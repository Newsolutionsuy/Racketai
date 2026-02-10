from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class SampledFrame:
    frame_index: int
    timestamp_s: float
    frame_bgr: np.ndarray


def sample_video_frames(video_path: str, target_fps: float = 10.0) -> tuple[list[SampledFrame], float]:
    """Load a video and sample it at target_fps for cost-efficient pose processing."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video at path: {video_path}")

    native_fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if frame_count <= 0 or native_fps <= 0:
        cap.release()
        raise ValueError("Invalid video metadata: missing frame count or FPS")

    total_duration_s = frame_count / native_fps

    # Step over frames instead of processing every frame (MVP speed/cost requirement).
    step = max(1, int(round(native_fps / target_fps)))

    sampled_frames: list[SampledFrame] = []
    frame_index = 0

    while True:
        ok, frame_bgr = cap.read()
        if not ok:
            break

        if frame_index % step == 0:
            sampled_frames.append(
                SampledFrame(
                    frame_index=frame_index,
                    timestamp_s=frame_index / native_fps,
                    frame_bgr=frame_bgr,
                )
            )
        frame_index += 1

    cap.release()

    if not sampled_frames:
        raise ValueError("No frames were sampled from the video")

    return sampled_frames, total_duration_s
