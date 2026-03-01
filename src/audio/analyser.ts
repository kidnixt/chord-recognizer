export function createAnalyser(
  ctx: AudioContext,
  source: MediaStreamAudioSourceNode
): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 16384;                 // Alta resolución
  analyser.smoothingTimeConstant = 0.85;    // Suavizado temporal

  source.connect(analyser);
  return analyser;
}
