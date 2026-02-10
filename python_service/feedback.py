from __future__ import annotations

import json
import os

from openai import OpenAI

from python_service.schemas import MetricsOutput, Sport, Stroke


def build_feedback_prompt(metrics: MetricsOutput, sport: Sport, stroke: Stroke) -> list[dict]:
    """Example prompt to transform metrics into short actionable coaching feedback."""
    payload = {
        "metrics": metrics.model_dump(),
        "sport": sport,
        "stroke": stroke,
    }

    return [
        {
            "role": "system",
            "content": (
                "You are an assistant that converts stroke metrics into coaching feedback. "
                "Rules: max 3 corrections, clear language, no jargon, actionable advice, no guessing, no hype. "
                "Return strict JSON with keys: summary, details."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(payload),
        },
    ]


def _fallback_feedback(metrics: MetricsOutput) -> tuple[str, str]:
    issues = []
    if metrics.contact_timing in {"early", "late"}:
        issues.append(f"contact is {metrics.contact_timing}")
    if metrics.hip_rotation == "low":
        issues.append("hip rotation is limited")
    if metrics.shoulder_hip_separation == "low":
        issues.append("upper and lower body are rotating together")
    if metrics.balance == "unstable":
        issues.append("balance drops through contact")

    if not issues:
        return (
            "Technique is efficient overall.",
            "Keep the same rhythm and spacing; repeat this motion at game speed.",
        )

    details = "; ".join(issues[:3]) + "."
    return (
        "The stroke has a solid base, with a few fixable points.",
        f"Focus on these corrections: {details}",
    )


def generate_feedback(metrics: MetricsOutput, sport: Sport, stroke: Stroke) -> tuple[str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _fallback_feedback(metrics)

    client = OpenAI(
        api_key=api_key,
        base_url=os.getenv("OPENAI_BASE_URL"),  # supports OpenAI-compatible providers
    )

    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=build_feedback_prompt(metrics, sport, stroke),
    )

    content = response.choices[0].message.content or "{}"
    parsed = json.loads(content)
    summary = str(parsed.get("summary", "")).strip()
    details = str(parsed.get("details", "")).strip()

    if not summary or not details:
        return _fallback_feedback(metrics)

    return summary, details
