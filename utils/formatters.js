// ============================================
// FORMATTERS — Currency & Date Formatting
// ============================================

/**
 * Format a number as Indonesian Rupiah currency string.
 * @param {number} amount - The amount to format.
 * @param {string} [currencyCode='IDR'] - ISO 4217 currency code.
 * @returns {string} Formatted currency string (e.g., "Rp150.000").
 */
window.formatCurrency = (amount, currencyCode = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format a date string to localized Indonesian short date.
 * @param {string} dateString - ISO date string or parseable date.
 * @returns {string} Formatted date (e.g., "22 Agt 2026").
 */
window.formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};
