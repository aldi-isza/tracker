// ============================================
// DASHBOARD VIEW
// ============================================

const { useState: _dvUseState, useMemo: _dvUseMemo, useRef: _dvUseRef, useCallback: _dvUseCallback } = React;

window.DashboardView = React.memo(({ user, transactions, categories, budgetRule = { needs: 50, wants: 30, savings: 20 }, onNavigate, onAddClick, onRefresh, isRefreshing }) => {
    // Filter Presets: 'this_month' (default), 'today', '7days', '30days', 'last_month', 'custom', 'all'
    const [filterPreset, setFilterPreset] = _dvUseState('this_month');
    const [customStart, setCustomStart] = _dvUseState('');
    const [customEnd, setCustomEnd] = _dvUseState('');
    const [isSummaryModalOpen, setIsSummaryModalOpen] = _dvUseState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = _dvUseState(false);

    // Helpers to format YYYY-MM-DD
    const formatDateObj = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Derived Date Range & Period Label
    const { filteredDashboardTransactions, periodLabel, buttonLabel } = _dvUseMemo(() => {
        const today = new Date();
        let start = null;
        let end = null;
        let label = 'Bulan Ini';
        let btn = 'Bulan Ini';

        if (filterPreset === 'today') {
            const todayStr = formatDateObj(today);
            start = todayStr;
            end = todayStr;
            label = `Hari Ini (${formatDate(todayStr)})`;
            btn = 'Hari Ini';
        } else if (filterPreset === '7days') {
            const past = new Date(today);
            past.setDate(past.getDate() - 6);
            start = formatDateObj(past);
            end = formatDateObj(today);
            label = '7 Hari Terakhir';
            btn = '7 Hari';
        } else if (filterPreset === '30days') {
            const past = new Date(today);
            past.setDate(past.getDate() - 29);
            start = formatDateObj(past);
            end = formatDateObj(today);
            label = '30 Hari Terakhir';
            btn = '30 Hari';
        } else if (filterPreset === 'this_month') {
            const y = today.getFullYear();
            const m = today.getMonth();
            const first = new Date(y, m, 1);
            const last = new Date(y, m + 1, 0);
            start = formatDateObj(first);
            end = formatDateObj(last);
            label = `Bulan Ini (${today.toLocaleString('id-ID', { month: 'short', year: 'numeric' })})`;
            btn = `Bulan Ini (${today.toLocaleString('id-ID', { month: 'short' })})`;
        } else if (filterPreset === 'last_month') {
            const y = today.getFullYear();
            const m = today.getMonth() - 1;
            const first = new Date(y, m, 1);
            const last = new Date(y, m + 1, 0);
            start = formatDateObj(first);
            end = formatDateObj(last);
            label = `Bulan Lalu (${first.toLocaleString('id-ID', { month: 'short', year: 'numeric' })})`;
            btn = `Bulan Lalu (${first.toLocaleString('id-ID', { month: 'short' })})`;
        } else if (filterPreset === 'custom') {
            start = customStart || null;
            end = customEnd || null;
            if (start && end) {
                if (start === end) {
                    label = formatDate(start);
                    btn = formatDate(start);
                } else {
                    label = `${formatDate(start)} – ${formatDate(end)}`;
                    btn = `${formatDate(start).split(' ')[0]} - ${formatDate(end).split(' ')[0]}`;
                }
            } else if (start) {
                label = `Mulai ${formatDate(start)}`;
                btn = `≥ ${formatDate(start).split(' ')[0]}`;
            } else if (end) {
                label = `Hingga ${formatDate(end)}`;
                btn = `≤ ${formatDate(end).split(' ')[0]}`;
            } else {
                label = 'Pilih Tanggal';
                btn = 'Pilih Tanggal';
            }
        } else if (filterPreset === 'all') {
            start = null;
            end = null;
            label = 'Semua Periode';
            btn = 'Semua';
        }

        const filtered = (transactions || []).filter(t => {
            if (!t.date) return false;
            const tDate = String(t.date).slice(0, 10);
            if (start && tDate < start) return false;
            if (end && tDate > end) return false;
            return true;
        });

        return { filteredDashboardTransactions: filtered, periodLabel: label, buttonLabel: btn };
    }, [transactions, filterPreset, customStart, customEnd]);

    const { income: totalIncome, expense: totalExpense } = calcTotals(filteredDashboardTransactions);
    const balance = calcBalance(transactions);
    const { income: todayIncome, expense: todayExpense } = calcTodayTotals(transactions);

    const netSavings = totalIncome - totalExpense;
    const savingsRate = calcSavingsRate(totalIncome, totalExpense);
    const healthBadge = _dvUseMemo(() => getHealthBadge(totalIncome, totalExpense, budgetRule), [totalIncome, totalExpense, budgetRule]);

    const categoryBreakdown = calcCategoryBreakdown(filteredDashboardTransactions);
    const hasExpenses = Object.keys(categoryBreakdown).length > 0;

    // Harmonized premium pastel & jewel tones for pie chart and categories
    const PREMIUM_PIE_PALETTE = [
        '#38bdf8', // Sky Blue
        '#a78bfa', // Soft Purple
        '#2dd4bf', // Teal
        '#fb7185', // Rose
        '#fbbf24', // Warm Amber
        '#818cf8', // Indigo
        '#34d399', // Emerald
        '#f472b6', // Peach Pink
        '#94a3b8'  // Slate / Others
    ];

    const sortedCategories = _dvUseMemo(() => {
        return Object.keys(categoryBreakdown)
            .map(catName => ({
                name: catName,
                amount: categoryBreakdown[catName].amount
            }))
            .sort((a, b) => b.amount - a.amount)
            .map((item, idx) => ({
                ...item,
                color: PREMIUM_PIE_PALETTE[idx % PREMIUM_PIE_PALETTE.length]
            }));
    }, [categoryBreakdown]);

    // ---- Chart Data ----
    const pieData = {
        labels: hasExpenses
            ? sortedCategories.map(c => {
                const pct = totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0;
                return `${c.name} (${pct}%)`;
            })
            : ['Belum ada belanja'],
        datasets: [{
            data: hasExpenses ? sortedCategories.map(c => c.amount) : [1],
            backgroundColor: hasExpenses ? sortedCategories.map(c => c.color) : ['#e2e8f0'],
            borderColor: '#18181b',
            borderWidth: 2,
            hoverOffset: 4
        }]
    };

    const pieOptions = {
        plugins: {
            legend: {
                display: false
            }
        }
    };

    const presets = [
        { id: 'today', label: 'Hari Ini' },
        { id: '7days', label: '7 Hari Terakhir' },
        { id: '30days', label: '30 Hari Terakhir' },
        { id: 'this_month', label: 'Bulan Ini' },
        { id: 'last_month', label: 'Bulan Lalu' },
        { id: 'all', label: 'Semua Periode' }
    ];

    const recentTransactions = filteredDashboardTransactions.slice(0, 5);

    const rawName = user?.email ? user.email.split('@')[0] : 'User';
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    return (
        <div className="space-y-4 pb-28 sm:pb-20">
            {/* Welcome Header & Global Time Filter */}
            <div className="flex items-center justify-between px-1 gap-2">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Selamat datang,</p>
                    <h2 className="text-base sm:text-lg font-black text-foreground truncate max-w-[150px] sm:max-w-xs">{displayName}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Global Date Filter Dropdown Trigger Button */}
                    <button
                        type="button"
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card dark:bg-[#18181b] hover:bg-muted/80 text-foreground border-2 border-black dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none text-xs font-black transition-all active:scale-95 cursor-pointer"
                        title="Filter Periode Tanggal"
                        aria-label="Filter Periode Tanggal"
                    >
                        <Icon name="calendar" size={13} className="text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[130px] sm:max-w-none">{buttonLabel}</span>
                        <Icon name="chevronDown" size={12} className="opacity-70 shrink-0" />
                    </button>

                    {/* Refresh Button */}
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-card dark:bg-[#18181b] hover:bg-muted/80 text-foreground border-2 border-black dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none text-xs font-black transition-all active:scale-95 cursor-pointer disabled:pointer-events-none ${isRefreshing ? 'opacity-70' : ''}`}
                        title="Refresh Data"
                        aria-label="Refresh Data"
                    >
                        <Icon name="refresh" size={13} className={isRefreshing ? 'animate-spin text-indigo-500' : ''} />
                        <span className="text-[11px] font-extrabold hidden sm:inline">{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Financial Hero Balance Card */}
            <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">Total Balance</span>
                </div>
                <div>
                    <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {formatCurrency(balance)}
                    </h3>
                </div>
                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <button
                        type="button"
                        onClick={() => setIsSummaryModalOpen(true)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs transition-all active:scale-95 ${NB.shadow.md} ${NB.border}`}
                    >
                        <Icon name="pieChart" size={14} />
                        <span>Financial Insights</span>
                    </button>
                    <div className="text-right shrink-0">
                        <span className="block text-[10px] text-slate-400 font-bold tracking-wider">Today's Spend</span>
                        <span className="text-xs sm:text-sm font-extrabold text-rose-400">
                            {formatCurrency(todayExpense)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Side-by-Side Summary Cards (Softened Dark Mode Borders) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl space-y-1.5 border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-none transition-all">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                            <Icon name="arrowDownLeft" size={16} />
                        </div>
                        <span className="text-xs font-black tracking-tight uppercase">Income</span>
                    </div>
                    <p className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate pt-0.5">
                        {formatCurrency(totalIncome)}
                    </p>
                </div>

                <div className="p-4 rounded-xl space-y-1.5 border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-none transition-all">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <div className="p-1.5 bg-rose-500/10 rounded-lg">
                            <Icon name="arrowUpRight" size={16} />
                        </div>
                        <span className="text-xs font-black tracking-tight uppercase">Expenses</span>
                    </div>
                    <p className="text-base sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 truncate pt-0.5">
                        {formatCurrency(totalExpense)}
                    </p>
                </div>
            </div>

            {/* Pie Chart Card (Softened Dark Mode Border & Clean Title) */}
            <Card className="dark:border-zinc-800 dark:bg-[#18181b] dark:shadow-none">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Pengeluaran Berdasarkan Kategori</span>
                        <span className="text-[10px] font-extrabold text-foreground px-2 py-0.5 rounded-md bg-muted border border-border">
                            {budgetRule.needs}%-{budgetRule.wants}%-{budgetRule.savings}%
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-2.5 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-1/2 flex justify-center py-2 shrink-0">
                        <ChartComponent type="pie" data={pieData} options={pieOptions} height="200px" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                        {!hasExpenses ? (
                            <div className="p-4 text-center text-xs text-muted-foreground font-bold">
                                Belum ada pengeluaran pada periode ini.
                            </div>
                        ) : (
                            sortedCategories.map(item => {
                                const pct = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
                                return (
                                    <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 dark:bg-zinc-900/60 border border-border/50 dark:border-zinc-800 hover:bg-muted/80 transition-colors">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs font-black text-foreground truncate">{item.name}</span>
                                            <span className="text-[10px] font-extrabold text-muted-foreground bg-muted/90 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-border/20 shrink-0">{pct}%</span>
                                        </div>
                                        <span className="text-xs font-extrabold text-foreground shrink-0">{formatCurrency(item.amount)}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>



            {/* Date Filter Modal (Opens from Dropdown Button) */}
            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Pilih Periode Waktu"
            >
                <div className="space-y-4">
                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px]">Pilihan Cepat</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map(p => {
                                const isActive = filterPreset === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                            setFilterPreset(p.id);
                                            setIsFilterModalOpen(false);
                                        }}
                                        className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                                            isActive
                                                ? `bg-indigo-500 text-black border-black ${NB.shadow.sm}`
                                                : `bg-card text-foreground border-black dark:border-zinc-800 hover:bg-muted`
                                        }`}
                                    >
                                        <span>{p.label}</span>
                                        {isActive && <Icon name="check" size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Date Range Section */}
                    <div className="pt-3 border-t border-border/80 dark:border-zinc-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px]">Rentang Tanggal Kustom</Label>
                            {customStart && customEnd && (
                                <button
                                    type="button"
                                    onClick={() => setCustomEnd(customStart)}
                                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                >
                                    Pilih 1 Hari Saja
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-semibold">Dari</span>
                                <Input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomStart(val);
                                        if (!customEnd) setCustomEnd(val);
                                    }}
                                    className="h-10 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-semibold">Sampai</span>
                                <Input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="h-10 text-xs"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => {
                                setFilterPreset('custom');
                                setIsFilterModalOpen(false);
                            }}
                            className="w-full font-black text-xs h-10 mt-1"
                        >
                            Terapkan Rentang Tanggal
                        </Button>
                    </div>

                    {/* Reset to Default */}
                    {filterPreset !== 'this_month' && (
                        <div className="pt-1 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterPreset('this_month');
                                    setCustomStart('');
                                    setCustomEnd('');
                                    setIsFilterModalOpen(false);
                                }}
                                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                            >
                                Reset ke Bulan Ini
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Financial Insights Modal */}
            <Modal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                title={`Financial Insights - ${periodLabel}`}
            >
                <div className="space-y-4">
                    {/* Today's Summary Card */}
                    <div className={`${NB.modalCard} space-y-2.5`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-black text-xs uppercase text-foreground">
                                <Icon name="calendar" size={14} /> Ringkasan Hari Ini
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">
                                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                                <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                                    <Icon name="arrowDownLeft" size={12} /> Pemasukan
                                </div>
                                <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 truncate">
                                    {formatCurrency(todayIncome)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-0.5">
                                <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400">
                                    <Icon name="arrowUpRight" size={12} /> Pengeluaran
                                </div>
                                <p className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 truncate">
                                    {formatCurrency(todayExpense)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Health Badge Card */}
                    <div className={`${NB.modalCard} space-y-2`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase text-muted-foreground">Kondisi Finansial</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${NB.borderThin} ${healthBadge.badgeColor}`}>
                                {healthBadge.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold">Tingkat Tabungan (Saving Rate)</p>
                                <p className={`text-lg font-black ${savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : savingsRate < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                                    {totalIncome > 0 ? `${savingsRate}%` : '0%'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold">Surplus / Sisa Dana</p>
                                <p className={`text-lg font-black ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {formatCurrency(netSavings)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Motivation & Evaluation Box */}
                    <div className={`${NB.modalCard} bg-indigo-500/15 space-y-2`}>
                        <div className="flex items-center gap-2 font-black text-xs text-foreground uppercase tracking-wide">
                            <span>🎯 Evaluasi & Tips Bijak Hemat</span>
                        </div>
                        <p className="text-xs font-bold text-foreground leading-relaxed">
                            {healthBadge.tip}
                        </p>
                    </div>

                    {/* Dynamic Budget Rule Breakdown */}
                    <div className={`${NB.modalCard} space-y-2.5`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase text-foreground">
                                💡 Target Anggaran ({budgetRule.needs}%-{budgetRule.wants}%-{budgetRule.savings}%)
                            </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between font-bold">
                                <span className="text-muted-foreground">🏢 Kebutuhan Primer (Maks {budgetRule.needs}%):</span>
                                <span className="font-extrabold">{formatCurrency(totalIncome * (budgetRule.needs / 100))}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span className="text-muted-foreground">☕ Keinginan / Lifestyle (Maks {budgetRule.wants}%):</span>
                                <span className="font-extrabold">{formatCurrency(totalIncome * (budgetRule.wants / 100))}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span className="text-muted-foreground">💰 Tabungan & Dana Darurat (Min {budgetRule.savings}%):</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(totalIncome * (budgetRule.savings / 100))}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => setIsSummaryModalOpen(false)}
                        className="w-full font-black text-sm h-11"
                    >
                        Tutup
                    </Button>
                </div>
            </Modal>
        </div>
    );
});
