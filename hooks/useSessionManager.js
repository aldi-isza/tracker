// ============================================
// useSessionManager — Session persistence & activity tracking
// ============================================

const { useState: _smUseState, useEffect: _smUseEffect, useCallback: _smUseCallback } = React;

/**
 * Manage user session: synchronous restore from localStorage, track activity, auto-expire.
 * Optimized for 0ms perceived latency & persistent login on local device.
 *
 * @param {{ SESSION_TIMEOUT: number }} config - Session timeout in ms (default: 30 days).
 * @param {{ USER: string, SESSION: string }} storageKeys - localStorage key names.
 * @returns {{ user, setUser, loading, handleLogin, handleLogout }}
 */
window.useSessionManager = (config, storageKeys) => {
    // 1. Synchronous initial state restoration (No loading flash, 0ms perceived latency)
    const [user, setUser] = _smUseState(() => {
        try {
            const userStr = localStorage.getItem(storageKeys.USER);
            const sessionTime = localStorage.getItem(storageKeys.SESSION);

            if (userStr) {
                const parsed = JSON.parse(userStr);
                if (parsed && parsed.id && parsed.email) {
                    if (sessionTime) {
                        const now = Date.now();
                        const lastActivity = parseInt(sessionTime, 10);
                        const timeout = config?.SESSION_TIMEOUT || (30 * 24 * 60 * 60 * 1000); // 30 hari

                        if (now - lastActivity <= timeout) {
                            if (parsed.theme === 'dark') document.documentElement.classList.add('dark');
                            localStorage.setItem(storageKeys.SESSION, now.toString());
                            return parsed;
                        } else {
                            // Sesi kedaluwarsa setelah 30 hari tidak ada aktivitas
                            localStorage.removeItem(storageKeys.USER);
                            localStorage.removeItem(storageKeys.SESSION);
                            return null;
                        }
                    }
                    if (parsed.theme === 'dark') document.documentElement.classList.add('dark');
                    localStorage.setItem(storageKeys.SESSION, Date.now().toString());
                    return parsed;
                }
            }
        } catch (e) {
            console.error('[Session Restore Error]', e);
        }
        return null;
    });

    const [loading, setLoading] = _smUseState(false);

    // 2. Sliding window activity tracking: refresh timestamp saat user berinteraksi
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
        window.addEventListener('touchstart', debouncedUpdate, { passive: true });

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('mousemove', debouncedUpdate);
            window.removeEventListener('keydown', debouncedUpdate);
            window.removeEventListener('click', debouncedUpdate);
            window.removeEventListener('touchstart', debouncedUpdate);
        };
    }, [user, storageKeys]);

    const handleLogin = _smUseCallback((userData) => {
        setUser(userData);
        localStorage.setItem(storageKeys.USER, JSON.stringify(userData));
        localStorage.setItem(storageKeys.SESSION, Date.now().toString());
        if (userData.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [storageKeys]);

    const handleLogout = _smUseCallback(() => {
        setUser(null);
        localStorage.removeItem(storageKeys.USER);
        localStorage.removeItem(storageKeys.SESSION);
        document.documentElement.classList.remove('dark');
    }, [storageKeys]);

    return { user, setUser, loading, handleLogin, handleLogout };
};
