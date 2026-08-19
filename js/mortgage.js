/**
 * mortgage.js
 * Core financial calculations for French-amortization mortgages.
 * All monetary outputs are in euros (numbers). Caller is responsible for formatting.
 */

/**
 * Monthly payment under the French amortization system.
 * @param {number} principal      - Loan amount (€)
 * @param {number} annualRatePct  - Annual interest rate (e.g. 3.5 for 3.5%)
 * @param {number} months         - Total loan term in months
 * @returns {number}
 */
export function monthlyPayment(principal, annualRatePct, months) {
    const r = annualRatePct / 100 / 12;
    if (r === 0) return principal / months;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

/**
 * Full amortization schedule.
 * @param {number} principal
 * @param {number} annualRatePct
 * @param {number} months
 * @returns {Array<{month: number, payment: number, interest: number, capital: number, balance: number}>}
 */
export function amortizationSchedule(principal, annualRatePct, months) {
    const r = annualRatePct / 100 / 12;
    const payment = monthlyPayment(principal, annualRatePct, months);
    const rows = [];
    let balance = principal;

    for (let i = 1; i <= months; i++) {
        const interest = balance * r;
        // On the last month, capital is whatever remains to avoid floating-point residual
        const capital = i === months ? balance : payment - interest;
        balance = Math.max(0, balance - capital);
        rows.push({ month: i, payment, interest, capital, balance });
    }

    return rows;
}

/**
 * Builds the full amortization schedule for a loan that includes multiple
 * extraordinary amortizations at specific months.
 *
 * Each amortization is applied in chronological order. After each one the
 * remaining loan is recalculated according to `mode`:
 *   - 'plazo': keep the current monthly payment, shorten the remaining term.
 *   - 'cuota': keep the remaining term, lower the monthly payment.
 *
 * @param {number} principal
 * @param {number} annualRatePct
 * @param {number} totalMonths
 * @param {Array<{month: number, amount: number}>} amortizations  - sorted or unsorted
 * @param {'plazo'|'cuota'} mode
 * @returns {Array<{month, payment, interest, capital, balance}>}
 */
export function buildScheduleWithAmortizations(principal, annualRatePct, totalMonths, amortizations, mode) {
    const r = annualRatePct / 100 / 12;
    const sorted = [...amortizations]
        .filter(a => a.month >= 1 && a.month <= totalMonths && a.amount > 0)
        .sort((a, b) => a.month - b.month);

    const fullSchedule = [];
    let balance = principal;
    let remainingMonths = totalMonths;
    let globalMonth = 0; // absolute month offset already appended to fullSchedule

    for (const amort of sorted) {
        if (balance <= 0) break;

        const segLength = amort.month - globalMonth; // months to process before this amort
        if (segLength <= 0) continue;

        // Build the segment from current balance for `remainingMonths`
        const seg = amortizationSchedule(balance, annualRatePct, remainingMonths);

        for (let i = 0; i < segLength; i++) {
            fullSchedule.push({ ...seg[i], month: globalMonth + i + 1 });
        }

        balance = seg[segLength - 1].balance;
        remainingMonths -= segLength;
        globalMonth = amort.month;

        if (balance <= 0 || remainingMonths <= 0) break;

        // Apply extraordinary payment
        const newBalance = balance - amort.amount;
        if (newBalance <= 0) { balance = 0; break; }

        if (mode === 'cuota') {
            // Same term, lower payment — just update balance; next segment recalculates payment
            balance = newBalance;
        } else {
            // Same payment as the segment we just built, shorter term
            const payment = seg[0].payment;
            const rawMonths = Math.log(payment / (payment - r * newBalance)) / Math.log(1 + r);
            remainingMonths = Math.max(1, Math.ceil(rawMonths));
            balance = newBalance;
        }
    }

    // Append the tail (after last amortization, or the full schedule if no amortizations)
    if (balance > 0 && remainingMonths > 0) {
        const tail = amortizationSchedule(balance, annualRatePct, remainingMonths);
        tail.forEach((row, i) => {
            fullSchedule.push({ ...row, month: globalMonth + i + 1 });
        });
    }

    return fullSchedule;
}
