// ============================================
// DASHBOARD VIEW — Clean, Streamlined & Integrated
// ============================================

const { useState: _dvUseState, useMemo: _dvUseMemo, useRef: _dvUseRef, useEffect: _dvUseEffect } = React;

window.DashboardView = React.memo(({
    user,
    transactions = [],
    categories = [],
    isLoading = false,
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
            const currentDay = now.getDate();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

            if (currentDay >= 25) {
                // If today is 25th or later: period is 25th of this month to 24th of next month
                start = new Date(currentYear, currentMonth, 25, 0, 0, 0, 0);
                end = new Date(currentYear, currentMonth + 1, 24, 23, 59, 59, 999);
                const nextMonth = (currentMonth + 1) % 12;
                label = `Bulan Ini (25 ${monthNames[currentMonth]} - 24 ${monthNames[nextMonth]})`;
            } else {
                // If today is before 25th: period is 25th of last month to 24th of this month
                start = new Date(currentYear, currentMonth - 1, 25, 0, 0, 0, 0);
                end = new Date(currentYear, currentMonth, 24, 23, 59, 59, 999);
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                label = `Bulan Ini (25 ${monthNames[prevMonth]} - 24 ${monthNames[currentMonth]})`;
            }
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

        // Today's Expense (use local date, not UTC)
        const now2 = new Date();
        const todayStr = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-${String(now2.getDate()).padStart(2, '0')}`;
        const todayExpense = transactions
            .filter(t => t.type === 'expense' && (t.date || '').slice(0, 10) === todayStr)
            .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

        return { totalBalance, periodIncome, periodExpense, todayExpense };
    }, [transactions, filteredTransactions]);

    // 3. Category Breakdown (Expense) & Pareto Monthly Analysis
    const { sortedCategories, monthlyPareto } = _dvUseMemo(() => {
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

        // --- Pareto Monthly Trend (Income vs Expense grouped by 25th-to-24th cycle) ---
        const monthlyMap = {};
        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        transactions.forEach(t => {
            if (!t.date) return;
            const d = new Date(t.date);
            if (isNaN(d.getTime())) return;

            // Cutoff cycle: if date >= 25, it belongs to the NEXT month's budget cycle
            let cycleYear = d.getFullYear();
            let cycleMonth = d.getMonth(); // 0-indexed

            const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

            let label = '';
            if (d.getDate() >= 25) {
                cycleMonth += 1;
                if (cycleMonth > 11) {
                    cycleMonth = 0;
                    cycleYear += 1;
                }
                label = `25 ${monthNamesShort[d.getMonth()]} - 24 ${monthNamesShort[cycleMonth]}`;
            } else {
                const prevM = d.getMonth() === 0 ? 11 : d.getMonth() - 1;
                label = `25 ${monthNamesShort[prevM]} - 24 ${monthNamesShort[d.getMonth()]}`;
            }

            const key = `${cycleYear}-${String(cycleMonth + 1).padStart(2, '0')}`;
            
            if (!monthlyMap[key]) {
                monthlyMap[key] = { key, label, income: 0, expense: 0 };
            }
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'income') {
                monthlyMap[key].income += amt;
            } else if (t.type === 'expense') {
                monthlyMap[key].expense += amt;
            }
        });

        const sortedMonthlyKeys = Object.keys(monthlyMap).sort().slice(-6); // last 6 cycles
        const paretoData = sortedMonthlyKeys.map(k => monthlyMap[k]);

        return { sortedCategories: list, monthlyPareto: paretoData };
    }, [transactions, filteredTransactions, dashboardSettings?.sort]);

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

    // In-App Skeleton Loading (Tampil hanya jika data belum terload)
    if (isLoading && transactions.length === 0 && categories.length === 0) {
        return (
            <div className="space-y-4 max-w-xl mx-auto pb-16">
                {/* Top Header Skeleton */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="h-6 w-28 skeleton-shimmer rounded-lg"></div>
                    <div className="h-9 w-20 skeleton-shimmer rounded-xl"></div>
                </div>

                {/* Hero Balance Card Skeleton */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div className="h-7 w-16 skeleton-shimmer rounded-xl"></div>
                    </div>
                    <div className="h-9 w-48 skeleton-shimmer rounded-lg"></div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="h-3 w-24 skeleton-shimmer rounded"></div>
                        <div className="h-5 w-20 skeleton-shimmer rounded-full"></div>
                    </div>
                </div>

                {/* 2 Summary Cards Skeleton */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <div className="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div className="h-6 w-24 skeleton-shimmer rounded"></div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <div className="h-3 w-16 skeleton-shimmer rounded"></div>
                        <div className="h-6 w-24 skeleton-shimmer rounded"></div>
                    </div>
                </div>

                {/* Quick Action Buttons Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 skeleton-shimmer"></div>
                    <div className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 skeleton-shimmer"></div>
                    <div className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 skeleton-shimmer"></div>
                    <div className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 skeleton-shimmer"></div>
                </div>

                {/* Categories Card Skeleton */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="h-4 w-28 skeleton-shimmer rounded"></div>
                    <div className="space-y-2 pt-2">
                        <div className="h-8 w-full skeleton-shimmer rounded-xl"></div>
                        <div className="h-8 w-full skeleton-shimmer rounded-xl"></div>
                        <div className="h-8 w-full skeleton-shimmer rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-xl mx-auto pb-16">
            {/* Top Bar Header — Clean & Streamlined Apple Style */}
            <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Overview
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs font-medium transition-all active:scale-95 cursor-pointer disabled:pointer-events-none ${isRefreshing ? 'opacity-70' : ''}`}
                        title="Sync Data"
                    >
                        <div className="flex items-center gap-1.5">
                            <Icon name="refresh" size={14} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
                            <span className="text-xs font-medium hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Total Balance Card (Apple Hero Card) */}
            <Card className="p-5 sm:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg shadow-blue-500/20 rounded-3xl">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-blue-100">Total Balance</p>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-white">
                            Rp {metrics.totalBalance.toLocaleString('id-ID')}
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={onAddClick}
                        className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-xs backdrop-blur-md border border-white/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                        <Icon name="plus" size={14} />
                        <span>Add</span>
                    </button>
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs">
                    <span className="text-blue-100 font-normal">Today's Expense</span>
                    <span className="bg-white/15 px-2.5 py-0.5 rounded-full font-medium text-white border border-white/10">
                        Rp {metrics.todayExpense.toLocaleString('id-ID')}
                    </span>
                </div>
            </Card>

            {/* Income & Expense Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/40 dark:border-emerald-800/40">
                            <Icon name="arrowDownLeft" size={12} />
                        </div>
                        <span>Income</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2 truncate">
                        Rp {metrics.periodIncome.toLocaleString('id-ID')}
                    </p>
                </Card>

                <Card className="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl">
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-[11px] uppercase tracking-wider">
                        <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/40 dark:border-rose-800/40">
                            <Icon name="arrowUpRight" size={12} />
                        </div>
                        <span>Expense</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2 truncate">
                        Rp {metrics.periodExpense.toLocaleString('id-ID')}
                    </p>
                </Card>
            </div>

            {/* Category Breakdown Chart Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Icon name="pieChart" size={14} />
                            <span>Categories</span>
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sortedCategories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                            No expenses in this period.
                        </div>
                    ) : (
                        <>
                            {/* Doughnut Chart Canvas */}
                            <div className="relative h-44 w-full flex items-center justify-center">
                                <canvas ref={chartRef}></canvas>
                            </div>

                            {/* Sorted Category Bars */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {sortedCategories.map(cat => {
                                    const percentage = metrics.periodExpense > 0 
                                        ? Math.round((cat.amount / metrics.periodExpense) * 100) 
                                        : 0;

                                    return (
                                        <div key={cat.name} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs font-medium">
                                                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                                                    <span>{cat.name}</span>
                                                </span>
                                                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                                                    Rp {cat.amount.toLocaleString('id-ID')} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

            {/* Monthly Pareto (Income vs Expense Bar Comparison) */}
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Icon name="barChart" size={14} />
                            <span>Monthly Comparison (Pareto)</span>
                        </CardTitle>
                        <div className="flex items-center gap-3 text-[10px] font-semibold">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Income
                            </span>
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Expense
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {monthlyPareto.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-xs font-medium">
                            Belum ada data bulanan.
                        </div>
                    ) : (
                        <div className="space-y-3 pt-1">
                            {monthlyPareto.map(item => {
                                const maxVal = Math.max(...monthlyPareto.flatMap(m => [m.income, m.expense]), 1);
                                const incomeWidth = Math.round((item.income / maxVal) * 100);
                                const expenseWidth = Math.round((item.expense / maxVal) * 100);

                                return (
                                    <div key={item.key} className="space-y-1 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                        <div className="flex justify-between items-center text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                            <span>{item.label}</span>
                                            <span className="text-[11px] font-mono text-slate-500">
                                                Net: <span className={item.income - item.expense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                    Rp {(item.income - item.expense).toLocaleString('id-ID')}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Income Bar */}
                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className="w-12 text-slate-500 font-medium truncate">Income</span>
                                            <div className="flex-1 h-2 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                                    style={{ width: `${Math.max(incomeWidth, 2)}%` }}
                                                />
                                            </div>
                                            <span className="w-20 text-right font-mono font-medium text-slate-700 dark:text-slate-300 truncate">
                                                Rp {item.income.toLocaleString('id-ID')}
                                            </span>
                                        </div>

                                        {/* Expense Bar */}
                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className="w-12 text-slate-500 font-medium truncate">Expense</span>
                                            <div className="flex-1 h-2 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                                                    style={{ width: `${Math.max(expenseWidth, 2)}%` }}
                                                />
                                            </div>
                                            <span className="w-20 text-right font-mono font-medium text-slate-700 dark:text-slate-300 truncate">
                                                Rp {item.expense.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* MODAL 1: Quick Add Family Note */}
            {isAddNoteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Icon name="wrench" size={16} className="text-blue-500" />
                                Catat Jadwal / Servis Keluarga
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddNoteOpen(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAddNote} className="space-y-3">
                            <div>
                                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Title *</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Oil Change, AC Service, Vehicle Tax"
                                    value={noteForm.title}
                                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Category</Label>
                                    <select
                                        value={noteForm.category}
                                        onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                                        className="flex h-10 w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium px-3 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="Kendaraan">Vehicle</option>
                                        <option value="Rumah & Properti">Home & Property</option>
                                        <option value="Kesehatan">Health</option>
                                        <option value="Dokumen & Legal">Legal & Documents</option>
                                        <option value="Lainnya">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Cost</Label>
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
                                    <Label className="text-xs font-black">Last Date *</Label>
                                    <Input
                                        type="date"
                                        value={noteForm.last_date}
                                        onChange={(e) => setNoteForm({ ...noteForm, last_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-black">Next Due Date</Label>
                                    <Input
                                        type="date"
                                        value={noteForm.next_due_date}
                                        onChange={(e) => setNoteForm({ ...noteForm, next_due_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-black">Notes (Optional)</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. SPX2 Oil, 18,000 km checkup"
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
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Save Record
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Quick Add Planning */}
            {isAddPlanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Icon name="target" size={16} className="text-emerald-500" />
                                New Financial Plan
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddPlanOpen(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAddPlan} className="space-y-3">
                            <div>
                                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Plan Title *</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Tires replacement, Freelance bonus, Groceries"
                                    value={planForm.title}
                                    onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Type</Label>
                                    <div className="grid grid-cols-2 gap-1 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setPlanForm({ ...planForm, type: 'expense' })}
                                            className={`p-2 text-xs font-medium rounded-xl transition-all ${
                                                planForm.type === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            Expense
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPlanForm({ ...planForm, type: 'income' })}
                                            className={`p-2 text-xs font-medium rounded-xl transition-all ${
                                                planForm.type === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            Income
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Estimated Amount *</Label>
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
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Category</Label>
                                    <select
                                        value={planForm.category_id}
                                        onChange={(e) => setPlanForm({ ...planForm, category_id: e.target.value })}
                                        className="flex h-10 w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium px-3 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories
                                            .filter(c => c.type === planForm.type)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Date</Label>
                                    <Input
                                        type="date"
                                        value={planForm.target_date}
                                        onChange={(e) => setPlanForm({ ...planForm, target_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Notes (Optional)</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Target store / payday week"
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
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    Save Plan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Realisasi Confirmation Modal */}
            {realizePlanTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Icon name="zap" size={16} className="text-amber-500" />
                                Realisasikan ke Transaksi
                            </h3>
                            <button
                                type="button"
                                onClick={() => setRealizePlanTarget(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <Icon name="x" size={18} />
                            </button>
                        </div>

                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 rounded-2xl text-amber-800 dark:text-amber-200 text-xs font-medium leading-relaxed">
                            💡 Data ini akan otomatis masuk ke database <strong>Transaksi ({realizePlanTarget.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'})</strong> dan saldo kas akan langsung disesuaikan.
                        </div>

                        <form onSubmit={handleExecuteRealize} className="space-y-3">
                            <div>
                                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Keterangan Transaksi</Label>
                                <Input
                                    type="text"
                                    value={realizeForm.description}
                                    onChange={(e) => setRealizeForm({ ...realizeForm, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nominal Aktual (Rp) *</Label>
                                    <Input
                                        type="number"
                                        value={realizeForm.amount}
                                        onChange={(e) => setRealizeForm({ ...realizeForm, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tanggal Transaksi *</Label>
                                    <Input
                                        type="date"
                                        value={realizeForm.date}
                                        onChange={(e) => setRealizeForm({ ...realizeForm, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Kategori Transaksi *</Label>
                                <select
                                    value={realizeForm.category_id}
                                    onChange={(e) => setRealizeForm({ ...realizeForm, category_id: e.target.value })}
                                    required
                                    className="flex h-10 w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium px-3 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
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
