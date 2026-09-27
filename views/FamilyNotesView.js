// ============================================
// FAMILY NOTES VIEW — Catatan Keluarga & Maintenance Logbook
// ============================================

const { useState: _fnvUseState, useMemo: _fnvUseMemo, useCallback: _fnvUseCallback } = React;

window.FamilyNotesView = React.memo(({ user, familyNotesState, onRefresh }) => {
    const { notes, isLoading, addNote, updateNote, deleteNote } = familyNotesState;

    // Filters
    const [selectedCategory, setSelectedCategory] = _fnvUseState('all');
    const [searchQuery, setSearchQuery] = _fnvUseState('');
    const [statusFilter, setStatusFilter] = _fnvUseState('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = _fnvUseState(false);
    const [editingNote, setEditingNote] = _fnvUseState(null);
    const [deleteConfirmId, setDeleteConfirmId] = _fnvUseState(null);

    // Form state
    const [formData, setFormData] = _fnvUseState({
        title: '',
        category: 'Kendaraan',
        last_date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        cost: '',
        status: 'Selesai',
        notes: ''
    });

    const CATEGORIES = [
        { id: 'all', label: 'Semua', icon: 'list', color: 'bg-zinc-500' },
        { id: 'Kendaraan', label: 'Kendaraan', icon: 'car', color: 'bg-amber-500', tag: '🛵 Kendaraan' },
        { id: 'Rumah', label: 'Rumah & Properti', icon: 'home', color: 'bg-emerald-500', tag: '🏠 Rumah' },
        { id: 'Kesehatan', label: 'Kesehatan', icon: 'shield', color: 'bg-rose-500', tag: '🏥 Kesehatan' },
        { id: 'Dokumen', label: 'Dokumen & Legal', icon: 'fileText', color: 'bg-blue-500', tag: '📄 Dokumen' },
        { id: 'Lainnya', label: 'Lainnya', icon: 'tag', color: 'bg-purple-500', tag: '📝 Lainnya' },
    ];

    // Open Add Modal
    const handleOpenAdd = () => {
        setEditingNote(null);
        setFormData({
            title: '',
            category: selectedCategory !== 'all' ? selectedCategory : 'Kendaraan',
            last_date: new Date().toISOString().split('T')[0],
            next_due_date: '',
            cost: '',
            status: 'Selesai',
            notes: ''
        });
        setIsModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (note) => {
        setEditingNote(note);
        setFormData({
            title: note.title || '',
            category: note.category || 'Kendaraan',
            last_date: note.last_date ? String(note.last_date).slice(0, 10) : new Date().toISOString().split('T')[0],
            next_due_date: note.next_due_date ? String(note.next_due_date).slice(0, 10) : '',
            cost: note.cost ? String(note.cost) : '',
            status: note.status || 'Selesai',
            notes: note.notes || ''
        });
        setIsModalOpen(true);
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        if (editingNote) {
            await updateNote(editingNote.id, formData);
        } else {
            await addNote(formData);
        }
        setIsModalOpen(false);
        setEditingNote(null);
    };

    // Filtered Notes
    const filteredNotes = _fnvUseMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return (notes || []).filter(note => {
            // Category filter
            if (selectedCategory !== 'all' && note.category !== selectedCategory) {
                return false;
            }

            // Status filter
            if (statusFilter === 'due_soon') {
                if (!note.next_due_date) return false;
                const today = new Date();
                const due = new Date(note.next_due_date);
                const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                if (diffDays > 30) return false;
            } else if (statusFilter === 'completed') {
                if (note.status !== 'Selesai') return false;
            }

            // Search query
            if (query) {
                const titleMatch = (note.title || '').toLowerCase().includes(query);
                const notesMatch = (note.notes || '').toLowerCase().includes(query);
                const catMatch = (note.category || '').toLowerCase().includes(query);
                return titleMatch || notesMatch || catMatch;
            }

            return true;
        }).sort((a, b) => {
            // Urutkan berdasarkan tanggal reminder terdekat atau last_date terbaru
            const dateA = a.next_due_date || a.last_date || '';
            const dateB = b.next_due_date || b.last_date || '';
            return dateB.localeCompare(dateA);
        });
    }, [notes, selectedCategory, statusFilter, searchQuery]);

    // Summary Stats
    const stats = _fnvUseMemo(() => {
        const total = (notes || []).length;
        const totalCost = (notes || []).reduce((sum, n) => sum + (parseFloat(n.cost) || 0), 0);
        
        const today = new Date();
        const upcomingDue = (notes || []).filter(n => {
            if (!n.next_due_date) return false;
            const due = new Date(n.next_due_date);
            const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 30 && diffDays >= -15; // 30 hari ke depan atau lewat s/d 15 hari
        }).length;

        return { total, totalCost, upcomingDue };
    }, [notes]);

    // Due Date Helper
    const getDueBadge = (dueDateStr) => {
        if (!dueDateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDateStr);
        due.setHours(0, 0, 0, 0);

        const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <Icon name="alertCircle" size={12} />
                    Lewat {Math.abs(diffDays)} hari
                </span>
            );
        } else if (diffDays === 0) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                    <Icon name="clock" size={12} />
                    Jatuh Tempo Hari Ini
                </span>
            );
        } else if (diffDays <= 14) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Icon name="clock" size={12} />
                    {diffDays} hari lagi
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                    <Icon name="calendar" size={12} />
                    {diffDays} hari lagi
                </span>
            );
        }
    };

    return (
        <div className="space-y-4 max-w-4xl mx-auto pb-12">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-indigo-500 text-black border-2 border-black dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <Icon name="fileText" size={18} />
                        </span>
                        Catatan Keluarga
                    </h2>
                    <p className="text-xs text-muted-foreground font-bold mt-0.5">
                        Logbook servis kendaraan, perawatan rumah & agenda keluarga.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs transition-all active:scale-95 ${NB.shadow.sm} ${NB.border}`}
                    >
                        <Icon name="plus" size={15} />
                        <span>Tambah Catatan</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">
                        <Icon name="fileText" size={13} className="text-indigo-500" />
                        <span>Total Catatan</span>
                    </div>
                    <p className="text-lg font-black text-foreground mt-0.5">{stats.total}</p>
                </div>

                <div className="p-3 rounded-xl border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-wider">
                        <Icon name="clock" size={13} />
                        <span>Jadwal Dekat</span>
                    </div>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.upcomingDue} Jadwal</p>
                </div>

                <div className="p-3 rounded-xl border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                        <Icon name="wallet" size={13} />
                        <span>Total Biaya</span>
                    </div>
                    <p className="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                        {formatCurrency(stats.totalCost)}
                    </p>
                </div>
            </div>

            {/* Search & Category Filter Pills */}
            <div className="space-y-2.5">
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Icon name="search" size={15} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari catatan (cth: ganti oli, AC, Vario)..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl bg-card border-2 border-black dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none placeholder:text-muted-foreground text-foreground transition-all"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                        >
                            <Icon name="x" size={14} />
                        </button>
                    )}
                </div>

                {/* Category Horizontal Scroll */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                    {CATEGORIES.map(cat => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all border-2 border-black dark:border-zinc-800 flex items-center gap-1.5 active:scale-95 ${
                                    isSelected
                                        ? `bg-indigo-500 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none`
                                        : 'bg-card text-foreground hover:bg-muted/80'
                                }`}
                            >
                                <Icon name={cat.icon} size={13} />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Notes List Cards */}
            <div className="space-y-3">
                {filteredNotes.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border bg-card/50 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                            <Icon name="fileText" size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black text-foreground">Belum ada catatan</h4>
                            <p className="text-xs text-muted-foreground font-bold max-w-sm mx-auto">
                                Mulai catat perawatan motor, mobil, servis AC, atau agenda penting keluarga agar mudah dilacak.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleOpenAdd}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500 text-black font-black text-xs ${NB.border} ${NB.shadow.sm}`}
                        >
                            <Icon name="plus" size={14} />
                            <span>Buat Catatan Pertama</span>
                        </button>
                    </div>
                ) : (
                    filteredNotes.map(note => {
                        const catConfig = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[1];
                        return (
                            <div
                                key={note.id}
                                className="p-4 rounded-xl border-2 border-black dark:border-zinc-800 bg-card dark:bg-[#18181b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-none space-y-3 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                            >
                                {/* Top Header of Card */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-muted border border-border text-foreground">
                                                {catConfig.tag || note.category}
                                            </span>
                                            {getDueBadge(note.next_due_date)}
                                        </div>
                                        <h3 className="font-extrabold text-sm sm:text-base text-foreground leading-snug break-words">
                                            {note.title}
                                        </h3>
                                    </div>

                                    {/* Action Dropdown / Buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(note)}
                                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-all"
                                            title="Edit Catatan"
                                        >
                                            <Icon name="edit" size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteConfirmId(note.id)}
                                            className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-rose-500 transition-all"
                                            title="Hapus Catatan"
                                        >
                                            <Icon name="trash" size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Description / Detail */}
                                {note.notes && (
                                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed bg-muted/30 dark:bg-zinc-900/40 p-2.5 rounded-lg border border-border/40">
                                        {note.notes}
                                    </p>
                                )}

                                {/* Card Footer Stats (Dates & Cost) */}
                                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-3 text-muted-foreground font-bold text-[11px]">
                                        <span className="flex items-center gap-1">
                                            <Icon name="calendarCheck" size={13} className="text-indigo-500" />
                                            Terakhir: {formatDate(note.last_date)}
                                        </span>
                                        {note.next_due_date && (
                                            <span className="flex items-center gap-1">
                                                <Icon name="clock" size={13} className="text-amber-500" />
                                                Berikutnya: {formatDate(note.next_due_date)}
                                            </span>
                                        )}
                                    </div>

                                    {note.cost > 0 && (
                                        <span className="font-black text-xs text-foreground px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            Biaya: {formatCurrency(note.cost)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal: Tambah / Edit Catatan */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingNote ? 'Edit Catatan Keluarga' : 'Tambah Catatan Keluarga Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Judul */}
                    <div className="space-y-1">
                        <Label htmlFor="note-title">Judul / Kegiatan *</Label>
                        <Input
                            id="note-title"
                            type="text"
                            required
                            placeholder="Cth: Ganti Oli Mesin Vario 160, Cuci AC Kamar"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Kategori & Biaya */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="note-category">Kategori</Label>
                            <select
                                id="note-category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full h-11 px-3.5 text-xs font-black rounded-lg border-2 border-black dark:border-zinc-800 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Kendaraan">🛵 Kendaraan (Motor / Mobil)</option>
                                <option value="Rumah">🏠 Rumah & Elektronik</option>
                                <option value="Kesehatan">🏥 Kesehatan & Medis</option>
                                <option value="Dokumen">📄 Dokumen & Tagihan</option>
                                <option value="Lainnya">📝 Lainnya</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="note-cost">Biaya Pengeluaran (Rp)</Label>
                            <Input
                                id="note-cost"
                                type="number"
                                min="0"
                                placeholder="Cth: 85000"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Tanggal Terakhir & Jadwal Berikutnya */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="note-last-date">Tanggal Dilakukan *</Label>
                            <Input
                                id="note-last-date"
                                type="date"
                                required
                                value={formData.last_date}
                                onChange={(e) => setFormData({ ...formData, last_date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="note-due-date">Jadwal Berikutnya (Opsional)</Label>
                            <Input
                                id="note-due-date"
                                type="date"
                                value={formData.next_due_date}
                                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Catatan / Keterangan */}
                    <div className="space-y-1">
                        <Label htmlFor="note-desc">Keterangan / Detail Servis</Label>
                        <textarea
                            id="note-desc"
                            rows={3}
                            placeholder="Cth: Oli SPX2 10W-30, ganti di KM 15.000, bengkel AHASS Tambun..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-3 text-xs font-bold rounded-lg border-2 border-black dark:border-zinc-800 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Modal Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            size="sm"
                        >
                            {editingNote ? 'Simpan Perubahan' : 'Tambah Catatan'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="Hapus Catatan?"
            >
                <div className="space-y-4">
                    <p className="text-xs font-bold text-muted-foreground">
                        Apakah kamu yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmId(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                deleteNote(deleteConfirmId);
                                setDeleteConfirmId(null);
                            }}
                        >
                            Hapus
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
});
