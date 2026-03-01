export function createAudioContext(): AudioContext {
  const AudioCtx =
    window.AudioContext || (window as any).webkitAudioContext;

  return new AudioCtx();
}
