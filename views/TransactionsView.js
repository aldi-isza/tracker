// ============================================
// TRANSACTIONS VIEW — Filters, Date Ranges & PDF Export
// ============================================

const { useState: _tvUseState, useMemo: _tvUseMemo } = React;

window.TransactionsView = React.memo(({ user, transactions, categories, onRefresh, onEdit, onDelete }) => {
    // Filter States
    const [period, setPeriod] = _tvUseState('1_month'); // '1_month', 'custom', '7days', 'today', 'all'
    const [customStartDate, setCustomStartDate] = _tvUseState('');
    const [customEndDate, setCustomEndDate] = _tvUseState('');
    const [type, setType] = _tvUseState('');
    const [categoryId, setCategoryId] = _tvUseState('');
    const [searchQuery, setSearchQuery] = _tvUseState('');
    const [currentPage, setCurrentPage] = _tvUseState(1);
    const [selectedTx, setSelectedTx] = _tvUseState(null);
    const [showFilterDrawer, setShowFilterDrawer] = _tvUseState(false);

    const toast = window.useToast();
    const ITEMS_PER_PAGE = 10;

    // Filter Logic
    const filtered = _tvUseMemo(() => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // 1 month default: current month start to end
        const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

        // 7 days ago
        const d7 = new Date();
        d7.setDate(d7.getDate() - 6);
        const d7Str = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`;

        // 30 days ago
        const d30 = new Date();
        d30.setDate(d30.getDate() - 29);
        const d30Str = `${d30.getFullYear()}-${String(d30.getMonth() + 1).padStart(2, '0')}-${String(d30.getDate()).padStart(2, '0')}`;

        const query = searchQuery.trim().toLowerCase();

        return transactions.filter(t => {
            // Type filter
            if (type && t.type !== type) return false;
            
            // Category filter
            if (categoryId && t.category_id !== categoryId) return false;

            // Date / Period filter
            const txDate = (t.date || '').slice(0, 10);
            if (period === '1_month') {
                if (txDate < currentMonthStart || txDate > currentMonthEnd) return false;
            } else if (period === '7days') {
                if (txDate < d7Str || txDate > todayStr) return false;
            } else if (period === '30days') {
                if (txDate < d30Str || txDate > todayStr) return false;
            } else if (period === 'today') {
                if (txDate !== todayStr) return false;
            } else if (period === 'custom') {
                if (customStartDate && txDate < customStartDate) return false;
                if (customEndDate && txDate > customEndDate) return false;
            }

            // Keyword Search query
            if (query) {
                const noteMatch = (t.note || '').toLowerCase().includes(query);
                const categoryMatch = (t.category?.name || '').toLowerCase().includes(query);
                const rawDateMatch = (t.date || '').toLowerCase().includes(query);
                const formattedDateMatch = formatDate(t.date).toLowerCase().includes(query);
                const amountMatch = String(t.amount || '').includes(query);
                return noteMatch || categoryMatch || rawDateMatch || formattedDateMatch || amountMatch;
            }

            return true;
        });
    }, [transactions, period, customStartDate, customEndDate, type, categoryId, searchQuery]);

    // Financial Metrics for Filtered Result
    const metrics = _tvUseMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        filtered.forEach(t => {
            const amt = Number(t.amount) || 0;
            if (t.type === 'income') totalIncome += amt;
            else if (t.type === 'expense') totalExpense += amt;
        });
        const net = totalIncome - totalExpense;
        return { totalIncome, totalExpense, net, count: filtered.length };
    }, [filtered]);

    // Reset pagination to page 1 whenever filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [period, customStartDate, customEndDate, type, categoryId, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (safeCurrentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
        if (safeCurrentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
    };

    // Label descriptions for current period
    const getPeriodDescription = () => {
        if (period === '1_month') return '1 Bulan Ini';
        if (period === '7days') return '7 Hari Terakhir';
        if (period === '30days') return '30 Hari Terakhir';
        if (period === 'today') return 'Hari Ini';
        if (period === 'custom') {
            if (customStartDate && customEndDate) return `${formatDate(customStartDate)} s/d ${formatDate(customEndDate)}`;
            if (customStartDate) return `Mulai ${formatDate(customStartDate)}`;
            if (customEndDate) return `Sampai ${formatDate(customEndDate)}`;
            return 'Rentang Tanggal Kustom';
        }
        return 'Semua Waktu';
    };

    // Export & Download PDF Report Handler
    const handleDownloadPDF = () => {
        if (filtered.length === 0) {
            toast("Tidak ada data transaksi untuk diekspor!", "error");
            return;
        }

        const now = new Date();
        const printDateStr = now.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const periodText = getPeriodDescription();
        const typeText = type === 'income' ? 'Hanya Pemasukan' : type === 'expense' ? 'Hanya Pengeluaran' : 'Semua Jenis';
        const categoryObj = categories.find(c => c.id === categoryId);
        const categoryText = categoryObj ? categoryObj.name : 'Semua Kategori';

        // Build HTML Table Rows
        const rowsHtml = filtered.map((t, idx) => {
            const isIncome = t.type === 'income';
            const badgeBg = isIncome ? '#dcfce7' : '#fee2e2';
            const badgeColor = isIncome ? '#15803d' : '#b91c1c';
            const amtColor = isIncome ? '#16a34a' : '#dc2626';
            const sign = isIncome ? '+' : '-';
            const catName = t.category?.name || 'Umum';

            return `
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                    <td style="padding: 8px 10px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
                    <td style="padding: 8px 10px; font-weight: 600; white-space: nowrap;">${formatDate(t.date)}</td>
                    <td style="padding: 8px 10px;">
                        <span style="font-weight: 700; color: #1e293b;">${catName}</span>
                    </td>
                    <td style="padding: 8px 10px; text-align: center;">
                        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; background-color: ${badgeBg}; color: ${badgeColor};">
                            ${isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}
                        </span>
                    </td>
                    <td style="padding: 8px 10px; color: #334155;">${t.note || '-'}</td>
                    <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: ${amtColor}; white-space: nowrap;">
                        ${sign}${formatCurrency(t.amount)}
                    </td>
                </tr>
            `;
        }).join('');

        const printWindow = window.open('', '_blank', 'width=900,height=750');
        if (!printWindow) {
            toast("Popup diblokir browser. Izinkan popup untuk mencetak PDF.", "error");
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Laporan_Keuangan_ISZA_${now.toISOString().slice(0, 10)}.pdf</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
                    @page {
                        size: A4 portrait;
                        margin: 15mm 12mm 15mm 12mm;
                    }
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                    }
                    body {
                        background: #ffffff;
                        color: #0f172a;
                        padding: 24px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 3px solid #000000;
                        padding-bottom: 16px;
                        margin-bottom: 20px;
                    }
                    .brand {
                        font-size: 22px;
                        font-weight: 900;
                        letter-spacing: -0.5px;
                        color: #000000;
                    }
                    .sub-brand {
                        font-size: 11px;
                        font-weight: 700;
                        color: #64748b;
                        margin-top: 2px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .doc-title {
                        text-align: right;
                    }
                    .doc-title h2 {
                        font-size: 16px;
                        font-weight: 900;
                        color: #4f46e5;
                    }
                    .doc-title p {
                        font-size: 10px;
                        color: #64748b;
                        margin-top: 3px;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 10px;
                        background: #f8fafc;
                        border: 2px solid #000000;
                        border-radius: 8px;
                        padding: 12px;
                        margin-bottom: 18px;
                        font-size: 11px;
                    }
                    .meta-item span {
                        display: block;
                        font-size: 9px;
                        font-weight: 800;
                        color: #64748b;
                        text-transform: uppercase;
                    }
                    .meta-item strong {
                        font-size: 11px;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    .summary-cards {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .card {
                        border: 2px solid #000000;
                        border-radius: 8px;
                        padding: 10px 14px;
                    }
                    .card-in { background: #f0fdf4; }
                    .card-out { background: #fef2f2; }
                    .card-net { background: #eef2ff; }
                    .card-label {
                        font-size: 9px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #475569;
                    }
                    .card-val {
                        font-size: 15px;
                        font-weight: 900;
                        margin-top: 4px;
                    }
                    .val-in { color: #16a34a; }
                    .val-out { color: #dc2626; }
                    .val-net { color: #4338ca; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th {
                        background: #000000;
                        color: #ffffff;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        padding: 8px 10px;
                    }
                    tbody tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    .footer {
                        margin-top: 24px;
                        border-top: 1px dashed #cbd5e1;
                        padding-top: 12px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 9px;
                        font-weight: 600;
                        color: #94a3b8;
                    }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="brand">ISZA FAMILY</div>
                        <div class="sub-brand">Personal & Family Finance Tracker</div>
                    </div>
                    <div class="doc-title">
                        <h2>LAPORAN KEUANGAN</h2>
                        <p>Dicetak pada: ${printDateStr}</p>
                    </div>
                </div>

                <div class="meta-grid">
                    <div class="meta-item">
                        <span>Periode Filter</span>
                        <strong>${periodText}</strong>
                    </div>
                    <div class="meta-item">
                        <span>Filter Kategori</span>
                        <strong>${categoryText}</strong>
                    </div>
                    <div class="meta-item">
                        <span>Jenis Transaksi</span>
                        <strong>${typeText}</strong>
                    </div>
                </div>

                <div class="summary-cards">
                    <div class="card card-in">
                        <div class="card-label">Total Pemasukan (+)</div>
                        <div class="card-val val-in">+${formatCurrency(metrics.totalIncome)}</div>
                    </div>
                    <div class="card card-out">
                        <div class="card-label">Total Pengeluaran (-)</div>
                        <div class="card-val val-out">-${formatCurrency(metrics.totalExpense)}</div>
                    </div>
                    <div class="card card-net">
                        <div class="card-label">Saldo Bersih / Selisih</div>
                        <div class="card-val val-net">${metrics.net >= 0 ? '+' : ''}${formatCurrency(metrics.net)}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 35px; text-align: center;">No</th>
                            <th style="width: 90px; text-align: left;">Tanggal</th>
                            <th style="width: 140px; text-align: left;">Kategori</th>
                            <th style="width: 100px; text-align: center;">Jenis</th>
                            <th style="text-align: left;">Catatan / Keterangan</th>
                            <th style="width: 130px; text-align: right;">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="footer">
                    <div>ISZA Family System • Dokumen Resmi Laporan Keuangan</div>
                    <div>Total Transaksi: ${metrics.count} Transaksi</div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 400);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        toast("Membuka jendela cetak / simpan PDF...", "success");
    };

    const hasActiveFilter = period !== '1_month' || customStartDate || customEndDate || type || categoryId || searchQuery;

    const resetFilters = () => {
        setPeriod('1_month');
        setCustomStartDate('');
        setCustomEndDate('');
        setType('');
        setCategoryId('');
        setSearchQuery('');
    };

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
        <div className="space-y-3.5 pb-28 sm:pb-20 max-w-4xl mx-auto">
            {/* Top Action Bar */}
            <div className="space-y-2.5">
                <div className="flex flex-row items-center gap-2 w-full">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                            <Icon name="search" size={15} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari transaksi, nominal, catatan..."
                            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-card text-foreground border-2 border-black dark:border-white rounded-xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-bold placeholder:text-muted-foreground"
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

                    {/* Filter Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                        className={`h-10 px-3 rounded-xl border-2 border-black dark:border-white font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
                            hasActiveFilter
                                ? 'bg-indigo-500 text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)]'
                                : 'bg-card text-foreground hover:bg-muted shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)]'
                        }`}
                    >
                        <Icon name="filter" size={14} />
                        <span className="hidden sm:inline">Filter</span>
                        {hasActiveFilter && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 border border-black"></span>
                        )}
                    </button>

                    {/* Download PDF Button */}
                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="h-10 px-3.5 rounded-xl border-2 border-black dark:border-white font-black text-xs bg-emerald-400 hover:bg-emerald-500 text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,1)] flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                        title="Download Laporan PDF"
                    >
                        <Icon name="download" size={15} />
                        <span className="hidden sm:inline">Download PDF</span>
                    </button>
                </div>

                {/* Filter Controls Panel (Collapsible / Dynamic) */}
                {showFilterDrawer && (
                    <Card className="p-3.5 sm:p-4 bg-muted/40 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] space-y-3">
                        <div className="flex items-center justify-between border-b border-border/80 pb-2">
                            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                                <Icon name="filter" size={13} /> Filter & Rentang Tanggal
                            </span>
                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-[11px] font-black text-rose-500 hover:underline"
                                >
                                    Reset Semua
                                </button>
                            )}
                        </div>

                        {/* Rentang Waktu Preset */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black">Rentang Waktu</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                {[
                                    { id: '1_month', label: '📅 1 Bulan Ini (Default)' },
                                    { id: 'custom', label: '🗓️ Rentang Tanggal' },
                                    { id: '7days', label: '⚡ 7 Hari' },
                                    { id: 'today', label: '☀️ Hari Ini' },
                                    { id: 'all', label: '🌐 Semua Waktu' }
                                ].map(opt => {
                                    const isSel = period === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setPeriod(opt.id)}
                                            className={`py-1.5 px-2 rounded-lg border-2 text-[11px] font-black transition-all active:scale-95 truncate ${
                                                isSel
                                                    ? 'bg-indigo-500 text-black border-black dark:border-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                                                    : 'bg-card text-foreground border-black dark:border-zinc-800 hover:bg-muted'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Date Inputs if 'custom' is selected */}
                        {period === 'custom' && (
                            <div className="p-2.5 bg-card rounded-xl border-2 border-black dark:border-zinc-800 space-y-1.5">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">Pilih Rentang Tanggal Kustom:</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[9px] font-bold text-muted-foreground block mb-0.5">Dari Tanggal</label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full h-9 px-2 text-xs font-bold rounded-lg border-2 border-black dark:border-white bg-white text-black focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-muted-foreground block mb-0.5">Sampai Tanggal</label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full h-9 px-2 text-xs font-bold rounded-lg border-2 border-black dark:border-white bg-white text-black focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Jenis Transaksi & Kategori */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/80">
                            <div>
                                <Label className="text-[10px] font-black mb-1 block">Jenis Transaksi</Label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full h-9 rounded-lg border-2 border-black dark:border-white bg-card text-foreground font-black px-2.5 text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                                >
                                    <option value="">Semua Jenis Transaksi</option>
                                    <option value="expense">Pengeluaran Only</option>
                                    <option value="income">Pemasukan Only</option>
                                </select>
                            </div>
                            <div>
                                <Label className="text-[10px] font-black mb-1 block">Kategori</Label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full h-9 rounded-lg border-2 border-black dark:border-white bg-card text-foreground font-black px-2.5 text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Filter Summary Metrics Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-card dark:bg-[#18181b] rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-black bg-indigo-400 px-2 py-0.5 rounded-md border border-black">
                            {getPeriodDescription()}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground">
                            {metrics.count} Transaksi
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-extrabold">
                        <span className="text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(metrics.totalIncome)}
                        </span>
                        <span className="text-rose-600 dark:text-rose-400">
                            -{formatCurrency(metrics.totalExpense)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile Card List View (< md) */}
            <div className="md:hidden space-y-2">
                {paginated.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-xs rounded-xl border-2 border-black dark:border-white bg-card dark:bg-[#18181b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                        Tidak ada transaksi yang sesuai filter.
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
                <div className="overflow-hidden rounded-xl border-2 border-black dark:border-white bg-card dark:bg-[#18181b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b-2 border-black dark:border-white bg-muted/40 dark:bg-zinc-900 text-foreground text-[11px] uppercase font-black tracking-wider">
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
                                        <td colSpan="6" className="text-center p-8 text-muted-foreground text-xs font-bold">
                                            Tidak ada transaksi yang sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(t => (
                                        <tr key={t.id} className="hover:bg-muted/30 dark:hover:bg-zinc-900/50 transition-colors">
                                            <td className="p-3.5 font-bold text-muted-foreground">{formatDate(t.date)}</td>
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
                                            <td className="text-right p-3.5 font-black">
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
                        <div className="flex items-center gap-3 p-3.5 bg-muted/40 dark:bg-zinc-900 rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
                            <div className="p-3 bg-muted/30 dark:bg-zinc-900/60 rounded-xl border-2 border-black dark:border-zinc-800 text-xs space-y-1">
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
