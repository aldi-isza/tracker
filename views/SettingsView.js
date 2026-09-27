// ============================================
// SETTINGS VIEW
// ============================================

const { useState: _svUseState } = React;

window.SettingsView = React.memo(({ 
    user, 
    budgetRule = { needs: 50, wants: 30, savings: 20 }, 
    dashboardSettings = { period: 'this_month', sort: 'highest' },
    onUpdateBudgetRule, 
    onUpdateDashboardSettings,
    onUpdateUser, 
    onLogout 
}) => {
    const [newPin, setNewPin] = _svUseState('');
    const [currentTheme, setCurrentTheme] = _svUseState(user.theme || 'light');

    // Budget Rule State
    const [ruleNeeds, setRuleNeeds] = _svUseState(budgetRule.needs);
    const [ruleWants, setRuleWants] = _svUseState(budgetRule.wants);
    const [ruleSavings, setRuleSavings] = _svUseState(budgetRule.savings);

    // Filter & Sort Settings State
    const [selectedPeriod, setSelectedPeriod] = _svUseState(dashboardSettings?.period || 'this_month');
    const [selectedSort, setSelectedSort] = _svUseState(dashboardSettings?.sort || 'highest');

    const toast = window.useToast();

    const ruleTotal = Number(ruleNeeds || 0) + Number(ruleWants || 0) + Number(ruleSavings || 0);

    const handleSaveBudgetRule = () => {
        const n = Number(ruleNeeds);
        const w = Number(ruleWants);
        const s = Number(ruleSavings);

        if (isNaN(n) || isNaN(w) || isNaN(s) || n < 0 || w < 0 || s < 0) {
            toast("Persentase harus berupa angka positif", "error");
            return;
        }
        if (n + w + s !== 100) {
            toast(`Total alokasi harus pas 100% (saat ini ${n + w + s}%)`, "error");
            return;
        }
        onUpdateBudgetRule({ needs: n, wants: w, savings: s });
        toast("Alokasi anggaran berhasil disimpan!", "success");
    };

    const applyPreset = (n, w, s) => {
        setRuleNeeds(n);
        setRuleWants(w);
        setRuleSavings(s);
    };

    const handleSaveDashboardSettings = (newPeriod, newSort) => {
        const period = newPeriod !== undefined ? newPeriod : selectedPeriod;
        const sort = newSort !== undefined ? newSort : selectedSort;
        setSelectedPeriod(period);
        setSelectedSort(sort);
        if (onUpdateDashboardSettings) {
            onUpdateDashboardSettings({ period, sort });
        }
        toast("Pengaturan filter & tampilan dashboard diperbarui!", "success");
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

    const BUDGET_PRESETS = [
        { label: '50/30/20 (Standar)', n: 50, w: 30, s: 20 },
        { label: '60/20/20 (Hemat)', n: 60, w: 20, s: 20 },
        { label: '70/20/10 (Dasar)', n: 70, w: 20, s: 10 },
        { label: '40/30/30 (Saver)', n: 40, w: 30, s: 30 },
    ];

    const PERIOD_OPTIONS = [
        { id: 'this_month', label: 'Bulan Ini', desc: 'Siklus bulan berjalan (Rekomendasi)' },
        { id: '30days', label: '30 Hari Terakhir', desc: 'Rentang 30 hari ke belakang' },
        { id: '7days', label: '7 Hari Terakhir', desc: 'Pantau belanja sepekan ini' },
        { id: 'today', label: 'Hari Ini', desc: 'Fokus transaksi harian' },
        { id: 'last_month', label: 'Bulan Lalu', desc: 'Evaluasi bulan sebelumnya' },
        { id: 'all', label: 'Semua Waktu', desc: 'Akumulasi total keseluruhan' }
    ];

    const SORT_OPTIONS = [
        { id: 'highest', label: '💰 Pengeluaran Terbesar' },
        { id: 'lowest', label: '📉 Pengeluaran Terkecil' },
        { id: 'name', label: '🔤 Nama Kategori (A-Z)' }
    ];

    return (
        <div className="space-y-3.5 max-w-xl mx-auto pb-12">
            {/* User Profile Card */}
            <Card className="p-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-black uppercase shrink-0">
                        {user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm truncate text-foreground">{user.email}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Login: {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('id-ID') : 'Hari ini'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Dashboard Filter & Sort Settings Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Icon name="filter" size={14} /> Filter & Sort Dashboard</span>
                        <span className="text-[10px] font-black text-black px-2 py-0.5 rounded-md bg-indigo-500 border border-black dark:border-white">
                            Aktif
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                        Atur periode waktu dan urutan data default untuk tampilan Dashboard tanpa popup yang mengganggu.
                    </p>

                    {/* Periode Default */}
                    <div className="space-y-1.5">
                        <Label>Periode Waktu Dashboard</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {PERIOD_OPTIONS.map(opt => {
                                const isSelected = selectedPeriod === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSaveDashboardSettings(opt.id, selectedSort)}
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
                                        <p className={`text-[10px] font-semibold mt-0.5 line-clamp-1 ${isSelected ? 'text-black/80' : 'text-muted-foreground'}`}>
                                            {opt.desc}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Urutan Kategori */}
                    <div className="space-y-1.5 pt-2 border-t border-border">
                        <Label>Urutan Kategori Pengeluaran</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {SORT_OPTIONS.map(opt => {
                                const isSelected = selectedSort === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSaveDashboardSettings(selectedPeriod, opt.id)}
                                        className={`p-2 rounded-lg border-2 text-xs font-black text-center transition-all active:scale-95 ${
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

            {/* Budget Allocation Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Icon name="pieChart" size={14} /> Alokasi Anggaran Bulanan</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${NB.borderThin} ${
                            ruleTotal === 100 ? 'bg-emerald-400 text-black' : 'bg-rose-400 text-black'
                        }`}>
                            Total: {ruleTotal}%
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                        Atur persentase pembagian budget bulanan untuk evaluasi belanja dan motivasi tabungan.
                    </p>

                    {/* Preset Buttons */}
                    <div className="space-y-1.5">
                        <Label>Preset Populer</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {BUDGET_PRESETS.map(p => (
                                <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => applyPreset(p.n, p.w, p.s)}
                                    className={`p-1.5 rounded-lg ${NB.border} text-[10px] font-black transition-all active:scale-95 text-center ${
                                        Number(ruleNeeds) === p.n && Number(ruleWants) === p.w && Number(ruleSavings) === p.s
                                            ? `bg-indigo-500 text-black ${NB.shadow.md}`
                                            : 'bg-muted/40 hover:bg-muted text-foreground'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <div className="flex flex-col items-center min-w-0">
                            <Label className="text-[9px] sm:text-[10px] text-center truncate w-full mb-1">🏢 Primer</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={ruleNeeds} 
                                onChange={(e) => setRuleNeeds(e.target.value)} 
                                className="text-center font-black px-1 text-xs sm:text-sm h-9 sm:h-11" 
                            />
                        </div>
                        <div className="flex flex-col items-center min-w-0">
                            <Label className="text-[9px] sm:text-[10px] text-center truncate w-full mb-1">☕ Keinginan</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={ruleWants} 
                                onChange={(e) => setRuleWants(e.target.value)} 
                                className="text-center font-black px-1 text-xs sm:text-sm h-9 sm:h-11" 
                            />
                        </div>
                        <div className="flex flex-col items-center min-w-0">
                            <Label className="text-[9px] sm:text-[10px] text-center truncate w-full mb-1">💰 Tabungan</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={ruleSavings} 
                                onChange={(e) => setRuleSavings(e.target.value)} 
                                className="text-center font-black px-1 text-xs sm:text-sm h-9 sm:h-11" 
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveBudgetRule}
                        variant="default"
                        className="w-full font-black text-xs"
                        disabled={ruleTotal !== 100}
                    >
                        Simpan Alokasi Anggaran
                    </Button>
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
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
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
