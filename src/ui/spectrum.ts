export class SpectrumVisualizer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private smoothedHeights: Float32Array;

  public minFreq = 65.41; // C2 (Nota baja de guitarra/bajo)
  public maxFreq = 1046.50; // C6 (Suficiente para acordes)

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.canvas = canvas;
    this.smoothedHeights = new Float32Array(0);
  }

  // Función auxiliar para saber si una nota es sostenida (#)
  private isSharp(noteName: string): boolean {
    return noteName.includes('#');
  }

  draw(
    timeData: Float32Array,
    spectrum: Float32Array,
    sampleRate: number,
    fftSize: number,
    activeNotes: string[] = [],
    chroma: Float32Array // Añadimos el croma como argumento
  ) {
    const { ctx, canvas, minFreq, maxFreq } = this;
    const { width, height } = canvas;
    if (this.smoothedHeights.length !== spectrum.length) {
      this.smoothedHeights = new Float32Array(spectrum.length);
    }

    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, width, height);

    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    // --- 1. DIBUJAR FONDO DE NOTAS (K-SPACE) ---
    // Recorremos todas las notas MIDI en nuestro rango
    for (let m = 36; m <= 84; m++) {
      const f = 440 * Math.pow(2, (m - 69) / 12);
      if (f < minFreq || f > maxFreq) continue;

      const xStart = ((Math.log10(f * Math.pow(2, -0.5 / 12)) - logMin) / (logMax - logMin)) * width;
      const xEnd = ((Math.log10(f * Math.pow(2, 0.5 / 12)) - logMin) / (logMax - logMin)) * width;
      
      const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const name = noteNames[m % 12];

      // Fondo: Rojo muy sutil para sostenidos, casi negro para naturales
      ctx.fillStyle = this.isSharp(name) ? "rgba(255, 120, 90, 0.05)" : "rgba(255, 255, 255, 0.02)";
      ctx.fillRect(xStart, 0, xEnd - xStart, height);

      // Etiquetas de texto superiores
      ctx.fillStyle = this.isSharp(name) ? "#FF785A" : "#888";
      ctx.font = "10px Roboto";
      ctx.textAlign = "center";
      ctx.fillText(name, xStart + (xEnd - xStart) / 2, 15);
    }

    // --- 2. WAVEFORM (Real-Time) ---
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 210, 90, 0.5)"; // Amarillo translúcido
    ctx.lineWidth = 1;
    const step = width / timeData.length;
    for (let i = 0; i < timeData.length; i++) {
      const y = (height * 0.15) + (timeData[i] * height * 0.1);
      if (i === 0) ctx.moveTo(i * step, y);
      else ctx.lineTo(i * step, y);
    }
    ctx.stroke();

    // --- 3. SPECTRUM (Llenado + Contorno) ---
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    // Suavizado en X (opcional, para hacer las colinas menos picudas)
    const points: {x: number, y: number}[] = [];

    for (let i = 0; i < spectrum.length; i++) {
      const freq = (i * sampleRate) / fftSize;
      if (freq < minFreq || freq > maxFreq) continue;

      const val = Math.max(0, (spectrum[i] + 100) / 80);
      this.smoothedHeights[i] = Math.max(val, this.smoothedHeights[i] * 0.85); // Inercia
      
      const x = ((Math.log10(freq) - logMin) / (logMax - logMin)) * width;
      // Invertimos la altura (0 es ruido, multiplicamos por un factor)
      const peakHeight = Math.pow(this.smoothedHeights[i], 1.5) * height * 0.8; 
      const y = height - peakHeight;
      
      points.push({x, y});
    }

    // Dibujamos la forma
    for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    
    // Terminamos de cerrar la forma para el relleno
    ctx.lineTo(width, height);
    
    // Primero rellenamos
    ctx.fillStyle = "rgba(255, 120, 90, 0.4)"; // Tú decides la opacidad del relleno
    ctx.fill();

    // Luego dibujamos el contorno (la línea de arriba)
    ctx.beginPath();
    if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = "#FF785A"; // El mismo color pero sólido para el contorno
        ctx.lineWidth = 2; // Grosor del contorno
        ctx.stroke();
    }

    // --- 4. CHROMA BARS (Estilo Pygame/Notebook) ---
    // Dibujamos 12 barras en el fondo para mostrar la energía de cada nota
    const barWidth = width / 12;
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    chroma.forEach((val, i) => {
      const x = i * barWidth;
      const barHeight = val * height * 0.2; // 20% de la altura del canvas
      
      // Color: Verde si la nota está activa, rojo tenue si no
      const isActive = activeNotes.includes(noteNames[i]);
      ctx.fillStyle = isActive ? "rgba(0, 255, 150, 0.4)" : "rgba(255, 120, 90, 0.1)";
      
      // Dibujar barra desde abajo
      ctx.fillRect(x + 2, height - barHeight, barWidth - 4, barHeight);

      // Texto de la nota abajo
      ctx.fillStyle = isActive ? "#00FF96" : "#444";
      ctx.font = "bold 12px Roboto";
      ctx.textAlign = "center";
      ctx.fillText(noteNames[i], x + barWidth / 2, height - 5);
    });
  }
}