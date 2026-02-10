from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from python_service.pose_analysis import PoseFrameFeatures
from python_service.schemas import MetricsOutput, View


@dataclass
class ImpactWindow:
    impact_index: int
    impact_time_s: float


def _wrist_speed(features: list[PoseFrameFeatures]) -> np.ndarray:
    speeds = [0.0]
    for i in range(1, len(features)):
        dt = max(1e-6, features[i].timestamp_s - features[i - 1].timestamp_s)
        dx = features[i].dominant_wrist_xy - features[i - 1].dominant_wrist_xy
        speeds.append(float(np.linalg.norm(dx) / dt))
    return np.array(speeds, dtype=np.float32)


def detect_impact_phase(features: list[PoseFrameFeatures]) -> ImpactWindow:
    """Approximate impact as peak wrist speed weighted by trunk rotation change."""
    speeds = _wrist_speed(features)
    trunk_rot = np.array(
        [abs(f.shoulder_angle_deg - f.hip_angle_deg) for f in features], dtype=np.float32
    )

    speed_norm = speeds / (np.max(speeds) + 1e-6)
    rot_norm = trunk_rot / (np.max(trunk_rot) + 1e-6)
    score = 0.75 * speed_norm + 0.25 * rot_norm

    impact_index = int(np.argmax(score))
    return ImpactWindow(impact_index=impact_index, impact_time_s=features[impact_index].timestamp_s)


def classify_contact_timing(impact_time_s: float, video_duration_s: float) -> str:
    # Example rule thresholds for MVP:
    # early <35% of clip, ok 35-65%, late >65%.
    phase = impact_time_s / max(1e-6, video_duration_s)
    if phase < 0.35:
        return "early"
    if phase > 0.65:
        return "late"
    return "ok"


def classify_hip_rotation(features: list[PoseFrameFeatures], impact_idx: int) -> str:
    # Use angular travel from start to impact as a simple proxy for rotation usage.
    start_angle = features[0].hip_angle_deg
    impact_angle = features[impact_idx].hip_angle_deg
    hip_rotation_abs = abs(impact_angle - start_angle)

    # Example thresholds in degrees:
    # <12 low, 12-25 ok, >25 good.
    if hip_rotation_abs < 12:
        return "low"
    if hip_rotation_abs <= 25:
        return "ok"
    return "good"


def classify_shoulder_hip_separation(features: list[PoseFrameFeatures], impact_idx: int) -> str:
    separation = abs(
        features[impact_idx].shoulder_angle_deg - features[impact_idx].hip_angle_deg
    )
    # Example threshold in degrees: <18 low else ok.
    return "low" if separation < 18 else "ok"


def classify_balance(features: list[PoseFrameFeatures], impact_idx: int, view: View | None) -> str:
    # Track head displacement around impact as a simple stability signal.
    start = max(0, impact_idx - 2)
    end = min(len(features), impact_idx + 3)
    head_positions = np.array([f.head_xy for f in features[start:end]], dtype=np.float32)

    if len(head_positions) < 2:
        return "unstable"

    displacement = np.linalg.norm(head_positions[-1] - head_positions[0])

    # Front view is more sensitive laterally; keep threshold tighter.
    threshold_px = 28.0 if view == "front" else 35.0
    return "stable" if displacement <= threshold_px else "unstable"


def compute_metrics(
    features: list[PoseFrameFeatures], video_duration_s: float, view: View | None
) -> MetricsOutput:
    impact = detect_impact_phase(features)

    return MetricsOutput(
        contact_timing=classify_contact_timing(impact.impact_time_s, video_duration_s),
        hip_rotation=classify_hip_rotation(features, impact.impact_index),
        shoulder_hip_separation=classify_shoulder_hip_separation(features, impact.impact_index),
        balance=classify_balance(features, impact.impact_index, view),
    )
