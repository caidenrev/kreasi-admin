# Kreasi.id — Admin CMS

Ini adalah sistem manajemen konten (CMS) internal yang digunakan oleh tim Kreasi.id untuk menyetujui produk, mengawasi transaksi, dan memproses pencairan dana seller.

## Prasyarat
Pastikan Anda sudah menjalankan `pnpm install` dari root direktori proyek.

## Konfigurasi Environment Variables

Buat file `.env.local` di dalam folder `admin/` ini, dan isi dengan kredensial Firebase Anda (Kredensial ini sama dengan yang ada di Client dan Seller):

```env
# Konfigurasi Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Akun Administrator
Tidak sembarang pengguna bisa masuk ke dashboard Admin. Hanya pengguna yang emailnya diatur mengandung kata `admin` (contoh: `admin@kreasi.id`) atau memiliki Custom Claims Firebase Admin yang bisa mengakses halaman ini. Jika bukan, mereka akan otomatis ditolak dan di-logout.

## Menjalankan Server Development

Agar tidak bentrok dengan Client (3000) dan Seller (3001), jalankan Admin CMS di port 3002. Jalankan perintah berikut di dalam direktori `admin/`:

```bash
pnpm dev --port 3002
```
*(Atau Anda bisa mengedit package.json `"dev": "next dev -p 3002"` dan cukup jalankan `pnpm dev`)*

Aplikasi akan berjalan di [http://localhost:3002](http://localhost:3002).

## Fitur Utama
- **Curation Queue:** Meninjau produk baru yang diupload seller. Admin bisa menyetujui (`approved`) atau menolak (`rejected`) dengan menyertakan alasan.
- **Payout Queue:** Memproses daftar permintaan penarikan dana (Withdrawal) dari seller. Mengubah status menjadi `completed`.
- **Export CSV:** Admin dapat mengekspor daftar pesanan pembeli dalam bentuk file Excel/CSV.
