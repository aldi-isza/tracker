// ============================================
// DASHBOARD VIEW — Clean & Streamlined
// ============================================

const { useState: _dvUseState, useMemo: _dvUseMemo, useRef: _dvUseRef, useCallback: _dvUseCallback } = React;

window.DashboardView = React.memo(({ 
    user, 
    transactions, 
    categories, 
    budgetRule = { needs: 50, wants: 30, savings: 20 },
    dashboardSettings = { period: 'this_month', sort: 'highest' },
    onNavigate, 
    onAddClick, 
    onRefresh, 
    isRefreshing 
}) => {
    const [isSummaryModalOpen, setIsSummaryModalOpen] = _dvUseState(false);

    // Helpers to format YYYY-MM-DD
    const formatDateObj = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Derived Date Range & Period Label based on dashboardSettings.period
    const { filteredDashboardTransactions, periodLabel } = _dvUseMemo(() => {
        const today = new Date();
        let start = null;
        let end = null;
        let label = 'Bulan Ini';
        const preset = dashboardSettings?.period || 'this_month';

        if (preset === 'today') {
            const todayStr = formatDateObj(today);
            start = todayStr;
            end = todayStr;
            label = `Hari Ini (${formatDate(todayStr)})`;
        } else if (preset === '7days') {
            const past = new Date(today);
            past.setDate(past.getDate() - 6);
            start = formatDateObj(past);
            end = formatDateObj(today);
            label = '7 Hari Terakhir';
        } else if (preset === '30days') {
            const past = new Date(today);
            past.setDate(past.getDate() - 29);
            start = formatDateObj(past);
            end = formatDateObj(today);
            label = '30 Hari Terakhir';
        } else if (preset === 'this_month') {
            const y = today.getFullYear();
            const m = today.getMonth();
            const first = new Date(y, m, 1);
            const last = new Date(y, m + 1, 0);
            start = formatDateObj(first);
            end = formatDateObj(last);
            label = `Bulan Ini (${today.toLocaleString('id-ID', { month: 'short', year: 'numeric' })})`;
        } else if (preset === 'last_month') {
            const y = today.getFullYear();
            const m = today.getMonth() - 1;
            const first = new Date(y, m, 1);
            const last = new Date(y, m + 1, 0);
            start = formatDateObj(first);
            end = formatDateObj(last);
            label = `Bulan Lalu (${first.toLocaleString('id-ID', { month: 'short', year: 'numeric' })})`;
        } else if (preset === 'all') {
            start = null;
            end = null;
            label = 'Semua Periode';
        }

        const filtered = (transactions || []).filter(t => {
            if (!t.date) return false;
            const tDate = String(t.date).slice(0, 10);
            if (start && tDate < start) return false;
            if (end && tDate > end) return false;
            return true;
        });

        return { filteredDashboardTransactions: filtered, periodLabel: label };
    }, [transactions, dashboardSettings]);

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
        '#38bdf8', '#a78bfa', '#2dd4bf', '#fb7185', 
        '#fbbf24', '#818cf8', '#34d399', '#f472b6', '#94a3b8'
    ];

    const sortedCategories = _dvUseMemo(() => {
        const rawList = Object.keys(categoryBreakdown).map(catName => ({
            name: catName,
            amount: categoryBreakdown[catName].amount
        }));

        const sortMode = dashboardSettings?.sort || 'highest';
        let sorted = rawList;
        if (sortMode === 'lowest') {
            sorted = rawList.sort((a, b) => a.amount - b.amount);
        } else if (sortMode === 'name') {
            sorted = rawList.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            sorted = rawList.sort((a, b) => b.amount - a.amount);
        }

        return sorted.map((item, idx) => ({
            ...item,
            color: PREMIUM_PIE_PALETTE[idx % PREMIUM_PIE_PALETTE.length]
        }));
    }, [categoryBreakdown, dashboardSettings]);

    // Chart Data
    const pieData = _dvUseMemo(() => ({
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
    }), [hasExpenses, sortedCategories, totalExpense]);

    const pieOptions = _dvUseMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        }
    }), []);

    const rawName = user?.email ? user.email.split('@')[0] : 'Keluarga';
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    return (
        <div className="space-y-4 max-w-4xl mx-auto pb-12">
            {/* Clean Welcome Header */}
            <div className="flex items-center justify-between px-1 gap-2 pt-1">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-1.5">
                        Halo, {displayName}! 👋
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-muted-foreground bg-muted/60 dark:bg-zinc-900/80 px-2.5 py-0.5 rounded-md border border-border/60">
                            <Icon name="calendar" size={12} className="text-indigo-500" />
                            {periodLabel}
                        </span>
                        <button
                            type="button"
                            onClick={() => onNavigate(window.VIEWS.SETTINGS)}
                            className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                            title="Buka pengaturan untuk mengganti filter default"
                        >
                            <span>Ubah Filter</span>
                            <Icon name="chevronRight" size={12} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Clean Refresh Button */}
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-card dark:bg-[#18181b] hover:bg-muted text-foreground border-2 border-black dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none text-xs font-black transition-all active:scale-95 cursor-pointer disabled:pointer-events-none ${isRefreshing ? 'opacity-70' : ''}`}
                        title="Refresh Data"
                        aria-label="Refresh Data"
                    >
                        <Icon name="refresh" size={13} className={isRefreshing ? 'animate-spin text-indigo-500' : ''} />
                        <span className="hidden sm:inline">{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Financial Hero Balance Card */}
            <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">Total Saldo Kas</span>
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
                        <span className="block text-[10px] text-slate-400 font-bold tracking-wider">Pengeluaran Hari Ini</span>
                        <span className="text-xs sm:text-sm font-extrabold text-rose-400">
                            {formatCurrency(todayExpense)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Side-by-Side Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl space-y-1.5 border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-none transition-all">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                            <Icon name="arrowDownLeft" size={16} />
                        </div>
                        <span className="text-xs font-black tracking-tight uppercase">Pemasukan</span>
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
                        <span className="text-xs font-black tracking-tight uppercase">Pengeluaran</span>
                    </div>
                    <p className="text-base sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 truncate pt-0.5">
                        {formatCurrency(totalExpense)}
                    </p>
                </div>
            </div>

            {/* Pie Chart Card */}
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
