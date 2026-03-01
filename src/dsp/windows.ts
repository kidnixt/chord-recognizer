export function applyHannWindow(data: Float32Array): Float32Array {
  const N = data.length;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    out[i] = data[i] * w;
  }
  return out;
}
