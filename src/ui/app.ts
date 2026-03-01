export function initializeUI() {
  const app = document.getElementById("app");
  if (!app) throw new Error("App container not found");

  app.innerHTML = `
    <div class="header">
      <h1>Chord Recognizer</h1>
    </div>
    <div class="main-content">
      <div class="visualizer-container">
        <canvas id="spectrumCanvas" width="800" height="400"></canvas>
      </div>
      <div class="output-container">
        <p id="output">Awaiting input...</p>
      </div>
    </div>
  `;

  const canvas = document.getElementById("spectrumCanvas") as HTMLCanvasElement;
  if (!canvas) throw new Error("Spectrum canvas not found");

  return canvas;
}

export function updateOutput(text: string) {
  const el = document.getElementById("output");
  if (el) el.textContent = text;
}
