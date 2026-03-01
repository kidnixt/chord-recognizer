const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Generamos las plantillas (Templates) como en el notebook
const CHORD_TEMPLATES: Record<string, number[]> = {};

NOTE_NAMES.forEach((name, i) => {
    // Mayor [0, 4, 7]
    const maj = new Array(12).fill(0);
    [0, 4, 7].forEach(v => maj[(i + v) % 12] = 1);
    CHORD_TEMPLATES[name] = maj;

    // Menor [0, 3, 7]
    const min = new Array(12).fill(0);
    [0, 3, 7].forEach(v => min[(i + v) % 12] = 1);
    CHORD_TEMPLATES[name + "m"] = min;
});

function cosineSimilarity(A: number[], B: number[]) {
    let dot = 0, mA = 0, mB = 0;
    for (let i = 0; i < 12; i++) {
        dot += A[i] * B[i];
        mA += A[i] * A[i];
        mB += B[i] * B[i];
    }
    return (mA === 0 || mB === 0) ? 0 : dot / (Math.sqrt(mA) * Math.sqrt(mB));
}

export function detectChordFromChroma(chroma: Float32Array | number[]) {
    let bestScore = -1;
    let bestChord = "---";

    for (const [name, template] of Object.entries(CHORD_TEMPLATES)) {
        const score = cosineSimilarity(Array.from(chroma), template);
        if (score > bestScore) {
            bestScore = score;
            bestChord = name;
        }
    }

    return { 
        name: bestChord, 
        score: bestScore // Esto es lo que usamos para el "% de confianza"
    };
}