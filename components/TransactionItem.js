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
                className="flex items-center justify-between p-3.5 hover:bg-muted/30 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-10 h-10 rounded-full border-2 border-black dark:border-zinc-800 flex items-center justify-center shrink-0 text-base shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                        style={{ backgroundColor: catColor }}
                    >
                        {catIcon}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-foreground truncate">{catName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{dateNote}</p>
                    </div>
                </div>
                <div className={`font-extrabold text-xs sm:text-sm shrink-0 ml-2 ${window.NB.amountColor(t.type)}`}>
                    {amountStr}
                </div>
            </div>
        );
    }

    // Full mode: Clean card layout for Transactions mobile view
    // Entire card is clickable (with hover & active states). No cluttering edit/delete icons directly under price.
    return (
        <div
            onClick={handleCardClick}
            className="p-3.5 flex items-center justify-between space-x-3 rounded-xl border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-none hover:bg-muted/30 dark:hover:bg-zinc-900 active:scale-[0.99] transition-all cursor-pointer select-none"
        >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div
                    className="w-10 h-10 rounded-full border-2 border-black dark:border-zinc-800 flex items-center justify-center shrink-0 text-base shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                    style={{ backgroundColor: catColor }}
                >
                    {catIcon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs sm:text-sm text-foreground truncate">{catName}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{dateNote}</p>
                </div>
            </div>
            <div className="text-right shrink-0">
                <span className={`font-extrabold text-xs sm:text-sm ${window.NB.amountColor(t.type)}`}>
                    {amountStr}
                </span>
            </div>
        </div>
    );
};
