// ============================================
// STYLES — Apple Minimalist UI System Constants
// ============================================

window.NB = {
    // Subtle, diffused ambient depth (Apple Elevation)
    shadow: {
        sm: 'shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
        md: 'shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
        lg: 'shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.5)]',
        xl: 'shadow-[0_16px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]',
        xxl: 'shadow-[0_24px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_54px_rgba(0,0,0,0.7)]',
        hero: 'shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] dark:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)]',
    },

    // Apple Hairline borders
    border: 'border border-slate-200/80 dark:border-slate-800/80',
    borderThin: 'border border-slate-200/70 dark:border-slate-800/70',

    // Avatar / Category circle
    avatar: (size = 9) => `w-${size} h-${size} rounded-full border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-100 text-xs font-semibold bg-slate-100 dark:bg-slate-800/80`,

    // Apple Segmented Control / Chip styles
    chip: {
        base: 'rounded-xl text-xs font-medium border border-transparent transition-all duration-200 active:scale-95',
        active: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold border-slate-200/60 dark:border-slate-700/60',
        inactive: 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50',
    },

    // Glassy Filter dropdown panel
    filterPanel: 'absolute right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-2xl p-4 z-50 animate-slide-up space-y-3.5',

    // Filter trigger button
    filterButton: (isActive) => `h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl font-medium text-xs text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 ${isActive ? 'ring-2 ring-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : ''}`,

    // Modal card
    modalCard: 'p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900',

    // Transaction type badge
    typeBadge: (type) => `text-[10px] px-2.5 py-0.5 rounded-full font-medium shrink-0 ${type === 'income' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40'}`,

    // Amount color
    amountColor: (type) => type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100',
};

/**
 * Maps category name to a clean, expressive standard icon/emoji.
 */
window.getCategoryIcon = (categoryName, type) => {
    if (!categoryName) return type === 'income' ? '💸' : '🏷️';
    const n = categoryName.toLowerCase();
    if (n.includes('makan') || n.includes('minum') || n.includes('kuliner') || n.includes('pangan') || n.includes('food')) return '🍽️';
    if (n.includes('pokok') || n.includes('sembako') || n.includes('belanja') || n.includes('groceries')) return '🛒';
    if (n.includes('kopi') || n.includes('coffee') || n.includes('cafe')) return '☕';
    if (n.includes('gaya') || n.includes('hiburan') || n.includes('entertainment') || n.includes('game') || n.includes('nonton')) return '🎬';
    if (n.includes('keuangan') || n.includes('gaji') || n.includes('salary') || n.includes('pendapatan')) return '💸';
    if (n.includes('tabungan') || n.includes('invest') || n.includes('saham') || n.includes('emas') || n.includes('reksa')) return '📈';
    if (n.includes('transport') || n.includes('bensin') || n.includes('bbm') || n.includes('ojek') || n.includes('parkir') || n.includes('tol')) return '🚗';
    if (n.includes('tagihan') || n.includes('listrik') || n.includes('pln') || n.includes('air') || n.includes('pdam') || n.includes('wifi') || n.includes('internet') || n.includes('pulsa')) return '⚡';
    if (n.includes('kesehatan') || n.includes('obat') || n.includes('medis') || n.includes('dokter') || n.includes('rumah sakit')) return '💊';
    if (n.includes('pendidikan') || n.includes('sekolah') || n.includes('kuliah') || n.includes('buku') || n.includes('kursus')) return '📚';
    if (n.includes('keluarga') || n.includes('anak') || n.includes('istri') || n.includes('suami') || n.includes('rumah')) return '🏠';
    if (n.includes('donasi') || n.includes('sedekah') || n.includes('amal') || n.includes('zakat') || n.includes('infaq')) return '🤲';
    if (n.includes('pakaian') || n.includes('baju') || n.includes('fashion')) return '👕';
    if (type === 'income') return '💰';
    return '🏷️';
};
