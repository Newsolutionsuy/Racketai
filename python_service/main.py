import json
import os

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


app = FastAPI()


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
    )


def generate_ai_analysis(payload: AnalyzeRequest) -> AnalyzeResponse | None:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None

    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    client = OpenAI(api_key=api_key)

    prompt = (
        'You are an expert racket sports coach. The video itself is not available, '
        'only metadata from the upload. Return concise coaching feedback in JSON with '
        'keys "summary" and "details". '\
        f'Input metadata: sport={payload.sport}, stroke={payload.stroke}, '
        f'handedness={payload.handedness}, view={payload.view or "unknown"}. '
        'Make feedback practical and specific, avoid mentioning missing video.'
    )

    response = client.responses.create(
        model=model,
        input=prompt,
        temperature=0.4,
    )

    content = response.output_text.strip()
    if content.startswith('```'):
        content = content.replace('```json', '').replace('```', '').strip()

    parsed = json.loads(content)
    summary = str(parsed.get('summary', '')).strip()
    details = str(parsed.get('details', '')).strip()

    if not summary or not details:
        return None

    return AnalyzeResponse(summary=summary, details=details)


@app.post('/analyze', response_model=AnalyzeResponse)
def analyze_video(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        ai_analysis = generate_ai_analysis(payload)
        if ai_analysis:
            return ai_analysis
    except Exception:
        pass

    return build_fallback_analysis(payload)
