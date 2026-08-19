/**
 * utils.js
 * Shared formatting and DOM helpers.
 */

const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

/** Format a number as euros */
export const formatEur = (n) => EUR.format(n);

/**
 * Format a month count as a human-readable string in Spanish.
 * e.g. 300 → "25 años", 301 → "25 años y 1 mes"
 */
export function formatMonths(m) {
    const years = Math.floor(m / 12);
    const months = m % 12;
    const y = years > 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : '';
    const mo = months > 0 ? `${months} ${months === 1 ? 'mes' : 'meses'}` : '';
    if (y && mo) return `${y} y ${mo}`;
    return y || mo || '0 meses';
}

/** Show an element (removes "hidden" class) */
export const show = (el) => el.classList.remove('hidden');

/** Hide an element (adds "hidden" class) */
export const hide = (el) => el.classList.add('hidden');

/** Set innerText of an element selected by id */
export const setText = (id, text) => { document.getElementById(id).textContent = text; };
