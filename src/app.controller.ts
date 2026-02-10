import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getUploadPage(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RacketAI - Video Upload</title>
    <style>
      :root {
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #0f172a;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%);
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        background: white;
        width: min(100%, 720px);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin-top: 0;
        margin-bottom: 8px;
        font-size: 1.75rem;
      }
      p {
        margin-top: 0;
        color: #475569;
      }
      form {
        display: grid;
        gap: 14px;
        margin-top: 16px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      label {
        font-size: 0.9rem;
        color: #334155;
        display: grid;
        gap: 6px;
      }
      input,
      select,
      button {
        font: inherit;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
      }
      button {
        border: none;
        background: #2563eb;
        color: white;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      #status {
        margin-top: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px;
        white-space: pre-wrap;
        background: #f8fafc;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Upload de video</h1>
      <p>Sube tu video para procesarlo y obtener feedback automáticamente.</p>
      <form id="upload-form">
        <label>
          Archivo de video (.mp4 o .mov)
          <input type="file" name="file" accept=".mp4,.mov" required />
        </label>

        <div class="grid">
          <label>
            Sport
            <input type="text" name="sport" value="tennis" required />
          </label>

          <label>
            Stroke
            <select name="stroke" required>
              <option value="forehand">forehand</option>
              <option value="backhand">backhand</option>
            </select>
          </label>

          <label>
            Handedness
            <select name="handedness" required>
              <option value="right">right</option>
              <option value="left">left</option>
            </select>
          </label>

          <label>
            View (opcional)
            <select name="view">
              <option value="">No especificar</option>
              <option value="side">side</option>
              <option value="front">front</option>
            </select>
          </label>
        </div>

        <button id="submit-btn" type="submit">Subir y procesar</button>
      </form>

      <section id="status">Esperando subida...</section>
    </main>

    <script>
      const form = document.getElementById('upload-form');
      const status = document.getElementById('status');
      const submitBtn = document.getElementById('submit-btn');

      const setStatus = (value) => {
        status.textContent = value;
      };

      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      async function pollVideo(videoId) {
        for (let attempt = 0; attempt < 30; attempt += 1) {
          const response = await fetch('/videos/' + videoId);
          const data = await response.json();

          setStatus('Estado: ' + data.status + '\\n\\n' + JSON.stringify(data, null, 2));

          if (data.status === 'done' || data.status === 'failed') {
            return;
          }

          await wait(2000);
        }

        setStatus('Tiempo de espera agotado. Vuelve a consultar el ID manualmente.');
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitBtn.disabled = true;
        setStatus('Subiendo video...');

        try {
          const formData = new FormData(form);
          const viewValue = formData.get('view');
          if (!viewValue) {
            formData.delete('view');
          }

          const uploadResponse = await fetch('/videos', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(errorText || 'No se pudo subir el video.');
          }

          const uploadData = await uploadResponse.json();
          setStatus('Video subido: ' + uploadData.videoId + '\\nIniciando procesamiento...');
          await pollVideo(uploadData.videoId);
        } catch (error) {
          setStatus('Error: ' + error.message);
        } finally {
          submitBtn.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
  }
}
