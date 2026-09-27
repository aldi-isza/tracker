// ============================================
// useFamilyNotes — Data hook for Catatan Keluarga (CRUD + Cache)
// ============================================

const { useState: _fnUseState, useEffect: _fnUseEffect, useCallback: _fnUseCallback } = React;

const FAMILY_NOTES_STORAGE_KEY = 'isza_family_notes_cache';

// Seed sample notes if completely empty for first-time onboarding
const DEFAULT_SAMPLE_NOTES = [
    {
        id: 'sample-1',
        title: 'Ganti Oli Mesin & Gardan Motor Vario',
        category: 'Kendaraan',
        last_date: new Date().toISOString().split('T')[0],
        next_due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: 85000,
        status: 'Selesai',
        notes: 'Oli SPX2 10W-30 + Oli Gardan di Bengkel Resmi AHASS. KM 12.500.'
    },
    {
        id: 'sample-2',
        title: 'Servis & Cuci AC Kamar Utama',
        category: 'Rumah',
        last_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        next_due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: 75000,
        status: 'Selesai',
        notes: 'Cuci filter dan cek tekanan freon (Tekanan normal 140 psi).'
    }
];

window.useFamilyNotes = (user, api, toast) => {
    // 1. Initial State from localStorage (0ms perceived latency)
    const [notes, setNotes] = _fnUseState(() => {
        try {
            const cached = localStorage.getItem(FAMILY_NOTES_STORAGE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return DEFAULT_SAMPLE_NOTES;
    });

    const [isLoading, setIsLoading] = _fnUseState(false);

    // 2. Fetch / Sync from Supabase
    const loadNotes = _fnUseCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setIsLoading(true);

        try {
            if (api && api.getFamilyNotes) {
                const remoteData = await api.getFamilyNotes(user.id);
                if (Array.isArray(remoteData) && remoteData.length > 0) {
                    setNotes(remoteData);
                    localStorage.setItem(FAMILY_NOTES_STORAGE_KEY, JSON.stringify(remoteData));
                }
            }
        } catch (err) {
            console.warn('[useFamilyNotes] Supabase sync notice (using local cache):', err.message);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [user, api]);

    useEffect(() => {
        if (user) {
            loadNotes(true);
        }
    }, [user, loadNotes]);

    // Save helper to persist to localStorage & state
    const persistNotes = _fnUseCallback((newNotes) => {
        setNotes(newNotes);
        try {
            localStorage.setItem(FAMILY_NOTES_STORAGE_KEY, JSON.stringify(newNotes));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }, []);

    // 3. Add Note
    const addNote = _fnUseCallback(async (noteData) => {
        const newId = 'fn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newRecord = {
            id: newId,
            user_id: user?.id,
            title: noteData.title.trim(),
            category: noteData.category || 'Kendaraan',
            last_date: noteData.last_date || new Date().toISOString().split('T')[0],
            next_due_date: noteData.next_due_date || null,
            cost: parseFloat(noteData.cost || 0),
            status: noteData.status || 'Selesai',
            notes: (noteData.notes || '').trim(),
            created_at: new Date().toISOString()
        };

        // Optimistic UI update
        const updated = [newRecord, ...notes];
        persistNotes(updated);

        // Try syncing to Supabase if available
        if (api && api.addFamilyNote && user?.id) {
            try {
                const remote = await api.addFamilyNote(user.id, newRecord);
                if (remote && remote.id) {
                    // Update the local placeholder ID with remote ID if returned
                    const synced = updated.map(n => n.id === newId ? remote : n);
                    persistNotes(synced);
                }
            } catch (err) {
                console.warn('[addNote] Saved locally. Remote error:', err.message);
            }
        }

        if (toast) toast('Catatan berhasil ditambahkan!', 'success');
        return newRecord;
    }, [notes, user, api, persistNotes, toast]);

    // 4. Update Note
    const updateNote = _fnUseCallback(async (id, noteData) => {
        const updatedRecord = {
            ...noteData,
            title: (noteData.title || '').trim(),
            cost: parseFloat(noteData.cost || 0),
            notes: (noteData.notes || '').trim(),
            updated_at: new Date().toISOString()
        };

        const updated = notes.map(n => n.id === id ? { ...n, ...updatedRecord } : n);
        persistNotes(updated);

        if (api && api.updateFamilyNote) {
            try {
                await api.updateFamilyNote(id, updatedRecord);
            } catch (err) {
                console.warn('[updateNote] Updated locally. Remote error:', err.message);
            }
        }

        if (toast) toast('Catatan berhasil diperbarui!', 'success');
    }, [notes, api, persistNotes, toast]);

    // 5. Delete Note
    const deleteNote = _fnUseCallback(async (id) => {
        const updated = notes.filter(n => n.id !== id);
        persistNotes(updated);

        if (api && api.deleteFamilyNote) {
            try {
                await api.deleteFamilyNote(id);
            } catch (err) {
                console.warn('[deleteNote] Deleted locally. Remote error:', err.message);
            }
        }

        if (toast) toast('Catatan telah dihapus!', 'success');
    }, [notes, api, persistNotes, toast]);

    return {
        notes,
        isLoading,
        loadNotes,
        addNote,
        updateNote,
        deleteNote
    };
};
