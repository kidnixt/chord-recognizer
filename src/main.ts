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
const stopButton = document.getElementById("stop")!;
let isListening = false;
const canvas = document.getElementById("spectrum") as HTMLCanvasElement;
let mediaStream: MediaStream | null = null;

button.addEventListener("click", async () => {
  if (isListening) return;
  isListening = true;

  const ctx = createAudioContext();
  mediaStream = await getMicrophoneStream();
  const source = ctx.createMediaStreamSource(mediaStream);
  const analyser = createAnalyser(ctx, source);

  const visualizer = new SpectrumVisualizer(canvas);

  updateOutput("Listening...");

  function loop() {
    if (!isListening) return;

    const spectrum = getSpectrum(analyser);

    const peaks = detectPeaks(spectrum, ctx.sampleRate, analyser.fftSize);
    const peaksFreqs = peaks.map(p => p.frequency);

    visualizer.draw(spectrum, ctx.sampleRate, analyser.fftSize, peaksFreqs);

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

stopButton.addEventListener("click", () => {
  if (!isListening) return;
  isListening = false;

  // Revoke microphone permissions
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  // Reset the spectrum visualizer
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  updateOutput("Stopped listening.");
});
