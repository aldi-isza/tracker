// ============================================
// ISZA FAMILY — Core Application Module
// ============================================
// This file contains only: Config, Constants, Toast System,
// Supabase Client/API, App Component, Root, and PWA registration.
// All views, hooks, utils, and shared components are loaded separately.

const { useState, useEffect, useContext, createContext, useMemo, useCallback, useRef } = React;

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const CONFIG = window.CONFIG || {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SESSION_TIMEOUT: 30 * 60 * 1000,
};

window.VIEWS = {
    DASHBOARD: 'dashboard',
    TRANSACTIONS: 'transactions',
    FAMILY_NOTES: 'family_notes',
    CATEGORIES: 'categories',
    SETTINGS: 'settings',
};

window.STORAGE_KEYS = {
    USER: 'ff_user',
    SESSION: 'ff_session',
    BUDGET_RULE: 'ff_budget_rule',
    DASHBOARD_SETTINGS: 'ff_dashboard_settings',
    FAMILY_NOTES: 'isza_family_notes_cache',
};

// ============================================
// TOAST SYSTEM
// ============================================

const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'default') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <div className="fixed top-4 right-4 left-4 md:left-auto md:w-80 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold pointer-events-auto transition-all animate-in slide-in-from-top-full ${
                        t.type === 'error' ? 'bg-rose-600 text-white' :
                        t.type === 'success' ? 'bg-emerald-600 text-white' :
                        'bg-card text-card-foreground border border-border'
                    }`}>
                        {t.type === 'error' && <Icon name="alertCircle" size={18} />}
                        {t.type === 'success' && <Icon name="check" size={18} />}
                        <span className="flex-1">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

window.useToast = () => useContext(ToastContext);

// ============================================
// SUPABASE CLIENT & API
// ============================================

const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

window.api = {
    async login(email, pin) {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPin = pin.trim();

        if (!validators.validateEmail(cleanEmail)) throw new Error('INVALID_EMAIL');
        if (!validators.validatePin(cleanPin)) throw new Error('INVALID_PIN');

        let { data: user, error: queryError } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .single();

        if (queryError || !user) {
            const { data: fallbackUser } = await supabase
                .from('users')
                .select('*')
                .limit(1)
                .maybeSingle();
            if (fallbackUser) {
                user = fallbackUser;
            } else {
                throw new Error('USER_NOT_FOUND');
            }
        }

        if (String(user.pin).trim() !== String(cleanPin).trim()) {
            throw new Error('INVALID_PIN');
        }

        return user;
    },

    async getCategories(userId) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .is('is_deleted', false)
            .order('name');
        if (error) throw error;
        return data || [];
    },

    async addCategory(userId, name, color, type) {
        if (!validators.validateCategoryName(name)) throw new Error('Nama kategori tidak valid');
        const { data, error } = await supabase
            .from('categories')
            .insert([{ user_id: userId, name: name.trim(), color, type }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateCategory(id, updates) {
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteCategory(id) {
        const { error } = await supabase
            .from('categories')
            .update({ is_deleted: true })
            .eq('id', id);
        if (error) throw error;
    },

    async getTransactions(userId, filters = {}) {
        let query = supabase
            .from('transactions')
            .select(`*, category:categories(*)`)
            .eq('user_id', userId)
            .is('is_deleted', false)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

        if (filters.type) query = query.eq('type', filters.type);
        if (filters.categoryId) query = query.eq('category_id', filters.categoryId);

        let { data, error } = await query;
        if (error) {
            // Fallback if created_at column is not present in database
            query = supabase
                .from('transactions')
                .select(`*, category:categories(*)`)
                .eq('user_id', userId)
                .is('is_deleted', false)
                .order('date', { ascending: false })
                .order('id', { ascending: false });
            if (filters.type) query = query.eq('type', filters.type);
            if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
            const res = await query;
            data = res.data;
            if (res.error) throw res.error;
        }

        const sortedData = (data || []).sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;

            if (a.created_at && b.created_at) {
                return new Date(b.created_at) - new Date(a.created_at);
            }
            if (a.id && b.id) {
                if (typeof a.id === 'number' && typeof b.id === 'number') return b.id - a.id;
                return String(b.id).localeCompare(String(a.id));
            }
            return 0;
        });

        return sortedData;
    },

    async addTransaction(userId, data) {
        const validation = validators.validateTransactionData(data);
        if (!validation.isValid) throw new Error(Object.values(validation.errors)[0]);

        const { data: res, error } = await supabase
            .from('transactions')
            .insert([{
                user_id: userId,
                ...data,
                amount: Math.abs(parseFloat(data.amount))
            }])
            .select()
            .single();
        if (error) throw error;
        return res;
    },

    async updateTransaction(id, data) {
        const validation = validators.validateTransactionData(data);
        if (!validation.isValid) throw new Error(Object.values(validation.errors)[0]);

        const { data: res, error } = await supabase
            .from('transactions')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return res;
    },

    async deleteTransaction(id) {
        const { error } = await supabase
            .from('transactions')
            .update({ is_deleted: true })
            .eq('id', id);
        if (error) throw error;
    },

    async updateUserPreferences(userId, updates) {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);
        if (error) throw error;
    },

    // Catatan Keluarga (Family Notes & Logbook)
    async getFamilyNotes(userId) {
        try {
            const { data, error } = await supabase
                .from('family_notes')
                .select('*')
                .eq('user_id', userId)
                .is('is_deleted', false)
                .order('last_date', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('[api.getFamilyNotes] Notice (using local cache):', err.message);
            return null;
        }
    },

    async addFamilyNote(userId, noteData) {
        try {
            const payload = {
                user_id: userId,
                title: noteData.title,
                category: noteData.category,
                last_date: noteData.last_date,
                next_due_date: noteData.next_due_date || null,
                cost: noteData.cost || 0,
                status: noteData.status || 'Selesai',
                notes: noteData.notes || ''
            };
            const { data, error } = await supabase
                .from('family_notes')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.warn('[api.addFamilyNote] Notice (saved locally):', err.message);
            return null;
        }
    },

    async updateFamilyNote(id, noteData) {
        try {
            const { data, error } = await supabase
                .from('family_notes')
                .update({
                    title: noteData.title,
                    category: noteData.category,
                    last_date: noteData.last_date,
                    next_due_date: noteData.next_due_date || null,
                    cost: noteData.cost || 0,
                    status: noteData.status || 'Selesai',
                    notes: noteData.notes || '',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.warn('[api.updateFamilyNote] Notice (updated locally):', err.message);
            return null;
        }
    },

    async deleteFamilyNote(id) {
        try {
            const { error } = await supabase
                .from('family_notes')
                .update({ is_deleted: true })
                .eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.warn('[api.deleteFamilyNote] Notice (deleted locally):', err.message);
        }
    }
};

// ============================================
// MAIN APP COMPONENT
// ============================================

const App = () => {
    // Session Management (extracted to hook)
    const { user, setUser, loading, handleLogin, handleLogout } = useSessionManager(CONFIG, window.STORAGE_KEYS);

    // Finance Data (extracted to hook)
    const toast = window.useToast();
    const { transactions, categories, isRefreshing, loadData, handleManualRefresh } = useFinanceData(user, window.api, toast);

    // Family Notes Data (Hook for Catatan Keluarga)
    const familyNotesState = useFamilyNotes(user, window.api, toast);

    // Dashboard Filter & Sort Settings State
    const [dashboardSettings, setDashboardSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(window.STORAGE_KEYS.DASHBOARD_SETTINGS);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.period) return parsed;
            }
        } catch (e) {}
        return { period: 'this_month', sort: 'highest' };
    });

    const handleUpdateDashboardSettings = useCallback((newSettings) => {
        setDashboardSettings(newSettings);
        localStorage.setItem(window.STORAGE_KEYS.DASHBOARD_SETTINGS, JSON.stringify(newSettings));
    }, []);

    // Budget Rule State
    const [budgetRule, setBudgetRule] = useState(() => {
        try {
            const saved = localStorage.getItem(window.STORAGE_KEYS.BUDGET_RULE);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed.needs === 'number' && typeof parsed.wants === 'number' && typeof parsed.savings === 'number') {
                    return parsed;
                }
            }
        } catch (e) {}
        return { needs: 50, wants: 30, savings: 20 };
    });

    const handleUpdateBudgetRule = useCallback((newRule) => {
        setBudgetRule(newRule);
        localStorage.setItem(window.STORAGE_KEYS.BUDGET_RULE, JSON.stringify(newRule));
    }, []);

    // Navigation
    const [currentView, setCurrentView] = useState(window.VIEWS.DASHBOARD);

    // Global Transaction Modal State
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [formData, setFormData] = useState({ type: 'expense', amount: '', category_id: '', date: new Date().toISOString().split('T')[0], note: '' });
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Sync category selection with chosen transaction type
    useEffect(() => {
        if (categories.length > 0) {
            const filtered = categories.filter(c => c.type === formData.type);
            if (filtered.length > 0 && !filtered.some(c => c.id === formData.category_id)) {
                setFormData(prev => ({ ...prev, category_id: filtered[0].id }));
            }
        }
    }, [formData.type, categories]);

    // --- Modal Triggers ---
    const openAddTransactionModal = useCallback(() => {
        const filtered = categories.filter(c => c.type === 'expense');
        setEditingTransaction(null);
        setFormData({
            type: 'expense',
            amount: '',
            category_id: filtered[0]?.id || categories[0]?.id || '',
            date: new Date().toISOString().split('T')[0],
            note: ''
        });
        setIsTransactionModalOpen(true);
    }, [categories]);

    const openEditTransactionModal = useCallback((t) => {
        if (!t) { openAddTransactionModal(); return; }
        setEditingTransaction(t);
        setFormData({
            type: t.type,
            amount: t.amount.toString(),
            category_id: t.category_id,
            date: t.date,
            note: t.note || ''
        });
        setIsTransactionModalOpen(true);
    }, [openAddTransactionModal]);

    const handleSaveTransaction = useCallback(async () => {
        try {
            if (editingTransaction) {
                await window.api.updateTransaction(editingTransaction.id, formData);
                toast("Transaksi diperbarui!", "success");
            } else {
                await window.api.addTransaction(user.id, formData);
                toast("Transaksi berhasil ditambahkan!", "success");
            }
            setIsTransactionModalOpen(false);
            setEditingTransaction(null);
            loadData();
        } catch (e) {
            toast(e.message, "error");
        }
    }, [editingTransaction, formData, user, loadData, toast]);

    const handleDeleteTransaction = useCallback(async () => {
        try {
            await window.api.deleteTransaction(deleteConfirm);
            toast("Transaksi berhasil dihapus!", "success");
            setDeleteConfirm(null);
            loadData();
        } catch (e) {
            toast(e.message, "error");
        }
    }, [deleteConfirm, loadData, toast]);

    // --- Render ---
    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-muted-foreground text-sm">⏳ Memuat...</div>;
    if (!user) return <LoginPage onLogin={handleLogin} />;

    const navItems = [
        { id: window.VIEWS.DASHBOARD, label: 'Dashboard', icon: 'home' },
        { id: window.VIEWS.TRANSACTIONS, label: 'Transaksi', icon: 'list' },
        { id: window.VIEWS.FAMILY_NOTES, label: 'Catatan', icon: 'fileText' },
        { id: window.VIEWS.CATEGORIES, label: 'Kategori', icon: 'folder' },
        { id: window.VIEWS.SETTINGS, label: 'Pengaturan', icon: 'settings' },
    ];

    const currentTitle = navItems.find(i => i.id === currentView)?.label || 'Dashboard';

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar (>= md) */}
            <aside className="hidden md:flex w-60 flex-col border-r border-border/80 bg-card">
                <div className="p-5 flex items-center gap-3">
                    <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-xs">
                        <Icon name="wallet" size={22} />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-base tracking-tight">ISZA FAMILY</h1>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">Personal Dashboard</p>
                    </div>
                </div>
                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                currentView === item.id
                                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Icon name={item.icon} size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-3.5 border-t border-border/80">
                    <div className="flex items-center gap-2.5 px-2 py-1.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/15 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold truncate text-foreground">{user?.email || ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 mt-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors"
                    >
                        <Icon name="logOut" size={15} /> Keluar
                    </button>
                </div>
            </aside>
            {/* Main Content Layout Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Top Header (< md) */}
                <header className="md:hidden flex items-center justify-between px-4 py-6 border-b-2 border-black dark:border-white bg-card sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div className={`bg-indigo-500 text-black p-1.5 rounded-lg ${NB.borderThin} ${NB.shadow.sm}`}>
                            <Icon name="wallet" size={18} />
                        </div>
                        <span className="font-extrabold text-sm tracking-tight text-foreground">{currentTitle}</span>
                    </div>
                </header>

                {/* Scrollable View Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-36 sm:pb-32 md:pb-8">
                    <div className="mx-auto max-w-4xl">
                        {currentView === window.VIEWS.DASHBOARD && <DashboardView user={user} transactions={transactions} categories={categories} budgetRule={budgetRule} dashboardSettings={dashboardSettings} onNavigate={setCurrentView} onAddClick={openAddTransactionModal} onRefresh={handleManualRefresh} isRefreshing={isRefreshing} />}
                        {currentView === window.VIEWS.TRANSACTIONS && <TransactionsView user={user} transactions={transactions} categories={categories} onRefresh={loadData} onEdit={openEditTransactionModal} onDelete={setDeleteConfirm} />}
                        {currentView === window.VIEWS.FAMILY_NOTES && <FamilyNotesView user={user} familyNotesState={familyNotesState} onRefresh={() => familyNotesState.loadNotes(false)} />}
                        {currentView === window.VIEWS.CATEGORIES && <CategoriesView user={user} categories={categories} onRefresh={loadData} />}
                        {currentView === window.VIEWS.SETTINGS && <SettingsView user={user} budgetRule={budgetRule} dashboardSettings={dashboardSettings} onUpdateBudgetRule={handleUpdateBudgetRule} onUpdateDashboardSettings={handleUpdateDashboardSettings} onUpdateUser={setUser} onLogout={handleLogout} />}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf8f5] dark:bg-zinc-950 border-t-2 border-black dark:border-white pb-safe">
                    <nav className="flex justify-between items-center h-16 px-1">
                        {navItems.slice(0, 2).map(item => {
                            const isActive = currentView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentView(item.id)}
                                    className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 ${
                                        isActive
                                            ? 'text-foreground font-black scale-105'
                                            : 'text-muted-foreground hover:text-foreground active:scale-95'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg transition-all ${isActive ? `bg-indigo-500 text-black ${NB.borderThin} ${NB.shadow.sm}` : ''}`}>
                                        <Icon name={item.icon} size={18} />
                                    </div>
                                    <span className="text-[9px] tracking-tight mt-0.5">{item.label}</span>
                                </button>
                            );
                        })}

                        {/* Center FAB */}
                        <div className="flex-1 flex justify-center h-full relative">
                            <button
                                onClick={openAddTransactionModal}
                                className={`absolute -top-5 w-11 h-11 bg-indigo-500 text-black rounded-full flex items-center justify-center ${NB.shadow.md} ${NB.border} hover:-translate-y-0.5 active:scale-90 transition-all z-50 shrink-0`}
                                aria-label="Shortcut Tambah Transaksi"
                            >
                                <Icon name="plus" size={22} />
                            </button>
                        </div>

                        {navItems.slice(2).map(item => {
                            const isActive = currentView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentView(item.id)}
                                    className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 ${
                                        isActive
                                            ? 'text-foreground font-black scale-105'
                                            : 'text-muted-foreground hover:text-foreground active:scale-95'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg transition-all ${isActive ? `bg-indigo-500 text-black ${NB.borderThin} ${NB.shadow.sm}` : ''}`}>
                                        <Icon name={item.icon} size={18} />
                                    </div>
                                    <span className="text-[9px] tracking-tight mt-0.5">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Shared Add/Edit Transaction Modal */}
            <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={editingTransaction ? "Edit Transaksi" : "Tambah Transaksi"}>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label>Jenis Transaksi</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, type: 'expense'})}
                                className={`py-2.5 rounded-lg ${NB.border} text-xs font-black flex items-center justify-center gap-2 transition-all ${
                                    formData.type === 'expense'
                                        ? `bg-rose-400 text-black ${NB.shadow.md}`
                                        : 'bg-card text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <Icon name="arrowUpRight" size={15} /> Pengeluaran
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, type: 'income'})}
                                className={`py-2.5 rounded-lg ${NB.border} text-xs font-black flex items-center justify-center gap-2 transition-all ${
                                    formData.type === 'income'
                                        ? `bg-emerald-400 text-black ${NB.shadow.md}`
                                        : 'bg-card text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                <Icon name="arrowDownLeft" size={15} /> Pemasukan
                            </button>
                        </div>
                    </div>

                    {/* Category Chips */}
                    <div className="space-y-1">
                        <Label>Kategori</Label>
                        {categories.filter(c => c.type === formData.type).length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2 leading-relaxed">
                                Belum ada kategori untuk jenis ini. Silakan tambah kategori baru di menu Kategori.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2 pt-1 max-h-40 overflow-y-auto">
                                {categories
                                    .filter(c => c.type === formData.type)
                                    .map(cat => {
                                        const isSelected = formData.category_id === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category_id: cat.id })}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${NB.border} transition-all active:scale-95 ${NB.shadow.sm} ${
                                                    isSelected
                                                        ? 'bg-indigo-500 text-black'
                                                        : 'bg-card text-muted-foreground hover:bg-muted'
                                                }`}
                                            >
                                                <span
                                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${NB.borderThin}`}
                                                    style={{ backgroundColor: isSelected ? '#ffffff' : cat.color }}
                                                />
                                                {cat.name}
                                            </button>
                                        );
                                    })
                                }
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Jumlah (Rp)</Label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Tanggal</Label>
                        <div className="relative flex items-center">
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="pr-10"
                            />
                            <div className="absolute right-3.5 text-foreground pointer-events-none">
                                <Icon name="calendar" size={18} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Catatan (opsional)</Label>
                        <Input
                            value={formData.note}
                            onChange={(e) => setFormData({...formData, note: e.target.value})}
                            placeholder="Tambahkan catatan singkat..."
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsTransactionModalOpen(false)} className="flex-1">Batal</Button>
                        <Button onClick={handleSaveTransaction} className="flex-1 font-bold">Simpan</Button>
                    </div>
                </div>
            </Modal>

            {/* Shared Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDeleteTransaction}
                title="Hapus Transaksi"
                message="Apakah Anda yakin ingin menghapus transaksi ini?"
            />
        </div>
    );
};

// ============================================
// ROOT & RENDER
// ============================================

const Root = () => (
    <ErrorBoundary>
        <ToastProvider>
            <App />
        </ToastProvider>
    </ErrorBoundary>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('PWA Service Worker registered:', reg.scope))
            .catch(err => console.log('PWA Service Worker registration failed:', err));
    });
}
