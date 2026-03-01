export class SpectrumVisualizer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  private minFreq = 50;
  private maxFreq = 4000; // Mantenemos el rango musical útil

  // Estado para el suavizado de las barras macizas
  private smoothedHeights: Float32Array;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    this.ctx = ctx;
    this.canvas = canvas;
    this.smoothedHeights = new Float32Array(0); // Se inicializará en el primer draw
  }

  draw(
    spectrum: Float32Array,
    sampleRate: number,
    fftSize: number,
    peaksFreqs: number[] = [] // Mantener por compatibilidad de firma
  ) {
    const { ctx, canvas, minFreq, maxFreq } = this;
    const width = canvas.width;
    const height = canvas.height;

    // Inicializar array de suavizado si cambia el tamaño del espectro
    if (this.smoothedHeights.length !== spectrum.length) {
      this.smoothedHeights = new Float32Array(spectrum.length);
    }

    // 1. FONDO NEGRO SÓLIDO Y ABSOLUTO (Se integra perfectamente con la UI)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    // 2. CÁLCULO DE BARRAS UNIDAS Y MACIZAS
    const bands = spectrum.length; 
    // Ancho de barra suficiente para que se toquen (Efecto "Montaña")
    const barWidth = Math.ceil(width / (bands * 0.45)); 

    for (let i = 0; i < bands; i++) {
      const freq = (i * sampleRate) / fftSize;
      if (freq < minFreq || freq > maxFreq) continue;

      let value = spectrum[i];
      if (!isFinite(value)) value = -100;
      
      const targetNormalized = Math.max(0, Math.min(1, (value + 100) / 100));

      // 3. SUAVIZADO DE CAÍDA ORGÁNICO
      const currentHeight = this.smoothedHeights[i];
      
      if (targetNormalized > currentHeight) {
        this.smoothedHeights[i] = targetNormalized; // Sube instantáneamente
      } else {
        this.smoothedHeights[i] = currentHeight * 0.85; // Baja suavemente
      }

      const barHeight = this.smoothedHeights[i] * height;
      const x = ((Math.log10(freq) - logMin) / (logMax - logMin)) * width;

      // 4. COLORES MATE SÓLIDOS SEGÚN ALTURA (Consistentes con la UI)
      let barColor = "#333333"; // Gris oscuro mate base
      if (this.smoothedHeights[i] > 0.3) barColor = "#FF785A"; // Naranja mate de tus botones
      if (this.smoothedHeights[i] > 0.7) barColor = "#FFD25A"; // Amarillo mate del header

      // Dibujar la barra principal maciza y mate
      ctx.fillStyle = barColor;
      ctx.fillRect(x, height - barHeight, barWidth + 1, barHeight);
    }
    
    // 5. LÍNEA DE BASE SUTIL Y LIMPIA (MATE)
    ctx.fillStyle = "#222222";
    ctx.fillRect(0, height - 1, width, 1);
  }
}