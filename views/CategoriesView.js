// ============================================
// CATEGORIES VIEW
// ============================================

const { useState: _cvUseState } = React;

const PRESET_BADGE_COLORS = [
    '#ADFF2F', '#FF2A6D', '#05D9E8', '#FFC857', '#FF5E00',
    '#9D00FF', '#00FF87', '#3B82F6', '#FF0055', '#FACC15',
];

window.CategoriesView = React.memo(({ user, categories, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = _cvUseState(false);
    const [activeListType, setActiveListType] = _cvUseState(null); // 'income' | 'expense' | null
    const [editingCategory, setEditingCategory] = _cvUseState(null);
    const [formData, setFormData] = _cvUseState({ name: '', color: '#ADFF2F', type: 'expense' });
    const [deleteConfirm, setDeleteConfirm] = _cvUseState(null);
    const toast = window.useToast();

    const handleOpenAdd = () => {
        setEditingCategory(null);
        setFormData({ name: '', color: '#ADFF2F', type: activeListType || 'expense' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cat) => {
        setEditingCategory(cat);
        setFormData({ name: cat.name, color: cat.color || '#ADFF2F', type: cat.type || 'expense' });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast("Nama kategori tidak boleh kosong", "error");
            return;
        }

        // Prevent duplicate colors among active categories
        const isColorUsed = categories.some(cat => 
            cat.color.toLowerCase() === formData.color.toLowerCase() && 
            (!editingCategory || cat.id !== editingCategory.id)
        );
        if (isColorUsed) {
            toast("Warna ini sudah digunakan oleh kategori lain. Silakan pilih warna yang berbeda!", "error");
            return;
        }

        try {
            if (editingCategory) {
                await window.api.updateCategory(editingCategory.id, {
                    name: formData.name.trim(),
                    color: formData.color,
                    type: formData.type
                });
                toast("Kategori berhasil diperbarui!", "success");
            } else {
                await window.api.addCategory(user.id, formData.name.trim(), formData.color, formData.type);
                toast("Kategori berhasil ditambahkan!", "success");
            }
            setIsModalOpen(false);
            setEditingCategory(null);
            setFormData({ name: '', color: '#ADFF2F', type: 'expense' });
            onRefresh();
        } catch (e) {
            toast(e.message, "error");
        }
    };

    const handleDelete = async () => {
        try {
            await window.api.deleteCategory(deleteConfirm);
            toast("Kategori berhasil dihapus!", "success");
            setDeleteConfirm(null);
            onRefresh();
        } catch (e) {
            toast(e.message, "error");
        }
    };

    return (
        <div className="space-y-4">
            {/* Header info */}
            <div className="px-1">
                <h2 className="text-base font-extrabold text-foreground">Kategori Keuangan</h2>
                <p className="text-xs text-muted-foreground font-semibold">Kelola kategori pemasukan dan pengeluaran Anda</p>
            </div>

            {/* Two Large Themed Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pemasukan Card */}
                <Card 
                    onClick={() => setActiveListType('income')} 
                    className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all bg-emerald-500/10 border-2 border-black dark:border-white flex flex-col justify-between min-h-[160px]"
                >
                    <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-emerald-400 text-black flex items-center justify-center ${NB.border} ${NB.shadow.sm}`}>
                            <Icon name="arrowDownLeft" size={24} />
                        </div>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Pemasukan</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-lg font-black text-foreground">Kategori Pemasukan</h3>
                        <p className="text-xs text-muted-foreground font-bold mt-1">
                            {categories.filter(c => c.type === 'income').length} Kategori terdaftar
                        </p>
                    </div>
                </Card>

                {/* Pengeluaran Card */}
                <Card 
                    onClick={() => setActiveListType('expense')} 
                    className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all bg-rose-500/10 border-2 border-black dark:border-white flex flex-col justify-between min-h-[160px]"
                >
                    <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-rose-400 text-black flex items-center justify-center ${NB.border} ${NB.shadow.sm}`}>
                            <Icon name="arrowUpRight" size={24} />
                        </div>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Pengeluaran</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-lg font-black text-foreground">Kategori Pengeluaran</h3>
                        <p className="text-xs text-muted-foreground font-bold mt-1">
                            {categories.filter(c => c.type === 'expense').length} Kategori terdaftar
                        </p>
                    </div>
                </Card>
            </div>

            {/* Modal List Kategori */}
            <Modal 
                isOpen={!!activeListType} 
                onClose={() => setActiveListType(null)} 
                title={`Daftar Kategori ${activeListType === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    <Button 
                        onClick={handleOpenAdd} 
                        variant="default" 
                        className="w-full font-bold shadow-sm"
                    >
                        <Icon name="plus" size={16} className="mr-1.5" /> Tambah Kategori Baru
                    </Button>

                    <div className="space-y-2">
                        {categories.filter(c => c.type === activeListType).length === 0 ? (
                            <p className="text-center text-xs text-muted-foreground py-6">Belum ada kategori untuk jenis ini.</p>
                        ) : (
                            categories
                                .filter(c => c.type === activeListType)
                                .map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-3.5 rounded-xl border-2 border-black dark:border-white bg-card">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full ${NB.border} flex items-center justify-center text-black text-xs font-black`} style={{ backgroundColor: cat.color }}>
                                                {cat.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-xs sm:text-sm text-foreground">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenEdit(cat)}
                                                className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-black dark:hover:border-white"
                                                aria-label="Edit Category"
                                                title="Edit Kategori"
                                            >
                                                <Icon name="edit" size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(cat.id)}
                                                className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-black dark:hover:border-white"
                                                aria-label="Delete Category"
                                                title="Hapus Kategori"
                                            >
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </Modal>

            {/* Modal Input Add / Edit */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCategory(null); }} title={editingCategory ? "Edit Kategori" : "Tambah Kategori"}>
                <div className="space-y-4 bg-card">
                    <div className="space-y-1">
                        <Label>Nama Kategori</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Contoh: Makanan, Gaji, Transport"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Jenis Kategori</Label>
                        <Select
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            options={[
                                { value: 'expense', label: 'Pengeluaran' },
                                { value: 'income', label: 'Pemasukan' }
                            ]}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Warna Badge</Label>
                        <div className="flex flex-wrap gap-2 py-1">
                            {PRESET_BADGE_COLORS.map(color => {
                                const isSelected = formData.color === color;
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({...formData, color})}
                                        className={`w-8 h-8 rounded-full ${NB.border} transition-all active:scale-90 ${NB.shadow.sm} ${
                                            isSelected
                                                ? 'scale-110 ring-2 ring-indigo-500'
                                                : 'hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground font-extrabold uppercase">Custom:</span>
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({...formData, color: e.target.value})}
                                className={`w-7 h-7 rounded-full ${NB.border} cursor-pointer p-0 overflow-hidden`}
                            />
                            <span className="text-xs font-mono text-muted-foreground">{formData.color}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingCategory(null); }} className="flex-1">Batal</Button>
                        <Button onClick={handleSave} className="flex-1 font-bold">{editingCategory ? "Simpan Perubahan" : "Tambah"}</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Hapus Kategori"
                message="Apakah Anda yakin ingin menghapus kategori ini?"
            />
        </div>
    );
});
