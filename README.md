# racket.ai - MVP Backend Core

Backend MVP para subir videos, procesarlos de forma asíncrona y devolver feedback estructurado.

## Stack

- **NestJS + TypeScript**
- **PostgreSQL + TypeORM**
- **BullMQ + Redis** para procesamiento asíncrono
- **Filesystem local** para almacenamiento de videos (`/uploads`)
- **Microservicio Python (OpenCV + MediaPipe Pose + reglas + LLM para redacción)**

## Setup rápido

```bash
cp .env.example .env
npm install
docker compose up -d postgres redis analysis-service
npm run start:dev
```

La API queda en `http://localhost:3000`.

## Configuración IA (OpenAI-compatible)

El microservicio calcula métricas de técnica con reglas determinísticas y usa un LLM solo para convertir esas métricas a texto legible.

Variables opcionales:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENAI_BASE_URL` (para proveedores OpenAI-compatible)

Si no hay `OPENAI_API_KEY`, el servicio devuelve feedback local determinístico.

## Frontend simple para subida

También puedes usar una interfaz web mínima en `GET /` para subir el video y ver el estado de procesamiento en vivo.

1. Abre `http://localhost:3000`.
2. Completa metadata + archivo.
3. Haz click en **Subir y procesar**.

## Flujo MVP

1. `POST /videos` recibe video y metadata.
2. Guarda el archivo en `uploads/`.
3. Crea registro `videos` y encola job.
4. Worker consume la cola y llama `POST http://localhost:8000/analyze`.
5. Guarda resultado en `analysis` y marca video como `done`.
6. `GET /videos/:id` devuelve estado y análisis.

## Endpoints

### POST `/videos`

`multipart/form-data`

Campos:
- `file` (mp4/mov)
- `sport` (string, ejemplo `tennis`)
- `stroke` (`forehand` | `backhand`)
- `handedness` (`right` | `left`)
- `view` opcional (`side` | `front`)

Respuesta:

```json
{
  "videoId": "uuid",
  "status": "uploaded"
}
```

### GET `/videos/:id`

Respuesta:

```json
{
  "videoId": "uuid",
  "status": "done",
  "analysis": {
    "summary": "The stroke has a solid base, with a few fixable points.",
    "details": "Focus on these corrections: contact is late; hip rotation is limited.",
    "metrics": {
      "contact_timing": "late",
      "hip_rotation": "low",
      "shoulder_hip_separation": "ok",
      "balance": "stable"
    }
  }
}
```

## Microservicio de análisis

Directorio: `python_service/`

Ejecutar standalone:

```bash
cd python_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Contrato:
- `POST /analyze`
- Input (acepta `video_path` o `videoPath`):
  ```json
  {
    "video_path": "uploads/stroke.mp4",
    "sport": "tennis",
    "stroke": "forehand",
    "handedness": "right",
    "view": "side"
  }
  ```
- Output:
  ```json
  {
    "summary": "Your preparation is solid, but contact happens too late.",
    "details": "Start your unit turn earlier and rotate your hips sooner before contact.",
    "metrics": {
      "contact_timing": "late",
      "hip_rotation": "low",
      "shoulder_hip_separation": "ok",
      "balance": "stable"
    }
  }
  ```
