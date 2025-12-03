/**
 * Frontend Validation Utilities
 * Matches backend validation rules in backend/utils/validators.js
 */

export const ValidationRules = {
  // Nama validation
  nama: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Nama harus 3-100 karakter dan hanya mengandung huruf'
  },

  // Email validation
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Format email tidak valid'
  },

  // Password validation
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
    message: 'Password minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan karakter spesial'
  },

  // Phone validation
  phone: {
    pattern: /^(\+62|62|0)[0-9]{9,12}$/,
    message: 'Nomor telepon tidak valid (contoh: 08xxxxxxxxxx)'
  },

  // Event name validation
  eventName: {
    minLength: 3,
    maxLength: 200,
    message: 'Nama event harus 3-200 karakter'
  },

  // Event description validation
  eventDescription: {
    minLength: 10,
    maxLength: 5000,
    message: 'Deskripsi event harus 10-5000 karakter'
  },

  // Event location validation
  eventLocation: {
    minLength: 3,
    maxLength: 200,
    message: 'Lokasi harus 3-200 karakter'
  },

  // Price validation
  price: {
    min: 0,
    message: 'Harga tidak boleh negatif'
  },

  // Stock validation
  stock: {
    min: 1,
    message: 'Stok minimal 1'
  },

  // Quantity validation
  quantity: {
    min: 1,
    max: 10,
    message: 'Jumlah tiket harus 1-10 per transaksi'
  }
};

/**
 * Validate field against rules
 */
export function validateField(value: any, rules: any): string | null {
  if (!value && rules.required) {
    return 'Field ini wajib diisi';
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    return rules.message || `Minimal ${rules.minLength} karakter`;
  }

  if (value && rules.maxLength && value.length > rules.maxLength) {
    return rules.message || `Maksimal ${rules.maxLength} karakter`;
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return rules.message || 'Format tidak valid';
  }

  if (typeof value === 'number' && rules.min !== undefined && value < rules.min) {
    return rules.message || `Nilai minimal ${rules.min}`;
  }

  if (typeof value === 'number' && rules.max !== undefined && value > rules.max) {
    return rules.message || `Nilai maksimal ${rules.max}`;
  }

  return null;
}

/**
 * Format validation errors from backend
 */
export function formatValidationErrors(errors: Array<{field: string; message: string}>): string {
  if (!errors || errors.length === 0) {
    return 'Terjadi kesalahan validasi';
  }
  
  return errors.map(e => `${e.field}: ${e.message}`).join('; ');
}

/**
 * Display error message with proper formatting
 */
export function getErrorMessage(error: any): string {
  if (error.response) {
    const { status, data } = error.response;
    
    // Handle validation errors array
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.message || e.msg).join(', ');
    }
    
    // Handle specific status codes with Indonesian messages
    switch (status) {
      case 400:
        return data.message || 'Data yang dikirim tidak valid';
      case 401:
        return data.message || 'Sesi Anda telah berakhir, silakan login kembali';
      case 403:
        return data.message || 'Anda tidak memiliki akses ke fitur ini';
      case 404:
        return data.message || 'Data tidak ditemukan';
      case 409:
        return data.message || 'Data sudah ada dalam sistem';
      case 429:
        const retryAfter = data.retryAfter || '15 menit';
        return `Terlalu banyak permintaan. Silakan coba lagi setelah ${retryAfter}`;
      case 500:
        return data.message || 'Terjadi kesalahan server, silakan coba lagi';
      default:
        return data.message || 'Terjadi kesalahan, silakan coba lagi';
    }
  } else if (error.request) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda';
  } else {
    return error.message || 'Terjadi kesalahan, silakan coba lagi';
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
} {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password minimal ${minLength} karakter`,
      strength: 'weak'
    };
  }

  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Password harus mengandung huruf besar',
      strength: 'weak'
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Password harus mengandung huruf kecil',
      strength: 'weak'
    };
  }

  if (!hasNumber) {
    return {
      isValid: false,
      message: 'Password harus mengandung angka',
      strength: 'medium'
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password harus mengandung karakter spesial (!@#$%^&* dll)',
      strength: 'medium'
    };
  }

  return {
    isValid: true,
    message: 'Password kuat',
    strength: 'strong'
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return ValidationRules.email.pattern.test(email);
}

/**
 * Validate phone number (Indonesia)
 */
export function validatePhone(phone: string): boolean {
  return ValidationRules.phone.pattern.test(phone);
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
