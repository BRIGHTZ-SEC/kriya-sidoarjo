-- ============================================================================
-- Toko Kriya Sidoarjo — Data Katalog (seed)
-- ----------------------------------------------------------------------------
-- Jalankan schema.sql terlebih dahulu, lalu file ini di SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. KATEGORI
-- ============================================================================
insert into public.categories (id, slug, name, icon, color, sort) values
  ('a0000000-0000-4000-8000-000000000001', 'batik',    'Batik',        'batik', '#c05a30', 1),
  ('a0000000-0000-4000-8000-000000000002', 'tas',      'Tas & Dompet', 'bag',   '#8a5a44', 2),
  ('a0000000-0000-4000-8000-000000000003', 'aksesoris','Aksesoris',    'gem',   '#5c6b73', 3),
  ('a0000000-0000-4000-8000-000000000004', 'kriya',    'Kriya Kayu',   'tree',  '#5f7a52', 4)
on conflict (slug) do nothing;

-- ============================================================================
-- 2. PRODUK
-- ============================================================================
insert into public.products (
  id, slug, name, category_id, price, discount_percent, stock, sold, weight,
  featured, active, short_desc, description, material, dimensions, care,
  tags, images, created_at
) values
(
  'b0000000-0000-4000-8000-000000000001', 'batik-tulis-sidoarjo', 'Batik Tulis Sidoarjo',
  'a0000000-0000-4000-8000-000000000001', 485000, 0, 12, 34, 0.4,
  true, true,
  'Kain batik tulis motif jlamprang, tulis tangan oleh perajin desa.',
  'Dibuat dengan teknik tulis tangan menggunakan canting. Motif jlamprang yang diwariskan turun-temurun dari perajin Sidoarjo. Berbahan katun prima yang tidak mudah luntur, sudah dilorod dan siap pakai.',
  'Katun prima', 'Sekitar 200 × 110 cm', 'Cuci tangan dengan air dingin dan sabun lembut.',
  '{Handmade,Katun Prima,Siap Pakai}', '{assets/img/products/batik-tulis-kriya-cpu.webp}',
  now() - interval '48 days'
),
(
  'b0000000-0000-4000-8000-000000000002', 'batik-cap-sdm-klasik', 'Batik Cap SDM Klasik',
  'a0000000-0000-4000-8000-000000000001', 185000, 0, 40, 128, 0.5,
  false, true,
  'Batik cap dengan pewarna alam, motif khas Sidoarjo.',
  'Batik cap dengan pewarnaan alami dari indigo dan akar mengkudu. Proses capping dilakukan manual memakai cap tembaga. Warnanya tahan lama dan ramah lingkungan.',
  'Katun dengan pewarna alam', 'Sekitar 200 × 110 cm', 'Cuci terpisah dengan sabun lembut.',
  '{Pewarna Alami,Motif Klasik}', '{}',
  now() - interval '46 days'
),
(
  'b0000000-0000-4000-8000-000000000003', 'batik-sogan-kawung', 'Batik Sogan Motif Kawung',
  'a0000000-0000-4000-8000-000000000001', 350000, 0, 18, 47, 0.4,
  false, true,
  'Sogan cokelat premium, motif kawung klasik.',
  'Pewarna sogan dari kulit kayu menghasilkan warna cokelat keemasan yang khas. Motif kawung sebagai simbol keabadian. Bahannya kain katun yang nyaman di kulit.',
  'Katun dengan pewarna sogan', 'Sekitar 200 × 110 cm', 'Cuci terpisah dengan sabun lembut.',
  '{Premium,Katun}', '{}',
  now() - interval '44 days'
),
(
  'b0000000-0000-4000-8000-000000000004', 'tas-ransel-kriya-cordura', 'Tas Ransel Kriya Cordura',
  'a0000000-0000-4000-8000-000000000002', 275000, 0, 22, 63, 0.9,
  false, true,
  'Cordura anti air, muat laptop 15 inci.',
  'Ransel dari bahan cordura 600D anti air dengan jahitan tangan yang kuat. Kompartemen laptop 15 inci, dua kantong ber-resleting, dan kantong air minum di samping.',
  'Cordura 600D', 'Sekitar 42 × 30 × 15 cm', 'Lap dengan kain lembap; jangan direndam.',
  '{Anti Air,Jahitan Tangan,Laptop 15 inci}', '{}',
  now() - interval '42 days'
),
(
  'b0000000-0000-4000-8000-000000000005', 'dompet-kulit-sapi-cokelat', 'Dompet Kulit Sapi Cokelat',
  'a0000000-0000-4000-8000-000000000002', 145000, 0, 55, 158, 0.2,
  true, true,
  'Kulit sapi full grain, makin awet makin bagus.',
  'Kulit sapi full grain yang menua cantik seiring pemakaian. Dijahit dengan teknik saddle stitch yang jauh lebih kuat dari jahitan mesin biasa.',
  'Kulit sapi full grain', 'Sekitar 11 × 9 cm', 'Bersihkan dengan kain kering dan gunakan pelembap kulit.',
  '{Full Grain,Saddle Stitch}', '{assets/img/products/dompet-kulit-sapi-cokelat.webp}',
  now() - interval '40 days'
),
(
  'b0000000-0000-4000-8000-000000000006', 'tas-travel-kulit', 'Tas Travel Kulit',
  'a0000000-0000-4000-8000-000000000002', 550000, 20, 9, 21, 1.4,
  false, true,
  'Ukuran 40x30x20 cm, pas untuk bagasi kabin.',
  'Ukuran 40 × 30 × 20 cm yang pas untuk batas bagasi kabin maskapai domestik. Dilengkapi tali trolley, kunci kombinasi, dan lapisan tahan air.',
  'Kulit sapi dan lapisan tahan air', '40 × 30 × 20 cm', 'Simpan di tempat kering dan bersihkan dengan kain lembut.',
  '{Size Kabin,Kulit Sapi}', '{}',
  now() - interval '38 days'
),
(
  'b0000000-0000-4000-8000-000000000007', 'sepatu-kulit-pria-formal', 'Sepatu Kulit Pria Formal',
  'a0000000-0000-4000-8000-000000000003', 425000, 0, 15, 38, 1.1,
  false, true,
  'Kulit pull-up, outsole karet anti slip.',
  'Sepatu formal dengan konstruksi yang nyaman dipakai seharian. Upper dari kulit pull-up dengan outsole karet anti slip. Dibuat oleh perajin lokal.',
  'Kulit pull-up dan sol karet', 'Ukuran tersedia 39–44', 'Bersihkan dan poles kulit secara berkala.',
  '{Handmade,Anti Slip}', '{}',
  now() - interval '36 days'
),
(
  'b0000000-0000-4000-8000-000000000008', 'sandal-kulit-pria', 'Sandal Kulit Pria',
  'a0000000-0000-4000-8000-000000000003', 225000, 17, 27, 71, 0.8,
  true, true,
  'Sol busa ringan, nyaman untuk harian.',
  'Sandal dengan sol busa EVA yang ringan dan alas kulit yang nyaman. Praktis untuk dipakai harian maupun bepergian singkat.',
  'Kulit dan sol busa EVA', 'Ukuran tersedia 39–44', 'Lap hingga kering setelah terkena air.',
  '{Ringan,Sehari-hari}', '{}',
  now() - interval '34 days'
),
(
  'b0000000-0000-4000-8000-000000000009', 'kalung-ukir-jati-koi', 'Kalung Ukir Jati Motif Koi',
  'a0000000-0000-4000-8000-000000000004', 165000, 0, 20, 44, 0.1,
  true, true,
  'Ukiran 3D motif koi dari kayu jati pilihan.',
  'Diukir tangan dari kayu jati solid oleh pengrajin lokal. Motif koi melambangkan ketekunan dan keberanian. Sudah termasuk rantai dan kotak penyimpanan.',
  'Kayu jati solid', 'Liontin sekitar 4 × 3 cm', 'Hindari air dan simpan di kotak saat tidak dipakai.',
  '{Hand Carved,Jati Solid}', '{}',
  now() - interval '32 days'
),
(
  'b0000000-0000-4000-8000-000000000010', 'relief-kayu-jati-ikan', 'Relief Kayu Jati Motif Ikan',
  'a0000000-0000-4000-8000-000000000004', 1250000, 0, 4, 7, 3.2,
  false, true,
  'Panel relief 60x90 cm, bisa custom motif.',
  'Panel ukir untuk dinding ukuran 60 × 90 cm. Motif dapat disesuaikan permintaan seperti ikan, gunung, atau wayang. Estimasi pengerjaan empat belas hari kerja.',
  'Kayu jati solid', '60 × 90 cm; motif dapat dipesan khusus', 'Bersihkan dengan kemoceng atau kain kering.',
  '{Custom,Panel Dinding}', '{}',
  now() - interval '30 days'
),
(
  'b0000000-0000-4000-8000-000000000011', 'boneka-kain-handmade', 'Boneka Kain Handmade',
  'a0000000-0000-4000-8000-000000000003', 85000, 0, 18, 0, 0.2,
  true, true,
  'Boneka kain buatan tangan dengan motif batik.',
  'Boneka kain bermotif batik yang dijahit tangan. Cocok menjadi hadiah atau hiasan dan dapat dibersihkan dengan lap lembut.',
  'Kain katun bermotif batik', 'Sekitar 18 cm', 'Bersihkan dengan lap lembut dan hindari pemutih.',
  '{Handmade,Kain Batik,Hadiah}', '{assets/img/products/boneka-kain-handmade.webp}',
  now() - interval '28 days'
),
(
  'b0000000-0000-4000-8000-000000000012', 'gantungan-kunci-kulit', 'Gantungan Kunci Kulit',
  'a0000000-0000-4000-8000-000000000003', 35000, 0, 30, 0, 0.05,
  false, true,
  'Gantungan kunci kulit dengan jahitan tangan.',
  'Aksesori gantungan kunci berbahan kulit dengan ring logam dan jahitan tangan. Ukurannya praktis untuk kunci rumah maupun kendaraan.',
  'Kulit dan ring logam', 'Sekitar 8 cm, termasuk ring', 'Jaga tetap kering dan bersihkan dengan kain lembut.',
  '{Handmade,Kulit,Aksesori}', '{assets/img/products/gantungan-kunci-kulit.webp}',
  now() - interval '26 days'
),
(
  'b0000000-0000-4000-8000-000000000013', 'kipas-anyaman-bambu', 'Kipas Anyaman Bambu',
  'a0000000-0000-4000-8000-000000000003', 45000, 0, 24, 0, 0.1,
  false, true,
  'Kipas bambu ringan dengan anyaman rapi.',
  'Kipas tangan sederhana dari bambu dengan rangka yang ringan. Praktis dibawa dan cocok sebagai aksesori atau cendera mata.',
  'Bambu', 'Sekitar 40 × 23 cm saat dibuka', 'Simpan di tempat kering dan jangan ditekuk berlebihan.',
  '{Handmade,Bambu,Cendera Mata}', '{assets/img/products/kipas-anyaman-bambu.webp}',
  now() - interval '24 days'
),
(
  'b0000000-0000-4000-8000-000000000014', 'meja-kayu-jati', 'Meja Kayu Jati',
  'a0000000-0000-4000-8000-000000000004', 1850000, 0, 5, 0, 12,
  false, true,
  'Meja kayu bernuansa natural untuk ruang keluarga.',
  'Meja kayu bergaya natural dengan serat kayu yang tampak jelas. Cocok sebagai meja ruang keluarga atau meja kopi.',
  'Kayu solid', 'Ukuran dan detail mengikuti produk pada foto', 'Lap dengan kain kering dan hindari paparan air berlebih.',
  '{Kayu,Furnitur,Natural}', '{assets/img/products/meja-kayu-jati.webp}',
  now() - interval '22 days'
),
(
  'b0000000-0000-4000-8000-000000000015', 'tas-anyaman-bambu', 'Tas Anyaman Bambu',
  'a0000000-0000-4000-8000-000000000002', 175000, 0, 12, 0, 0.6,
  true, true,
  'Tas anyaman natural dengan pegangan kokoh.',
  'Tas anyaman bernuansa natural dengan desain ringan untuk membawa barang pribadi. Setiap anyaman memiliki karakter tersendiri.',
  'Bahan anyaman alami', 'Ukuran mengikuti produk pada foto', 'Jaga tetap kering dan bersihkan dengan sikat lembut.',
  '{Anyaman,Handmade,Natural}', '{assets/img/products/tas-anyaman-bambu.webp}',
  now() - interval '20 days'
),
(
  'b0000000-0000-4000-8000-000000000016', 'tas-rotan', 'Tas Rotan',
  'a0000000-0000-4000-8000-000000000002', 195000, 0, 10, 0, 0.7,
  false, true,
  'Tas rotan ringan dengan bentuk praktis.',
  'Tas dari bahan rotan dengan bentuk sederhana dan tali panjang. Cocok digunakan untuk membawa barang pribadi saat bepergian.',
  'Rotan dan tali kain', 'Ukuran mengikuti produk pada foto', 'Simpan di tempat kering dan hindari beban berlebih.',
  '{Rotan,Anyaman,Handmade}', '{assets/img/products/tas-rotan.webp}',
  now() - interval '18 days'
)
on conflict (slug) do nothing;

-- ============================================================================
-- 3. VARIASI PRODUK (sepatu kulit: pilih ukuran)
-- ============================================================================
insert into public.product_variants (id, product_id, label, stock, sort) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000007', 'Ukuran 39', 4, 1),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000007', 'Ukuran 40', 6, 2),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000007', 'Ukuran 41', 3, 3),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000007', 'Ukuran 42', 2, 4)
on conflict do nothing;

-- ============================================================================
-- 4. VOUCHER
-- ============================================================================
insert into public.vouchers (code, type, value, min_spend, max_discount, quota, used, active, expires_at, description) values
  ('KRIYA10', 'percent', 10, 200000, 50000, 100, 23, true, null,
   'Diskon 10% untuk belanja di atas Rp200.000, potongan maksimal Rp50.000.'),
  ('HEMAT25K', 'fixed', 25000, 300000, 0, 50, 11, true, null,
   'Potongan tetap Rp25.000 untuk belanja di atas Rp300.000.'),
  ('GRATISONGKIR', 'freeship', 0, 150000, 0, 200, 64, true, null,
   'Gratis ongkir kirim untuk belanja di atas Rp150.000.'),
  ('PANGKAS10', 'percent', 10, 0, 20000, 1, 0, true, now() - interval '3 days',
   'Voucher contoh. Kedaluwarsa tiga hari lalu sehingga tidak bisa dipakai.'),
  ('MERAJAHUT', 'percent', 15, 500000, 100000, 20, 4, false, null,
   'Diskon 15% untuk belanja di atas Rp500.000. Sedang dinonaktifkan admin.')
on conflict (code) do nothing;

-- ============================================================================
-- 5. PENGATURAN TOKO
-- ============================================================================
insert into public.store_settings (
  id, store_name, wa_number, free_shipping_min, cod_zones, cod_fee,
  regular_cost, express_cost, sameday_cost
) values (
  1, 'Toko Kriya Sidoarjo', '6285745120164', 500000,
  '{sidoarjo,surabaya,grosok,gedangan,tangerang,waru,krian,buduran}',
  5000, 15000, 25000, 35000
)
on conflict (id) do nothing;

-- ============================================================================
-- 6. PESANAN DEMO sengaja tidak di-seed agar tidak memerlukan akun contoh
-- ============================================================================
-- ============================================================================
-- 7. ULASAN DEMO (acak tapi konsisten, ±64 ulasan)
-- ============================================================================
select setseed(0.20261005);

with data as (
  select
    p.id as product_id,
    g.i as n,
    random() as roll_author,
    random() as roll_rating,
    random() as roll_status,
    random() as roll_days,
    random() as roll_text
  from public.products p
  cross join generate_series(1, 4) as g(i)
),
base as (
  select
    d.product_id,
    case
      when d.roll_rating > 0.80 then 5
      when d.roll_rating > 0.45 then 4
      when d.roll_rating > 0.22 then 3
      when d.roll_rating > 0.08 then 2
      else 1
    end as rating,
    (array[
      'Dewi Anggraini','Rizky Pratama','Sinta Maharani','Bagus Wicaksono',
      'Nurul Hidayah','Agus Setiawan','Putri Larasati','Fajar Nugroho',
      'Intan Permata','Yoga Saputra','Rina Oktaviani','Hendra Kusuma',
      'Ayu Lestari','Bayu Saputra','Lina Marlina','Doni Ramadhan'
    ])[1 + floor(d.roll_author * 16)::int] as author,
    case when d.roll_status > 0.94 then 'pending' else 'published' end as status,
    now() - ((2 + floor(d.roll_days * 118))::int || ' days')::interval as created_at,
    d.roll_text
  from data d
)
insert into public.reviews (product_id, author, rating, text, status, created_at)
select
  b.product_id,
  b.author,
  b.rating,
  case b.rating
    when 5 then (array[
      'Barang sesuai foto dan deskripsi, pengemasannya rapi banget. Recommended!',
      'Kualitasnya di luar ekspektasi untuk harga segini. Pengerjaannya detail.',
      'Sampai dua hari lebih cepat dari perkiraan. Penjual responsif dan ramah.',
      'Sudah dua kali order, tidak pernah kecewa. Kualitasnya konsisten.',
      'Packing bubble wrap tebal, aman sampai tanpa retak sedikit pun.'
    ])[1 + floor(b.roll_text * 5)::int]
    when 4 then (array[
      'Bagus, cuma pengirimannya agak lama dari perkiraan. Produknya sendiri oke.',
      'Sesuai ekspektasi. Semoga awet dipakai jangka panjang.',
      'Warna sedikit beda dari foto, tapi tetap bagus. Recommended.',
      'Kualitas bagus, tapi kemasan luar penyok sedikit karena pengiriman.'
    ])[1 + floor(b.roll_text * 4)::int]
    when 3 then (array[
      'Lumayan, tapi ada bagian yang finishing-nya kurang rapi.',
      'Oke untuk harganya, tapi tidak istimewa seperti yang dibayangkan.',
      'Ukurannya sedikit lebih kecil dari dugaan. Selebihnya oke.'
    ])[1 + floor(b.roll_text * 3)::int]
    when 2 then (array[
      'Agak kecewa, ada goresan kecil saat sampai. Penjualnya fast respon kok.',
      'Jahitan di satu sisi kurang rapi, untungnya masih layak dipakai.'
    ])[1 + floor(b.roll_text * 2)::int]
    else 'Barang lama sampai dan sempat tidak ada kabar. Sudah dua kali chat.'
  end as text,
  b.status,
  b.created_at
from base b;

-- Pastikan rating produk terhitung ulang setelah ulasan masuk
update public.products p set
  rating = coalesce((
    select round(avg(r.rating), 1) from public.reviews r
    where r.product_id = p.id and r.status = 'published'
  ), 0),
  reviews_count = (
    select count(*) from public.reviews r
    where r.product_id = p.id and r.status = 'published'
  );
