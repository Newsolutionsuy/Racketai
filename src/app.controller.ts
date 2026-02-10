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
    <title>RacketAI - Tennis Video Analysis</title>
    <style>
      :root {
        --primary: #2563eb;
        --primary-hover: #1d4ed8;
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --text: #0f172a;
        --text-muted: #64748b;
        --border: #e2e8f0;
        --success: #10b981;
        --error: #ef4444;
      }
      * { box-sizing: border-box; }
      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background-color: var(--bg);
        color: var(--text);
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        line-height: 1.5;
      }
      .container {
        width: 100%;
        max-width: 900px;
      }
      header {
        text-align: center;
        margin-bottom: 40px;
      }
      h1 { font-size: 2.5rem; margin-bottom: 8px; color: var(--primary); }
      p.subtitle { color: var(--text-muted); font-size: 1.1rem; }

      .grid-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      @media (max-width: 768px) {
        .grid-layout { grid-template-columns: 1fr; }
      }

      .card {
        background: var(--card-bg);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid var(--border);
      }
      h2 { font-size: 1.25rem; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

      form { display: grid; gap: 16px; }
      .form-group { display: flex; flex-direction: column; gap: 6px; }
      label { font-size: 0.875rem; font-weight: 600; color: #475569; }
      input, select {
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
        font-size: 1rem;
        transition: border-color 0.2s;
      }
      input:focus, select:focus { outline: none; border-color: var(--primary); }

      .btn {
        background: var(--primary);
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        font-size: 1rem;
      }
      .btn:hover { background: var(--primary-hover); }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .video-list {
        max-height: 400px;
        overflow-y: auto;
        display: grid;
        gap: 8px;
      }
      .video-item {
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
      }
      .video-item:hover { border-color: var(--primary); background: #eff6ff; }
      .video-item.selected { border-color: var(--primary); background: #dbeafe; }
      .video-icon { color: var(--text-muted); }

      #status-card { margin-top: 24px; display: none; }
      .status-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .status-badge {
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .status-processing, .status-uploaded { background: #fef3c7; color: #92400e; }
      .status-done { background: #d1fae5; color: #065f46; }
      .status-failed { background: #fee2e2; color: #991b1b; }

      .result-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
      .result-summary { font-weight: 700; font-size: 1.1rem; margin-bottom: 8px; }
      .result-details { color: var(--text-muted); font-size: 0.95rem; white-space: pre-wrap; }
      .result-meta { margin-top: 12px; font-size: 0.8rem; color: var(--text-muted); font-style: italic; }

      .hidden { display: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>RacketAI</h1>
        <p class="subtitle">Análisis inteligente de técnica para deportes de raqueta</p>
      </header>

      <div class="grid-layout">
        <!-- Upload Section -->
        <div class="card">
          <h2><span>📤</span> Sube un Video</h2>
          <form id="upload-form">
            <div class="form-group">
              <label>Archivo de video (.mp4, .mov)</label>
              <input type="file" name="file" accept=".mp4,.mov" required />
            </div>
            <div class="form-group">
              <label>Deporte</label>
              <input type="text" name="sport" value="tennis" required />
            </div>
            <div class="form-group">
              <label>Golpe</label>
              <select name="stroke" required>
                <option value="forehand">Forehand (Drive)</option>
                <option value="backhand">Backhand (Revés)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Lateralidad</label>
              <select name="handedness" required>
                <option value="right">Diestro</option>
                <option value="left">Zurdo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Vista (opcional)</label>
              <select name="view">
                <option value="">No especificar</option>
                <option value="side">Lateral</option>
                <option value="front">Frontal</option>
              </select>
            </div>
            <button type="submit" class="btn" id="upload-btn">Subir y Analizar</button>
          </form>
        </div>

        <!-- Existing Videos Section -->
        <div class="card">
          <h2><span>📁</span> Videos en Servidor</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: -8px; margin-bottom: 16px;">
            Selecciona un video ya subido para volver a analizarlo.
          </p>
          <div id="video-list" class="video-list">
            <p>Cargando videos...</p>
          </div>

          <form id="existing-form" class="hidden" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
            <input type="hidden" name="filename" id="selected-filename" />
            <div class="form-group">
              <label>Deporte</label>
              <input type="text" name="sport" value="tennis" required />
            </div>
            <div class="grid-layout" style="gap: 12px; margin-bottom: 16px;">
                <div class="form-group">
                  <label>Golpe</label>
                  <select name="stroke" required>
                    <option value="forehand">Forehand</option>
                    <option value="backhand">Backhand</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Lateralidad</label>
                  <select name="handedness" required>
                    <option value="right">Diestro</option>
                    <option value="left">Zurdo</option>
                  </select>
                </div>
            </div>
            <button type="submit" class="btn" id="existing-btn">Analizar Seleccionado</button>
          </form>
        </div>
      </div>

      <!-- Status & Results Card -->
      <div id="status-card" class="card">
        <div class="status-header">
          <h2 style="margin-bottom: 0;">Análisis en curso</h2>
          <span id="status-badge" class="status-badge status-processing">Procesando</span>
        </div>
        <p id="status-text" style="font-size: 0.9rem; margin-bottom: 0;">Iniciando...</p>

        <div id="result-container" class="result-section hidden">
          <div id="result-summary" class="result-summary"></div>
          <div id="result-details" class="result-details"></div>
          <div id="result-meta" class="result-meta"></div>
        </div>
      </div>
    </div>

    <script>
      const uploadForm = document.getElementById('upload-form');
      const existingForm = document.getElementById('existing-form');
      const videoListContainer = document.getElementById('video-list');
      const statusCard = document.getElementById('status-card');
      const statusBadge = document.getElementById('status-badge');
      const statusText = document.getElementById('status-text');
      const resultContainer = document.getElementById('result-container');
      const resultSummary = document.getElementById('result-summary');
      const resultDetails = document.getElementById('result-details');
      const resultMeta = document.getElementById('result-meta');
      const selectedFilenameInput = document.getElementById('selected-filename');

      async function loadExistingVideos() {
        try {
          const response = await fetch('/videos/uploads');
          const files = await response.json();

          if (files.length === 0) {
            videoListContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No hay videos disponibles</p>';
            return;
          }

          videoListContainer.innerHTML = '';
          files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'video-item';
            item.innerHTML = \`
              <span class="video-icon">🎬</span>
              <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${file}</span>
            \`;
            item.onclick = () => {
              document.querySelectorAll('.video-item').forEach(i => i.classList.remove('selected'));
              item.classList.add('selected');
              selectedFilenameInput.value = file;
              existingForm.classList.remove('hidden');
            };
            videoListContainer.appendChild(item);
          });
        } catch (error) {
          videoListContainer.innerHTML = '<p style="color:var(--error);">Error al cargar videos</p>';
        }
      }

      function updateUIStatus(data) {
        statusCard.style.display = 'block';
        statusBadge.textContent = data.status;
        statusBadge.className = 'status-badge status-' + data.status;

        if (data.status === 'processing' || data.status === 'uploaded') {
          statusText.textContent = 'Estamos analizando tu video. Por favor espera...';
          resultContainer.classList.add('hidden');
        } else if (data.status === 'done') {
          statusText.textContent = '¡Análisis completado!';
          if (data.analysis) {
            resultContainer.classList.remove('hidden');
            resultSummary.textContent = data.analysis.summary;
            resultDetails.textContent = data.analysis.details;

            let meta = 'Analizado por: ' + data.analysis.analyzedBy;
            if (data.analysis.couldNotUseAIReason) {
              meta += ' (Fallback debido a: ' + data.analysis.couldNotUseAIReason + ')';
            }
            resultMeta.textContent = meta;
          }
        } else if (data.status === 'failed') {
          statusText.textContent = 'Hubo un error al procesar el video.';
          resultContainer.classList.add('hidden');
        }
      }

      async function pollVideo(videoId) {
        for (let attempt = 0; attempt < 60; attempt += 1) {
          try {
            const response = await fetch('/videos/' + videoId);
            const data = await response.json();
            updateUIStatus(data);
            if (data.status === 'done' || data.status === 'failed') return;
          } catch (e) {
            console.error('Polling error', e);
          }
          await new Promise(r => setTimeout(r, 2000));
        }
        statusText.textContent = 'Tiempo de espera agotado.';
      }

      uploadForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('upload-btn');
        btn.disabled = true;
        statusCard.style.display = 'block';
        statusText.textContent = 'Subiendo video...';
        resultContainer.classList.add('hidden');

        try {
          const formData = new FormData(uploadForm);
          if (!formData.get('view')) formData.delete('view');

          const res = await fetch('/videos', { method: 'POST', body: formData });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          await pollVideo(data.videoId);
        } catch (error) {
          statusText.textContent = 'Error: ' + error.message;
          statusBadge.className = 'status-badge status-failed';
          statusBadge.textContent = 'Error';
        } finally {
          btn.disabled = false;
          loadExistingVideos();
        }
      };

      existingForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('existing-btn');
        btn.disabled = true;
        statusCard.style.display = 'block';
        statusText.textContent = 'Iniciando análisis...';
        resultContainer.classList.add('hidden');

        try {
          const formData = new FormData(existingForm);
          const payload = Object.fromEntries(formData.entries());

          const res = await fetch('/videos/existing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          await pollVideo(data.videoId);
        } catch (error) {
          statusText.textContent = 'Error: ' + error.message;
          statusBadge.className = 'status-badge status-failed';
          statusBadge.textContent = 'Error';
        } finally {
          btn.disabled = false;
        }
      };

      loadExistingVideos();
    </script>
  </body>
</html>`;
  }
}
