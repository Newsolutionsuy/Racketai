from fastapi import FastAPI
from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    videoPath: str
    sport: str
    stroke: str
    handedness: str


class AnalyzeResponse(BaseModel):
    summary: str
    details: str


app = FastAPI()


@app.post('/analyze', response_model=AnalyzeResponse)
def analyze_video(payload: AnalyzeRequest) -> AnalyzeResponse:
    stroke_hint = 'unit turn' if payload.stroke == 'forehand' else 'shoulder alignment'
    hand_hint = 'right-side loading' if payload.handedness == 'right' else 'left-side loading'

    return AnalyzeResponse(
        summary='Solid preparation, but contact point is late.',
        details=f'Try starting your {stroke_hint} earlier and rotating your hips sooner. Focus on {hand_hint}.',
    )
