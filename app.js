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
    SESSION_TIMEOUT: 30 * 24 * 60 * 60 * 1000,
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
            const { data: fallbackUser, error: fallbackErr } = await supabase
                .from('users')
                .select('*')
                .limit(1)
                .maybeSingle();
            if (fallbackUser) {
                user = fallbackUser;
            } else if (queryError && (queryError.status === 401 || queryError.message?.includes('apiKey'))) {
                throw new Error('Koneksi Supabase Gagal (Harap Refresh Halaman)');
            } else if (queryError && queryError.message?.includes('Failed to fetch')) {
                throw new Error('Koneksi Internet/DNS Bermasalah (Gagal menghubungi Supabase)');
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
        if (filters.limit) query = query.limit(filters.limit);

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
            if (filters.limit) query = query.limit(filters.limit);
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
            if (error) {
                console.error('[api.addFamilyNote] Supabase error:', error);
                throw error;
            }
            return data;
        } catch (err) {
            console.error('[api.addFamilyNote] Failed to save to Supabase:', err);
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
    },

    // Planning (Rencana Anggaran & Transaksi)
    async getPlanning(userId) {
        try {
            const { data, error } = await supabase
                .from('planning')
                .select('*')
                .eq('user_id', userId)
                .is('is_deleted', false)
                .order('target_date', { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('[api.getPlanning] Notice (fallback to local):', err.message);
            return null;
        }
    },

    async addPlanning(userId, planData) {
        try {
            const payload = {
                user_id: userId,
                title: planData.title,
                type: planData.type || 'expense',
                amount: Math.abs(parseFloat(planData.amount) || 0),
                category_id: planData.category_id || null,
                target_date: planData.target_date,
                notes: planData.notes || '',
                is_realized: false
            };
            const { data, error } = await supabase
                .from('planning')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.warn('[api.addPlanning] Notice (saved locally):', err.message);
            return null;
        }
    },

    async updatePlanning(id, planData) {
        try {
            const updates = { ...planData, updated_at: new Date().toISOString() };
            const { data, error } = await supabase
                .from('planning')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.warn('[api.updatePlanning] Notice (updated locally):', err.message);
            return null;
        }
    },

    async deletePlanning(id) {
        try {
            const { error } = await supabase
                .from('planning')
                .update({ is_deleted: true })
                .eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.warn('[api.deletePlanning] Notice (deleted locally):', err.message);
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
    const { transactions, categories, isLoading, isRefreshing, loadData, handleManualRefresh } = useFinanceData(user, window.api, toast);

    // Family Notes Data (Hook for Catatan Keluarga)
    const familyNotesState = useFamilyNotes(user, window.api, toast);

    // Planning Data (Hook for Rencana & Realisasi)
    const planningState = usePlanning(user, window.api, toast, () => loadData(false));

    // Dashboard Filter & Sort Settings State
    const [dashboardSettings, setDashboardSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(window.STORAGE_KEYS.DASHBOARD_SETTINGS);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.period) return parsed;
            }
        } catch (e) {}
        return { period: '1_month', customStartDate: '', customEndDate: '', categoryId: 'all', sort: 'highest' };
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

    // AI Advisor Modal State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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

    const [isInSubpage, setIsInSubpage] = useState(false);

    // --- Render ---
    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-muted-foreground text-sm">⏳ Memuat...</div>;
    if (!user) return <LoginPage onLogin={handleLogin} />;

    const navItems = [
        { id: window.VIEWS.DASHBOARD, label: 'Dashboard', icon: 'home' },
        { id: window.VIEWS.TRANSACTIONS, label: 'Transactions', icon: 'list' },
        { id: window.VIEWS.FAMILY_NOTES, label: 'Notes', icon: 'fileText' },
        { id: window.VIEWS.SETTINGS, label: 'Settings', icon: 'settings' },
    ];

    const currentTitle = navItems.find(i => i.id === currentView)?.label || (currentView === window.VIEWS.CATEGORIES ? 'Categories' : 'Dashboard');

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar (>= md) */}
            {!isInSubpage && (
                <aside className="hidden md:flex w-64 flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
                    <div className="p-6 flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-sm">
                            <Icon name="wallet" size={20} />
                        </div>
                        <div>
                            <h1 className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">ISZA FAMILY</h1>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">FINANCE DASHBOARD</p>
                        </div>
                    </div>
                    <nav className="flex-1 px-3.5 space-y-1">
                        {navItems.map(item => {
                            const isActive = currentView === item.id || (item.id === window.VIEWS.SETTINGS && currentView === window.VIEWS.CATEGORIES);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentView(item.id)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon name={item.icon} size={17} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <button
                            type="button"
                            onClick={() => setIsAiModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-95 active:scale-98 transition-all"
                        >
                            <Icon name="sparkles" size={15} /> Isza AI Advisor
                        </button>
                        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-xs shrink-0">
                                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-medium truncate text-slate-900 dark:text-slate-200">{user?.email || ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                            <Icon name="logOut" size={15} /> Log Out
                        </button>
                    </div>
                </aside>
            )}
            {/* Main Content Layout Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Top Header (< md) */}
                {!isInSubpage && (
                    <header className="md:hidden flex items-center justify-between px-5 pt-safe pb-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl sticky top-0 z-30 transition-all">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-blue-600 text-white p-1.5 rounded-xl shadow-xs">
                                <Icon name="wallet" size={16} />
                            </div>
                            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">{currentTitle}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAiModalOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 text-xs font-semibold active:scale-95 transition-all shadow-xs"
                        >
                            <Icon name="sparkles" size={14} className="text-blue-600 dark:text-blue-400" />
                            <span>AI Advisor</span>
                        </button>
                    </header>
                )}

                {/* Scrollable View Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-32 sm:pb-28 md:pb-8">
                    <div className="mx-auto max-w-4xl">
                        {currentView === window.VIEWS.DASHBOARD && (
                            <DashboardView 
                                user={user} 
                                transactions={transactions} 
                                categories={categories} 
                                isLoading={isLoading}
                                dashboardSettings={dashboardSettings} 
                                familyNotesState={familyNotesState}
                                planningState={planningState}
                                onNavigate={setCurrentView} 
                                onAddClick={openAddTransactionModal} 
                                onRefresh={handleManualRefresh} 
                                isRefreshing={isRefreshing} 
                            />
                        )}
                        {currentView === window.VIEWS.TRANSACTIONS && (
                            <TransactionsView 
                                user={user} 
                                transactions={transactions} 
                                categories={categories} 
                                isLoading={isLoading}
                                onRefresh={loadData} 
                                onEdit={openEditTransactionModal} 
                                onDelete={setDeleteConfirm} 
                            />
                        )}
                        {currentView === window.VIEWS.FAMILY_NOTES && (
                            <FamilyNotesView 
                                user={user} 
                                familyNotesState={familyNotesState} 
                                planningState={planningState}
                                categories={categories}
                                onRefresh={() => {
                                    familyNotesState.loadNotes(false);
                                    loadData(false);
                                }} 
                                onSubpageToggle={setIsInSubpage}
                            />
                        )}
                        {currentView === window.VIEWS.CATEGORIES && (
                            <CategoriesView 
                                user={user} 
                                categories={categories} 
                                onRefresh={loadData} 
                                onBack={() => setCurrentView(window.VIEWS.SETTINGS)}
                            />
                        )}
                        {currentView === window.VIEWS.SETTINGS && (
                            <SettingsView 
                                user={user} 
                                onUpdateUser={setUser} 
                                onLogout={handleLogout} 
                                onManageCategories={() => setCurrentView(window.VIEWS.CATEGORIES)}
                                categoriesCount={categories.length}
                            />
                        )}
                    </div>
                </main>

                {/* Mobile Bottom Navigation (4 Tabs + Floating Action Button) */}
                {!isInSubpage && (
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 pb-safe">
                        <nav className="flex justify-between items-center h-16 px-3 relative">
                            {/* Tab 1: Dashboard */}
                            {(() => {
                                const item = navItems[0];
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentView(item.id)}
                                        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                                            isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : ''}`}>
                                            <Icon name={item.icon} size={20} />
                                        </div>
                                        <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                                    </button>
                                );
                            })()}

                            {/* Tab 2: Transaksi */}
                            {(() => {
                                const item = navItems[1];
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentView(item.id)}
                                        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                                            isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : ''}`}>
                                            <Icon name={item.icon} size={20} />
                                        </div>
                                        <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                                    </button>
                                );
                            })()}

                            {/* Center FAB */}
                            <div className="flex-1 flex justify-center h-full relative">
                                <button
                                    onClick={openAddTransactionModal}
                                    className="absolute -top-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all z-50 shrink-0 border-2 border-white dark:border-slate-900"
                                    aria-label="Shortcut Tambah Transaksi"
                                >
                                    <Icon name="plus" size={22} />
                                </button>
                            </div>

                            {/* Tab 3: Catatan */}
                            {(() => {
                                const item = navItems[2];
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentView(item.id)}
                                        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                                            isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : ''}`}>
                                            <Icon name={item.icon} size={20} />
                                        </div>
                                        <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                                    </button>
                                );
                            })()}

                            {/* Tab 4: Pengaturan */}
                            {(() => {
                                const item = navItems[3];
                                const isActive = currentView === item.id || currentView === window.VIEWS.CATEGORIES;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentView(item.id)}
                                        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                                            isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : ''}`}>
                                            <Icon name={item.icon} size={20} />
                                        </div>
                                        <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                                    </button>
                                );
                            })()}
                        </nav>
                    </div>
                )}
            </div>

            {/* Shared Add/Edit Transaction Modal */}
            <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={editingTransaction ? "Edit Transaction" : "New Transaction"}>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label>Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, type: 'expense'})}
                                className={`py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                                    formData.type === 'expense'
                                        ? 'bg-rose-500 text-white shadow-xs border-rose-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                                }`}
                            >
                                <Icon name="arrowUpRight" size={15} /> Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, type: 'income'})}
                                className={`py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                                    formData.type === 'income'
                                        ? 'bg-emerald-600 text-white shadow-xs border-emerald-700'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                                }`}
                            >
                                <Icon name="arrowDownLeft" size={15} /> Income
                            </button>
                        </div>
                    </div>

                    {/* Category Chips */}
                    <div className="space-y-1">
                        <Label>Category</Label>
                        {categories.filter(c => c.type === formData.type).length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2 leading-relaxed">
                                No categories available for this type.
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
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                                }`}
                                            >
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
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
                        <Label>Amount</Label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Date</Label>
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
                        <Label>Note</Label>
                        <Input
                            value={formData.note}
                            onChange={(e) => setFormData({...formData, note: e.target.value})}
                            placeholder="Optional note"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsTransactionModalOpen(false)} className="flex-1">Cancel</Button>
                        <Button onClick={handleSaveTransaction} className="flex-1 font-medium bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
                    </div>
                </div>
            </Modal>

            {/* AI Advisor Modal */}
            <AiAdvisorModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                financialData={{
                    transactions,
                    categories,
                    planning: planningState?.planningList || [],
                    familyNotes: familyNotesState?.notes || [],
                    user
                }}
            />

            {/* Shared Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDeleteTransaction}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction?"
                confirmText="Delete"
                cancelText="Cancel"
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

// Register PWA Service Worker with forced update
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('PWA Service Worker registered:', reg.scope);
                // Force check for update immediately
                reg.update();
            })
            .catch(err => console.log('PWA Service Worker registration failed:', err));
        
        // Listen for new SW and auto-activate
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('New Service Worker activated — reloading for fresh cache.');
            window.location.reload();
        });
    });
}
