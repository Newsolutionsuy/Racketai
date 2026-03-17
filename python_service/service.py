from __future__ import annotations

from feedback import generate_feedback
from metrics import compute_metrics
from pose_analysis import extract_pose_features
from schemas import AnalyzeRequest, AnalyzeResponse
from video_processing import sample_video_frames


def analyze_stroke(payload: AnalyzeRequest) -> AnalyzeResponse:
    frames, video_duration_s = sample_video_frames(payload.video_path)
    pose_features = extract_pose_features(frames, payload.handedness)
    metrics = compute_metrics(pose_features, video_duration_s, payload.view)
    feedback = generate_feedback(metrics, payload.sport, payload.stroke)

    return AnalyzeResponse(
        summary=feedback.summary,
        details=feedback.details,
        metrics=metrics,
        analyzedBy=feedback.analyzed_by,
        couldNotUseAIReason=feedback.could_not_use_ai_reason,
    )
