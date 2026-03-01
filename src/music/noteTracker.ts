import { frequencyToNote, type Note } from './pitch';
export class NoteTracker {
  private history: Note[][] = [];
  private windowSize: number;

  constructor(windowSize = 10) {
    this.windowSize = windowSize;
  }

  update(notes: Note[]): Note[] {
    this.history.push(notes);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    return this.getStableNotes();
  }

  private getStableNotes(): Note[] {
    const count = new Map<string, { note: Note; hits: number }>();

    for (const frame of this.history) {
      for (const note of frame) {
        const key = note.name;
        if (!count.has(key)) {
          count.set(key, { note, hits: 0 });
        }
        count.get(key)!.hits++;
      }
    }

    // solo notas que aparecen en al menos X% de los frames
    const threshold = this.windowSize * 0.6;

    return Array.from(count.values())
      .filter(v => v.hits >= threshold)
      .map(v => v.note);
  }
}
