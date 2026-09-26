// ============================================
// STYLES — Reusable Neobrutal CSS Class Constants
// ============================================

window.NB = {
    // Shadow patterns
    shadow: {
        sm: 'shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]',
        md: 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
        lg: 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]',
        xl: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]',
        xxl: 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]',
        hero: 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]',
    },

    // Common border style
    border: 'border-2 border-black dark:border-white',
    borderThin: 'border border-black dark:border-white',

    // Common avatar / category badge circle
    avatar: (size = 9) => `w-${size} h-${size} rounded-full border-2 border-black dark:border-white flex items-center justify-center text-black text-xs font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]`,

    // Chip / pill button styles
    chip: {
        base: 'rounded-lg text-xs font-black border-2 border-black dark:border-white transition-all active:scale-95',
        active: 'bg-indigo-500 text-black',
        inactive: 'bg-white text-black hover:bg-neutral-100',
    },

    // Filter dropdown panel
    filterPanel: 'absolute right-0 mt-2 bg-[#faf8f5]/90 dark:bg-zinc-950/90 backdrop-blur-md border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] rounded-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 space-y-3.5',

    // Filter trigger button
    filterButton: (isActive) => `h-11 px-4 bg-card border-2 border-black dark:border-white rounded-lg font-black text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:bg-muted active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 ${isActive ? 'bg-indigo-500 text-black' : ''}`,

    // Modal card
    modalCard: 'p-4 rounded-xl border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-card',

    // Transaction type badge
    typeBadge: (type) => `text-[9px] px-2 py-0.5 rounded-full border border-black dark:border-white font-black shrink-0 ${type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`,

    // Amount color
    amountColor: (type) => type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
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
