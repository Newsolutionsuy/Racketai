from __future__ import annotations

from fastapi import FastAPI, HTTPException

from schemas import AnalyzeRequest, AnalyzeResponse
from service import analyze_stroke

app = FastAPI(title="racket.ai-analysis-service", version="0.1.0")


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_video(payload: AnalyzeRequest) -> AnalyzeResponse:
    """REST-ready entrypoint for tennis/padel stroke analysis."""
    try:
        return analyze_stroke(payload)
    except Exception as exc:
        error_type = exc.__class__.__name__
        detail = str(exc).strip()
        message = f"{error_type}: {detail}" if detail else error_type
        raise HTTPException(status_code=400, detail=message) from exc
