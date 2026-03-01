import { createAudioContext } from "./audio/audioContext";
import { getMicrophoneStream } from "./audio/microphone";
import { createAnalyser } from "./audio/analyser";
import { getSpectrum } from "./dsp/fft";
import { detectPeaks } from "./dsp/peaks";
import { frequencyToNote } from "./music/pitch";
import { updateOutput } from "./ui/app";
import { SpectrumVisualizer } from "./ui/spectrum";

import { NoteTracker } from "./music/noteTracker";

const tracker = new NoteTracker(12);




const button = document.getElementById("start")!;
const canvas = document.getElementById("spectrum") as HTMLCanvasElement;

button.addEventListener("click", async () => {
  const ctx = createAudioContext();
  const stream = await getMicrophoneStream();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = createAnalyser(ctx, source);

  const visualizer = new SpectrumVisualizer(canvas);

  updateOutput("Listening...");

  function loop() {
    const spectrum = getSpectrum(analyser);

    // 🎨 dibujamos espectro

    const peaks = detectPeaks(spectrum, ctx.sampleRate, analyser.fftSize);
    const peaksFreqs = peaks.map(p => p.frequency); // array de frecuencias reales

    visualizer.draw(spectrum, ctx.sampleRate, analyser.fftSize, peaksFreqs);



    // dentro del loop
    const rawNotes = peaks.map(p => frequencyToNote(p.frequency));
    const stableNotes = tracker.update(rawNotes);
    const text = stableNotes
      .map(n => `${n.name} (${n.frequency.toFixed(1)} Hz)`)
      .join("\n");

    updateOutput(text || "No peaks");

    requestAnimationFrame(loop);
  }

  loop();
});
