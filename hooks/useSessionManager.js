// ============================================
// useSessionManager — Session persistence & activity tracking
// ============================================

const { useState: _smUseState, useEffect: _smUseEffect, useCallback: _smUseCallback } = React;

/**
 * Manage user session: restore from localStorage, track activity, auto-expire.
 *
 * @param {{ SESSION_TIMEOUT: number }} config - Session timeout in ms.
 * @param {{ USER: string, SESSION: string }} storageKeys - localStorage key names.
 * @returns {{ user, setUser, loading, handleLogin, handleLogout }}
 */
window.useSessionManager = (config, storageKeys) => {
    const [user, setUser] = _smUseState(null);
    const [loading, setLoading] = _smUseState(true);

    // Restore session on mount
    _smUseEffect(() => {
        const userStr = localStorage.getItem(storageKeys.USER);
        const sessionTime = localStorage.getItem(storageKeys.SESSION);

        if (userStr && sessionTime) {
            const now = Date.now();
            const lastActivity = parseInt(sessionTime, 10);

            if (now - lastActivity <= config.SESSION_TIMEOUT) {
                try {
                    const parsed = JSON.parse(userStr);
                    if (parsed.id && parsed.email) {
                        setUser(parsed);
                        if (parsed.theme === 'dark') document.documentElement.classList.add('dark');
                        localStorage.setItem(storageKeys.SESSION, now.toString());
                    }
                } catch (e) {
                    console.error('[Session Load Error]', e);
                }
            } else {
                localStorage.removeItem(storageKeys.USER);
                localStorage.removeItem(storageKeys.SESSION);
            }
        }
        setLoading(false);
    }, []);

    // Debounced activity tracking
    _smUseEffect(() => {
        if (!user) return;

        let timeout;
        const updateSession = () => {
            localStorage.setItem(storageKeys.SESSION, Date.now().toString());
        };
        const debouncedUpdate = () => {
            clearTimeout(timeout);
            timeout = setTimeout(updateSession, 2000);
        };

        window.addEventListener('mousemove', debouncedUpdate, { passive: true });
        window.addEventListener('keydown', debouncedUpdate, { passive: true });
        window.addEventListener('click', debouncedUpdate, { passive: true });

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('mousemove', debouncedUpdate);
            window.removeEventListener('keydown', debouncedUpdate);
            window.removeEventListener('click', debouncedUpdate);
        };
    }, [user]);

    const handleLogin = _smUseCallback((userData) => {
        setUser(userData);
        localStorage.setItem(storageKeys.USER, JSON.stringify(userData));
        localStorage.setItem(storageKeys.SESSION, Date.now().toString());
        if (userData.theme === 'dark') document.documentElement.classList.add('dark');
    }, [storageKeys]);

    const handleLogout = _smUseCallback(() => {
        setUser(null);
        localStorage.removeItem(storageKeys.USER);
        localStorage.removeItem(storageKeys.SESSION);
        document.documentElement.classList.remove('dark');
    }, [storageKeys]);

    return { user, setUser, loading, handleLogin, handleLogout };
};
