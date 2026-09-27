// ============================================
// SETTINGS VIEW — Clean, Streamlined & Focused
// ============================================

const { useState: _svUseState } = React;

window.SettingsView = React.memo(({ 
    user, 
    onUpdateUser, 
    onLogout 
}) => {
    const [newPin, setNewPin] = _svUseState('');
    const [currentTheme, setCurrentTheme] = _svUseState(user.theme || 'light');
    const toast = window.useToast();

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

    return (
        <div className="space-y-4 max-w-xl mx-auto pb-16">
            {/* User Profile Card */}
            <Card className="p-4 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
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

            {/* Preference Options Card */}
            <Card className="border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
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
            <Card className="border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
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
