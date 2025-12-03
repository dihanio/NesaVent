# Frontend Integration dengan Backend (Bahasa Indonesia)

## Overview
Dokumentasi ini menjelaskan bagaimana frontend NESAVENT terintegrasi dengan backend yang telah dioptimasi untuk production.

## Fitur Utama

### 1. Error Handling Otomatis (Bahasa Indonesia)
File: `frontend/lib/api.ts`

Semua error dari backend otomatis diterjemahkan ke Bahasa Indonesia:

```typescript
import api from '@/lib/api';

try {
  const response = await api.post('/auth/login', data);
} catch (error) {
  // error.message sudah dalam Bahasa Indonesia
  console.log(error.message); // "Terlalu banyak permintaan, silakan coba lagi nanti"
}
```

**Error Messages:**
- 400: "Data yang dikirim tidak valid"
- 401: "Sesi Anda telah berakhir, silakan login kembali"
- 403: "Anda tidak memiliki akses ke fitur ini"
- 404: "Data tidak ditemukan"
- 409: "Data sudah ada dalam sistem"
- 429: "Terlalu banyak permintaan, silakan coba lagi nanti"
- 500: "Terjadi kesalahan server, silakan coba lagi"

### 2. Validation Utilities
File: `frontend/lib/validation.ts`

#### Password Validation
```typescript
import { validatePasswordStrength } from '@/lib/validation';

const result = validatePasswordStrength('MyPass123!');
// {
//   isValid: true,
//   message: "Password kuat",
//   strength: "strong"
// }
```

#### Email Validation
```typescript
import { validateEmail } from '@/lib/validation';

const isValid = validateEmail('user@example.com'); // true
```

#### Phone Validation
```typescript
import { validatePhone } from '@/lib/validation';

const isValid = validatePhone('081234567890'); // true
```

#### Get Error Message
```typescript
import { getErrorMessage } from '@/lib/validation';

try {
  await api.post('/auth/login', data);
} catch (error) {
  const message = getErrorMessage(error);
  setError(message); // Pesan dalam Bahasa Indonesia
}
```

### 3. Alert Components
File: `frontend/components/ui/alert.tsx`

#### Error Alert
```tsx
import { ErrorAlert } from '@/components/ui/alert';

<ErrorAlert 
  error="Email sudah terdaftar" 
  onClose={() => setError('')}
/>
```

#### Success Alert
```tsx
import { SuccessAlert } from '@/components/ui/alert';

<SuccessAlert 
  message="Registrasi berhasil!" 
  onClose={() => setSuccess('')}
/>
```

#### Warning Alert
```tsx
import { WarningAlert } from '@/components/ui/alert';

<WarningAlert 
  message="Akun Anda belum terverifikasi" 
/>
```

#### Rate Limit Alert
```tsx
import { RateLimitAlert } from '@/components/ui/alert';

<RateLimitAlert retryAfter="15 menit" />
```

## Implementasi pada Form

### Login Form
```tsx
'use client';

import { useState } from 'react';
import { authService } from '@/lib/auth';
import { getErrorMessage } from '@/lib/validation';
import { ErrorAlert } from '@/components/ui/alert';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(formData);
      router.push('/');
    } catch (err) {
      setError(getErrorMessage(err)); // Otomatis dalam Bahasa Indonesia
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ErrorAlert error={error} onClose={() => setError('')} />
      {/* Form fields */}
      <button disabled={loading}>
        {loading ? 'Memproses...' : 'Masuk'}
      </button>
    </form>
  );
}
```

### Register Form dengan Validation
```tsx
'use client';

import { useState } from 'react';
import { authService } from '@/lib/auth';
import { getErrorMessage, validatePasswordStrength, validateEmail } from '@/lib/validation';
import { ErrorAlert } from '@/components/ui/alert';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi client-side
    if (formData.nama.length < 3 || formData.nama.length > 100) {
      setError('Nama harus 3-100 karakter');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Format email tidak valid');
      return;
    }

    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    try {
      await authService.register(formData);
      router.push('/');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ErrorAlert error={error} onClose={() => setError('')} />
      
      <input 
        name="nama" 
        placeholder="Nama Lengkap"
        value={formData.nama}
        onChange={handleChange}
      />
      
      <input 
        name="email" 
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
      />
      
      <input 
        name="password" 
        type="password"
        placeholder="Password (min 8 karakter)"
        value={formData.password}
        onChange={handleChange}
      />
      <p className="text-xs text-gray-500">
        Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial
      </p>
      
      <input 
        name="confirmPassword" 
        type="password"
        placeholder="Konfirmasi Password"
        value={formData.confirmPassword}
        onChange={handleChange}
      />
      
      <button type="submit">Daftar</button>
    </form>
  );
}
```

## Handling Rate Limiting

Backend akan return HTTP 429 ketika rate limit exceeded. Frontend akan menampilkan pesan:

```
"Terlalu banyak permintaan. Silakan coba lagi setelah 15 menit"
```

Contoh implementasi:

```tsx
try {
  await api.post('/auth/login', credentials);
} catch (error: any) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.data.retryAfter || '15 menit';
    setError(`Terlalu banyak permintaan. Silakan coba lagi setelah ${retryAfter}`);
    
    // Atau gunakan RateLimitAlert
    // <RateLimitAlert retryAfter={retryAfter} />
  } else {
    setError(getErrorMessage(error));
  }
}
```

## Validation Rules

### Backend Validation Rules (dari `backend/utils/validators.js`)

Frontend harus follow rules yang sama:

| Field | Validasi | Error Message (ID) |
|-------|----------|-------------------|
| Nama | 3-100 karakter, hanya huruf | "Nama harus 3-100 karakter" |
| Email | Format valid | "Format email tidak valid" |
| Password | Min 8 char, uppercase, lowercase, number, special char | "Password minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan karakter spesial" |
| Event Name | 3-200 karakter | "Nama event harus 3-200 karakter" |
| Event Description | 10-5000 karakter | "Deskripsi harus 10-5000 karakter" |
| Price | >= 0 | "Harga tidak boleh negatif" |
| Stock | >= 1 | "Stok minimal 1" |
| Quantity | 1-10 | "Jumlah tiket harus 1-10 per transaksi" |

## Testing

### Test Login dengan Rate Limiting
```bash
# Bash
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

Setelah 5 kali percobaan, akan muncul error 429.

### Test Registration Validation
```bash
# Password terlalu pendek
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Test User",
    "email": "test@test.com",
    "password": "short"
  }'

# Response:
# {
#   "errors": [{
#     "field": "password",
#     "message": "Password minimal 8 karakter"
#   }]
# }
```

## Best Practices

### 1. Selalu Handle Errors
```tsx
try {
  const response = await api.post('/endpoint', data);
  // Success handling
} catch (error) {
  const message = getErrorMessage(error);
  setError(message);
}
```

### 2. Gunakan Validation Sebelum Submit
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Client-side validation DULU
  if (!validateEmail(email)) {
    setError('Format email tidak valid');
    return;
  }
  
  // Baru kirim ke server
  try {
    await api.post('/endpoint', data);
  } catch (error) {
    setError(getErrorMessage(error));
  }
};
```

### 3. Show Loading State
```tsx
<button type="submit" disabled={loading}>
  {loading ? 'Memproses...' : 'Submit'}
</button>
```

### 4. Clear Errors on Retry
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(''); // Clear previous errors
  
  try {
    await api.post('/endpoint', data);
  } catch (error) {
    setError(getErrorMessage(error));
  }
};
```

## Troubleshooting

### Error: "Tidak dapat terhubung ke server"
- Pastikan backend sedang running
- Check `NEXT_PUBLIC_API_URL` di `.env.local`
- Check CORS configuration di backend

### Error: "Sesi Anda telah berakhir"
- Token JWT expired
- User akan otomatis redirect ke `/login`
- Clear localStorage dan login ulang

### Error: "Terlalu banyak permintaan"
- Rate limit exceeded
- Tunggu sesuai `retryAfter` yang ditentukan
- Jangan spam request

### Validation Errors Tidak Muncul
- Check `handleValidationErrors` middleware di backend routes
- Check error response format
- Pastikan frontend menggunakan `getErrorMessage()` utility

## Summary

✅ Semua error messages dalam Bahasa Indonesia
✅ Validation rules match antara frontend & backend
✅ Alert components siap pakai
✅ Rate limiting handled gracefully
✅ Consistent error handling pattern
