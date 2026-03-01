import { createAudioContext } from "./audio/audioContext";
import { getMicrophoneStream } from "./audio/microphone";
import { createAnalyser } from "./audio/analyser";
import { getSpectrum } from "./dsp/fft";
import { updateOutput } from "./ui/app";

const button = document.getElementById("start")!;

button.addEventListener("click", async () => {
  const ctx = createAudioContext();
  const stream = await getMicrophoneStream();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = createAnalyser(ctx, source);

  updateOutput("Listening...");

  function loop() {
    const spectrum = getSpectrum(analyser);

    // DEBUG: mostramos el pico máximo
    const max = Math.max(...spectrum);
    updateOutput(`Max energy: ${max.toFixed(2)} dB`);

    requestAnimationFrame(loop);
  }

  loop();
});
