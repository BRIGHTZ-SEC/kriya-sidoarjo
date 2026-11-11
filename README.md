# Toko Kriya Sidoarjo

Prototype e-commerce statis untuk kriya asli Sidoarjo (batik tulis, kulit,
ukiran kayu). Frontend vanilla ES modules, di-host di GitHub Pages.
Backend memakai Supabase (PostgreSQL + Auth + Storage).

## Struktur

- `index.html`, `katalog.html`, `produk.html`, `checkout.html`, `akun.html`,
  `lacak.html`, `admin.html` — halaman toko & panel admin
- `assets/js/` — modul JS (ui, db, api, auth, cart, layout, per-halaman)
- `assets/css/` — base, components, store, admin
- `assets/img/` — logo & foto produk
- `supabase/schema.sql` — skema DB + RPC + RLS + storage bucket
- `supabase/seed.sql` — data contoh (kategori, produk, voucher, ulasan, order demo)

## Setup Supabase (wajib agar toko berfungsi)

1. Buat project baru di https://supabase.com (gratis). Catat **Project URL**
   dan **anon public key** dari menu Settings → API.
2. Buka SQL Editor → New query, paste isi `supabase/schema.sql`, klik Run.
3. Buat 2 user di Authentication → Users → Add user (Auto Confirm User: ON):
   - `admin@tokokriya.id` / `admin123`
   - `bayu@mail.com` / `bayu123`
4. Jalankan `supabase/seed.sql` di SQL Editor (mengisi profil admin, kategori,
   produk, voucher, ulasan, dan 2 pesanan demo untuk bayu).
5. Isi `assets/js/config.js`:
   ```js
   export const CONFIG = {
     SUPABASE_URL: 'https://xxxxx.supabase.co',
     SUPABASE_ANON_KEY: 'eyJhbGciOi...',
   };
   ```
6. Commit & push. Situs live di `https://brightz-sec.github.io/kriya-sidoarjo`.

## Akun demo

- Admin: `admin@tokokriya.id` / `admin123` (akses panel admin di `admin.html`)
- Pembeli: `bayu@mail.com` / `bayu123` (punya 2 pesanan demo)

## Catatan

- Keranjang disimpan di `localStorage` (`tks_cart`, `tks_voucher`).
- Harga & ongkir dihitung ulang oleh server lewat RPC `place_order` —
  aman dari manipulasi klien.
- Produk tanpa foto otomatis pakai placeholder anyaman + ikon kategori.
  Tambahkan foto lewat panel admin (unggah ke bucket storage `products`).

## Lisensi

Prototype untuk tugas sekolah. Bebas dipakai & dimodifikasi.
