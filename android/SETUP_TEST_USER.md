# Setup Test User untuk Development

Panduan untuk testing aplikasi Android dengan user accounts.

## Arsitektur Autentikasi

Sistem ini menggunakan **Passwordless Face Authentication**:

| Role | Autentikasi |
|------|-------------|
| **ADMIN** | Email + Password (untuk web admin) |
| **EMPLOYEE** | Face Only (tidak perlu email/password) |

**Karyawan tidak perlu login tradisional** - mereka cukup scan wajah untuk absensi.

## Flow Testing

### 1. Register Face (Sebagai Employee Baru)

1. Buka aplikasi Android
2. Tap "📸 Rekam Data Wajah"
3. Ikuti petunjuk untuk capture 5 pose wajah
4. Masukkan nama
5. Submit → Status "Pending Approval"

### 2. Approve di Web Admin (Sebagai Admin)

1. Login ke http://localhost:5173 dengan:
   ```
   Email: admin@absensi.com
   Password: admin123
   ```
2. Buka menu "Pendaftaran Wajah"
3. Klik registrasi yang pending
4. Klik "Approve"
5. Pilih department & set nama (jika perlu ubah)
6. Submit → User account otomatis dibuat

### 3. Test Absensi (Sebagai Employee)

Setelah di-approve:
1. Buka aplikasi Android
2. Embeddings akan di-sync otomatis dari server
3. Tap "Absen Masuk" atau "Absen Pulang"
4. Scan wajah → sistem akan match dengan embeddings tersimpan
5. Konfirmasi → Attendance record dibuat

## Sync Embeddings

Saat pertama kali buka app atau setelah ada user baru di-approve, app akan:
1. Download semua embeddings user yang approved
2. Simpan ke SharedPreferences
3. Gunakan untuk face matching lokal

```kotlin
// EmbeddingStorage.kt
fun syncFromServer() {
    // GET /attendance/embeddings
    // Simpan semua user embeddings untuk offline matching
}
```

## Testing Tips

### Cek Embeddings Sudah Sync
Lihat logcat untuk message:
```
EmbeddingStorage: Synced X users from server
```

### Force Refresh Embeddings
Restart app atau tambahkan tombol manual sync di HomeFragment.

### Test Face Match
1. Pastikan pencahayaan cukup
2. Posisikan wajah di tengah frame
3. Tunggu sampai face detection stable (15 frames)
4. Lihat distance score di logcat - harus < 0.7 untuk match

## Troubleshooting

### "Wajah tidak dikenali"
- Cek apakah embeddings sudah di-sync (lihat logcat)
- Coba refresh embeddings
- Pastikan pencahayaan cukup
- Coba dari sudut berbeda

### "Belum ada data wajah"
- User belum di-approve di web admin
- Sync embeddings belum jalan
- Restart app untuk trigger sync ulang

### Backend connection error
- Pastikan backend running di port 3001
- Setup ADB reverse: `adb reverse tcp:3001 tcp:3001`
- Cek BASE_URL di Constants.kt

## Admin Token (Untuk Testing API)

Jika perlu test API manual dengan token:

```bash
# Login sebagai admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@absensi.com","password":"admin123"}'

# Gunakan token dari response untuk API calls
curl -X GET http://localhost:3001/api/attendance/all \
  -H "Authorization: Bearer TOKEN_DARI_RESPONSE"
```

---

**Last Updated**: November 26, 2025
