// ============================================
// usePlanning — Data hook for Planning & Realisasi (CRUD + Cache)
// ============================================

const { useState: _plUseState, useEffect: _plUseEffect, useCallback: _plUseCallback } = React;

window.usePlanning = (user, api, toast, onTransactionAdded) => {
    const [planningList, setPlanningList] = _plUseState(() => {
        try {
            const cached = localStorage.getItem('isza_tracker_planning_cache');
            if (cached !== null) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch(e) {}
        return [];
    });

    const [isLoading, setIsLoading] = _plUseState(() => {
        try {
            const cached = localStorage.getItem('isza_tracker_planning_cache');
            return !cached;
        } catch(e) { return true; }
    });

    // Load data from Supabase with LocalStorage fallback
    const loadPlanning = _plUseCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setIsLoading(true);

        try {
            if (api && api.getPlanning) {
                const remote = await api.getPlanning(user.id);
                if (remote && Array.isArray(remote)) {
                    setPlanningList(remote);
                    localStorage.setItem('isza_tracker_planning_cache', JSON.stringify(remote));
                }
            }
        } catch (err) {
            console.warn('[usePlanning] Fetch remote fallback to cache:', err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user, api]);

    // Save initial load
    _plUseEffect(() => {
        if (user) {
            const hasCache = planningList.length > 0;
            loadPlanning(hasCache);
        } else {
            setPlanningList([]);
            localStorage.removeItem('isza_tracker_planning_cache');
        }
    }, [user, loadPlanning]);

    // Add Planning
    const addPlanning = _plUseCallback(async (data) => {
        if (!user) return;
        const newPlan = {
            id: 'plan-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            user_id: user.id,
            title: data.title || 'Rencana Baru',
            type: data.type || 'expense',
            amount: parseFloat(data.amount) || 0,
            category_id: data.category_id || null,
            category_name: data.category_name || '',
            target_date: data.target_date || new Date().toISOString().split('T')[0],
            notes: data.notes || '',
            is_realized: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Optimistic UI Update
        const updated = [newPlan, ...planningList];
        setPlanningList(updated);
        localStorage.setItem('isza_tracker_planning_cache', JSON.stringify(updated));

        // Sync to Supabase
        if (api && api.addPlanning) {
            try {
                const res = await api.addPlanning(user.id, newPlan);
                if (res && res.id) {
                    const synced = updated.map(p => p.id === newPlan.id ? res : p);
                    setPlanningList(synced);
                    localStorage.setItem('isza_tracker_planning_cache', JSON.stringify(synced));
                }
            } catch (err) {
                console.warn('[usePlanning.addPlanning] Supabase sync deferred:', err.message);
            }
        }

        if (toast) toast('Rencana berhasil ditambahkan!', 'success');
        return newPlan;
    }, [user, planningList, api, toast]);

    // Update Planning
    const updatePlanning = _plUseCallback(async (id, data) => {
        if (!user) return;
        const updated = planningList.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    ...data,
                    amount: data.amount !== undefined ? parseFloat(data.amount) : item.amount,
                    updated_at: new Date().toISOString()
                };
            }
            return item;
        });

        setPlanningList(updated);
        localStorage.setItem('isza_tracker_planning_cache', JSON.stringify(updated));

        if (api && api.updatePlanning) {
            try {
                await api.updatePlanning(id, data);
            } catch (err) {
                console.warn('[usePlanning.updatePlanning] Supabase sync deferred:', err.message);
            }
        }

        if (toast) toast('Rencana berhasil diperbarui!', 'success');
    }, [user, planningList, api, toast]);

    // Delete Planning
    const deletePlanning = _plUseCallback(async (id) => {
        if (!user) return;
        const updated = planningList.filter(item => item.id !== id);
        setPlanningList(updated);
        localStorage.setItem('isza_tracker_planning_cache', JSON.stringify(updated));

        if (api && api.deletePlanning) {
            try {
                await api.deletePlanning(id);
            } catch (err) {
                console.warn('[usePlanning.deletePlanning] Supabase sync deferred:', err.message);
            }
        }

        if (toast) toast('Rencana berhasil dihapus!', 'info');
    }, [user, planningList, api, toast]);

    // Realize Planning -> Auto insert into Transactions DB conditionally
    const realizePlanning = _plUseCallback(async (plan, customData = {}) => {
        if (!user || !plan) return;

        const realizedAmount = customData.amount !== undefined ? parseFloat(customData.amount) : parseFloat(plan.amount);
        const realizedDate = customData.date || new Date().toISOString().split('T')[0];
        const realizedCategory = customData.category_id || plan.category_id;
        const realizedType = customData.type || plan.type || 'expense';
        const realizedDescription = customData.description || `[Realisasi] ${plan.title}`;

        try {
            let createdTx = null;

            // 1. Insert transaction into Supabase Transactions DB if category is provided
            if (api && api.addTransaction && realizedCategory) {
                try {
                    createdTx = await api.addTransaction(user.id, {
                        type: realizedType,
                        amount: realizedAmount,
                        category_id: realizedCategory,
                        date: realizedDate,
                        note: realizedDescription
                    });
                } catch (txErr) {
                    console.warn('[usePlanning.realize] addTransaction warning:', txErr.message);
                }
            }

            // 2. Mark Planning as Realized locally
            const updated = planningList.map(item => {
                if (item.id === plan.id) {
                    return {
                        ...item,
                        is_realized: true,
                        realized_at: new Date().toISOString(),
                        realized_transaction_id: createdTx?.id || ('tx-local-' + Date.now()),
                        updated_at: new Date().toISOString()
                    };
                }
                return item;
            });

            setPlanningList(updated);
            localStorage.setItem('isza_tracker_planning_cache', JSON.stringify(updated));

            // 3. Update in Supabase planning table
            if (api && api.updatePlanning) {
                await api.updatePlanning(plan.id, {
                    is_realized: true,
                    realized_at: new Date().toISOString(),
                    realized_transaction_id: createdTx?.id || null
                });
            }

            // 4. Trigger Finance Data reload so balance & transactions update instantly
            if (onTransactionAdded) {
                onTransactionAdded();
            }

            if (toast) {
                toast(`Rencana "${plan.title}" berhasil direalisasikan!`, 'success');
            }
            return true;
        } catch (err) {
            console.error('[usePlanning.realizePlanning Error]', err);
            if (toast) toast('Gagal merealisasikan rencana: ' + err.message, 'error');
            return false;
        }
    }, [user, planningList, api, toast, onTransactionAdded]);

    return {
        planningList,
        isLoading,
        loadPlanning,
        addPlanning,
        updatePlanning,
        deletePlanning,
        realizePlanning
    };
};
