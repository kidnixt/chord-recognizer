export function createAnalyser(
  ctx: AudioContext,
  source: MediaStreamAudioSourceNode
): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0.8;

  source.connect(analyser);
  return analyser;
}
