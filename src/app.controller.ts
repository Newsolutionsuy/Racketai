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
    <title>RacketAI - Video Analysis</title>
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
        width: min(100%, 800px);
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin-top: 0;
        margin-bottom: 8px;
        font-size: 1.75rem;
        color: #1e293b;
      }
      h2 {
        font-size: 1.25rem;
        margin-top: 24px;
        margin-bottom: 12px;
        color: #334155;
      }
      p {
        margin-top: 0;
        color: #475569;
        line-height: 1.5;
      }
      .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 8px;
      }
      .tab-btn {
        background: none;
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        font-weight: 500;
        color: #64748b;
        border-radius: 8px;
      }
      .tab-btn.active {
        background: #eff6ff;
        color: #2563eb;
      }
      form {
        display: grid;
        gap: 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }
      label {
        font-size: 0.9rem;
        font-weight: 500;
        color: #334155;
        display: grid;
        gap: 8px;
      }
      input,
      select,
      button {
        font: inherit;
        padding: 12px;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
        transition: border-color 0.2s;
      }
      input:focus, select:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }
      button {
        border: none;
        background: #2563eb;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      button:hover {
        background: #1d4ed8;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      #status-container {
        margin-top: 32px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        background: #f8fafc;
        display: none;
      }
      .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .status-badge {
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .status-uploaded { background: #dcfce7; color: #166534; }
      .status-processing { background: #fef9c3; color: #854d0e; }
      .status-done { background: #dbeafe; color: #1e40af; }
      .status-failed { background: #fee2e2; color: #991b1b; }

      .analysis-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-top: 12px;
      }
      .analysis-summary {
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 8px;
        color: #1e293b;
      }
      .analysis-details {
        color: #475569;
        font-size: 0.95rem;
        line-height: 1.6;
      }
      .analysis-meta {
        margin-top: 16px;
        font-size: 0.8rem;
        color: #94a3b8;
        border-top: 1px solid #f1f5f9;
        padding-top: 8px;
      }
      .hidden { display: none !important; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Análisis de Video AI</h1>
      <p>Obtén feedback instantáneo de un entrenador experto para tus golpes de tenis.</p>

      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('upload')">Subir nuevo</button>
        <button class="tab-btn" onclick="switchTab('existing')">Usar existente</button>
      </div>

      <!-- Upload Form -->
      <form id="upload-form">
        <label id="file-label">
          Archivo de video (.mp4 o .mov)
          <input type="file" name="file" accept=".mp4,.mov" required />
        </label>

        <label id="existing-label" class="hidden">
          Seleccionar video existente
          <select name="filename" id="existing-select">
            <option value="">Cargando videos...</option>
          </select>
        </label>

        <div class="grid">
          <label>
            Deporte
            <input type="text" name="sport" value="tennis" required />
          </label>

          <label>
            Golpe
            <select name="stroke" required>
              <option value="forehand">Forehand</option>
              <option value="backhand">Backhand</option>
            </select>
          </label>

          <label>
            Lateralidad
            <select name="handedness" required>
              <option value="right">Diestro</option>
              <option value="left">Zurdo</option>
            </select>
          </label>

          <label>
            Vista (opcional)
            <select name="view">
              <option value="">No especificar</option>
              <option value="side">Lateral</option>
              <option value="front">Frontal</option>
            </select>
          </label>
        </div>

        <button id="submit-btn" type="submit">Analizar video</button>
      </form>

      <section id="status-container">
        <div class="status-header">
          <h2 style="margin: 0">Resultado del Análisis</h2>
          <span id="status-badge" class="status-badge">Processing</span>
        </div>
        <div id="status-text">Iniciando...</div>
        <div id="analysis-content" class="hidden">
          <div class="analysis-card">
            <div id="analysis-summary" class="analysis-summary"></div>
            <div id="analysis-details" class="analysis-details"></div>
            <div id="analysis-meta" class="analysis-meta"></div>
          </div>
        </div>
      </section>
    </main>

    <script>
      let currentMode = 'upload';
      const form = document.getElementById('upload-form');
      const submitBtn = document.getElementById('submit-btn');
      const existingSelect = document.getElementById('existing-select');
      const fileLabel = document.getElementById('file-label');
      const existingLabel = document.getElementById('existing-label');
      const statusContainer = document.getElementById('status-container');
      const statusBadge = document.getElementById('status-badge');
      const statusText = document.getElementById('status-text');
      const analysisContent = document.getElementById('analysis-content');
      const analysisSummary = document.getElementById('analysis-summary');
      const analysisDetails = document.getElementById('analysis-details');
      const analysisMeta = document.getElementById('analysis-meta');

      function switchTab(mode) {
        currentMode = mode;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        if (mode === 'upload') {
          fileLabel.classList.remove('hidden');
          existingLabel.classList.add('hidden');
          fileLabel.querySelector('input').required = true;
          existingSelect.required = false;
        } else {
          fileLabel.classList.add('hidden');
          existingLabel.classList.remove('hidden');
          fileLabel.querySelector('input').required = false;
          existingSelect.required = true;
          loadExistingVideos();
        }
      }

      async function loadExistingVideos() {
        try {
          const response = await fetch('/videos/uploads');
          const files = await response.json();
          existingSelect.innerHTML = files.length
            ? files.map(f => \`<option value="\${f}">\${f}</option>\`).join('')
            : '<option value="">No hay videos disponibles</option>';
        } catch (e) {
          existingSelect.innerHTML = '<option value="">Error al cargar videos</option>';
        }
      }

      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      async function pollVideo(videoId) {
        statusContainer.style.display = 'block';
        analysisContent.classList.add('hidden');

        for (let attempt = 0; attempt < 60; attempt += 1) {
          const response = await fetch('/videos/' + videoId);
          const data = await response.json();

          statusBadge.textContent = data.status;
          statusBadge.className = 'status-badge status-' + data.status;
          statusText.textContent = data.status === 'processing' ? 'Procesando con IA...' : 'Estado: ' + data.status;

          if (data.status === 'done' && data.analysis) {
            analysisContent.classList.remove('hidden');
            analysisSummary.textContent = data.analysis.summary;
            analysisDetails.textContent = data.analysis.details;

            let meta = 'Analizado por: ' + data.analysis.analyzedBy;
            if (data.analysis.couldNotUseAIReason) {
              meta += ' | Fallback: ' + data.analysis.couldNotUseAIReason;
            }
            analysisMeta.textContent = meta;
            return;
          }

          if (data.status === 'failed') {
            statusText.textContent = 'El procesamiento falló.';
            return;
          }

          await wait(2000);
        }

        statusText.textContent = 'Tiempo de espera agotado.';
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitBtn.disabled = true;
        statusContainer.style.display = 'block';
        statusText.textContent = 'Iniciando...';
        analysisContent.classList.add('hidden');

        try {
          const formData = new FormData(form);
          const endpoint = currentMode === 'upload' ? '/videos' : '/videos/existing';

          let response;
          if (currentMode === 'upload') {
             response = await fetch(endpoint, { method: 'POST', body: formData });
          } else {
             const data = Object.fromEntries(formData.entries());
             response = await fetch(endpoint, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(data)
             });
          }

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error en la petición');
          }

          const result = await response.json();
          await pollVideo(result.videoId);
        } catch (error) {
          statusText.textContent = 'Error: ' + error.message;
          statusBadge.textContent = 'Error';
          statusBadge.className = 'status-badge status-failed';
        } finally {
          submitBtn.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
  }
}
