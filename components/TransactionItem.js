// ============================================
// TransactionItem — Reusable Transaction Row Component
// ============================================
// Used in both DashboardView (recent list) and TransactionsView (mobile cards).

/**
 * A single transaction item display.
 *
 * @param {Object} transaction - Transaction data with nested category.
 * @param {boolean} [compact=false] - If true, renders a compact row (for Dashboard).
 * @param {Function} [onClick] - Card click callback (opens detail / action sheet).
 * @param {Function} [onEdit] - Edit callback (fallback if onClick not provided).
 * @param {Function} [onDelete] - Delete callback.
 */
window.TransactionItem = ({ transaction: t, compact = false, onClick, onEdit, onDelete }) => {
    const catIcon = window.getCategoryIcon ? window.getCategoryIcon(t.category?.name, t.type) : '🏷️';
    const catName = t.category?.name || 'Transaksi';
    const catColor = t.category?.color || '#FFADAD';
    const amountStr = `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`;
    const dateNote = `${formatDate(t.date)}${t.note ? ` • ${t.note}` : ''}`;

    const handleCardClick = () => {
        if (onClick) onClick(t);
        else if (onEdit) onEdit(t);
    };

    // Compact mode: simple row for Dashboard recent list
    if (compact) {
        return (
            <div 
                onClick={handleCardClick}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-10 h-10 rounded-2xl border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 text-base shadow-xs"
                        style={{ backgroundColor: `${catColor}20`, color: catColor }}
                    >
                        {catIcon}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{catName}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{dateNote}</p>
                    </div>
                </div>
                <div className={`font-semibold text-xs sm:text-sm shrink-0 ml-2 ${window.NB.amountColor(t.type)}`}>
                    {amountStr}
                </div>
            </div>
        );
    }

    // Full mode: Clean card layout for Transactions mobile view
    return (
        <div
            onClick={handleCardClick}
            className="p-3.5 flex items-center justify-between space-x-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer select-none"
        >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div
                    className="w-10 h-10 rounded-2xl border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 text-base shadow-xs"
                    style={{ backgroundColor: `${catColor}20`, color: catColor }}
                >
                    {catIcon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{catName}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{dateNote}</p>
                </div>
            </div>
            <div className="text-right shrink-0">
                <span className={`font-semibold text-xs sm:text-sm ${window.NB.amountColor(t.type)}`}>
                    {amountStr}
                </span>
            </div>
        </div>
    );
};
