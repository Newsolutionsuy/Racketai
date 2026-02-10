from __future__ import annotations

from dataclasses import dataclass

import cv2
import mediapipe as mp
import numpy as np

from python_service.schemas import Handedness
from python_service.video_processing import SampledFrame


@dataclass
class PoseFrameFeatures:
    timestamp_s: float
    head_xy: np.ndarray
    shoulder_center_xy: np.ndarray
    hip_center_xy: np.ndarray
    dominant_elbow_xy: np.ndarray
    dominant_wrist_xy: np.ndarray
    shoulder_angle_deg: float
    hip_angle_deg: float


mp_pose = mp.solutions.pose


def _to_xy(landmark, width: int, height: int) -> np.ndarray:
    return np.array([landmark.x * width, landmark.y * height], dtype=np.float32)


def _segment_angle_deg(p1: np.ndarray, p2: np.ndarray) -> float:
    v = p2 - p1
    return float(np.degrees(np.arctan2(v[1], v[0])))


def extract_pose_features(frames: list[SampledFrame], handedness: Handedness) -> list[PoseFrameFeatures]:
    """Run MediaPipe Pose and keep only landmarks required by MVP metrics."""
    features: list[PoseFrameFeatures] = []

    dominant_elbow_idx = (
        mp_pose.PoseLandmark.RIGHT_ELBOW if handedness == "right" else mp_pose.PoseLandmark.LEFT_ELBOW
    )
    dominant_wrist_idx = (
        mp_pose.PoseLandmark.RIGHT_WRIST if handedness == "right" else mp_pose.PoseLandmark.LEFT_WRIST
    )

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        for f in frames:
            rgb = cv2.cvtColor(f.frame_bgr, cv2.COLOR_BGR2RGB)
            result = pose.process(rgb)
            if not result.pose_landmarks:
                continue

            lm = result.pose_landmarks.landmark
            h, w = f.frame_bgr.shape[:2]

            nose = _to_xy(lm[mp_pose.PoseLandmark.NOSE], w, h)
            l_shoulder = _to_xy(lm[mp_pose.PoseLandmark.LEFT_SHOULDER], w, h)
            r_shoulder = _to_xy(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER], w, h)
            l_hip = _to_xy(lm[mp_pose.PoseLandmark.LEFT_HIP], w, h)
            r_hip = _to_xy(lm[mp_pose.PoseLandmark.RIGHT_HIP], w, h)

            dominant_elbow = _to_xy(lm[dominant_elbow_idx], w, h)
            dominant_wrist = _to_xy(lm[dominant_wrist_idx], w, h)

            shoulder_center = (l_shoulder + r_shoulder) / 2.0
            hip_center = (l_hip + r_hip) / 2.0

            features.append(
                PoseFrameFeatures(
                    timestamp_s=f.timestamp_s,
                    head_xy=nose,
                    shoulder_center_xy=shoulder_center,
                    hip_center_xy=hip_center,
                    dominant_elbow_xy=dominant_elbow,
                    dominant_wrist_xy=dominant_wrist,
                    shoulder_angle_deg=_segment_angle_deg(l_shoulder, r_shoulder),
                    hip_angle_deg=_segment_angle_deg(l_hip, r_hip),
                )
            )

    if not features:
        raise ValueError("Pose landmarks could not be detected in sampled frames")

    return features
