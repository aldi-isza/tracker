// ============================================
// FAMILY NOTES VIEW — Minimal 2-Card Hub (Maintenance & Planning)
// ============================================

const { useState: _fnvUseState, useMemo: _fnvUseMemo, useEffect: _fnvUseEffect } = React;

window.FamilyNotesView = React.memo(({ 
    user, 
    familyNotesState, 
    planningState,
    categories = [],
    onNavigate,
    setIsInSubpage
}) => {
    // Current subview: 'maintenance' | 'planning'
    const [subview, setSubview] = _fnvUseState('maintenance');

    // Keep bottom navbar always accessible
    _fnvUseEffect(() => {
        if (typeof setIsInSubpage === 'function') {
            setIsInSubpage(false);
        }
    }, [setIsInSubpage]);

    // Data shortcuts with loading state
    const { 
        notes = [], 
        isLoading: isNotesLoading = false,
        addNote, 
        updateNote, 
        deleteNote 
    } = familyNotesState || {};

    const { 
        planningList: plans = [], 
        isLoading: isPlansLoading = false,
        addPlanning: addPlan, 
        updatePlanning: updatePlan, 
        deletePlanning: deletePlan, 
        realizePlanning: realizePlan 
    } = planningState || {};

    // --- SUBPAGE: MAINTENANCE STATE ---
    const [maintenanceSearch, setMaintenanceSearch] = _fnvUseState('');
    const [isNoteModalOpen, setIsNoteModalOpen] = _fnvUseState(false);
    const [editingNote, setEditingNote] = _fnvUseState(null);
    const [noteFormData, setNoteFormData] = _fnvUseState({
        title: '',
        category: 'Kendaraan',
        last_date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        cost: '',
        notes: ''
    });

    // --- SUBPAGE: PLANNING STATE ---
    const [planningSearch, setPlanningSearch] = _fnvUseState('');
    const [isPlanModalOpen, setIsPlanModalOpen] = _fnvUseState(false);
    const [editingPlan, setEditingPlan] = _fnvUseState(null);
    const [planFormData, setPlanFormData] = _fnvUseState({
        title: '',
        type: 'expense',
        category: '',
        planned_amount: '',
        target_date: '',
        notes: ''
    });

    // Note Modal Handlers
    const handleOpenAddNote = () => {
        setEditingNote(null);
        setNoteFormData({
            title: '',
            category: 'Kendaraan',
            last_date: new Date().toISOString().split('T')[0],
            next_due_date: '',
            cost: '',
            notes: ''
        });
        setIsNoteModalOpen(true);
    };

    const handleOpenEditNote = (n) => {
        setEditingNote(n);
        setNoteFormData({
            title: n.title || '',
            category: n.category || 'Kendaraan',
            last_date: n.last_date ? String(n.last_date).slice(0, 10) : new Date().toISOString().split('T')[0],
            next_due_date: n.next_due_date ? String(n.next_due_date).slice(0, 10) : '',
            cost: n.cost ? String(n.cost) : '',
            notes: n.notes || ''
        });
        setIsNoteModalOpen(true);
    };

    const handleSubmitNote = async (e) => {
        e.preventDefault();
        if (!noteFormData.title.trim()) return;
        const payload = {
            title: noteFormData.title.trim(),
            category: noteFormData.category || 'Kendaraan',
            last_date: noteFormData.last_date || new Date().toISOString().split('T')[0],
            next_due_date: noteFormData.next_due_date || null,
            cost: parseFloat(noteFormData.cost || 0),
            notes: noteFormData.notes || ''
        };
        if (editingNote) {
            await updateNote(editingNote.id, payload);
        } else {
            await addNote(payload);
        }
        setIsNoteModalOpen(false);
        setEditingNote(null);
    };

    // Plan Modal Handlers
    const handleOpenAddPlan = () => {
        setEditingPlan(null);
        const matchingCats = categories.filter(c => c.type === 'expense');
        const defaultCat = matchingCats.length > 0 ? matchingCats[0] : (categories[0] || null);
        setPlanFormData({
            title: '',
            type: 'expense',
            category_id: defaultCat ? defaultCat.id : '',
            category: defaultCat ? defaultCat.name : '',
            planned_amount: '',
            target_date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setIsPlanModalOpen(true);
    };

    const handleOpenEditPlan = (p) => {
        setEditingPlan(p);
        const matchingCats = categories.filter(c => c.type === (p.type || 'expense'));
        const defaultCat = matchingCats.length > 0 ? matchingCats[0] : (categories[0] || null);
        setPlanFormData({
            title: p.title || '',
            type: p.type || 'expense',
            category_id: p.category_id || (defaultCat ? defaultCat.id : ''),
            category: p.category || (defaultCat ? defaultCat.name : ''),
            planned_amount: (p.amount !== undefined ? p.amount : p.planned_amount) ? String(p.amount || p.planned_amount) : '',
            target_date: p.target_date ? String(p.target_date).slice(0, 10) : '',
            notes: p.notes || ''
        });
        setIsPlanModalOpen(true);
    };

    const handleSubmitPlan = async (e) => {
        e.preventDefault();
        if (!planFormData.title.trim()) return;
        const payload = {
            title: planFormData.title.trim(),
            type: planFormData.type || 'expense',
            category_id: planFormData.category_id || null,
            target_date: planFormData.target_date || new Date().toISOString().split('T')[0],
            notes: planFormData.notes || '',
            amount: parseFloat(planFormData.planned_amount || 0)
        };
        if (editingPlan) {
            await updatePlan(editingPlan.id, payload);
        } else {
            await addPlan(payload);
        }
        setIsPlanModalOpen(false);
        setEditingPlan(null);
    };

    // Filtered lists
    const filteredNotes = _fnvUseMemo(() => {
        const q = maintenanceSearch.trim().toLowerCase();
        if (!q) return notes || [];
        return (notes || []).filter(n => (n.title || '').toLowerCase().includes(q));
    }, [notes, maintenanceSearch]);

    const filteredPlans = _fnvUseMemo(() => {
        const q = planningSearch.trim().toLowerCase();
        if (!q) return plans || [];
        return (plans || []).filter(p => (p.title || '').toLowerCase().includes(q));
    }, [plans, planningSearch]);

    // Pagination constants & state
    const ITEMS_PER_PAGE = 8;
    const [notePage, setNotePage] = _fnvUseState(1);
    const [planPage, setPlanPage] = _fnvUseState(1);

    // Reset pagination when searching
    _fnvUseEffect(() => {
        setNotePage(1);
    }, [maintenanceSearch]);

    _fnvUseEffect(() => {
        setPlanPage(1);
    }, [planningSearch]);

    // Note pagination calculation
    const totalNotePages = Math.max(1, Math.ceil(filteredNotes.length / ITEMS_PER_PAGE));
    const safeNotePage = Math.min(Math.max(1, notePage), totalNotePages);
    const paginatedNotes = filteredNotes.slice((safeNotePage - 1) * ITEMS_PER_PAGE, safeNotePage * ITEMS_PER_PAGE);

    // Plan pagination calculation
    const totalPlanPages = Math.max(1, Math.ceil(filteredPlans.length / ITEMS_PER_PAGE));
    const safePlanPage = Math.min(Math.max(1, planPage), totalPlanPages);
    const paginatedPlans = filteredPlans.slice((safePlanPage - 1) * ITEMS_PER_PAGE, safePlanPage * ITEMS_PER_PAGE);

    const TABS = _fnvUseMemo(() => [
        { id: 'maintenance', label: 'Maintenance', icon: 'wrench', count: notes.length, activeColor: 'text-blue-600 dark:text-blue-400' },
        { id: 'planning', label: 'Planning', icon: 'calendar', count: plans.length, activeColor: 'text-emerald-600 dark:text-emerald-400' }
    ], [notes.length, plans.length]);

    // ============================================
    // 1. MAINTENANCE VIEW
    // ============================================
    if (subview === 'maintenance') {
        return (
            <div className="space-y-4 max-w-xl mx-auto pt-2 pb-16 min-h-[85vh]">
                {/* Reusable Segmented Tabs */}
                <SegmentedControl tabs={TABS} activeTab={subview} onChange={setSubview} />

                {/* Maintenance Header Bar */}
                <div className="flex items-center justify-between pb-1">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            Maintenance
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Logbook and service tracking
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenAddNote}
                        className="h-8 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
                    >
                        <Icon name="plus" size={14} />
                        <span>Add</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Icon name="search" size={14} />
                    </div>
                    <input
                        type="text"
                        value={maintenanceSearch}
                        onChange={(e) => setMaintenanceSearch(e.target.value)}
                        placeholder="Search records..."
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
                    />
                </div>

                {/* Ultra-Clean Title-Only List */}
                <div className="space-y-2">
                    {isNotesLoading && notes.length === 0 ? (
                        <SkeletonList count={4} />
                    ) : filteredNotes.length === 0 ? (
                        <EmptyState 
                            icon="wrench" 
                            title="No maintenance records" 
                            description="Track vehicle services and home maintenance."
                            actionLabel="Add Record"
                            onAction={handleOpenAddNote}
                        />
                    ) : (
                        paginatedNotes.map(n => (
                            <div
                                key={n.id}
                                onClick={() => handleOpenEditNote(n)}
                                className="px-4 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] shadow-xs group"
                            >
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {n.title}
                                </span>
                                <Icon name="chevronRight" size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0 transition-transform group-hover:translate-x-0.5" />
                            </div>
                        ))
                    )}
                </div>

                {/* Maintenance Pagination Bar */}
                {filteredNotes.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-2 px-1 text-xs">
                        <span className="text-slate-400 font-medium">
                            Page <span className="text-slate-800 dark:text-slate-200 font-bold">{safeNotePage}</span> of {totalNotePages} ({filteredNotes.length} records)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setNotePage(p => Math.max(1, p - 1))}
                                disabled={safeNotePage === 1}
                                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-xs"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => setNotePage(p => Math.min(totalNotePages, p + 1))}
                                disabled={safeNotePage === totalNotePages}
                                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-xs"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Manage / Edit Note Modal */}
                <Modal
                    isOpen={isNoteModalOpen}
                    onClose={() => setIsNoteModalOpen(false)}
                    title={editingNote ? 'Manage Maintenance' : 'New Maintenance'}
                >
                    <form onSubmit={handleSubmitNote} className="space-y-3.5">
                        <div className="space-y-1">
                            <Label htmlFor="m-title">Title *</Label>
                            <Input
                                id="m-title"
                                type="text"
                                required
                                placeholder="e.g. Oil Change, AC Service"
                                value={noteFormData.title}
                                onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="m-cat">Category</Label>
                                <select
                                    id="m-cat"
                                    value={noteFormData.category}
                                    onChange={(e) => setNoteFormData({ ...noteFormData, category: e.target.value })}
                                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="Kendaraan">Kendaraan</option>
                                    <option value="Rumah">Rumah</option>
                                    <option value="Kesehatan">Kesehatan</option>
                                    <option value="Dokumen">Dokumen</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="m-cost">Cost</Label>
                                <Input
                                    id="m-cost"
                                    type="number"
                                    placeholder="0"
                                    value={noteFormData.cost}
                                    onChange={(e) => setNoteFormData({ ...noteFormData, cost: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="m-last">Last Date</Label>
                                <Input
                                    id="m-last"
                                    type="date"
                                    value={noteFormData.last_date}
                                    onChange={(e) => setNoteFormData({ ...noteFormData, last_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="m-due">Next Due</Label>
                                <Input
                                    id="m-due"
                                    type="date"
                                    value={noteFormData.next_due_date}
                                    onChange={(e) => setNoteFormData({ ...noteFormData, next_due_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="m-notes">Description</Label>
                            <textarea
                                id="m-notes"
                                rows={2}
                                placeholder="Notes..."
                                value={noteFormData.notes}
                                onChange={(e) => setNoteFormData({ ...noteFormData, notes: e.target.value })}
                                className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                            {editingNote ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (window.confirm('Delete this item?')) {
                                            await deleteNote(editingNote.id);
                                            setIsNoteModalOpen(false);
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                >
                                    Delete
                                </button>
                            ) : <div />}

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsNoteModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            </div>
        );
    }

    // ============================================
    // 2. PLANNING VIEW
    // ============================================
    if (subview === 'planning') {
        return (
            <div className="space-y-4 max-w-xl mx-auto pt-2 pb-16 min-h-[85vh]">
                {/* Reusable Segmented Tabs */}
                <SegmentedControl tabs={TABS} activeTab={subview} onChange={setSubview} />

                {/* Planning Header Bar */}
                <div className="flex items-center justify-between pb-1">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            Planning
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Financial targets and budget plans
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenAddPlan}
                        className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
                    >
                        <Icon name="plus" size={14} />
                        <span>Add</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Icon name="search" size={14} />
                    </div>
                    <input
                        type="text"
                        value={planningSearch}
                        onChange={(e) => setPlanningSearch(e.target.value)}
                        placeholder="Search plans..."
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
                    />
                </div>

                {/* Ultra-Clean Title-Only List */}
                <div className="space-y-2">
                    {isPlansLoading && plans.length === 0 ? (
                        <SkeletonList count={4} />
                    ) : filteredPlans.length === 0 ? (
                        <EmptyState 
                            icon="calendar" 
                            title="No planned items" 
                            description="Plan upcoming family expenses and milestones."
                            actionLabel="Add Plan"
                            onAction={handleOpenAddPlan}
                        />
                    ) : (
                        paginatedPlans.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleOpenEditPlan(p)}
                                className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] shadow-xs group"
                            >
                                <div className="flex items-center gap-2.5 truncate min-w-0">
                                    {p.is_realized ? (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 rounded-md shrink-0 flex items-center gap-1">
                                            <Icon name="check" size={10} />
                                            <span>Realized</span>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            title="Click to Realize"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                realizePlan(p);
                                            }}
                                            className="px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 rounded-lg hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all shrink-0 flex items-center gap-1 shadow-xs active:scale-95"
                                        >
                                            <Icon name="check" size={11} />
                                            <span>Realize</span>
                                        </button>
                                    )}
                                    <span className={`text-sm font-semibold truncate ${p.is_realized ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {p.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {p.amount > 0 && (
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            Rp {Number(p.amount).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                    <Icon name="chevronRight" size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Planning Pagination Bar */}
                {filteredPlans.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-2 px-1 text-xs">
                        <span className="text-slate-400 font-medium">
                            Page <span className="text-slate-800 dark:text-slate-200 font-bold">{safePlanPage}</span> of {totalPlanPages} ({filteredPlans.length} plans)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPlanPage(p => Math.max(1, p - 1))}
                                disabled={safePlanPage === 1}
                                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-xs"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlanPage(p => Math.min(totalPlanPages, p + 1))}
                                disabled={safePlanPage === totalPlanPages}
                                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-xs"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Manage / Edit Plan Modal */}
                <Modal
                    isOpen={isPlanModalOpen}
                    onClose={() => setIsPlanModalOpen(false)}
                    title={editingPlan ? 'Manage Plan' : 'New Plan'}
                >
                    <form onSubmit={handleSubmitPlan} className="space-y-3.5">
                        <div className="space-y-1">
                            <Label htmlFor="p-title">Title *</Label>
                            <Input
                                id="p-title"
                                type="text"
                                required
                                placeholder="e.g. Vacation, Tax"
                                value={planFormData.title}
                                onChange={(e) => setPlanFormData({ ...planFormData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="p-type">Type</Label>
                                <select
                                    id="p-type"
                                    value={planFormData.type}
                                    onChange={(e) => setPlanFormData({ ...planFormData, type: e.target.value })}
                                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="p-amount">Planned Amount</Label>
                                <Input
                                    id="p-amount"
                                    type="number"
                                    placeholder="0"
                                    value={planFormData.planned_amount}
                                    onChange={(e) => setPlanFormData({ ...planFormData, planned_amount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="p-cat">Category</Label>
                                <select
                                    id="p-cat"
                                    value={planFormData.category_id}
                                    onChange={(e) => {
                                        const cat = categories.find(c => c.id === e.target.value);
                                        setPlanFormData({ 
                                            ...planFormData, 
                                            category_id: e.target.value,
                                            category: cat ? cat.name : ''
                                        });
                                    }}
                                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    <option value="">-- Select Category --</option>
                                    {categories.filter(c => c.type === planFormData.type).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="p-target">Target Date</Label>
                                <Input
                                    id="p-target"
                                    type="date"
                                    value={planFormData.target_date}
                                    onChange={(e) => setPlanFormData({ ...planFormData, target_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="p-notes">Description</Label>
                            <textarea
                                id="p-notes"
                                rows={2}
                                placeholder="Notes..."
                                value={planFormData.notes}
                                onChange={(e) => setPlanFormData({ ...planFormData, notes: e.target.value })}
                                className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                            {editingPlan ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (window.confirm('Delete this plan?')) {
                                                await deletePlan(editingPlan.id);
                                                setIsPlanModalOpen(false);
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                    >
                                        Delete
                                    </button>
                                    {typeof realizePlan === 'function' && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                await realizePlan(editingPlan);
                                                setIsPlanModalOpen(false);
                                            }}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                                        >
                                            Realize
                                        </button>
                                    )}
                                </div>
                            ) : <div />}

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsPlanModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            </div>
        );
    }

    return null;
});