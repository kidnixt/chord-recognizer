export interface Peak {
  frequency: number;
  magnitude: number;
}

export function detectPeaks(
  spectrum: Float32Array,
  sampleRate: number,
  fftSize: number,
  options = {
    minFrequency: 80,
    maxFrequency: 2000,
    maxPeaks: 6,
    thresholdDb: -60,
  }
): Peak[] {
  const peaks: Peak[] = [];

  const binFreq = sampleRate / fftSize;

  for (let i = 1; i < spectrum.length - 1; i++) {
    const freq = i * binFreq;

    if (freq < options.minFrequency || freq > options.maxFrequency) continue;
    if (spectrum[i] < options.thresholdDb) continue;

    // máximo local
    if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
      peaks.push({
        frequency: freq,
        magnitude: spectrum[i],
      });
    }
  }

  // ordenar por energía (más fuerte primero)
  peaks.sort((a, b) => b.magnitude - a.magnitude);

  return peaks.slice(0, options.maxPeaks);
}
