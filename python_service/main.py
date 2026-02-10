import base64
import json
import os

import cv2
from fastapi import FastAPI
from openai import OpenAI
from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    videoPath: str
    sport: str
    stroke: str
    handedness: str
    view: str | None = None


class AnalyzeResponse(BaseModel):
    summary: str
    details: str
    analyzedBy: str
    couldNotUseAIReason: str | None = None


app = FastAPI()


def extract_frames(video_path: str, num_frames: int = 5):
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at {video_path}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        raise ValueError(f"Video file {video_path} has no frames")

    # Pick frames at regular intervals
    frame_indices = [int(i * total_frames / num_frames) for i in range(num_frames)]

    base64_frames = []
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        success, frame = cap.read()
        if success:
            _, buffer = cv2.imencode('.jpg', frame)
            base64_frames.append(base64.b64encode(buffer).decode('utf-8'))

    cap.release()
    if not base64_frames:
        raise ValueError(f"Failed to extract any frames from {video_path}")

    return base64_frames


def build_fallback_analysis(payload: AnalyzeRequest) -> AnalyzeResponse:
    stroke_hint = 'unit turn' if payload.stroke == 'forehand' else 'shoulder alignment'
    hand_hint = 'right-side loading' if payload.handedness == 'right' else 'left-side loading'
    view_hint = f' from a {payload.view} view' if payload.view else ''

    return AnalyzeResponse(
        summary='Solid preparation, but contact point is late.',
        details=(
            f'Try starting your {stroke_hint} earlier and rotating your hips sooner. '
            f'Focus on {hand_hint}{view_hint}.'
        ),
        analyzedBy='fallback-local',
    )


def generate_ai_analysis(payload: AnalyzeRequest) -> AnalyzeResponse:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError('OPENAI_API_KEY is not configured')

    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    client = OpenAI(api_key=api_key)

    # Extract frames for visual analysis
    base64_frames = extract_frames(payload.videoPath)

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert racket sports coach. Analyze the provided video frames of a stroke "
                "and provide constructive feedback. Return feedback in JSON format with "
                "keys 'summary' and 'details'."
            )
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "content": (
                        f"Input metadata: sport={payload.sport}, stroke={payload.stroke}, "
                        f"handedness={payload.handedness}, view={payload.view or 'unknown'}. "
                        "Please analyze these frames and provide specific coaching advice."
                    )
                },
                *[
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{frame}"}
                    }
                    for frame in base64_frames
                ]
            ]
        }
    ]

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.4,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content.strip()
    parsed = json.loads(content)
    summary = str(parsed.get('summary', '')).strip()
    details = str(parsed.get('details', '')).strip()

    if not summary or not details:
        raise ValueError('OpenAI returned an invalid response format')

    return AnalyzeResponse(summary=summary, details=details, analyzedBy='openai')


@app.post('/analyze', response_model=AnalyzeResponse)
def analyze_video(payload: AnalyzeRequest) -> AnalyzeResponse:
    print(f"Received analyze request for: {payload.videoPath}")
    ai_error_reason: str | None = None

    try:
        result = generate_ai_analysis(payload)
        print(f"AI analysis successful: {result.analyzedBy}")
        return result
    except Exception as error:
        ai_error_reason = str(error).strip() or 'Unknown AI analysis error'
        print(f"AI analysis failed, falling back. Reason: {ai_error_reason}")

    fallback_analysis = build_fallback_analysis(payload)
    fallback_analysis.couldNotUseAIReason = ai_error_reason
    return fallback_analysis
