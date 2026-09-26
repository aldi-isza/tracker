// ============================================
// VALIDATORS — Input Validation & Error Messages
// ============================================

window.validators = {
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePin: (pin) => {
        if (typeof pin !== 'string') return false;
        return /^\d{6}$/.test(pin);
    },

    validateAmount: (amount) => {
        const num = parseFloat(amount);
        return num > 0 && !isNaN(num);
    },

    validateCategoryName: (name) => {
        return typeof name === 'string' && name.trim().length > 0 && name.length <= 100;
    },

    validateTransactionData: (data) => {
        const errors = {};

        if (!window.validators.validateAmount(data.amount)) {
            errors.amount = 'Amount must be greater than 0';
        }
        if (!data.category_id) {
            errors.category_id = 'Category is required';
        }
        if (!data.date) {
            errors.date = 'Date is required';
        }
        if (data.note && data.note.length > 500) {
            errors.note = 'Note cannot exceed 500 characters';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

window.ERROR_MESSAGES = {
    'INVALID_PIN': 'PIN harus tepat 6 angka',
    'INVALID_EMAIL': 'Format email tidak valid',
    'INVALID_AMOUNT': 'Jumlah harus lebih dari 0',
    'CATEGORY_REQUIRED': 'Pilih kategori terlebih dahulu',
    'USER_NOT_FOUND': 'User tidak ditemukan. Hubungi admin untuk membuat akun.',
    'INVALID_CREDENTIALS': 'Email atau PIN salah',
    'DATABASE_PERMISSION_ERROR': 'Kesalahan izin database - Hubungi admin',
    'NETWORK_ERROR': 'Kesalahan jaringan. Periksa koneksi internet Anda.',
    'UNKNOWN_ERROR': 'Terjadi kesalahan yang tidak terduga'
};

/**
 * Get a user-facing error message from an error code.
 * @param {string} errorCode - Error code key.
 * @returns {string} Localized error message.
 */
window.getErrorMessage = (errorCode) => {
    return window.ERROR_MESSAGES[errorCode] || window.ERROR_MESSAGES['UNKNOWN_ERROR'];
};
