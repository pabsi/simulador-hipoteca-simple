/**
 * persist.js
 * Saves/restores form state via localStorage and handles JSON export/import.
 */

const STORAGE_KEY = 'hipoteca-simulador-v1';

export function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { }
}

export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}

export function exportJSON(state) {
    const filename = `hipoteca-${state.inicioAnio ?? 'datos'}.json`;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
}

/** Reads a File object and resolves with the parsed JSON. */
export function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            try { resolve(JSON.parse(e.target.result)); }
            catch { reject(new Error('El archivo no es un JSON válido.')); }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsText(file);
    });
}
