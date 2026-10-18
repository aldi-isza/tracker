// ============================================
// SETTINGS VIEW — Clean, Streamlined & Focused
// ============================================

const { useState: _svUseState } = React;

window.SettingsView = React.memo(({ 
    user, 
    onUpdateUser, 
    onLogout,
    onManageCategories,
    categoriesCount = 0
}) => {
    const [newPin, setNewPin] = _svUseState('');
    const [currentTheme, setCurrentTheme] = _svUseState(user.theme || 'light');
    const [geminiKey, setGeminiKey] = _svUseState(() => window.geminiService ? window.geminiService.getApiKey() : '');
    const [showKey, setShowKey] = _svUseState(false);
    const toast = window.useToast();

    const handleSaveGeminiKey = () => {
        if (window.geminiService) {
            window.geminiService.setApiKey(geminiKey);
            toast(geminiKey.trim() ? "Google AI Studio API Key saved." : "API Key removed.", "success");
        }
    };

    const handleChangePin = async () => {
        if (!validators.validatePin(newPin)) {
            toast("PIN must be 6 digits", "error");
            return;
        }
        try {
            await window.api.updateUserPreferences(user.id, { pin: newPin });
            toast("PIN updated successfully!", "success");
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
            <Card className="p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold uppercase shrink-0 border border-blue-100 dark:border-blue-900/50">
                        {user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate text-slate-900 dark:text-white">{user.email}</h3>
                    </div>
                </div>
            </Card>

            {/* Categories Navigation Card */}
            {onManageCategories && (
                <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div 
                        onClick={onManageCategories}
                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/60 dark:border-blue-900/30">
                                <Icon name="folder" size={18} />
                            </div>
                            <div>
                                <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">Categories</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Icon name="chevronRight" size={16} />
                        </div>
                    </div>
                </Card>
            )}

            {/* Google AI Studio API Key Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Icon name="sparkles" size={14} className="text-blue-500" /> Google AI Studio
                        </span>
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-blue-500 hover:underline font-medium flex items-center gap-1"
                        >
                            Get Key <Icon name="arrowUpRight" size={10} />
                        </a>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="space-y-1.5">
                        <Label>API Key</Label>
                        <div className="flex gap-2">
                            <Input
                                type={showKey ? "text" : "password"}
                                placeholder="AQ.Ab8... / AIzaSy..."
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                className="flex-1 font-mono text-xs"
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setShowKey(!showKey)} 
                                className="shrink-0 text-slate-500 px-2.5"
                                title={showKey ? "Hide" : "Show"}
                            >
                                <Icon name={showKey ? "eyeOff" : "sparkles"} size={14} />
                            </Button>
                            <Button onClick={handleSaveGeminiKey} variant="secondary" className="font-medium shrink-0">
                                Save
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preference Options Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <Icon name="settings" size={14} /> Theme
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-xs">
                                <Icon name={currentTheme === 'light' ? 'sun' : 'moon'} size={16} />
                            </div>
                            <div>
                                <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">{currentTheme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
                            </div>
                        </div>
                        <Button onClick={handleThemeChange} variant="outline" size="sm" className="font-medium">
                            Toggle
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <Icon name="shield" size={14} /> Security
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="space-y-1.5">
                        <Label>Change PIN</Label>
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
                            <Button onClick={handleChangePin} variant="secondary" className="font-medium shrink-0">
                                Update
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logout Button */}
            <Card className="border-rose-100 dark:border-rose-950/40 bg-rose-50/30 dark:bg-rose-950/10">
                <CardContent className="p-3.5">
                    <Button
                        onClick={onLogout}
                        variant="destructive"
                        className="w-full font-medium shadow-xs"
                    >
                        <Icon name="logOut" size={16} className="mr-2" /> Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
});
