# Toko Kriya Sidoarjo

Prototype toko *e-commerce* kerajinan tangan khas Sidoarjo — batik tulis, tas & dompet kulit, aksesoris, dan kriya kayu. Dibangun dengan HTML, CSS, dan JavaScript vanilla tanpa server; seluruh data disimpan di `localStorage` browser.

**Live:** https://brightz-sec.github.io/kriya-sidoarjo/

> Prototype tampilan untuk keperluan pembelajaran — bukan toko sungguhan.

## Fitur

**Toko (`index.html`)**

- Katalog dengan pencarian, filter (rentang harga, stok, label, promo saja, favorit) dan 7 opsi pengurutan
- Keranjang belanja, voucher, gratis ongkir otomatis (belanja ≥ Rp500.000), checkout simulasi
- Lacak paket, riwayat pesanan, favorit, ulasan produk, lightbox foto
- Tema gelap/terang, tampilan responsif, tombol chat WhatsApp

**Admin (`admin.html`)**

- Dashboard statistik toko
- Kelola produk: foto (maks 4, otomatis dikompres), variasi & stok, diskon, produk unggulan
- Pesanan: ubah status, kirim resi, ekspor CSV
- Balas ulasan, kelola voucher, daftar pembeli

## Cara Menjalankan

Tanpa build step — cukup clone lalu buka di browser:

```bash
git clone https://github.com/BRIGHTZ-SEC/kriya-sidoarjo.git
cd kriya-sidoarjo
npx serve .        # atau buka index.html langsung
```

- Toko: `index.html`
- Panel admin: `admin.html`

## Akun Demo

| Role    | Email               | Password  |
| ------- | ------------------- | --------- |
| Pembeli | bayu@mail.com       | bayu123   |
| Admin   | admin@tokokriya.id  | admin123  |

## Struktur Proyek

```
├── index.html        # Halaman toko
├── admin.html        # Panel admin
└── assets/
    ├── css/          # style.css (toko), admin.css (panel admin)
    ├── js/
    │   ├── theme.js  # Toggle tema gelap/terang
    │   ├── data.js   # Skema data, seed, migrasi, Store (localStorage)
    │   ├── app.js    # Logika halaman toko
    │   └── admin.js  # Logika panel admin
    └── img/
        ├── logo/         # Logo toko
        ├── products/     # Foto produk (.jpg/.webp)
        └── kategori/     # Icon kategori (.svg)
```

## Catatan Teknis

- Data tersimpan di `localStorage` dengan key **`tks_db_v1`** (skema v14). Untuk reset penuh: DevTools → Application → Local Storage → hapus key tersebut, lalu muat ulang halaman.
- Migrasi skema lama ke baru ada di fungsi `migrate()` pada `assets/js/data.js`.
- Produk yang belum punya foto asli (masih placeholder SVG) otomatis tidak ditampilkan di katalog oleh filter `hasProductPhoto()`.
- Perubahan apa pun cukup di-push ke `main` — GitHub Pages otomatis rebuild ±30 detik.

## Dibuat oleh

Bima Ramadhan Kartika AKA BRIGHTZSEC
