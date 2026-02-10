from __future__ import annotations

from fastapi import FastAPI, HTTPException

from python_service.schemas import AnalyzeRequest, AnalyzeResponse
from python_service.service import analyze_stroke

app = FastAPI(title="racket.ai-analysis-service", version="0.1.0")


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_video(payload: AnalyzeRequest) -> AnalyzeResponse:
    """REST-ready entrypoint for tennis/padel stroke analysis."""
    try:
        return analyze_stroke(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
