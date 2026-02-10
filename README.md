# racket.ai - MVP Backend Core

Backend MVP para subir videos, procesarlos de forma asíncrona y devolver feedback estructurado.

## Stack

- **NestJS + TypeScript**
- **PostgreSQL + TypeORM**
- **BullMQ + Redis** para procesamiento asíncrono
- **Filesystem local** para almacenamiento de videos (`/uploads`)
- **Microservicio Python (IA con OpenAI + fallback local)** para análisis

## Setup rápido

```bash
cp .env.example .env
npm install
docker compose up -d postgres redis analysis-service
npm run start:dev
```

La API queda en `http://localhost:3000`.



## Configuración IA (OpenAI)

El microservicio de análisis usa OpenAI si encuentra `OPENAI_API_KEY`.
Si no existe (o hay error), cae automáticamente al análisis mock local.

Variables opcionales:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)

Ejemplo:

```bash
export OPENAI_API_KEY="tu_api_key"
export OPENAI_MODEL="gpt-4o-mini"
```

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
    "summary": "Solid preparation, but contact point is late.",
    "details": "Try starting your unit turn earlier and rotating your hips sooner."
  }
}
```

## Microservicio de análisis (mock)

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
- Input:
  ```json
  {
    "videoPath": "...",
    "sport": "tennis",
    "stroke": "forehand",
    "handedness": "right",
    "view": "side"
  }
  ```
- Output:
  ```json
  {
    "summary": "Solid preparation, but contact point is late.",
    "details": "Try starting your unit turn earlier and rotating your hips sooner."
  }
  ```
