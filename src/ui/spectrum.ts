export class SpectrumVisualizer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private minFreq = 50;   // Hz
  private maxFreq = 8000; // Hz

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  draw(
    spectrum: Float32Array,
    sampleRate: number,
    fftSize: number,
    peaksFreqs: number[] = []
  ) {
    const { ctx, width, height, minFreq, maxFreq } = this;

    ctx.clearRect(0, 0, width, height);

    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    for (let i = 0; i < spectrum.length; i++) {
      let value = spectrum[i];
      if (!isFinite(value)) value = -100;
      const normalized = Math.max(0, Math.min(1, (value + 100) / 100));
      const barHeight = normalized * height;

      const freq = (i * sampleRate) / fftSize;
      if (freq < minFreq || freq > maxFreq) continue;

      // posición X en log scale
      const x = ((Math.log10(freq) - logMin) / (logMax - logMin)) * width;

      const isPeak = peaksFreqs.some(f => Math.abs(f - freq) < 10);
      let color = "steelblue";
      if (isPeak) color = "crimson";
      else if (normalized > 0.7) color = "orange";

      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "black");

      ctx.fillStyle = gradient;

      // dibujamos una barra mínima de 1px
      ctx.fillRect(x, height - barHeight, 2, barHeight);
    }

    ctx.strokeStyle = "#ccc";
    ctx.beginPath();
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    ctx.stroke();
  }
}
