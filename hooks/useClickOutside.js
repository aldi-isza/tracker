// ============================================
// useClickOutside — Close dropdowns on outside click
// ============================================

/**
 * Detect clicks outside a referenced element and invoke a callback.
 * Replaces 3 duplicate useEffect patterns across Dashboard, Transactions, and Categories.
 *
 * @param {React.RefObject} ref - Ref to the container element.
 * @param {Function} onClickOutside - Callback when a click occurs outside the ref.
 */
window.useClickOutside = (ref, onClickOutside) => {
    const { useEffect } = React;

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onClickOutside();
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [ref, onClickOutside]);
};
