// ============================================
// SETTINGS VIEW — Clean, Streamlined & Focused
// ============================================

const { useState: _svUseState } = React;

window.SettingsView = React.memo(({ 
    user, 
    categories = [],
    dashboardSettings = { 
        period: '1_month', 
        customStartDate: '', 
        customEndDate: '', 
        categoryId: 'all', 
        sort: 'highest' 
    },
    onUpdateDashboardSettings,
    onUpdateUser, 
    onLogout 
}) => {
    const [newPin, setNewPin] = _svUseState('');
    const [currentTheme, setCurrentTheme] = _svUseState(user.theme || 'light');

    // Filter & Sort Settings State
    const [selectedPeriod, setSelectedPeriod] = _svUseState(dashboardSettings?.period || '1_month');
    const [customStartDate, setCustomStartDate] = _svUseState(dashboardSettings?.customStartDate || '');
    const [customEndDate, setCustomEndDate] = _svUseState(dashboardSettings?.customEndDate || '');
    const [selectedCategory, setSelectedCategory] = _svUseState(dashboardSettings?.categoryId || 'all');
    const [selectedSort, setSelectedSort] = _svUseState(dashboardSettings?.sort || 'highest');

    const toast = window.useToast();

    const handleSaveDashboardSettings = (overrides = {}) => {
        const period = overrides.period !== undefined ? overrides.period : selectedPeriod;
        const start = overrides.customStartDate !== undefined ? overrides.customStartDate : customStartDate;
        const end = overrides.customEndDate !== undefined ? overrides.customEndDate : customEndDate;
        const cat = overrides.categoryId !== undefined ? overrides.categoryId : selectedCategory;
        const sort = overrides.sort !== undefined ? overrides.sort : selectedSort;

        setSelectedPeriod(period);
        setCustomStartDate(start);
        setCustomEndDate(end);
        setSelectedCategory(cat);
        setSelectedSort(sort);

        if (onUpdateDashboardSettings) {
            onUpdateDashboardSettings({
                period,
                customStartDate: start,
                customEndDate: end,
                categoryId: cat,
                sort
            });
        }
        toast("Pengaturan filter & urutan dashboard tersimpan!", "success");
    };

    const handleChangePin = async () => {
        if (!validators.validatePin(newPin)) {
            toast("PIN harus 6 angka", "error");
            return;
        }
        try {
            await window.api.updateUserPreferences(user.id, { pin: newPin });
            toast("PIN berhasil diperbarui!", "success");
            setNewPin('');
        } catch (e) {
            toast(e.message, "error");
        }
    };

    const handleThemeChange = () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setCurrentTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        const updatedUser = { ...user, theme: newTheme };
        onUpdateUser(updatedUser);
        localStorage.setItem(window.STORAGE_KEYS.USER, JSON.stringify(updatedUser));

        window.api.updateUserPreferences(user.id, { theme: newTheme }).catch(e => toast(e.message, "error"));
    };

    const PERIOD_OPTIONS = [
        { id: '1_month', label: '📅 1 Bulan (Default)', desc: 'Rentang 30 hari / siklus bulan ini' },
        { id: 'custom', label: '🗓️ Rentang Tanggal', desc: 'Tentukan tanggal mulai dan selesai' },
        { id: '7days', label: '⚡ 7 Hari Terakhir', desc: 'Pantau belanja sepekan ini' },
        { id: 'today', label: '☀️ Hari Ini', desc: 'Fokus transaksi hari ini' },
        { id: 'all', label: '🌐 Semua Waktu', desc: 'Semua riwayat transaksi' }
    ];

    const SORT_OPTIONS = [
        { id: 'highest', label: '💰 Pengeluaran Terbesar (Default)' },
        { id: 'lowest', label: '📉 Pengeluaran Terkecil' },
        { id: 'name', label: '🔤 Nama Kategori (A-Z)' }
    ];

    return (
        <div className="space-y-4 max-w-xl mx-auto pb-16">
            {/* User Profile Card */}
            <Card className="p-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-black uppercase shrink-0 border-2 border-black dark:border-white">
                        {user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-sm truncate text-foreground">{user.email}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Sesi Aktif • Tracker Keluarga ISZA
                        </p>
                    </div>
                </div>
            </Card>

            {/* Dashboard Filter & Sort Settings Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Icon name="filter" size={14} /> Filter Rentang Waktu & Kategori</span>
                        <span className="text-[10px] font-black text-black px-2 py-0.5 rounded-md bg-indigo-400 border border-black dark:border-white">
                            Dashboard Setting
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-[11px] font-semibold text-muted-foreground leading-relaxed">
                        Atur filter default untuk rentang waktu, filter kategori, dan urutan pengeluaran di Dashboard.
                    </p>

                    {/* Rentang Waktu */}
                    <div className="space-y-2">
                        <Label className="text-xs font-black">Rentang Waktu</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PERIOD_OPTIONS.map(opt => {
                                const isSelected = selectedPeriod === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSaveDashboardSettings({ period: opt.id })}
                                        className={`p-2.5 rounded-xl border-2 text-left transition-all active:scale-95 ${
                                            isSelected
                                                ? `bg-indigo-500 text-black border-black dark:border-white ${NB.shadow.sm}`
                                                : `bg-card text-foreground border-black dark:border-zinc-800 hover:bg-muted`
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black">{opt.label}</span>
                                            {isSelected && <Icon name="check" size={14} />}
                                        </div>
                                        <p className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-black/80' : 'text-muted-foreground'}`}>
                                            {opt.desc}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Date Range Inputs if "custom" selected */}
                        {selectedPeriod === 'custom' && (
                            <div className="p-3 bg-muted/40 rounded-xl border-2 border-black dark:border-zinc-800 space-y-2 mt-2">
                                <p className="text-[11px] font-bold text-foreground">Pilih Rentang Tanggal:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-[10px] font-bold text-muted-foreground">Dari Tanggal</Label>
                                        <Input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => {
                                                setCustomStartDate(e.target.value);
                                                handleSaveDashboardSettings({ customStartDate: e.target.value });
                                            }}
                                            className="h-10 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-bold text-muted-foreground">Sampai Tanggal</Label>
                                        <Input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => {
                                                setCustomEndDate(e.target.value);
                                                handleSaveDashboardSettings({ customEndDate: e.target.value });
                                            }}
                                            className="h-10 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filter Kategori */}
                    <div className="space-y-1.5 pt-2 border-t border-border">
                        <Label className="text-xs font-black">Filter Kategori Khusus (Opsional)</Label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => handleSaveDashboardSettings({ categoryId: e.target.value })}
                            className="flex h-11 w-full rounded-lg border-2 border-black dark:border-white bg-white text-black font-extrabold px-3 py-2 text-xs transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                        >
                            <option value="all">🌐 Semua Kategori (Default)</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Urutan Kategori Pengeluaran */}
                    <div className="space-y-1.5 pt-2 border-t border-border">
                        <Label className="text-xs font-black">Urutan Kategori Pengeluaran (Default: Terbesar)</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {SORT_OPTIONS.map(opt => {
                                const isSelected = selectedSort === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSaveDashboardSettings({ sort: opt.id })}
                                        className={`p-2.5 rounded-lg border-2 text-xs font-black text-center transition-all active:scale-95 ${
                                            isSelected
                                                ? `bg-indigo-500 text-black border-black dark:border-white ${NB.shadow.sm}`
                                                : `bg-card text-foreground border-black dark:border-zinc-800 hover:bg-muted`
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preference Options Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Icon name="settings" size={14} /> Tampilan & Tema
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border-2 border-black dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-card rounded-lg border border-border/60">
                                <Icon name={currentTheme === 'light' ? 'sun' : 'moon'} size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-xs sm:text-sm">Mode Tampilan</p>
                                <p className="text-[11px] text-muted-foreground">{currentTheme === 'light' ? 'Mode Terang' : 'Mode Gelap'}</p>
                            </div>
                        </div>
                        <Button onClick={handleThemeChange} variant="outline" size="sm" className="font-bold">
                            Ubah
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Icon name="shield" size={14} /> Keamanan Akun
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="space-y-1">
                        <Label>Ubah PIN 6 Angka</Label>
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength="6"
                                placeholder="••••••"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                className="flex-1"
                            />
                            <Button onClick={handleChangePin} variant="secondary" className="font-bold shrink-0">
                                Perbarui
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logout Button */}
            <Card className="border-rose-500/20 bg-rose-500/5">
                <CardContent className="p-3.5">
                    <Button
                        onClick={onLogout}
                        variant="destructive"
                        className="w-full font-bold shadow-xs"
                    >
                        <Icon name="logOut" size={16} className="mr-2" /> Keluar
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
});
