// ============================================
// DASHBOARD VIEW — Clean, Streamlined & Integrated
// ============================================

const { useState: _dvUseState, useMemo: _dvUseMemo, useRef: _dvUseRef, useEffect: _dvUseEffect } = React;

window.DashboardView = React.memo(({
    user,
    transactions = [],
    categories = [],
    dashboardSettings = { period: '1_month', customStartDate: '', customEndDate: '', categoryId: 'all', sort: 'highest' },
    familyNotesState,
    planningState,
    onNavigate,
    onAddClick,
    onRefresh,
    isRefreshing
}) => {
    // Quick Action Modals on Dashboard
    const [isAddNoteOpen, setIsAddNoteOpen] = _dvUseState(false);
    const [isAddPlanOpen, setIsAddPlanOpen] = _dvUseState(false);
    const [realizePlanTarget, setRealizePlanTarget] = _dvUseState(null);

    // Form State for Quick Add Family Note
    const [noteForm, setNoteForm] = _dvUseState({
        title: '',
        category: 'Kendaraan',
        last_date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        cost: '',
        notes: ''
    });

    // Form State for Quick Add Planning
    const [planForm, setPlanForm] = _dvUseState({
        title: '',
        type: 'expense',
        amount: '',
        category_id: '',
        target_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Realize Form State (editable amount/date during realization)
    const [realizeForm, setRealizeForm] = _dvUseState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        description: ''
    });

    const toast = window.useToast();
    const chartRef = _dvUseRef(null);
    const chartInstance = _dvUseRef(null);

    // 1. Calculate Period Filter & Label
    const { filteredTransactions, periodLabel } = _dvUseMemo(() => {
        const now = new Date();
        let start = new Date(0);
        let end = new Date(8640000000000000);
        let label = '1 Bulan Terakhir';

        const period = dashboardSettings?.period || '1_month';

        if (period === '1_month' || period === 'this_month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            label = `1 Bulan (${monthNames[now.getMonth()]} ${now.getFullYear()})`;
        } else if (period === 'custom') {
            if (dashboardSettings.customStartDate) {
                start = new Date(dashboardSettings.customStartDate);
                start.setHours(0, 0, 0, 0);
            }
            if (dashboardSettings.customEndDate) {
                end = new Date(dashboardSettings.customEndDate);
                end.setHours(23, 59, 59, 999);
            }
            label = `Rentang: ${dashboardSettings.customStartDate || '...'} s/d ${dashboardSettings.customEndDate || '...'}`;
        } else if (period === '7days') {
            start = new Date(now.getTime() - 7 * 86400000);
            start.setHours(0, 0, 0, 0);
            label = '7 Hari Terakhir';
        } else if (period === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            label = 'Hari Ini';
        } else if (period === 'all') {
            start = new Date(0);
            end = new Date(8640000000000000);
            label = 'Semua Waktu';
        }

        const filtered = transactions.filter(t => {
            const tDate = new Date(t.date);
            const matchesDate = tDate >= start && tDate <= end;
            const matchesCat = !dashboardSettings?.categoryId || dashboardSettings.categoryId === 'all' 
                ? true 
                : (t.category_id === dashboardSettings.categoryId);
            return matchesDate && matchesCat;
        });

        return { filteredTransactions: filtered, periodLabel: label };
    }, [transactions, dashboardSettings]);

    // 2. Financial Metrics
    const metrics = _dvUseMemo(() => {
        // Overall all-time balance
        const allTimeIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
        const allTimeExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
        const totalBalance = allTimeIncome - allTimeExpense;

        // Period-specific income & expense
        const periodIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
        const periodExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

        // Today's Expense
        const todayStr = new Date().toISOString().split('T')[0];
        const todayExpense = transactions
            .filter(t => t.type === 'expense' && t.date === todayStr)
            .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

        return { totalBalance, periodIncome, periodExpense, todayExpense };
    }, [transactions, filteredTransactions]);

    // 3. Category Breakdown (Expense)
    const { sortedCategories } = _dvUseMemo(() => {
        const breakdown = {};
        const expenseTxs = filteredTransactions.filter(t => t.type === 'expense');

        expenseTxs.forEach(t => {
            const catName = t.category?.name || 'Lain-lain';
            const catColor = t.category?.color || '#6366f1';
            if (!breakdown[catName]) {
                breakdown[catName] = { amount: 0, color: catColor };
            }
            breakdown[catName].amount += (parseFloat(t.amount) || 0);
        });

        const list = Object.entries(breakdown).map(([name, item]) => ({
            name,
            amount: item.amount,
            color: item.color
        }));

        const sortMode = dashboardSettings?.sort || 'highest';
        if (sortMode === 'lowest') {
            list.sort((a, b) => a.amount - b.amount);
        } else if (sortMode === 'name') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // default: highest
            list.sort((a, b) => b.amount - a.amount);
        }

        return { sortedCategories: list };
    }, [filteredTransactions, dashboardSettings?.sort]);

    // 4. Chart Render
    _dvUseEffect(() => {
        if (!chartRef.current || typeof Chart === 'undefined') return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const labels = sortedCategories.map(c => c.name);
        const data = sortedCategories.map(c => c.amount);
        const backgroundColors = sortedCategories.map(c => c.color);

        if (labels.length === 0) {
            chartInstance.current = null;
            return;
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#000000',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const val = context.raw || 0;
                                return ` ${context.label}: Rp ${val.toLocaleString('id-ID')}`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [sortedCategories]);

    // Quick Add Note Handler
    const handleQuickAddNote = async (e) => {
        e.preventDefault();
        if (!noteForm.title.trim()) {
            toast('Judul catatan wajib diisi', 'error');
            return;
        }
        if (familyNotesState && familyNotesState.addNote) {
            await familyNotesState.addNote({
                title: noteForm.title,
                category: noteForm.category,
                last_date: noteForm.last_date,
                next_due_date: noteForm.next_due_date || null,
                cost: noteForm.cost ? parseFloat(noteForm.cost) : 0,
                notes: noteForm.notes
            });
            setIsAddNoteOpen(false);
            setNoteForm({
                title: '',
                category: 'Kendaraan',
                last_date: new Date().toISOString().split('T')[0],
                next_due_date: '',
                cost: '',
                notes: ''
            });
        }
    };

    // Quick Add Planning Handler
    const handleQuickAddPlan = async (e) => {
        e.preventDefault();
        if (!planForm.title.trim() || !planForm.amount) {
            toast('Nama rencana dan nominal wajib diisi', 'error');
            return;
        }
        if (planningState && planningState.addPlanning) {
            const selectedCat = categories.find(c => c.id === planForm.category_id);
            await planningState.addPlanning({
                title: planForm.title,
                type: planForm.type,
                amount: parseFloat(planForm.amount),
                category_id: planForm.category_id || null,
                category_name: selectedCat?.name || '',
                target_date: planForm.target_date,
                notes: planForm.notes
            });
            setIsAddPlanOpen(false);
            setPlanForm({
                title: '',
                type: 'expense',
                amount: '',
                category_id: '',
                target_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
        }
    };

    // Open Realize Modal
    const openRealizeModal = (plan) => {
        setRealizePlanTarget(plan);
        const matchingCats = categories.filter(c => c.type === (plan.type || 'expense'));
        const defaultCatId = plan.category_id || (matchingCats.length > 0 ? matchingCats[0].id : '');
        
        setRealizeForm({
            amount: plan.amount,
            date: new Date().toISOString().split('T')[0],
            category_id: defaultCatId,
            type: plan.type || 'expense',
            description: `[Realisasi] ${plan.title}`
        });
    };

    // Execute Realize
    const handleExecuteRealize = async (e) => {
        e.preventDefault();
        if (!realizePlanTarget || !planningState?.realizePlanning) return;
        
        if (!realizeForm.category_id) {
            toast('Silakan pilih kategori transaksi', 'error');
            return;
        }

        const success = await planningState.realizePlanning(realizePlanTarget, realizeForm);
        if (success) {
            setRealizePlanTarget(null);
        }
    };

    // Family Notes snippet data
    const notesList = familyNotesState?.notes || [];
    const upcomingNotes = _dvUseMemo(() => {
        return [...notesList].sort((a, b) => {
            if (!a.next_due_date) return 1;
            if (!b.next_due_date) return -1;
            return new Date(a.next_due_date) - new Date(b.next_due_date);
        }).slice(0, 3);
    }, [notesList]);

    // Planning snippet data
    const plansList = planningState?.planningList || [];
    const pendingPlans = _dvUseMemo(() => {
        return plansList.filter(p => !p.is_realized).slice(0, 4);
    }, [plansList]);

    return (
        <div className="space-y-4 max-w-xl mx-auto pb-16">
            {/* Top Bar Header — Clean & Streamlined */}
            <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        Halo, {user?.email?.split('@')[0] || 'Keluarga'}! 👋
                    </h2>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-black bg-indigo-400 px-2.5 py-0.5 rounded-md border border-black dark:border-white">
                            <Icon name="calendar" size={12} />
                            {periodLabel}
                        </span>
                        <button
                            type="button"
                            onClick={() => onNavigate(window.VIEWS.SETTINGS)}
                            className="text-[10px] sm:text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                        >
                            Filter Setting →
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`p-2 sm:px-3 sm:py-2 rounded-xl bg-card dark:bg-[#18181b] hover:bg-muted/80 text-foreground border-2 border-black dark:border-white ${NB.shadow.sm} text-xs font-black transition-all active:scale-95 cursor-pointer disabled:pointer-events-none ${isRefreshing ? 'opacity-70' : ''}`}
                        title="Sinkronisasi Data"
                    >
                        <div className="flex items-center gap-1.5">
                            <Icon name="refresh" size={14} className={isRefreshing ? 'animate-spin text-indigo-500' : ''} />
                            <span className="text-xs font-black hidden sm:inline">{isRefreshing ? 'Sync...' : 'Refresh'}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Total Saldo Card (Hero) */}
            <Card className="p-4 sm:p-5 bg-indigo-500 text-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-black/80">Total Saldo Kas</p>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                            Rp {metrics.totalBalance.toLocaleString('id-ID')}
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={onAddClick}
                        className="px-3 py-2 rounded-xl bg-white text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Icon name="plus" size={14} />
                        <span>Transaksi</span>
                    </button>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-black/20 flex items-center justify-between text-xs font-black">
                    <span className="text-black/80">Pengeluaran Hari Ini:</span>
                    <span className="bg-black/10 px-2 py-0.5 rounded-md border border-black/30">
                        Rp {metrics.todayExpense.toLocaleString('id-ID')}
                    </span>
                </div>
            </Card>

            {/* Income & Expense Summary Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <Card className="p-3.5 bg-emerald-300 dark:bg-emerald-950/40 text-foreground border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                    <div className="flex items-center gap-1.5 text-black dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center border border-black">
                            <Icon name="arrowDownLeft" size={12} />
                        </div>
                        <span>Pemasukan</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-black dark:text-emerald-200 mt-2 truncate">
                        Rp {metrics.periodIncome.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] font-bold text-black/70 dark:text-emerald-400 mt-0.5 line-clamp-1">{periodLabel}</p>
                </Card>

                <Card className="p-3.5 bg-rose-300 dark:bg-rose-950/40 text-foreground border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                    <div className="flex items-center gap-1.5 text-black dark:text-rose-300 font-black text-xs uppercase tracking-wider">
                        <div className="w-5 h-5 rounded-full bg-rose-500 text-black flex items-center justify-center border border-black">
                            <Icon name="arrowUpRight" size={12} />
                        </div>
                        <span>Pengeluaran</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-black dark:text-rose-200 mt-2 truncate">
                        Rp {metrics.periodExpense.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] font-bold text-black/70 dark:text-rose-400 mt-0.5 line-clamp-1">{periodLabel}</p>
                </Card>
            </div>

            {/* CARD 1: Catatan & Jadwal Perawatan Keluarga */}
            <Card className="border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Icon name="wrench" size={14} className="text-indigo-500" />
                            <span>Catatan & Servis Keluarga</span>
                        </CardTitle>
                        <button
                            type="button"
                            onClick={() => setIsAddNoteOpen(true)}
                            className="px-2 py-1 rounded-md bg-indigo-500 text-black font-black text-[11px] border border-black dark:border-white hover:bg-indigo-400 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                        >
                            <Icon name="plus" size={12} />
                            <span>Tambah</span>
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                    {upcomingNotes.length === 0 ? (
                        <div className="text-center py-5 bg-muted/20 rounded-xl border border-dashed border-border">
                            <p className="text-xs font-bold text-muted-foreground">Belum ada catatan servis / keluarga.</p>
                            <button
                                type="button"
                                onClick={() => setIsAddNoteOpen(true)}
                                className="mt-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                + Catat Jadwal Servis Pertama
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {upcomingNotes.map(item => {
                                const daysDiff = item.next_due_date 
                                    ? Math.ceil((new Date(item.next_due_date) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
                                    : null;

                                return (
                                    <div 
                                        key={item.id}
                                        className="p-2.5 bg-muted/30 hover:bg-muted/50 rounded-xl border-2 border-black dark:border-zinc-800 flex items-center justify-between gap-2 transition-all"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-300 text-black border border-black">
                                                    {item.category}
                                                </span>
                                                <h4 className="text-xs font-black text-foreground truncate">{item.title}</h4>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                                                Terakhir: {new Date(item.last_date).toLocaleDateString('id-ID')}
                                                {item.cost ? ` • Rp ${parseFloat(item.cost).toLocaleString('id-ID')}` : ''}
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            {daysDiff !== null ? (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border border-black ${
                                                    daysDiff < 0 
                                                        ? 'bg-rose-400 text-black animate-pulse'
                                                        : daysDiff <= 7
                                                            ? 'bg-amber-400 text-black'
                                                            : 'bg-emerald-300 text-black'
                                                }`}>
                                                    {daysDiff < 0 ? `Lewat ${Math.abs(daysDiff)}h` : daysDiff === 0 ? 'Hari ini' : `${daysDiff}h lagi`}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-muted-foreground">Selesai</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="pt-1 text-center">
                        <button
                            type="button"
                            onClick={() => onNavigate(window.VIEWS.FAMILY_NOTES)}
                            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Buka Semua Catatan & Kelola Logbook ({notesList.length}) →
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* CARD 2: Rencana Anggaran & Planning (Dengan Tombol Realisasi) */}
            <Card className="border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Icon name="target" size={14} className="text-emerald-500" />
                            <span>Rencana & Planning Transaksi</span>
                        </CardTitle>
                        <button
                            type="button"
                            onClick={() => setIsAddPlanOpen(true)}
                            className="px-2 py-1 rounded-md bg-emerald-400 text-black font-black text-[11px] border border-black dark:border-white hover:bg-emerald-300 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                        >
                            <Icon name="plus" size={12} />
                            <span>Rencana</span>
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                    {pendingPlans.length === 0 ? (
                        <div className="text-center py-5 bg-muted/20 rounded-xl border border-dashed border-border">
                            <p className="text-xs font-bold text-muted-foreground">Semua rencana transaksi telah terealisasi! 🎉</p>
                            <button
                                type="button"
                                onClick={() => setIsAddPlanOpen(true)}
                                className="mt-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                + Buat Rencana Pengeluaran / Pemasukan
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingPlans.map(plan => {
                                const isExpense = plan.type === 'expense';
                                return (
                                    <div
                                        key={plan.id}
                                        className="p-3 bg-muted/30 hover:bg-muted/50 rounded-xl border-2 border-black dark:border-zinc-800 flex items-center justify-between gap-3 transition-all"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-black ${
                                                    isExpense ? 'bg-rose-300 text-black' : 'bg-emerald-300 text-black'
                                                }`}>
                                                    {isExpense ? 'Pengeluaran' : 'Pemasukan'}
                                                </span>
                                                <h4 className="text-xs font-black text-foreground truncate">{plan.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs font-black text-foreground">
                                                    Rp {parseFloat(plan.amount).toLocaleString('id-ID')}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground">
                                                    • Target: {new Date(plan.target_date).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            {plan.notes && (
                                                <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">
                                                    "{plan.notes}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Tombol Realisasi */}
                                        <button
                                            type="button"
                                            onClick={() => openRealizeModal(plan)}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                                            title="Realisasikan ke Transaksi"
                                        >
                                            <Icon name="zap" size={12} />
                                            <span>Realisasi</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Breakdown Chart Card */}
            <Card className="border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Icon name="pieChart" size={14} />
                            <span>Kategori Pengeluaran ({sortedCategories.length})</span>
                        </CardTitle>
                        <span className="text-[10px] font-black text-muted-foreground">
                            Urutan: {dashboardSettings?.sort === 'lowest' ? 'Terkecil' : dashboardSettings?.sort === 'name' ? 'A-Z' : 'Terbesar (Default)'}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sortedCategories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs font-bold">
                            Tidak ada data pengeluaran pada periode ini.
                        </div>
                    ) : (
                        <>
                            {/* Doughnut Chart Canvas */}
                            <div className="relative h-44 w-full flex items-center justify-center">
                                <canvas ref={chartRef}></canvas>
                            </div>

                            {/* Sorted Category Bars */}
                            <div className="space-y-2 pt-2 border-t border-border">
                                {sortedCategories.map(cat => {
                                    const percentage = metrics.periodExpense > 0 
                                        ? Math.round((cat.amount / metrics.periodExpense) * 100) 
                                        : 0;

                                    return (
                                        <div key={cat.name} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: cat.color }}></span>
                                                    <span>{cat.name}</span>
                                                </span>
                                                <span className="font-mono font-black">
                                                    Rp {cat.amount.toLocaleString('id-ID')} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-black/30">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* MODAL 1: Quick Add Family Note */}
            {isAddNoteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
                    <div className="bg-card dark:bg-[#18181b] border-2 border-black dark:border-white rounded-2xl p-5 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-border pb-2">
                            <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                                <Icon name="wrench" size={16} className="text-indigo-500" />
                                Catat Jadwal / Servis Keluarga
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddNoteOpen(false)}
                                className="p-1 text-muted-foreground hover:text-foreground font-black"
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAddNote} className="space-y-3">
                            <div>
                                <Label className="text-xs font-black">Judul Catatan / Servis *</Label>
                                <Input
                                    type="text"
                                    placeholder="Cth: Ganti Oli Vario, Servis AC, Pajak STNK"
                                    value={noteForm.title}
                                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-black">Kategori</Label>
                                    <select
                                        value={noteForm.category}
                                        onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                                        className="flex h-11 w-full rounded-lg border-2 border-black dark:border-white bg-white text-black font-black px-2 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                                    >
                                        <option value="Kendaraan">🛵 Kendaraan</option>
                                        <option value="Rumah & Properti">🏠 Rumah & Properti</option>
                                        <option value="Kesehatan">🏥 Kesehatan</option>
                                        <option value="Dokumen & Legal">📄 Dokumen & Legal</option>
                                        <option value="Lainnya">📝 Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-black">Biaya (Rp)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={noteForm.cost}
                                        onChange={(e) => setNoteForm({ ...noteForm, cost: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-black">Tanggal Terakhir *</Label>
                                    <Input
                                        type="date"
                                        value={noteForm.last_date}
                                        onChange={(e) => setNoteForm({ ...noteForm, last_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-black">Jadwal Berikutnya</Label>
                                    <Input
                                        type="date"
                                        value={noteForm.next_due_date}
                                        onChange={(e) => setNoteForm({ ...noteForm, next_due_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-black">Catatan Tambahan (Opsional)</Label>
                                <Input
                                    type="text"
                                    placeholder="Cth: Oli SPX2, Bengkel AHASS, KM 18.000"
                                    value={noteForm.notes}
                                    onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddNoteOpen(false)}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="flex-1 bg-indigo-500 hover:bg-indigo-400"
                                >
                                    Simpan Catatan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Quick Add Planning */}
            {isAddPlanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
                    <div className="bg-card dark:bg-[#18181b] border-2 border-black dark:border-white rounded-2xl p-5 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-border pb-2">
                            <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                                <Icon name="target" size={16} className="text-emerald-500" />
                                Buat Rencana Transaksi (Planning)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddPlanOpen(false)}
                                className="p-1 text-muted-foreground hover:text-foreground font-black"
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAddPlan} className="space-y-3">
                            <div>
                                <Label className="text-xs font-black">Nama Rencana *</Label>
                                <Input
                                    type="text"
                                    placeholder="Cth: Beli Ban Motor, Bonus Freelance, Beli Sembako"
                                    value={planForm.title}
                                    onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-black">Tipe Transaksi</Label>
                                    <div className="grid grid-cols-2 gap-1 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setPlanForm({ ...planForm, type: 'expense' })}
                                            className={`p-2 text-xs font-black rounded-lg border-2 border-black transition-all ${
                                                planForm.type === 'expense' ? 'bg-rose-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            Pengeluaran
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPlanForm({ ...planForm, type: 'income' })}
                                            className={`p-2 text-xs font-black rounded-lg border-2 border-black transition-all ${
                                                planForm.type === 'income' ? 'bg-emerald-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            Pemasukan
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-black">Target Nominal (Rp) *</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={planForm.amount}
                                        onChange={(e) => setPlanForm({ ...planForm, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-black">Kategori</Label>
                                    <select
                                        value={planForm.category_id}
                                        onChange={(e) => setPlanForm({ ...planForm, category_id: e.target.value })}
                                        className="flex h-11 w-full rounded-lg border-2 border-black dark:border-white bg-white text-black font-black px-2 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                                    >
                                        <option value="">Pilih Kategori...</option>
                                        {categories
                                            .filter(c => c.type === planForm.type)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-black">Target Tanggal</Label>
                                    <Input
                                        type="date"
                                        value={planForm.target_date}
                                        onChange={(e) => setPlanForm({ ...planForm, target_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-black">Keterangan / Catatan</Label>
                                <Input
                                    type="text"
                                    placeholder="Cth: Beli di official store / tanggal gajian"
                                    value={planForm.notes}
                                    onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddPlanOpen(false)}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-black font-black"
                                >
                                    Simpan Rencana
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Realisasi Confirmation Modal */}
            {realizePlanTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
                    <div className="bg-card dark:bg-[#18181b] border-2 border-black dark:border-white rounded-2xl p-5 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-border pb-2">
                            <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                                <Icon name="zap" size={16} className="text-amber-500" />
                                Realisasikan ke Transaksi
                            </h3>
                            <button
                                type="button"
                                onClick={() => setRealizePlanTarget(null)}
                                className="p-1 text-muted-foreground hover:text-foreground font-black"
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        <div className="p-3 bg-amber-100 dark:bg-amber-950/40 border-2 border-black rounded-xl text-black dark:text-amber-200 text-xs font-bold leading-relaxed">
                            💡 Data ini akan otomatis masuk ke database <strong>Transaksi ({realizePlanTarget.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'})</strong> dan saldo kas akan langsung disesuaikan.
                        </div>

                        <form onSubmit={handleExecuteRealize} className="space-y-3">
                            <div>
                                <Label className="text-xs font-black">Keterangan Transaksi</Label>
                                <Input
                                    type="text"
                                    value={realizeForm.description}
                                    onChange={(e) => setRealizeForm({ ...realizeForm, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-black">Nominal Aktual (Rp) *</Label>
                                    <Input
                                        type="number"
                                        value={realizeForm.amount}
                                        onChange={(e) => setRealizeForm({ ...realizeForm, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-black">Tanggal Transaksi *</Label>
                                    <Input
                                        type="date"
                                        value={realizeForm.date}
                                        onChange={(e) => setRealizeForm({ ...realizeForm, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-black">Kategori Transaksi *</Label>
                                <select
                                    value={realizeForm.category_id}
                                    onChange={(e) => setRealizeForm({ ...realizeForm, category_id: e.target.value })}
                                    required
                                    className="flex h-11 w-full rounded-lg border-2 border-black dark:border-white bg-white text-black font-black px-2 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories
                                        .filter(c => c.type === realizePlanTarget.type)
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRealizePlanTarget(null)}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-black font-black"
                                >
                                    ⚡ Eksekusi Realisasi
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
});
