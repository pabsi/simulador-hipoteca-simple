/**
 * chart.js  (kept as tabChart.js for path stability)
 * Renders and updates the amortization area chart using Chart.js (global).
 */

import { formatEur } from './utils.js';

let chartInstance = null;

/**
 * Returns an array of 'YYYY-MM' strings for each month in the schedule.
 * @param {string} startYearMonth  - 'YYYY-MM' (value from <input type="month">)
 * @param {number} count
 */
function buildDateLabels(startYearMonth, count) {
    const [y, m] = startYearMonth.split('-').map(Number);
    const labels = [];
    for (let i = 0; i < count; i++) {
        const total = m - 1 + i; // 0-based months offset
        const year = y + Math.floor(total / 12);
        const month = (total % 12) + 1;
        labels.push(`${year}-${String(month).padStart(2, '0')}`);
    }
    return labels;
}

/**
 * Renders (or re-renders) the stacked area chart.
 * @param {Array<{month, capital, interest}>} schedule
 * @param {string} startYearMonth  - 'YYYY-MM'
 */
export function renderChart(schedule, startYearMonth) {
    const labels = buildDateLabels(startYearMonth, schedule.length);
    const capitalData = schedule.map(r => parseFloat(r.capital.toFixed(2)));
    const interestData = schedule.map(r => parseFloat(r.interest.toFixed(2)));

    const ctx = document.getElementById('chart-amortizacion').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Capital',
                    data: capitalData,
                    backgroundColor: 'rgba(37, 99, 235, 0.35)',
                    borderColor: 'rgba(37, 99, 235, 0.85)',
                    borderWidth: 1.5,
                    fill: 'origin',
                    tension: 0.35,
                    pointRadius: 0,
                    order: 1,
                },
                {
                    label: 'Intereses',
                    data: interestData,
                    backgroundColor: 'rgba(234, 88, 12, 0.35)',
                    borderColor: 'rgba(234, 88, 12, 0.85)',
                    borderWidth: 1.5,
                    fill: 'origin',
                    tension: 0.35,
                    pointRadius: 0,
                    order: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 24,
                        maxRotation: 60,
                        minRotation: 45,
                        color: '#6b7280',
                        font: { size: 10 },
                    },
                    grid: { color: 'rgba(0,0,0,.05)' },
                },
                y: {
                    title: { display: true, text: 'Importe (€)', color: '#6b7280', font: { size: 12 } },
                    ticks: { color: '#6b7280', font: { size: 11 }, callback: v => formatEur(v) },
                    grid: { color: 'rgba(0,0,0,.05)' },
                },
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#374151', font: { size: 12 }, boxWidth: 14, padding: 16 },
                },
                tooltip: {
                    callbacks: {
                        title: items => items[0].label,
                        label: item => ` ${item.dataset.label}: ${formatEur(item.parsed.y)}`,
                    },
                },
            },
        },
    });
}
