// ============================================
// CATEGORIES VIEW
// ============================================

const { useState: _cvUseState } = React;

const PRESET_BADGE_COLORS = [
    '#ADFF2F', '#FF2A6D', '#05D9E8', '#FFC857', '#FF5E00',
    '#9D00FF', '#00FF87', '#3B82F6', '#FF0055', '#FACC15',
];

window.CategoriesView = React.memo(({ user, categories, onRefresh, onBack }) => {
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
            toast("Category name cannot be empty", "error");
            return;
        }

        // Prevent duplicate colors among active categories
        const isColorUsed = categories.some(cat => 
            cat.color.toLowerCase() === formData.color.toLowerCase() && 
            (!editingCategory || cat.id !== editingCategory.id)
        );
        if (isColorUsed) {
            toast("This color is already used by another category.", "error");
            return;
        }

        try {
            if (editingCategory) {
                await window.api.updateCategory(editingCategory.id, {
                    name: formData.name.trim(),
                    color: formData.color,
                    type: formData.type
                });
                toast("Category updated successfully.", "success");
            } else {
                await window.api.addCategory(user.id, formData.name.trim(), formData.color, formData.type);
                toast("Category added successfully.", "success");
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
            toast("Category deleted successfully.", "success");
            setDeleteConfirm(null);
            onRefresh();
        } catch (e) {
            toast(e.message, "error");
        }
    };

    return (
        <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Categories</h2>
                </div>
                {onBack && (
                    <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 font-medium">
                        <Icon name="arrowLeft" size={14} /> Back
                    </Button>
                )}
            </div>

            {/* Two Large Themed Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pemasukan Card */}
                <Card 
                    onClick={() => setActiveListType('income')} 
                    className="p-6 cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col justify-between min-h-[160px] rounded-2xl"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                            <Icon name="arrowDownLeft" size={24} />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                            {categories.filter(c => c.type === 'income').length} Items
                        </span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Income</h3>
                    </div>
                </Card>

                {/* Pengeluaran Card */}
                <Card 
                    onClick={() => setActiveListType('expense')} 
                    className="p-6 cursor-pointer hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 transition-all bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 flex flex-col justify-between min-h-[160px] rounded-2xl"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-xs">
                            <Icon name="arrowUpRight" size={24} />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/60">
                            {categories.filter(c => c.type === 'expense').length} Items
                        </span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Expense</h3>
                    </div>
                </Card>
            </div>

            {/* Modal List Kategori */}
            <Modal 
                isOpen={!!activeListType} 
                onClose={() => setActiveListType(null)} 
                title={activeListType === 'income' ? 'Income Categories' : 'Expense Categories'}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    <Button 
                        onClick={handleOpenAdd} 
                        variant="default" 
                        className="w-full font-bold shadow-sm"
                    >
                        <Icon name="plus" size={16} className="mr-1.5" /> New Category
                    </Button>

                    <div className="space-y-2">
                        {categories.filter(c => c.type === activeListType).length === 0 ? (
                            <p className="text-center text-xs text-muted-foreground py-6">No categories found for this type.</p>
                        ) : (
                            categories
                                .filter(c => c.type === activeListType)
                                .map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 text-xs font-bold" style={{ backgroundColor: cat.color }}>
                                                {cat.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenEdit(cat)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                                aria-label="Edit Category"
                                                title="Edit Category"
                                            >
                                                <Icon name="edit" size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(cat.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                aria-label="Delete Category"
                                                title="Delete Category"
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
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCategory(null); }} title={editingCategory ? "Edit Category" : "New Category"}>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label>Category Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Food, Salary, Transport"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Type</Label>
                        <Select
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            options={[
                                { value: 'expense', label: 'Expense' },
                                { value: 'income', label: 'Income' }
                            ]}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Badge Color</Label>
                        <div className="flex flex-wrap gap-2 py-1">
                            {PRESET_BADGE_COLORS.map(color => {
                                const isSelected = formData.color === color;
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({...formData, color})}
                                        className={`w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 transition-all active:scale-90 ${
                                            isSelected
                                                ? 'scale-110 ring-2 ring-blue-500'
                                                : 'hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingCategory(null); }} className="flex-1">Cancel</Button>
                        <Button onClick={handleSave} className="flex-1 font-semibold bg-blue-600 hover:bg-blue-700 text-white">{editingCategory ? "Save Changes" : "Create"}</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Delete Category"
                message="Are you sure you want to delete this category?"
            />
        </div>
    );
});
