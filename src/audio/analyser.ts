export function createAnalyser(
  ctx: AudioContext,
  source: MediaStreamAudioSourceNode
): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 8192;
  analyser.smoothingTimeConstant = 0.8;

  source.connect(analyser);
  return analyser;
}
