from __future__ import annotations

import json
import os
from dataclasses import dataclass

from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)

from schemas import MetricsOutput, Sport, Stroke


@dataclass
class FeedbackResult:
    summary: str
    details: str
    analyzed_by: str
    could_not_use_ai_reason: str | None = None


def build_feedback_prompt(metrics: MetricsOutput, sport: Sport, stroke: Stroke) -> list[dict]:
    """Transforma métricas en feedback corto y accionable en español."""
    payload = {
        "metrics": metrics.model_dump(),
        "sport": sport,
        "stroke": stroke,
    }

    return [
        {
            "role": "system",
            "content": (
                "Eres un asistente de técnica deportiva. Convierte métricas de golpe en feedback de coaching "
                "breve y accionable en español neutro. "
                "Reglas: máximo 3 correcciones, lenguaje claro, sin jerga técnica innecesaria, sin inventar datos, "
                "sin tono exagerado. "
                "Devuelve JSON estricto con claves: summary y details (ambos en español)."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(payload),
        },
    ]


def _fallback_feedback(
    metrics: MetricsOutput,
    reason: str | None = None,
) -> FeedbackResult:
    issues = []
    if metrics.contact_timing == "early":
        issues.append("el contacto ocurre demasiado temprano")
    if metrics.contact_timing == "late":
        issues.append("el contacto llega tarde")
    if metrics.hip_rotation == "low":
        issues.append("la rotación de cadera es insuficiente")
    if metrics.shoulder_hip_separation == "low":
        issues.append("hombros y cadera giran casi al mismo tiempo")
    if metrics.balance == "unstable":
        issues.append("se pierde estabilidad durante el impacto")

    if not issues:
        return FeedbackResult(
            summary="La técnica es eficiente en general.",
            details="Mantén el mismo ritmo y la misma distancia de golpeo, y repite el gesto a velocidad de juego.",
            analyzed_by="rules",
            could_not_use_ai_reason=reason,
        )

    details = "; ".join(issues[:3]) + "."
    return FeedbackResult(
        summary="El golpe tiene una base sólida, con algunos ajustes clave.",
        details=f"Enfócate en estas correcciones: {details}",
        analyzed_by="rules",
        could_not_use_ai_reason=reason,
    )


def _extract_retry_after_seconds(exc: RateLimitError) -> str | None:
    response = getattr(exc, "response", None)
    headers = getattr(response, "headers", None)
    if not headers:
        return None

    retry_after = headers.get("retry-after")
    if not retry_after:
        return None

    retry_after = retry_after.strip()
    return retry_after if retry_after else None


def _friendly_ai_error_reason(exc: Exception) -> str:
    if isinstance(exc, RateLimitError):
        message = str(exc).lower()
        if "insufficient_quota" in message:
            return (
                "Sin cuota/crédito de IA (insufficient_quota). "
                "Activa facturación o aumenta presupuesto del proyecto/organización."
            )

        retry_after = _extract_retry_after_seconds(exc)
        if retry_after:
            return (
                "Límite de IA alcanzado (429 Rate Limit). "
                f"Reintenta en ~{retry_after}s o aumenta cuota/facturación."
            )
        return "Límite de IA alcanzado (429 Rate Limit). Revisa cuota/facturación o cambia de modelo."

    if isinstance(exc, AuthenticationError):
        return "Autenticación IA fallida. Verifica OPENAI_API_KEY."

    if isinstance(exc, APIConnectionError):
        return "No se pudo conectar al proveedor de IA."

    if isinstance(exc, APIStatusError):
        return f"Proveedor IA respondió con error HTTP {exc.status_code}."

    return f"Fallo de IA ({exc.__class__.__name__})."


def generate_feedback(metrics: MetricsOutput, sport: Sport, stroke: Stroke) -> FeedbackResult:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _fallback_feedback(metrics, "OPENAI_API_KEY no está configurada.")

    try:
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
            return _fallback_feedback(metrics, "La respuesta de IA no incluyó summary/details válidos.")

        return FeedbackResult(
            summary=summary,
            details=details,
            analyzed_by="llm",
            could_not_use_ai_reason=None,
        )
    except Exception as exc:  # pragma: no cover - defensive fallback for API/runtime errors.
        return _fallback_feedback(metrics, _friendly_ai_error_reason(exc))
