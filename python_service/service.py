from __future__ import annotations

from python_service.feedback import generate_feedback
from python_service.metrics import compute_metrics
from python_service.pose_analysis import extract_pose_features
from python_service.schemas import AnalyzeRequest, AnalyzeResponse
from python_service.video_processing import sample_video_frames


def analyze_stroke(payload: AnalyzeRequest) -> AnalyzeResponse:
    frames, video_duration_s = sample_video_frames(payload.video_path)
    pose_features = extract_pose_features(frames, payload.handedness)
    metrics = compute_metrics(pose_features, video_duration_s, payload.view)
    summary, details = generate_feedback(metrics, payload.sport, payload.stroke)

    return AnalyzeResponse(summary=summary, details=details, metrics=metrics)
