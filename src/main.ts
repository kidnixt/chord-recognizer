import { createAudioContext } from "./audio/audioContext";
import { getMicrophoneStream } from "./audio/microphone";
import { createAnalyser } from "./audio/analyser";
import { getSpectrum } from "./dsp/fft";
import { detectPeaks } from "./dsp/peaks";
import { frequencyToNote } from "./music/pitch";
import { updateOutput } from "./ui/app";
import { SpectrumVisualizer } from "./ui/spectrum";
import { NoteTracker } from "./music/noteTracker";
import { computeChroma } from "./dsp/chroma"; // Crea este archivo con el código que te daré abajo
import { detectChordFromChroma } from "./music/chords";

const tracker = new NoteTracker(25); // Un poco más de inercia para evitar parpadeos
const button = document.getElementById("start")!;
const stopButton = document.getElementById("stop")!;
const canvas = document.getElementById("spectrum") as HTMLCanvasElement;

let mediaStream: MediaStream | null = null;
let audioCtx: AudioContext | null = null;
let isListening = false;
let smoothedChroma = new Float32Array(12).fill(0);

let detectionThreshold = 0.40;
let volumeGate = 0.015;

const thresholdSlider = document.getElementById("thresholdSlider") as HTMLInputElement;
const thresholdValue = document.getElementById("thresholdValue")!;
thresholdSlider.addEventListener("input", (e) => {
  detectionThreshold = parseFloat((e.target as HTMLInputElement).value);
  thresholdValue.textContent = detectionThreshold.toFixed(2);
});

const gateSlider = document.getElementById("gateSlider") as HTMLInputElement;
const gateValue = document.getElementById("gateValue")!;
gateSlider.addEventListener("input", (e) => {
  volumeGate = parseFloat((e.target as HTMLInputElement).value);
  gateValue.textContent = volumeGate.toFixed(3);
});

button.addEventListener("click", async () => {
  if (isListening) return;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 44100, 
    });
  }
  
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  isListening = true;
  mediaStream = await getMicrophoneStream();
  
  const source = audioCtx.createMediaStreamSource(mediaStream);
  const analyser = createAnalyser(audioCtx, source);
  
  analyser.fftSize = 8192; 
  analyser.smoothingTimeConstant = 0.4; // Ajustado para mayor fluidez visual

  const visualizer = new SpectrumVisualizer(canvas);
  const timeData = new Float32Array(analyser.fftSize);

  updateOutput("Listening...");

  function loop() {
  if (!isListening || !audioCtx) return;

  analyser.getFloatTimeDomainData(timeData);
  const spectrum = getSpectrum(analyser);

  // 1. GATE DE VOLUMEN PRIMERO
  const rms = Math.sqrt(timeData.reduce((sum, v) => sum + v * v, 0) / timeData.length);

  if (rms < volumeGate) {
    // Si hay silencio, "limpiamos" el suavizado lentamente para que no queden fantasmas
    for (let i = 0; i < 12; i++) smoothedChroma[i] *= 0.5; 

    updateOutput(`
      <div style="display: flex; flex-direction: column; align-items: center; opacity: 0.3;">
        <span style="font-size: 4rem; font-weight: 900; color: #191919;">---</span>
        <span style="font-size: 0.85rem; color: #666;">SILENCE</span>
      </div>
    `);
    visualizer.draw(timeData, spectrum, audioCtx.sampleRate, analyser.fftSize, [], smoothedChroma);
    requestAnimationFrame(loop);
    return;
  }

  // 2. UNA SOLA LLAMADA A CHROMA
  const rawChroma = computeChroma(spectrum, audioCtx.sampleRate, analyser.fftSize);

  // 3. SUAVIZADO TEMPORAL
  // Si quieres que responda más rápido, sube el 0.2 a 0.3
  for (let i = 0; i < 12; i++) {
    smoothedChroma[i] = (smoothedChroma[i] * 0.75) + (rawChroma[i] * 0.25);
  }

  // 4. DETECCIÓN BASADA EN EL SUAVIZADO
  const result = detectChordFromChroma(smoothedChroma);

  // 5. NOTAS ACTIVAS (Usamos el suavizado para que las letras no parpadeen)
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const activeNotes: string[] = [];
  smoothedChroma.forEach((val, i) => {
    if (val > detectionThreshold) activeNotes.push(noteNames[i]);
  });

  // 6. DIBUJO (Usamos smoothedChroma para que las barritas de la UI sean fluidas)
  visualizer.draw(
    timeData, 
    spectrum, 
    audioCtx.sampleRate, 
    analyser.fftSize, 
    activeNotes,
    smoothedChroma 
  );

  // 7. UI OUTPUT
  // Subimos un poco el umbral de score a 0.65 para que solo muestre acordes "seguros"
  const isConfident = result.score > 0.65;
  const displayHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
      <span style="font-size: 5rem; font-weight: 900; color: ${isConfident ? '#00FF96' : '#191919'}; line-height: 1; text-transform: uppercase;">
          ${isConfident ? result.name : "..."}
      </span>
      <div style="margin-top: 10px; display: flex; flex-direction: column; align-items: center;">
          <span style="font-size: 0.95rem; color: #666; font-weight: 600; text-transform: uppercase;">
              confidence: ${Math.floor(result.score * 100)}%
          </span>
      </div>
    </div>
  `;

  updateOutput(displayHTML);
  requestAnimationFrame(loop);
}
  loop();
});

stopButton.addEventListener("click", () => {
  isListening = false;
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (audioCtx) audioCtx.suspend();
  
  // Reset visual del output
  updateOutput(`
    <div style="font-size: 2rem; font-weight: 900; color: #191919; opacity: 0.3;">
        OFFLINE
    </div>
  `);
});