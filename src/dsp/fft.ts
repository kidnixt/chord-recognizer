export function getSpectrum(analyser: AnalyserNode): Float32Array {
  const buffer = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(buffer);
  return buffer;
}
