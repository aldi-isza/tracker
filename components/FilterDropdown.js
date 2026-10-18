// ============================================
// FilterDropdown — Reusable Filter Component (Mobile Bottom Sheet & Desktop Dropdown)
// ============================================

const { useState: _fdpUseState, useRef: _fdpUseRef, useCallback: _fdpUseCallback, useEffect: _fdpUseEffect } = React;

/**
 * A reusable filter component that renders as a thumb-friendly Bottom Sheet on mobile
 * and a neat dropdown panel on desktop.
 *
 * @param {string} label - Header label (e.g., "Filter Transaksi").
 * @param {string} triggerLabel - Text on trigger button.
 * @param {boolean} hasActiveFilter - Whether any filter is currently active.
 * @param {Array<{ label: string, options: Array<{ value: string, label: string }>, value: string, onChange: Function }>} groups - Filter option groups.
 * @param {Function} [onReset] - Optional reset callback.
 * @param {string} [className] - Extra classes for the container.
 */
window.FilterDropdown = ({ label, triggerLabel = 'Filter', hasActiveFilter = false, groups = [], onReset, className = '' }) => {
    const [isOpen, setIsOpen] = _fdpUseState(false);
    const triggerRef = _fdpUseRef(null);
    const panelRef = _fdpUseRef(null);

    const closeDropdown = _fdpUseCallback(() => setIsOpen(false), []);

    // Prevent body scroll when mobile bottom sheet is open
    _fdpUseEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <div className={`relative shrink-0 ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={window.NB.filterButton(hasActiveFilter)}
                aria-label={label}
            >
                <Icon name="filter" size={16} />
                <span className="text-xs font-semibold">{triggerLabel}</span>
                {hasActiveFilter && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                )}
            </button>

            {isOpen && (
                <div 
                    onClick={(e) => { if (e.target === e.currentTarget) closeDropdown(); }}
                    className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end md:items-start md:justify-end p-0 md:p-6 animate-in fade-in duration-200"
                >
                    <div 
                        ref={panelRef}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full md:w-80 max-h-[85vh] md:max-h-[80vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t md:border border-slate-200/80 dark:border-slate-800 rounded-t-3xl md:rounded-2xl shadow-xl p-5 pb-safe space-y-4 overflow-y-auto animate-slide-up md:animate-in md:zoom-in-95 duration-200"
                    >
                        {/* Drag Handle Indicator on Mobile */}
                        <div className="md:hidden w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2" />

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-white">
                                <Icon name="filter" size={14} className="text-blue-600" /> {label}
                            </div>
                            <div className="flex items-center gap-3">
                                {hasActiveFilter && onReset && (
                                    <button
                                        type="button"
                                        onClick={onReset}
                                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                                    >
                                        Reset
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={closeDropdown}
                                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    aria-label="Tutup"
                                >
                                    <Icon name="x" size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Option Groups */}
                        {groups.map((group, gi) => (
                            <div key={gi} className="space-y-1.5">
                                {group.label && <Label>{group.label}</Label>}
                                <div className={`flex flex-wrap gap-2 pt-0.5 ${group.scrollable ? 'max-h-40 overflow-y-auto pr-1' : ''}`}>
                                    {group.options.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                group.onChange(opt.value);
                                                if (group.closeOnSelect) closeDropdown();
                                            }}
                                            className={`px-3 py-2 ${window.NB.chip.base} ${window.NB.shadow.sm} dark:border-zinc-800 ${
                                                group.value === opt.value ? window.NB.chip.active : 'bg-white dark:bg-zinc-900 text-foreground hover:bg-neutral-100 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            {opt.label}
                                            {group.value === opt.value && group.closeOnSelect && (
                                                <span className="ml-1"><Icon name="check" size={12} /></span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Done Button */}
                        <Button
                            onClick={closeDropdown}
                            size="default"
                            className="w-full font-bold mt-2 h-11"
                        >
                            Terapkan Filter
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
