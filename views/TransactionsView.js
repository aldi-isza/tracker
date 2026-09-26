// ============================================
// TRANSACTIONS VIEW
// ============================================

const { useState: _tvUseState, useMemo: _tvUseMemo } = React;

window.TransactionsView = React.memo(({ user, transactions, categories, onRefresh, onEdit, onDelete }) => {
    const [type, setType] = _tvUseState('');
    const [categoryId, setCategoryId] = _tvUseState('');
    const [searchQuery, setSearchQuery] = _tvUseState('');
    const [currentPage, setCurrentPage] = _tvUseState(1);
    const [selectedTx, setSelectedTx] = _tvUseState(null);

    const ITEMS_PER_PAGE = 10;

    const filtered = _tvUseMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        
        // Base filter by type and category
        let list = transactions.filter(t => {
            if (type && t.type !== type) return false;
            if (categoryId && t.category_id !== categoryId) return false;
            return true;
        });

        if (query) {
            // Search all matching transactions responsively
            return list.filter(t => {
                const noteMatch = (t.note || '').toLowerCase().includes(query);
                const categoryMatch = (t.category?.name || '').toLowerCase().includes(query);
                const rawDateMatch = (t.date || '').toLowerCase().includes(query);
                const formattedDateMatch = formatDate(t.date).toLowerCase().includes(query);
                return noteMatch || categoryMatch || rawDateMatch || formattedDateMatch;
            });
        }
        
        return list;
    }, [transactions, type, categoryId, searchQuery]);

    // Reset pagination to page 1 whenever filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [type, categoryId, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safeCurrentPage <= 3) {
            return [1, 2, 3, 4, '...', totalPages];
        }
        if (safeCurrentPage >= totalPages - 2) {
            return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
    };

    const catOptions = categories.map(c => ({ value: c.id, label: c.name }));

    const typeOptions = [
        { value: '', label: 'Semua Jenis' },
        { value: 'income', label: 'Pemasukan' },
        { value: 'expense', label: 'Pengeluaran' }
    ];

    const allCatOptions = [{ value: '', label: 'Semua Kategori' }, ...catOptions];

    const paginationBar = filtered.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-0.5">
            <span className="text-xs font-bold text-muted-foreground order-2 sm:order-1">
                Menampilkan <span className="text-foreground font-black">{startIndex + 1}–{endIndex}</span> dari <span className="text-foreground font-black">{filtered.length}</span> transaksi
            </span>

            {totalPages > 1 && (
                <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                    <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={safeCurrentPage === 1}
                        className={`h-9 px-3 rounded-lg border-2 border-black dark:border-zinc-800 font-black text-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                            safeCurrentPage === 1 ? 'bg-muted text-muted-foreground' : `bg-card hover:bg-muted text-foreground ${NB.shadow.sm} dark:shadow-none`
                        }`}
                        aria-label="Halaman Sebelumnya"
                    >
                        <Icon name="chevronLeft" size={15} />
                        <span className="hidden sm:inline">Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1">
                        {getPageNumbers().map((p, idx) => {
                            if (p === '...') {
                                return (
                                    <span key={`dots-${idx}`} className="px-1.5 text-xs font-black text-muted-foreground">
                                        ...
                                    </span>
                                );
                            }
                            const isActive = p === safeCurrentPage;
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setCurrentPage(p)}
                                    className={`min-w-[34px] h-9 px-2 rounded-lg border-2 border-black dark:border-zinc-800 text-xs font-black transition-all active:scale-95 ${
                                        isActive
                                            ? `bg-indigo-500 text-black ${NB.shadow.sm} dark:shadow-none`
                                            : `bg-card hover:bg-muted text-foreground ${NB.shadow.sm} dark:shadow-none`
                                    }`}
                                    aria-label={`Halaman ${p}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={safeCurrentPage === totalPages}
                        className={`h-9 px-3 rounded-lg border-2 border-black dark:border-zinc-800 font-black text-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                            safeCurrentPage === totalPages ? 'bg-muted text-muted-foreground' : `bg-card hover:bg-muted text-foreground ${NB.shadow.sm} dark:shadow-none`
                        }`}
                        aria-label="Halaman Selanjutnya"
                    >
                        <span className="hidden sm:inline">Selanjutnya</span>
                        <Icon name="chevronRight" size={15} />
                    </button>
                </div>
            )}
        </div>
    ) : null;

    return (
        <div className="space-y-3.5 pb-28 sm:pb-20">
            {/* Action Bar */}
            <div className="flex flex-row items-center gap-2.5 w-full">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Icon name="search" size={15} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari transaksi..."
                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-zinc-900 text-foreground border-2 border-black dark:border-zinc-800 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-muted-foreground/80"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground"
                            aria-label="Clear Search"
                        >
                            <Icon name="x" size={14} />
                        </button>
                    )}
                </div>

                <div className="shrink-0">
                    <FilterDropdown
                        label="Filter Transaksi"
                        hasActiveFilter={!!(type || categoryId || searchQuery)}
                        groups={[
                            {
                                label: 'Jenis',
                                options: typeOptions,
                                value: type,
                                onChange: setType,
                            },
                            {
                                label: 'Kategori',
                                options: allCatOptions,
                                value: categoryId,
                                onChange: setCategoryId,
                                scrollable: true,
                            }
                        ]}
                        onReset={() => { setType(''); setCategoryId(''); setSearchQuery(''); }}
                    />
                </div>
            </div>

            {/* Mobile Card List View (< md) */}
            <div className="md:hidden space-y-2">
                {paginated.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-xs rounded-xl border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                        Tidak ada transaksi yang ditemukan.
                    </div>
                ) : (
                    paginated.map(t => (
                        <TransactionItem
                            key={t.id}
                            transaction={t}
                            onClick={setSelectedTx}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
                {paginationBar}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block">
                <div className="overflow-hidden rounded-xl border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b border-border/80 dark:border-zinc-800 bg-muted/40 dark:bg-zinc-900 text-muted-foreground text-[11px] uppercase font-bold tracking-wider">
                                    <th className="text-left p-3.5">Tanggal</th>
                                    <th className="text-left p-3.5">Kategori</th>
                                    <th className="text-left p-3.5">Jenis</th>
                                    <th className="text-right p-3.5">Jumlah</th>
                                    <th className="text-left p-3.5">Catatan</th>
                                    <th className="text-center p-3.5">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 dark:divide-zinc-800">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center p-8 text-muted-foreground text-xs">
                                            Tidak ada transaksi yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(t => (
                                        <tr key={t.id} className="hover:bg-muted/30 dark:hover:bg-zinc-900/50 transition-colors">
                                            <td className="p-3.5 font-semibold text-muted-foreground">{formatDate(t.date)}</td>
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-7 h-7 rounded-full border border-black dark:border-zinc-800 flex items-center justify-center shrink-0 text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                                                        style={{ backgroundColor: t.category?.color || '#FFADAD' }}
                                                    >
                                                        {window.getCategoryIcon ? window.getCategoryIcon(t.category?.name, t.type) : '🏷️'}
                                                    </div>
                                                    <span className="font-bold text-foreground">{t.category?.name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`inline-flex items-center ${NB.typeBadge(t.type)}`}>
                                                    {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                </span>
                                            </td>
                                            <td className="text-right p-3.5 font-extrabold">
                                                <span className={NB.amountColor(t.type)}>
                                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-xs text-muted-foreground max-w-[200px] truncate">{t.note || '-'}</td>
                                            <td className="text-center p-3.5 space-x-1">
                                                <button onClick={() => onEdit(t)} className="p-1.5 hover:bg-muted dark:hover:bg-zinc-800 rounded-lg text-indigo-600 transition-colors" aria-label="Edit"><Icon name="edit" size={15} /></button>
                                                <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-600 transition-colors" aria-label="Hapus"><Icon name="trash" size={15} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {paginationBar}
            </div>

            {/* Mobile Transaction Detail & Action Sheet Modal */}
            <Modal
                isOpen={!!selectedTx}
                onClose={() => setSelectedTx(null)}
                title="Detail Transaksi"
            >
                {selectedTx && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3.5 bg-muted/40 dark:bg-zinc-900 rounded-xl border border-border dark:border-zinc-800">
                            <div
                                className="w-12 h-12 rounded-full border-2 border-black dark:border-zinc-800 flex items-center justify-center shrink-0 text-xl shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-none"
                                style={{ backgroundColor: selectedTx.category?.color || '#FFADAD' }}
                            >
                                {window.getCategoryIcon ? window.getCategoryIcon(selectedTx.category?.name, selectedTx.type) : '🏷️'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-sm sm:text-base text-foreground truncate">
                                    {selectedTx.category?.name || 'Transaksi'}
                                </h4>
                                <p className="text-xs text-muted-foreground font-semibold">
                                    {formatDate(selectedTx.date)}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={`text-base sm:text-lg font-black ${window.NB.amountColor(selectedTx.type)}`}>
                                    {selectedTx.type === 'income' ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                                </span>
                            </div>
                        </div>

                        {selectedTx.note ? (
                            <div className="p-3 bg-muted/30 dark:bg-zinc-900/60 rounded-xl border border-border dark:border-zinc-800 text-xs space-y-1">
                                <span className="font-bold text-muted-foreground uppercase text-[10px]">Catatan</span>
                                <p className="font-semibold text-foreground">{selectedTx.note}</p>
                            </div>
                        ) : (
                            <div className="p-3 bg-muted/20 dark:bg-zinc-900/40 rounded-xl border border-border dark:border-zinc-800 text-xs text-muted-foreground font-medium">
                                Tidak ada catatan tambahan.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const t = selectedTx;
                                    setSelectedTx(null);
                                    onEdit(t);
                                }}
                                className="w-full font-bold text-xs h-11 flex items-center justify-center gap-1.5"
                            >
                                <Icon name="edit" size={15} /> Edit Transaksi
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    const id = selectedTx.id;
                                    setSelectedTx(null);
                                    onDelete(id);
                                }}
                                className="w-full font-bold text-xs h-11 flex items-center justify-center gap-1.5"
                            >
                                <Icon name="trash" size={15} /> Hapus
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
});
