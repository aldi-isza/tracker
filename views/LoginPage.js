// ============================================
// LOGIN PAGE VIEW (Cached & Instant Responsive)
// ============================================

const { useState: _lpUseState, useCallback: _lpUseCallback, useEffect: _lpUseEffect } = React;

window.LoginPage = ({ onLogin }) => {
    const email = 'isza@family.id';
    const [pin, setPin] = _lpUseState('');
    const [loading, setLoading] = _lpUseState(false);
    const [rememberDevice, setRememberDevice] = _lpUseState(true);
    const toast = window.useToast();

    const submitWithPin = _lpUseCallback(async (targetPin) => {
        if (!validators.validatePin(targetPin)) {
            toast("PIN must be 6 digits", "error");
            return;
        }

        setLoading(true);
        try {
            const user = await window.api.login(email, targetPin);
            // Simpan status remember device
            localStorage.setItem('isza_remember_device', rememberDevice ? 'true' : 'false');
            onLogin(user);
            toast("Welcome to ISZA FAMILY", "success");
        } catch (error) {
            const errorCode = error.message;
            const userMessage = getErrorMessage(errorCode);
            toast(userMessage, "error");
            setPin(''); // Reset PIN on error
        } finally {
            setLoading(false);
        }
    }, [email, rememberDevice, onLogin, toast]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        submitWithPin(pin);
    };

    const handlePinChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPin(val);
        // Instant Auto-submit ketika 6 angka selesai diketik
        if (val.length === 6 && !loading) {
            submitWithPin(val);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 pb-safe">
            <Card className="w-full max-w-sm border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="text-center space-y-3 pt-8 pb-3">
                    <div className="mx-auto bg-blue-600 text-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Icon name="wallet" size={30} />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">ISZA FAMILY</CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Sign in with Family PIN</p>
                    </div>
                </CardHeader>
                <CardContent className="pb-8 pt-2">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="pin" className="text-xs font-medium text-slate-600 dark:text-slate-400">ENTER PIN</Label>
                                {loading && (
                                    <span className="text-[11px] font-semibold text-blue-600 animate-pulse flex items-center gap-1">
                                        <Icon name="refresh" size={11} className="animate-spin" />
                                        Verifying...
                                    </span>
                                )}
                            </div>
                            <Input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength="6"
                                placeholder="••••••"
                                value={pin}
                                onChange={handlePinChange}
                                disabled={loading}
                                required
                                autoFocus
                                className="text-center text-xl tracking-[0.5em] font-semibold h-12 rounded-xl border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* Checkbox Remember Me */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="remember-device"
                                checked={rememberDevice}
                                onChange={(e) => setRememberDevice(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                            />
                            <label htmlFor="remember-device" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                Remember this device (30 days)
                            </label>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full font-medium text-xs h-11 shadow-sm rounded-xl flex items-center justify-center gap-2"
                            disabled={loading || pin.length < 6}
                        >
                            {loading ? (
                                <>
                                    <Icon name="refresh" size={14} className="animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
