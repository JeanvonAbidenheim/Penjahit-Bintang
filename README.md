# ✦ Penjahit Bintang — Website & Sistem Pemesanan

Website komersial untuk usaha penjahit **Penjahit Bintang** di Surabaya. Dilengkapi sistem pemesanan online, tracking status realtime, dan dashboard admin — dibangun dengan HTML, CSS, JavaScript murni dan Firebase sebagai backend.

🔗 **Live:** https://penjahit-bintang.vercel.app

---

## 📁 Struktur Folder

```
penjahit-bintang/
│
├── index.html              # Halaman utama (landing page)
├── auth.html                # Login & daftar akun pelanggan
├── pesan.html                # Form buat pesanan baru
├── status.html               # Tracking status pesanan (realtime)
├── admin.html                # Dashboard admin — kelola pesanan
├── galeri-admin.html         # Dashboard admin — kelola galeri foto
│
├── favicon.ico, favicon-*.png, apple-touch-icon.png
│
└── assets/
    ├── css/
    │   ├── main.css          # Entry point — import semua CSS index.html
    │   ├── base.css          # Variabel warna, font, reset, animasi
    │   ├── navbar.css         # Navbar utama
    │   ├── hero.css           # Hero section
    │   ├── layanan.css        # Kartu layanan
    │   ├── galeri.css         # Galeri masonry + lightbox
    │   ├── tentang.css        # Section tentang
    │   ├── testimoni.css      # Section testimoni
    │   ├── kontak.css         # Form kontak + Google Maps
    │   ├── footer.css         # Footer + tombol WA mengambang
    │   ├── responsive.css     # Semua media query index.html
    │   ├── sistem.css         # Style auth/pesan/status/admin
    │   └── galeri-admin.css   # Style halaman kelola galeri
    │
    └── js/
        ├── utils.js           # Fungsi pembantu (notif, animasi scroll, dll)
        ├── navbar.js           # Logic navbar utama
        ├── galeri.js           # (legacy) data galeri statis
        ├── lightbox.js         # Popup viewer foto
        ├── main.js             # Entry point index.html
        │
        ├── firebase.js         # Konfigurasi & inisialisasi Firebase
        ├── auth.js             # Login, daftar, logout
        ├── pesan.js            # Buat pesanan baru
        ├── status.js           # Tracking status pesanan (realtime)
        ├── admin.js            # Dashboard admin — kelola pesanan
        ├── galeri-admin.js      # Upload & kelola foto galeri (Cloudinary)
        └── galeri-publik.js     # Tampilkan galeri di index.html (dari Firebase)
```

---

## 🛠️ Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | HTML, CSS, JavaScript (vanilla, ES Modules) |
| Autentikasi | Firebase Authentication (Email/Password) |
| Database | Firebase Realtime Database |
| Penyimpanan Foto | Cloudinary (unsigned upload) |
| Hosting | Vercel |
| Form Kontak | Formspree |
| Notifikasi | WhatsApp (wa.me link otomatis) |

---

## ⚙️ Konfigurasi Penting

Sebelum deploy ulang atau development, pastikan nilai-nilai berikut sudah benar di file terkait:

### 1. Firebase (`assets/js/firebase.js`)
```js
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "...",
  databaseURL:       "...",
  projectId:         "...",
  storageBucket:     "...",
  messagingSenderId: "...",
  appId:             "..."
};
```
Ambil dari **Firebase Console → Project Settings → Your apps**.

### 2. Email Admin (`assets/js/admin.js` & `assets/js/galeri-admin.js`)
```js
const EMAIL_ADMIN = 'emailadmin@gmail.com'; // ganti dengan email admin asli
```
Email ini yang punya akses ke `admin.html` dan `galeri-admin.html`. Akun admin didaftarkan lewat `auth.html` seperti pelanggan biasa — sistem yang membedakan berdasarkan email ini.

### 3. URL Notifikasi WA (`assets/js/admin.js`)
```js
'https://penjahit-bintang.vercel.app/status.html'
```
Ganti dengan URL Vercel produksi.

### 4. Cloudinary (`assets/js/galeri-admin.js`)
```js
const CLOUDINARY_URL    = 'https://api.cloudinary.com/v1_1/<cloud_name>/image/upload';
const CLOUDINARY_PRESET = '<nama_preset>';
```
Cloud name & preset didapat dari **Cloudinary Dashboard → Settings → Upload → Upload Presets** (mode harus **Unsigned**).

### 5. Formspree (`assets/js/main.js`)
```js
const FORMSPREE_URL = 'https://formspree.io/f/xxxxxxxx';
```

### 6. Nomor WhatsApp Toko
Dicari & diganti di beberapa tempat: `index.html` (tombol WA, footer, form kontak), `assets/js/main.js`, `assets/js/admin.js`.

---

## 🔥 Struktur Data Firebase Realtime Database

```
penjahit-bintang-default-rtdb/
│
├── users/
│   └── {uid}/
│       ├── nama:  "Nama Pelanggan"
│       ├── no_hp: "08xxxxxxxxxx"
│       ├── email: "email@contoh.com"
│       └── createdAt: 1234567890
│
├── pesanan/
│   └── {pushId}/
│       ├── nomorOrder:     "PB-20260611-A1B2"
│       ├── userId:         "{uid}"
│       ├── layanan:        "Jahit Custom Pria"
│       ├── deskripsi:      "..."
│       ├── status:         "menunggu_konfirmasi" | "dikonfirmasi" | "diproses" | "selesai" | "diambil"
│       ├── catatanAdmin:   "..." | null
│       ├── estimasiAmbil:  "2026-06-15" | null
│       ├── createdAt:      1234567890
│       └── updatedAt:      1234567890
│
└── galeri/
    └── {pushId}/
        ├── nama:      "Kemeja Batik Custom"
        ├── kategori:  "pria" | "wanita" | "permak" | "seragam"
        ├── badge:     "baru" | "terlaris" | "promo" | null
        ├── fotoUrl:   "https://res.cloudinary.com/.../foto.jpg"
        └── createdAt: 1234567890
```

---

## 👤 Alur Pengguna

### Pelanggan
```
auth.html (daftar/login)
    → pesan.html (buat pesanan baru, dapat nomor order)
    → status.html (pantau status pesanan realtime)
```

### Admin
```
auth.html (login dengan email admin)
    → admin.html (lihat semua pesanan, ubah status, kirim notif WA)
    → galeri-admin.html (upload/hapus foto, atur badge)
```

Status pesanan yang diubah admin otomatis tersinkron ke `status.html` pelanggan secara realtime (Firebase `onValue`).

---

## ✨ Fitur Utama

- **Landing page modern** — hero, layanan, galeri masonry, testimoni, kontak, Google Maps
- **Lightbox galeri** — navigasi keyboard (←/→/Esc) & swipe HP
- **Sistem akun pelanggan** — daftar, login, logout (Firebase Auth)
- **Pemesanan online** — generate nomor order otomatis (`PB-YYYYMMDD-XXXX`)
- **Tracking status realtime** — progress bar 5 tahap (Menunggu → Dikonfirmasi → Diproses → Selesai → Diambil)
- **Dashboard admin** — statistik, filter status, update status + catatan + estimasi, kirim notif WA otomatis
- **Kelola galeri** — admin upload foto langsung dari dashboard ke Cloudinary, atur kategori & badge
- **Form kontak** — terkirim ke email (Formspree) + WhatsApp otomatis
- **Tombol WA mengambang**, **favicon**, **meta Open Graph** untuk preview link
- Sepenuhnya **responsive** (HP, tablet, desktop)

---

## 🚀 Deploy

Project ini static (tidak butuh build step) — cukup upload seluruh folder ke **Vercel** atau **Netlify**:

1. Drag & drop folder project ke dashboard Vercel/Netlify, **atau**
2. Hubungkan repo Git → auto-deploy setiap push

Tidak ada `package.json` atau proses build yang diperlukan.

---

## 🧵 Catatan Pengembangan

- Kode ditulis dengan gaya sederhana (function biasa, tanpa framework) agar mudah dipahami dan dikembangkan lebih lanjut
- Banyak komentar dalam Bahasa Indonesia/Jawa Suroboyo untuk memudahkan pemeliharaan
- Firebase Realtime Database dipakai (bukan Firestore) karena gratis tanpa perlu billing
- Upload foto pakai Cloudinary (bukan Firebase Storage) karena setup lebih sederhana — tanpa security rules yang rumit

---

## 📌 Ide Pengembangan Selanjutnya

- [ ] Testimoni dinamis (kelola dari dashboard admin)
- [ ] Notifikasi email otomatis saat status pesanan berubah
- [ ] Halaman daftar harga lengkap per layanan
- [ ] Riwayat & laporan pesanan (export ke Excel/PDF)
- [ ] Multi-admin dengan role berbeda

---

*Dibangun dengan ❤️ untuk Penjahit Bintang, Surabaya.*
