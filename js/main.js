/**
 * main.js
 * Entry point: form handling, orchestrates calculation and display.
 */

import { amortizationSchedule, buildScheduleWithAmortizations, monthlyPayment } from './mortgage.js';
import { formatEur, formatMonths, show, hide, setText } from './utils.js';
import { initAmortList, getAmortizations, setAmortizations } from './amortList.js';
import { renderChart } from './tabChart.js';
import { saveState, loadState, exportJSON, readJSONFile } from './persist.js';

initAmortList();

// Default start date to current month/year, then restore any saved state
const now = new Date();
document.getElementById('inicio-mes').value = String(now.getMonth() + 1);
document.getElementById('inicio-anio').value = String(now.getFullYear());
const _saved = loadState();
if (_saved) populateForm(_saved);

document.getElementById('form-main').addEventListener('submit', onSubmit);

document.getElementById('btn-export').addEventListener('click', () => exportJSON(buildState()));

document.getElementById('input-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const state = await readJSONFile(file);
        populateForm(state);
    } catch (err) {
        showError(document.getElementById('error-main'), err.message);
    }
    e.target.value = '';
});

function onSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('error-main');
    hide(errorEl);

    const capital = parseFloat(document.getElementById('capital').value);
    const interes = parseFloat(document.getElementById('interes').value);
    const anios = parseInt(document.getElementById('anios').value, 10);
    const inicioMes = parseInt(document.getElementById('inicio-mes').value, 10);
    const inicioAnio = parseInt(document.getElementById('inicio-anio').value, 10);
    const fechaInicio = `${inicioAnio}-${String(inicioMes).padStart(2, '0')}`;
    const mode = document.querySelector('input[name="destino"]:checked')?.value ?? 'plazo';

    if (!capital || capital <= 0) return showError(errorEl, 'El capital debe ser mayor que 0.');
    if (!interes || interes <= 0) return showError(errorEl, 'El tipo de interés debe ser mayor que 0.');
    if (!anios || anios < 1 || anios > 40) return showError(errorEl, 'El plazo debe estar entre 1 y 40 años.');
    if (!inicioAnio || inicioAnio < 1900) return showError(errorEl, 'Indica un año de inicio válido.');

    const totalMonths = anios * 12;
    const rawAmorts = getAmortizations();

    // Convert amort dates → schedule month offsets and validate
    const amortizations = [];
    for (const a of rawAmorts) {
        if (!a.yearMonth) return showError(errorEl, 'Indica la fecha de cada amortización.');
        if (!a.amount || a.amount <= 0) return showError(errorEl, 'El importe de cada amortización debe ser mayor que 0.');
        const month = dateToScheduleMonth(a.yearMonth, fechaInicio);
        if (month < 1 || month > totalMonths)
            return showError(errorEl, `La fecha de amortización debe estar dentro del plazo del préstamo.`);
        amortizations.push({ month, amount: a.amount });
    }

    // Build schedules
    const primerasCuota = parseFloat(document.getElementById('primera-cuota').value) || 0;
    const hasPrimera = primerasCuota > 0;

    // When a partial first month exists, amort months shift by -1 inside the regular schedule
    const regularAmorts = hasPrimera
        ? amortizations.filter(a => a.month > 1).map(a => ({ ...a, month: a.month - 1 }))
        : amortizations;

    const baseRegular = amortizationSchedule(capital, interes, totalMonths);
    const finalRegular = regularAmorts.length > 0
        ? buildScheduleWithAmortizations(capital, interes, totalMonths, regularAmorts, mode)
        : baseRegular;

    // Prepend the partial first month row (all interest, no capital reduction)
    const shift = hasPrimera ? 1 : 0;
    const primeraRow = { month: 1, payment: primerasCuota, interest: primerasCuota, capital: 0, balance: capital };
    const baseSchedule = hasPrimera ? [primeraRow, ...baseRegular.map(r => ({ ...r, month: r.month + 1 }))] : baseRegular;
    const finalSchedule = hasPrimera ? [primeraRow, ...finalRegular.map(r => ({ ...r, month: r.month + 1 }))] : finalRegular;

    renderChart(finalSchedule, fechaInicio);
    saveState(buildState());
    renderSummary(capital, interes, totalMonths, baseSchedule, finalSchedule, amortizations.length > 0, fechaInicio, rawAmorts);
}

function showError(el, msg) {
    el.textContent = msg;
    show(el);
}

/** Converts a 'YYYY-MM' date to a 1-based schedule month number relative to the loan start. */
function dateToScheduleMonth(yearMonth, startYearMonth) {
    const [sy, sm] = startYearMonth.split('-').map(Number);
    const [y, m] = yearMonth.split('-').map(Number);
    return (y - sy) * 12 + (m - sm) + 1;
}

function buildState() {
    return {
        capital: parseFloat(document.getElementById('capital').value) || 0,
        interes: parseFloat(document.getElementById('interes').value) || 0,
        anios: parseInt(document.getElementById('anios').value, 10) || 0,
        inicioMes: parseInt(document.getElementById('inicio-mes').value, 10) || 1,
        inicioAnio: parseInt(document.getElementById('inicio-anio').value, 10) || new Date().getFullYear(),
        primerasCuota: parseFloat(document.getElementById('primera-cuota').value) || 0,
        destino: document.querySelector('input[name="destino"]:checked')?.value ?? 'plazo',
        amortizaciones: getAmortizations(),
    };
}

function populateForm(state) {
    if (state.capital) document.getElementById('capital').value = state.capital;
    if (state.interes) document.getElementById('interes').value = state.interes;
    if (state.anios) document.getElementById('anios').value = state.anios;
    if (state.inicioMes) document.getElementById('inicio-mes').value = state.inicioMes;
    if (state.inicioAnio) document.getElementById('inicio-anio').value = state.inicioAnio;
    if (state.primerasCuota) document.getElementById('primera-cuota').value = state.primerasCuota;
    if (state.destino) {
        const radio = document.querySelector(`input[name="destino"][value="${state.destino}"]`);
        if (radio) radio.checked = true;
    }
    setAmortizations(state.amortizaciones ?? []);
}

function renderSummary(capital, interes, totalMonths, baseSchedule, finalSchedule, hasAmorts, fechaInicio, rawAmorts) {
    const initialPayment = monthlyPayment(capital, interes, totalMonths);
    const finalTotalInterest = finalSchedule.reduce((s, r) => s + r.interest, 0);
    const finalTotalPaid = finalSchedule.reduce((s, r) => s + r.interest + r.capital, 0);
    const finalMonths = finalSchedule.length;

    setText('cuota-mensual', formatEur(initialPayment));
    setText('total-intereses', formatEur(finalTotalInterest));
    setText('total-pagado', formatEur(finalTotalPaid));
    setText('plazo-final', formatMonths(finalMonths));

    // Capital restante a fecha de hoy
    const [sy, sm] = fechaInicio.split('-').map(Number);
    const today = new Date();
    // 1-based schedule month for today — same formula as dateToScheduleMonth
    const currentSchMonth = (today.getFullYear() - sy) * 12 + (today.getMonth() + 1 - sm) + 1;

    let capitalRestante;
    if (currentSchMonth <= 1) {
        capitalRestante = capital; // loan hasn't produced any payment yet
    } else {
        // Payments completed = currentSchMonth - 1 (capped at schedule length)
        const done = Math.min(currentSchMonth - 1, finalSchedule.length);
        let balance = finalSchedule[done - 1].balance;

        // Subtract extraordinary amortizations that fall in the CURRENT schedule month
        // and whose day has already passed. No day → treated as already paid.
        for (const a of (rawAmorts ?? [])) {
            if (!a.yearMonth) continue;
            const [ay, am] = a.yearMonth.split('-').map(Number);
            const offset = (ay - sy) * 12 + (am - sm) + 1; // 1-based, matches currentSchMonth
            if (offset === currentSchMonth) {
                const alreadyPaid = a.day == null || a.day <= today.getDate();
                if (alreadyPaid) balance = Math.max(0, balance - a.amount);
            }
        }
        capitalRestante = balance;
    }

    const fechaHoyStr = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(today);
    setText('capital-restante', formatEur(capitalRestante));
    setText('capital-restante-hint', `A fecha: ${fechaHoyStr}`);
    show(document.getElementById('capital-restante-section'));

    show(document.getElementById('summary'));

    if (hasAmorts) {
        const baseInterest = baseSchedule.reduce((s, r) => s + r.interest, 0);
        const savedInterest = baseInterest - finalTotalInterest;
        const savedMonths = totalMonths - finalMonths;

        setText('saving-interest', formatEur(savedInterest));

        const timeItem = document.getElementById('saving-time-item');
        if (savedMonths > 0) {
            setText('saving-time', formatMonths(savedMonths));
            show(timeItem);
        } else {
            hide(timeItem);
        }

        show(document.getElementById('savings-section'));
    } else {
        hide(document.getElementById('savings-section'));
    }
}

