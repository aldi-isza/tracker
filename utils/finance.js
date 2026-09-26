// ============================================
// FINANCE — Financial Calculation Utilities
// ============================================

/**
 * Filter transactions by a specific month and year.
 * @param {Array} transactions - All transactions.
 * @param {number} month - Target month (0-indexed).
 * @param {number} year - Target year.
 * @returns {Array} Filtered transactions for the target month.
 */
window.filterByMonth = (transactions, month, year) => {
    return (transactions || []).filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
};

/**
 * Filter transactions between two date strings (inclusive, format YYYY-MM-DD).
 * @param {Array} transactions - All transactions.
 * @param {string|null} [startDate] - Start date (YYYY-MM-DD).
 * @param {string|null} [endDate] - End date (YYYY-MM-DD).
 * @returns {Array} Filtered transactions.
 */
window.filterByDateRange = (transactions, startDate, endDate) => {
    return (transactions || []).filter(t => {
        if (!t.date) return false;
        const tDate = String(t.date).slice(0, 10);
        if (startDate && tDate < startDate) return false;
        if (endDate && tDate > endDate) return false;
        return true;
    });
};

/**
 * Calculate total income and expense from a list of transactions.
 * @param {Array} transactions - Transactions to sum.
 * @returns {{ income: number, expense: number }}
 */
window.calcTotals = (transactions) => {
    let income = 0;
    let expense = 0;
    (transactions || []).forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') income += amount;
        else if (t.type === 'expense') expense += amount;
    });
    return { income, expense };
};

/**
 * Calculate the cumulative all-time balance.
 * @param {Array} transactions - All transactions.
 * @returns {number} Net balance (income - expense).
 */
window.calcBalance = (transactions) => {
    return (transactions || []).reduce((sum, t) => {
        const amount = parseFloat(t.amount) || 0;
        return sum + (t.type === 'income' ? amount : -amount);
    }, 0);
};

/**
 * Calculate today's income and expense.
 * @param {Array} transactions - All transactions.
 * @returns {{ income: number, expense: number }}
 */
window.calcTodayTotals = (transactions) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    const todayTx = (transactions || []).filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
    });

    return window.calcTotals(todayTx);
};

/**
 * Calculate expense breakdown by category.
 * @param {Array} transactions - Transactions (typically monthly, pre-filtered).
 * @returns {Object} Map of category name → { amount, color }.
 */
window.calcCategoryBreakdown = (transactions) => {
    const breakdown = {};
    (transactions || [])
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const catName = t.category?.name || 'Lainnya';
            const catColor = t.category?.color || '#94a3b8';
            if (!breakdown[catName]) {
                breakdown[catName] = { amount: 0, color: catColor };
            }
            breakdown[catName].amount += parseFloat(t.amount) || 0;
        });
    return breakdown;
};

/**
 * Calculate savings rate as a percentage.
 * @param {number} income - Total income.
 * @param {number} expense - Total expense.
 * @returns {number} Savings rate (0-100, can be negative).
 */
window.calcSavingsRate = (income, expense) => {
    if (income <= 0) return 0;
    return Math.round(((income - expense) / income) * 100);
};

/**
 * Determine financial health badge based on income, expense, and budget rule.
 * @param {number} income - Total income.
 * @param {number} expense - Total expense.
 * @param {{ needs: number, wants: number, savings: number }} budgetRule - Budget allocation rule.
 * @returns {{ status: string, badgeColor: string, tip: string }}
 */
window.getHealthBadge = (income, expense, budgetRule) => {
    const savingsRate = window.calcSavingsRate(income, expense);

    if (income === 0 && expense === 0) {
        return {
            status: 'Belum Ada Aktivitas',
            badgeColor: 'bg-neutral-200 text-black',
            tip: 'Mulai catat setiap transaksi harianmu agar arus kas dan tabungan keluarga bisa dievaluasi dengan akurat.'
        };
    }
    if (income > 0 && expense > income) {
        return {
            status: '⚠️ Defisit (Pengeluaran > Pemasukan)',
            badgeColor: 'bg-rose-400 text-black',
            tip: 'Pengeluaran melebihi pemasukan bulan ini! Evaluasi pos belanja sekunder dan prioritaskan kebutuhan primer terlebih dahulu agar arus kas kembali surplus.'
        };
    }
    if (savingsRate >= (budgetRule.savings + 10)) {
        return {
            status: '🌟 Super Saver (Sangat Sehat)',
            badgeColor: 'bg-emerald-400 text-black',
            tip: `Luar biasa! Kamu berhasil menyisihkan lebih dari ${budgetRule.savings + 10}% pendapatan bulan ini (target tabunganmu: ${budgetRule.savings}%). Pertahankan disiplin ini untuk mempercepat dana darurat dan impian keluarga!`
        };
    }
    if (savingsRate >= budgetRule.savings) {
        return {
            status: '👍 Sehat & Sesuai Target',
            badgeColor: 'bg-indigo-400 text-black',
            tip: `Bagus! Tabunganmu mencapai ${savingsRate}% dan telah memenuhi target alokasi tabungan (${budgetRule.savings}%). Pertahankan konsistensi ini!`
        };
    }
    return {
        status: '⚡ Di Bawah Target Tabungan',
        badgeColor: 'bg-amber-400 text-black',
        tip: `Porsi tabungan bulan ini (${savingsRate}%) masih di bawah targetmu (${budgetRule.savings}%). Coba periksa pos belanja dan sesuaikan alokasi ${budgetRule.needs}/${budgetRule.wants}/${budgetRule.savings} untuk budget yang lebih sehat.`
    };
};
