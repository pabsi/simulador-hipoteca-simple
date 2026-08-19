/**
 * amortList.js
 * Manages the dynamic list of extraordinary amortizations in the sidebar form.
 */

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MONTH_OPTIONS = MONTHS
    .map((name, i) => `<option value="${i + 1}">${name}</option>`)
    .join('');

let nextId = 1;

const listEl = () => document.getElementById('amort-list');
const emptyEl = () => document.getElementById('amort-empty');
const destinoEl = () => document.getElementById('destino-field');

function syncVisibility() {
    const hasItems = listEl().children.length > 0;
    emptyEl().classList.toggle('hidden', hasItems);
    destinoEl().classList.toggle('hidden', !hasItems);
}

function addEntry() {
    const id = nextId++;
    const li = document.createElement('li');
    li.className = 'amort-entry';
    li.dataset.id = id;
    li.innerHTML = `
        <button type="button" class="btn-remove" title="Eliminar" aria-label="Eliminar amortización">×</button>
        <div class="amort-fields-row">
            <div class="amort-col">
                <span class="amort-entry-label">Fecha</span>
                <div class="date-pair">
                    <div class="input-wrap">
                        <select class="amort-mes-sel">${MONTH_OPTIONS}</select>
                    </div>
                    <div class="input-wrap">
                        <input type="number" class="amort-anio" min="1900" max="2100" step="1" placeholder="2025">
                    </div>
                </div>
            </div>
            <div class="amort-row-bottom">
                <div class="amort-col amort-col-day">
                    <span class="amort-entry-label">Día (opc.)</span>
                    <div class="input-wrap">
                        <input type="number" class="amort-dia" min="1" max="31" step="1" placeholder="—">
                        <span class="unit">d</span>
                    </div>
                </div>
                <div class="amort-col">
                    <span class="amort-entry-label">Importe</span>
                    <div class="input-wrap">
                        <input type="number" class="amort-importe" min="1" step="100" placeholder="10 000">
                        <span class="unit">€</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    li.querySelector('.btn-remove').addEventListener('click', () => {
        li.remove();
        syncVisibility();
    });
    listEl().appendChild(li);
    syncVisibility();
    li.querySelector('.amort-anio').focus();
}

/**
 * Reads all entries from the DOM.
 * @returns {Array<{yearMonth: string, amount: number}>}  yearMonth is 'YYYY-MM'
 */
export function getAmortizations() {
    return [...listEl().querySelectorAll('.amort-entry')].map(li => {
        const mes = li.querySelector('.amort-mes-sel').value;
        const anio = li.querySelector('.amort-anio').value;
        const diaVal = li.querySelector('.amort-dia')?.value;
        const day = diaVal ? parseInt(diaVal, 10) : null;
        const amount = parseFloat(li.querySelector('.amort-importe').value) || 0;
        const yearMonth = anio ? `${anio}-${String(mes).padStart(2, '0')}` : '';
        return { yearMonth, day, amount };
    });
}

export function initAmortList() {
    document.getElementById('btn-add-amort').addEventListener('click', addEntry);
    syncVisibility();
}

/**
 * Replaces the list contents with the provided amortizations.
 * Pass an empty array to just clear the list.
 */
export function setAmortizations(amorts) {
    listEl().innerHTML = '';
    nextId = 1;
    for (const a of amorts) {
        addEntry();
        const last = listEl().lastElementChild;
        const [year, month] = (a.yearMonth ?? '').split('-');
        if (month) last.querySelector('.amort-mes-sel').value = String(parseInt(month, 10));
        if (year) last.querySelector('.amort-anio').value = year;
        if (a.day != null) {
            const diaEl = last.querySelector('.amort-dia');
            if (diaEl) diaEl.value = String(a.day);
        }
        last.querySelector('.amort-importe').value = String(a.amount ?? '');
    }
    syncVisibility();
}
