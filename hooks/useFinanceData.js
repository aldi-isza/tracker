// ============================================
// useFinanceData — Data loading & CRUD operations (Optimized with Local Cache)
// ============================================

const { useState: _fdUseState, useEffect: _fdUseEffect, useCallback: _fdUseCallback } = React;

/**
 * Manage financial data loading, refreshing, and CRUD operations.
 * Optimized with LocalStorage caching for 0ms Perception / Stale-While-Revalidate.
 *
 * @param {Object|null} user - Current user object.
 * @param {Object} api - API object with getCategories, getTransactions, etc.
 * @param {Function} toast - Toast notification function.
 * @returns {{ transactions, categories, isRefreshing, loadData, handleManualRefresh }}
 */
window.useFinanceData = (user, api, toast) => {
    // 1. Inisialisasi awal dengan membaca langsung dari localStorage (0ms perceived latency)
    const [transactions, setTransactions] = _fdUseState(() => {
        try { return JSON.parse(localStorage.getItem('isza_tracker_txs_cache')) || []; } catch(e) { return []; }
    });
    const [categories, setCategories] = _fdUseState(() => {
        try { return JSON.parse(localStorage.getItem('isza_tracker_cats_cache')) || []; } catch(e) { return []; }
    });
    const [isRefreshing, setIsRefreshing] = _fdUseState(false);

    // 2. Fungsi Load Data Utama (Fetch dari Supabase -> Update UI -> Save ke Cache)
    const loadData = _fdUseCallback(async (silent = false) => {
        if (!user) return;
        
        // Hanya set status refreshing jika tidak sedang silent fetch background
        if (!silent) setIsRefreshing(true);
        
        try {
            const [cats, txs] = await Promise.all([
                api.getCategories(user.id),
                api.getTransactions(user.id)
            ]);
            
            // Render hasil terbaru
            setCategories(cats || []);
            setTransactions(txs || []);

            // Simpan ke Cache Lokal (Persist)
            localStorage.setItem('isza_tracker_cats_cache', JSON.stringify(cats || []));
            localStorage.setItem('isza_tracker_txs_cache', JSON.stringify(txs || []));
            
        } catch (error) {
            console.error('[loadData Error]', error);
        } finally {
            if (!silent) setIsRefreshing(false);
        }
    }, [user, api]);

    const handleManualRefresh = _fdUseCallback(async () => {
        if (isRefreshing || !user) return;
        setIsRefreshing(true); // Paksa show spinner untuk refresh manual
        try {
            await loadData(false);
            toast('Data tersinkronisasi!', 'success');
        } catch (e) {
            toast('Gagal menyinkronkan data', 'error');
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing, user, loadData, toast]);

    // 3. Auto-load Background saat aplikasi dibuka & user login (Silent Sync)
    _fdUseEffect(() => {
        if (user) {
            // Karena data sudah muncul di UI dari cache, kita sync ke cloud di background (silent=true)
            loadData(true); 
        } else {
            // Clear cache jika user logout
            setTransactions([]);
            setCategories([]);
            localStorage.removeItem('isza_tracker_txs_cache');
            localStorage.removeItem('isza_tracker_cats_cache');
        }
    }, [user, loadData]);

    return { transactions, categories, isRefreshing, loadData, handleManualRefresh };
};
