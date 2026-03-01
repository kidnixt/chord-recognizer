import { createAudioContext } from "./audio/audioContext";
import { getMicrophoneStream } from "./audio/microphone";
import { createAnalyser } from "./audio/analyser";
import { getSpectrum } from "./dsp/fft";
import { detectPeaks } from "./dsp/peaks";
import { frequencyToNote } from "./music/pitch";
import { updateOutput } from "./ui/app";
import { SpectrumVisualizer } from "./ui/spectrum";

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
    visualizer.draw(spectrum);

    // 🎵 detección musical
    const peaks = detectPeaks(
      spectrum,
      ctx.sampleRate,
      analyser.fftSize
    );

    const notes = peaks.map(p => frequencyToNote(p.frequency));

    const text = notes
      .map(n => `${n.name} (${n.frequency.toFixed(1)} Hz)`)
      .join("\n");

    updateOutput(text || "No peaks");

    requestAnimationFrame(loop);
  }

  loop();
});
