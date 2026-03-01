const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface Note {
  name: string;
  midi: number;
  frequency: number;
}

export function frequencyToNote(freq: number): Note {
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const name = NOTE_NAMES[midi % 12];

  return {
    name,
    midi,
    frequency: freq,
  };
}
