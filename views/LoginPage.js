// ============================================
// LOGIN PAGE VIEW
// ============================================

const { useState: _lpUseState } = React;

window.LoginPage = ({ onLogin }) => {
    const email = 'isza@family.id';
    const [pin, setPin] = _lpUseState('');
    const [loading, setLoading] = _lpUseState(false);
    const toast = window.useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validators.validatePin(pin)) {
            toast("PIN harus 6 angka", "error");
            return;
        }

        setLoading(true);
        try {
            const user = await window.api.login(email, pin);
            onLogin(user);
            toast("Selamat datang di ISZA FAMILY!", "success");
        } catch (error) {
            const errorCode = error.message;
            const userMessage = getErrorMessage(errorCode);
            toast(userMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 pb-safe">
            <Card className={`w-full max-w-sm ${NB.border} bg-card ${NB.shadow.hero} rounded-2xl overflow-hidden`}>
                <CardHeader className="text-center space-y-3 pt-8 pb-3">
                    <div className={`mx-auto bg-indigo-500 text-black p-4 rounded-2xl ${NB.border} w-20 h-20 flex items-center justify-center ${NB.shadow.xl}`}>
                        <Icon name="wallet" size={36} />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black tracking-tight text-foreground uppercase">ISZA FAMILY</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground">Personal Finance Dashboard</p>
                    </div>
                </CardHeader>
                <CardContent className="pb-8 pt-2">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="pin" className="text-xs font-extrabold text-foreground">MASUKKAN PIN (6 ANGKA)</Label>
                            </div>
                            <Input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength="6"
                                placeholder="••••••"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                disabled={loading}
                                required
                                autoFocus
                                className={`text-center text-xl tracking-[0.5em] font-black h-14 ${NB.border} ${NB.shadow.lg} focus:translate-x-0.5 focus:translate-y-0.5`}
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full font-black text-base h-12" disabled={loading || pin.length < 6}>
                            {loading ? '⏳ Memproses...' : 'Masuk'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
