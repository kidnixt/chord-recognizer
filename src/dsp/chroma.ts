export function computeChroma(spectrum: Float32Array, sampleRate: number, fftSize: number): Float32Array {
    const chroma = new Float32Array(12).fill(0);
    
    for (let i = 0; i < spectrum.length; i++) {
        const freq = (i * sampleRate) / fftSize;
        
        // Filtro de rango: 70Hz (cerca de Mi grave) a 1100Hz
        if (freq < 70 || freq > 1100) continue; 

        // 1. Convertimos frecuencia a número MIDI continuo (con decimales)
        const midi = 12 * Math.log2(freq / 440) + 69;
        
        // 2. Usamos Math.floor(midi + 0.5) para un redondeo más estable hacia la nota más cercana
        // El modulo 12 negativo se evita sumando 12 antes del %
        const pitchClass = (Math.round(midi) % 12 + 12) % 12;
        
        // 3. Energía: Magnitud al cuadrado. 
        // spectrum[i] suele ser dB, así que esto extrae la potencia real.
        const magnitude = Math.pow(10, spectrum[i] / 20);
        chroma[pitchClass] += magnitude * magnitude;
    }

    // 4. Normalización Robusta (Root Mean Square o Max)
    // Usamos Max para que el perfil de la plantilla (0 a 1) encaje mejor
    let maxVal = 0;
    for (let j = 0; j < 12; j++) {
        if (chroma[j] > maxVal) maxVal = chroma[j];
    }

    if (maxVal > 0) {
        for (let k = 0; k < 12; k++) {
            // Aplicamos una pequeña raíz cuadrada tras normalizar 
            // Esto ayuda a que las notas secundarias del acorde no desaparezcan
            chroma[k] = Math.sqrt(chroma[k] / maxVal);
        }
    }
    
    return chroma;
}