from __future__ import annotations

from typing import Literal

from pydantic import AliasChoices, BaseModel, Field

Sport = Literal["tennis", "padel"]
Stroke = Literal["forehand", "backhand"]
Handedness = Literal["right", "left"]
View = Literal["side", "front"]


class AnalyzeRequest(BaseModel):
    video_path: str = Field(
        ...,
        description="Local path to a short stroke video",
        validation_alias=AliasChoices("video_path", "videoPath"),
    )
    sport: Sport
    stroke: Stroke
    handedness: Handedness
    view: View | None = None


class MetricsOutput(BaseModel):
    contact_timing: Literal["early", "late", "ok"]
    hip_rotation: Literal["low", "ok", "good"]
    shoulder_hip_separation: Literal["low", "ok"]
    balance: Literal["stable", "unstable"]


class AnalyzeResponse(BaseModel):
    summary: str
    details: str
    metrics: MetricsOutput
