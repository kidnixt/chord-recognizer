export class SpectrumVisualizer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  draw(spectrum: Float32Array) {
    const { ctx, width, height } = this;

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / spectrum.length;

    for (let i = 0; i < spectrum.length; i++) {
      // spectrum está en dB negativos
      const value = spectrum[i];
      const normalized = (value + 100) / 100; // [-100,0] → [0,1]
      const barHeight = normalized * height;

      ctx.fillStyle = "steelblue";
      ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth,
        barHeight
      );
    }
  }
}
