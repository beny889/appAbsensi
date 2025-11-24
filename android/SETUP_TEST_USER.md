# Setup Test User untuk Development

Karena sistem autentikasi belum sepenuhnya terintegrasi, Anda perlu setup test user token untuk bisa test fitur check-in/check-out.

## Langkah-langkah:

### 1. Login via API untuk mendapatkan token

Gunakan salah satu user yang sudah di-approve di backend:

```bash
# Method 1: Using curl dari terminal
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@absensi.com","password":"admin123"}'

# Method 2: Using PowerShell
$body = @{
    email = "admin@absensi.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$response
```

Response akan berisi:
```json
{
  "user": {
    "id": "user_id_here",
    "email": "admin@absensi.com",
    "name": "Admin User",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Simpan token ke aplikasi Android

Ada 2 cara:

#### Cara 1: Via adb shell (Temporary - untuk testing cepat)

**PENTING**: Cara ini hanya untuk testing dan token akan hilang setelah app di-restart atau device di-reboot.

```bash
# Masukkan token yang didapat dari step 1
adb shell "run-as com.absensi sh -c 'echo TOKEN_ANDA_DISINI > /data/data/com.absensi/shared_prefs/absensi_prefs.xml'"
```

#### Cara 2: Buat LoginActivity (Proper solution - recommended)

Implementasi LoginActivity dengan form email/password yang akan:
1. Call API `/auth/login`
2. Simpan token via `TokenManager.saveToken()`
3. Redirect ke MainActivity

### 3. Test User Accounts

Berikut adalah user yang bisa digunakan untuk testing (setelah di-approve via web admin):

```
Email: admin@absensi.com
Password: admin123
```

**Note**: Jika belum punya user yang approved, Anda harus:
1. Register wajah via aplikasi Android
2. Approve di web admin panel
3. Login menggunakan email/password yang di-set saat approve

---

## Alternatif: Hardcode Token untuk Development

**HANYA UNTUK DEVELOPMENT - JANGAN DIGUNAKAN DI PRODUCTION!**

Edit file `MainActivity.kt` atau `SplashActivity.kt`, tambahkan di onCreate():

```kotlin
// TEMPORARY: Auto-login for development
val tokenManager = TokenManager(this)
if (!tokenManager.isLoggedIn()) {
    // Ganti dengan token valid dari backend
    val testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    tokenManager.setupDemoUser(
        token = testToken,
        userId = "user_id_here",
        name = "Test User",
        email = "test@absensi.com"
    )
    Log.d("MainActivity", "Demo user setup for development")
}
```

**PENTING**: Hapus code ini sebelum production!

---

## Verify Token Working

Setelah setup token, test dengan:

```bash
# Dari terminal/PowerShell - test apakah token valid
curl -X GET http://localhost:3001/api/attendance/today \
  -H "Authorization: Bearer TOKEN_ANDA_DISINI"

# Jika valid, akan return attendance data atau array kosong []
# Jika invalid, akan return 401 Unauthorized
```

---

## Troubleshooting

### "Belum Login" saat check-in
- Pastikan token sudah disimpan dengan benar
- Cek logcat untuk message "No token found"
- Verify token masih valid (tidak expired)

### "Face registration pending approval"
- User harus di-approve dulu di web admin
- Buka http://localhost:5173/registrations
- Approve registration, set email & password
- Login dengan credentials tersebut

### "Outside allowed location"
- Belum ada location yang di-set di database
- Atau GPS coordinates tidak match dengan location radius
- Untuk testing, bisa disable location check di backend

---

**Last Updated**: 2025-11-24
