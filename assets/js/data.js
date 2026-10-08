/* =========================================================================
   Toko Kriya Sidoarjo — Lapisan Data (Prototype)
   Semua data disimpan di localStorage browser. Tidak ada server.
   ========================================================================= */

const DB_KEY = 'tks_db_v1';
const SCHEMA_VERSION = 14;

/* Produk makanan dihapus dari katalog (fokus toko jadi kerajinan saja) */
const RETIRED_PRODUCT_IDS = ['p4', 'p5', 'p6', 'p14', 'p15', 'p16'];

/* Ongkos kirim gratis otomatis untuk belanja di atas ambang ini */
const FREE_SHIPPING_MIN = 500000;

/* COD hanya dilayani di wilayah ini */
const COD_ZONES = ['sidoarjo', 'surabaya', 'grosok', 'gedangan', 'tangerang', 'waru', 'krian', 'buduran'];

function productSalePrice(product) {
  const discount = Math.min(90, Math.max(0, Number(product.discountPercent) || 0));
  return Math.round(product.price * (1 - discount / 100));
}

function orderItemImage(item) {
  const isProductImage = (src) =>
    typeof src === 'string' &&
    (src.startsWith('data:image/') ||
      /^assets\/img\/products\/[a-z0-9-]+\.(?:jpe?g|png|webp|gif|avif)$/i.test(src));
  if (isProductImage(item.image)) return item.image;
  const product = Store.findProduct(item.productId);
  return product
    ? Store.productImages(product).find((src) => isProductImage(src)) || ''
    : '';
}

const CATEGORIES = [
  { slug: 'batik',  name: 'Batik',        icon: '👘', color: '#C2643B' },
  { slug: 'tas',    name: 'Tas & Dompet', icon: '👜', color: '#8A5A44' },
  { slug: 'aksesoris', name: 'Aksesoris', icon: '🧷', color: '#5C6B73' },
  { slug: 'kriya',  name: 'Kriya Kayu',   icon: '🪵', color: '#6B7F5E' },
];

const SEED_PRODUCTS = [
  {
    id: 'p1', slug: 'batik-tulis-sidoarjo', name: 'Batik Tulis Sidoarjo',
    category: 'batik', price: 485000, stock: 12, sold: 34, icon: '👘', weight: 0.4, images: ['assets/img/products/batik-tulis-kriya-cpu.jpg'], featured: true,
    short: 'Kain batik tulis motif jlamprang, tulis tangan oleh perajin desa.',
    desc: 'Dibuat dengan teknik tulis tangan menggunakan canting. Motif jlamprang yang diwariskan turun-temurun dari perajin Sidoarjo. Berbahan katun prima yang tidak mudah luntur, sudah dilorod dan siap pakai.',
    material: 'Katun prima',
    dimensions: 'Sekitar 200 × 110 cm',
    care: 'Cuci tangan dengan air dingin dan sabun lembut.',
    tags: ['Handmade', 'Katun Prima', 'Siap Pakai'],
  },
  {
    id: 'p2', slug: 'batik-cap-sdm-klasik', name: 'Batik Cap SDM Klasik',
    category: 'batik', price: 185000, stock: 40, sold: 128, icon: '👘', weight: 0.5, images: ['assets/img/products/batik-cap-sdm-klasik.svg'], featured: true,
    short: 'Batik cap dengan pewarna alam, motif khas Sidoarjo.',
    desc: 'Batik cap dengan pewarna alami dari indigo dan akar mengkudu. Proses capping dilakukan manual memakai cap tembaga. Warnanya tahan lama dan ramah lingkungan.',
    material: 'Katun dengan pewarna alam',
    dimensions: 'Sekitar 200 × 110 cm',
    care: 'Cuci terpisah dengan sabun lembut.',
    tags: ['Pewarna Alami', 'Ekspor-ready'],
  },
  {
    id: 'p3', slug: 'batik-sogan-kawung', name: 'Batik Sogan Motif Kawung',
    category: 'batik', price: 350000, stock: 18, sold: 47, icon: '👘', weight: 0.4, images: ['assets/img/products/batik-sogan-kawung.svg'],
    short: 'Sogan cokelat premium, motif kawung klasik.',
    desc: 'Pewarna sogan dari kulit kayu sogan menghasilkan warna cokelat keemasan yang khas. Motif kawung sebagai simbol keabadian. Bahannya kain katun yang nyaman di kulit.',
    material: 'Katun dengan pewarna sogan',
    dimensions: 'Sekitar 200 × 110 cm',
    care: 'Cuci terpisah dengan sabun lembut.',
    tags: ['Premium', 'Katun'],
  },
  {
    id: 'p7', slug: 'tas-ransel-kriya-cordura', name: 'Tas Ransel Kriya Cordura',
    category: 'tas', price: 275000, stock: 22, sold: 63, icon: '👜', weight: 0.9, images: ['assets/img/products/tas-ransel-kriya-cordura.svg'],
    short: 'Cordura anti air, muat laptop 15 inci.',
    desc: 'Ransel dari bahan cordura 600D anti air dengan jahitan tangan yang kuat. Kompartemen laptop 15 inci, dua kantong ber zipper, dan kantong air minum samping.',
    material: 'Cordura 600D',
    dimensions: 'Sekitar 42 × 30 × 15 cm',
    care: 'Lap dengan kain lembap; jangan direndam.',
    tags: ['Anti Air', 'Jahitan Tangan', 'Laptop 15 inci'],
  },
  {
    id: 'p8', slug: 'dompet-kulit-sapi-cokelat', name: 'Dompet Kulit Sapi Cokelat',
    category: 'tas', price: 145000, stock: 55, sold: 158, icon: '👜', weight: 0.2, images: ['assets/img/products/dompet-kulit-sapi-cokelat.jpg'], featured: true,
    short: 'Kulit sapi full grain, makin awet makin bagus.',
    desc: 'Kulit sapi full grain yang menua cantik seiring pemakaian. Dijahit dengan teknik saddle stitch yang jauh lebih kuat dari jahit mesin biasa.',
    material: 'Kulit sapi full grain',
    dimensions: 'Sekitar 11 × 9 cm',
    care: 'Bersihkan dengan kain kering dan gunakan pelembap kulit.',
    tags: ['Full Grain', 'Saddle Stitch'],
  },
  {
    id: 'p9', slug: 'tas-travel-kulit', name: 'Tas Travel Kulit',
    category: 'tas', price: 550000, stock: 9, sold: 21, icon: '👜', weight: 1.4, images: ['assets/img/products/tas-travel-kulit.svg'], discountPercent: 20,
    short: 'Ukuran 40x30x20 cm, pas untuk bagasi kabin.',
    desc: 'Ukuran 40x30x20 cm yang pas untuk batas bagasi kabin maskapai domestik. Dilengkapi tali trolley, kunci kombinasi, dan lining tahan air.',
    material: 'Kulit sapi dan lapisan tahan air',
    dimensions: '40 × 30 × 20 cm',
    care: 'Simpan di tempat kering dan bersihkan dengan kain lembut.',
    tags: ['Size Kabin', 'Kulit Sapi'],
  },
  {
    id: 'p10', slug: 'sepatu-kulit-pria-formal', name: 'Sepatu Kulit Pria Formal',
    category: 'sepatu', price: 425000, stock: 15, sold: 38, icon: '👟', weight: 1.1, images: ['assets/img/products/sepatu-kulit-pria-formal.svg'],
    short: 'Kulit pull-up, outsole karet anti slip.',
    desc: 'Sepatu formal dengan konstruksi yang nyaman dipakai seharian. Upper dari kulit pull-up dengan outsole karet anti slip. Dibuat oleh perajin lokal.',
    material: 'Kulit pull-up dan sol karet',
    dimensions: 'Ukuran tersedia 39–44',
    care: 'Bersihkan dan poles kulit secara berkala.',
    tags: ['Handmade', 'Anti Slip'],
  },
  {
    id: 'p11', slug: 'sandal-kulit-pria', name: 'Sandal Kulit Pria',
    category: 'sepatu', price: 225000, stock: 27, sold: 71, icon: '👟', weight: 0.8, images: ['assets/img/products/sandal-kulit-pria.svg'], discountPercent: 17, featured: true,
    short: 'Sol busa ringan, nyaman untuk harian.',
    desc: 'Sandal dengan sol busa EVA yang ringan dan alas kulit yang nyaman. Praktis untuk dipakai harian maupun bepergian singkat.',
    material: 'Kulit dan sol busa EVA',
    dimensions: 'Ukuran tersedia 39–44',
    care: 'Lap hingga kering setelah terkena air.',
    tags: ['Ringan', 'Sehari-hari'],
  },
  {
    id: 'p12', slug: 'kalung-ukir-jati-koi', name: 'Kalung Ukir Jati Motif Koi',
    category: 'kriya', price: 165000, stock: 20, sold: 44, icon: '🪵', weight: 0.1, images: ['assets/img/products/kalung-ukir-jati-koi.svg'], featured: true,
    short: 'Ukiran 3D motif koi dari kayu jati pilihan.',
    desc: 'Diukir tangan dari kayu jati solid oleh pengrajin lokal. Motif koi melambangkan ketekunan dan keberanian. Sudah termasuk rantai dan kotak penyimpanan.',
    material: 'Kayu jati solid',
    dimensions: 'Liontin sekitar 4 × 3 cm',
    care: 'Hindari air dan simpan di kotak saat tidak dipakai.',
    tags: ['Hand Carved', 'Jati Solid'],
  },
  {
    id: 'p13', slug: 'relief-kayu-jati-ikan', name: 'Relief Kayu Jati Motif Ikan',
    category: 'kriya', price: 1250000, stock: 4, sold: 7, icon: '🪵', weight: 3.2, images: ['assets/img/products/relief-kayu-jati-ikan.svg'],
    short: 'Panel relief 60x90 cm, bisa custom motif.',
    desc: 'Panel ukir untuk dinding ukuran 60x90 cm. Motif dapat disesuaikan permintaan seperti ikan, gunung, atau wayang. Estimasi pengerjaan empat belas hari kerja.',
    material: 'Kayu jati solid',
    dimensions: '60 × 90 cm; motif dapat dipesan khusus',
    care: 'Bersihkan dengan kemoceng atau kain kering.',
    tags: ['Custom', 'Panel Dinding'],
  },
  {
    id: 'p17', slug: 'boneka-kain-handmade', name: 'Boneka Kain Handmade',
    category: 'aksesoris', price: 85000, stock: 18, sold: 0, icon: '🧸', weight: 0.2, images: ['assets/img/products/boneka-kain-handmade.jpg'], featured: true,
    short: 'Boneka kain buatan tangan dengan motif batik.',
    desc: 'Boneka kain bermotif batik yang dijahit tangan. Cocok menjadi hadiah atau hiasan dan dapat dibersihkan dengan lap lembut.',
    material: 'Kain katun bermotif batik',
    dimensions: 'Sekitar 18 cm',
    care: 'Bersihkan dengan lap lembut dan hindari pemutih.',
    tags: ['Handmade', 'Kain Batik', 'Hadiah'],
  },
  {
    id: 'p18', slug: 'gantungan-kunci-kulit', name: 'Gantungan Kunci Kulit',
    category: 'aksesoris', price: 35000, stock: 30, sold: 0, icon: '🔑', weight: 0.05, images: ['assets/img/products/gantungan-kunci-kulit.webp'],
    short: 'Gantungan kunci kulit dengan jahitan tangan.',
    desc: 'Aksesori gantungan kunci berbahan kulit dengan ring logam dan jahitan tangan. Ukurannya praktis untuk kunci rumah maupun kendaraan.',
    material: 'Kulit dan ring logam',
    dimensions: 'Sekitar 8 cm, termasuk ring',
    care: 'Jaga tetap kering dan bersihkan dengan kain lembut.',
    tags: ['Handmade', 'Kulit', 'Aksesori'],
  },
  {
    id: 'p19', slug: 'kipas-anyaman-bambu', name: 'Kipas Anyaman Bambu',
    category: 'aksesoris', price: 45000, stock: 24, sold: 0, icon: '🪭', weight: 0.1, images: ['assets/img/products/kipas-anyaman-bambu.jpg'],
    short: 'Kipas bambu ringan dengan anyaman rapi.',
    desc: 'Kipas tangan sederhana dari bambu dengan rangka yang ringan. Praktis dibawa dan cocok sebagai aksesori atau cendera mata.',
    material: 'Bambu',
    dimensions: 'Sekitar 40 × 23 cm saat dibuka',
    care: 'Simpan di tempat kering dan jangan ditekuk berlebihan.',
    tags: ['Handmade', 'Bambu', 'Cendera Mata'],
  },
  {
    id: 'p20', slug: 'meja-kayu-jati', name: 'Meja Kayu Jati',
    category: 'kriya', price: 1850000, stock: 5, sold: 0, icon: '🪵', weight: 12, images: ['assets/img/products/meja-kayu-jati.jpg'],
    short: 'Meja kayu bernuansa natural untuk ruang keluarga.',
    desc: 'Meja kayu bergaya natural dengan serat kayu yang tampak jelas. Cocok sebagai meja ruang keluarga atau meja kopi.',
    material: 'Kayu solid',
    dimensions: 'Ukuran dan detail mengikuti produk pada foto',
    care: 'Lap dengan kain kering dan hindari paparan air berlebih.',
    tags: ['Kayu', 'Furnitur', 'Natural'],
  },
  {
    id: 'p21', slug: 'tas-anyaman-bambu', name: 'Tas Anyaman Bambu',
    category: 'tas', price: 175000, stock: 12, sold: 0, icon: '👜', weight: 0.6, images: ['assets/img/products/tas-anyaman-bambu.jpg'], featured: true,
    short: 'Tas anyaman natural dengan pegangan kokoh.',
    desc: 'Tas anyaman bernuansa natural dengan desain ringan untuk membawa barang pribadi. Setiap anyaman memiliki karakter tersendiri.',
    material: 'Bahan anyaman alami',
    dimensions: 'Ukuran mengikuti produk pada foto',
    care: 'Jaga tetap kering dan bersihkan dengan sikat lembut.',
    tags: ['Anyaman', 'Handmade', 'Natural'],
  },
  {
    id: 'p22', slug: 'tas-rotan', name: 'Tas Rotan',
    category: 'tas', price: 195000, stock: 10, sold: 0, icon: '👜', weight: 0.7, images: ['assets/img/products/tas-rotan.jpg'],
    short: 'Tas rotan ringan dengan bentuk praktis.',
    desc: 'Tas dari bahan rotan dengan bentuk sederhana dan tali panjang. Cocok digunakan untuk membawa barang pribadi saat bepergian.',
    material: 'Rotan dan tali kain',
    dimensions: 'Ukuran mengikuti produk pada foto',
    care: 'Simpan di tempat kering dan hindari beban berlebih.',
    tags: ['Rotan', 'Anyaman', 'Handmade'],
  },
];

/* ------------------------------ Helpers ------------------------------ */

const rupiah = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');

const uid = (prefix) =>
  prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

const slugify = (s) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const variantIdForLabel = (label) => {
  let hash = 2166136261;
  for (const char of label.trim().toLowerCase()) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return 'variant-' + (hash >>> 0).toString(36);
};

const categoryName = (slug) =>
  (CATEGORIES.find((c) => c.slug === slug) || { name: slug }).name;

const daysAgo = (n) => {
  const t = new Date('2026-10-05T09:00:00');
  t.setDate(t.getDate() - n);
  return t.toISOString();
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDateTime = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
  ' pukul ' + new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

/* Generator angka pseudo-acak yang stabil supaya data demo selalu sama */
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ---------------------------- Data Awal ---------------------------- */

const SEED_USERS = [
  {
    id: 'u1', name: 'Bayu Pamungkas', email: 'bayu@mail.com', password: 'bayu123',
    role: 'customer', phone: '081234567890',
    addresses: [
      {
        id: 'a1', label: 'Rumah', name: 'Bayu Pamungkas', phone: '081234567890',
        address: 'Jl. Raya Sidoarjo No. 12 RT 02 RW 05', city: 'Sidoarjo', postal: '61234',
        isDefault: true,
      },
    ],
  },
  {
    id: 'u2', name: 'Admin Toko', email: 'admin@tokokriya.id', password: 'admin123',
    role: 'admin', phone: '081298765432', addresses: [],
  },
];

const SEED_REVIEW_NAMES = [
  'Dewi Anggraini', 'Rizky Pratama', 'Sinta Maharani', 'Bagus Wicaksono',
  'Nurul Hidayah', 'Agus Setiawan', 'Putri Larasati', 'Fajar Nugroho',
  'Intan Permata', 'Yoga Saputra', 'Rina Oktaviani', 'Hendra Kusuma',
  'Ayu Lestari', 'Bayu Saputra', 'Lina Marlina', 'Doni Ramadhan',
];

const SEED_REVIEW_TEXTS = {
  5: [
    'Barang sesuai foto dan deskripsi, pengemasannya rapi banget. Recommended!',
    'Kualitasnya di luar ekspektasi untuk harga segini. Pengerjaan detail.',
    'Sampai dua hari sooner dari perkiraan. Penjual responsif dan ramah.',
    'Sudah dua kali order, tidak pernah kecewa. Kualitasnya konsisten.',
    'Packing bubble wrap tebal, aman sampai tanpa retak sedikit pun.',
  ],
  4: [
    'Bagus, cuma pengirimannya agak lama dari perkiraan. Produknya sendiri oke.',
    'Sesuai ekspektasi. Semoga awet dipakai jangka panjang.',
    'Warna sedikit beda dari foto, tapi tetap bagus. Recommended.',
    'Kualitas bagus, tapi kemasan luar penyok sedikit karena pengiriman.',
  ],
  3: [
    'Lumayan, tapi ada bagian yang finishing-nya kurang rapi.',
    'Oke untuk harganya, tapi tidak istimewa seperti yang dibayangkan.',
  ],
  2: ['Agak kecewa, ada goresan kecil saat sampai. Penjual fast respon kok.'],
  1: ['Barang tidak sampai dalam seminggu dan tidak ada kabar. Sudah dua kali chat.'],
};

function seedReviews(products) {
  const rand = seededRandom(20261005);
  const out = [];
  let n = 0;

  products.forEach((p, pi) => {
    const count = 3 + Math.floor(rand() * 4); /* 3 sampai 6 ulasan per produk */
    for (let i = 0; i < count; i++) {
      const roll = rand();
      const rating = roll > 0.78 ? 5 : roll > 0.4 ? 4 : roll > 0.2 ? 3 : roll > 0.08 ? 2 : 1;
      const pool = SEED_REVIEW_TEXTS[rating] || SEED_REVIEW_TEXTS[4];
      const author = SEED_REVIEW_NAMES[(pi * 3 + i * 5) % SEED_REVIEW_NAMES.length];
      n += 1;
      out.push({
        id: 'RV' + String(1000 + n),
        productId: p.id,
        userId: null,
        author,
        rating,
        text: pool[(pi + i) % pool.length],
        createdAt: daysAgo(2 + Math.floor(rand() * 120)),
        status: rand() > 0.94 ? 'pending' : 'published',
        reply: null,
        orderId: null,
      });
    }
  });

  return out;
}

function recalcProductRating(db, productId) {
  const p = db.products.find((x) => x.id === productId);
  if (!p) return;
  const live = db.reviews.filter((r) => r.productId === productId && r.status === 'published');
  p.reviews = live.length;
  p.rating = live.length
    ? Math.round((live.reduce((s, r) => s + r.rating, 0) / live.length) * 10) / 10
    : 0;
}

const SEED_ORDERS = [
  {
    id: 'ORD-2026-0011',
    userId: 'u1',
    createdAt: daysAgo(6),
    status: 'selesai',
    customer: {
      name: 'Bayu Pamungkas', phone: '081234567890', email: 'bayu@mail.com',
      address: 'Jl. Raya Sidoarjo No. 12 RT 02 RW 05', city: 'Sidoarjo', postal: '61234',
      note: '',
    },
    payment: 'transfer',
    shipping: 'reguler',
    items: [
      { productId: 'p8', name: 'Dompet Kulit Sapi Cokelat', price: 145000, qty: 2, icon: '👜', weight: 0.2 },
    ],
    subtotal: 290000, discount: 0, shippingCost: 15000, paymentFee: 0, total: 305000,
    voucher: null, resi: 'TKS251009338417', paidAt: daysAgo(6), cancelReason: null,
    statusHistory: [
      { status: 'menunggu', at: daysAgo(6), note: 'Pesanan dibuat, menunggu pembayaran' },
      { status: 'diproses', at: daysAgo(6), note: 'Pembayaran diterima via transfer bank' },
      { status: 'dikirim', at: daysAgo(5), note: 'Paket diserahkan ke kurir, resi TKS251009338417' },
      { status: 'selesai', at: daysAgo(3), note: 'Paket diterima pembeli' },
    ],
  },
  {
    id: 'ORD-2026-0012',
    userId: 'u1',
    createdAt: daysAgo(2),
    status: 'diproses',
    customer: {
      name: 'Bayu Pamungkas', phone: '081234567890', email: 'bayu@mail.com',
      address: 'Jl. Raya Sidoarjo No. 12 RT 02 RW 05', city: 'Sidoarjo', postal: '61234',
      note: 'Titip ke satpam bila rumah kosong.',
    },
    payment: 'qris',
    shipping: 'reguler',
    items: [
      { productId: 'p1', name: 'Batik Tulis Sidoarjo', price: 485000, qty: 1, icon: '👘', weight: 0.4 },
      { productId: 'p11', name: 'Sandal Kulit Pria', price: 265000, qty: 1, icon: '👟', weight: 0.8 },
    ],
    subtotal: 750000, discount: 50000, shippingCost: 0, paymentFee: 0, total: 700000,
    voucher: { code: 'KRIYA10', type: 'percent', value: 10, label: 'Diskon 10%' },
    resi: null, paidAt: daysAgo(2), cancelReason: null,
    statusHistory: [
      { status: 'menunggu', at: daysAgo(2), note: 'Pesanan dibuat, menunggu pembayaran QRIS' },
      { status: 'diproses', at: daysAgo(2), note: 'Pembayaran QRIS diterima' },
    ],
  },
];

const SEED_VOUCHERS = [
  {
    code: 'KRIYA10', type: 'percent', value: 10, minSpend: 200000, maxDiscount: 50000,
    quota: 100, used: 23, active: true, expiresAt: null,
    desc: 'Diskon 10% untuk belanja di atas Rp200.000, potongan maksimal Rp50.000.',
  },
  {
    code: 'HEMAT25K', type: 'fixed', value: 25000, minSpend: 300000, maxDiscount: 0,
    quota: 50, used: 11, active: true, expiresAt: null,
    desc: 'Potongan tetap Rp25.000 untuk belanja di atas Rp300.000.',
  },
  {
    code: 'GRATISONGKIR', type: 'freeship', value: 0, minSpend: 150000, maxDiscount: 0,
    quota: 200, used: 64, active: true, expiresAt: null,
    desc: 'Gratis ongkir kirim untuk belanja di atas Rp150.000.',
  },
  {
    code: 'PANGKAS10', type: 'percent', value: 10, minSpend: 0, maxDiscount: 20000,
    quota: 1, used: 0, active: true, expiresAt: daysAgo(3),
    desc: 'Voucher contoh. Kedaluwarsa tiga hari lalu sehingga tidak bisa dipakai.',
  },
  {
    code: 'MERAJAHUT', type: 'percent', value: 15, minSpend: 500000, maxDiscount: 100000,
    quota: 20, used: 4, active: false, expiresAt: null,
    desc: 'Diskon 15% untuk belanja di atas Rp500.000. Sedang dinonaktifkan admin.',
  },
];

function seedDB() {
  const db = {
    version: SCHEMA_VERSION,
    products: SEED_PRODUCTS.map((p) => ({ ...p, images: p.images || [] })),
    users: SEED_USERS.map((u) => ({ ...u, addresses: u.addresses || [] })),
    orders: SEED_ORDERS,
    reviews: [],
    vouchers: SEED_VOUCHERS.map((v) => ({ ...v })),
    cart: [],
    session: null,
  };
  db.reviews = seedReviews(db.products);
  db.products.forEach((p) => recalcProductRating(db, p.id));
  return db;
}

/* Migrasi data dari versi skema sebelumnya */
function migrate(db) {
  const fromVersion = typeof db.version === 'number' ? db.version : 0;
  db.version = SCHEMA_VERSION;

  if (!Array.isArray(db.products)) db.products = [];
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.orders)) db.orders = [];
  if (!Array.isArray(db.cart)) db.cart = [];
  if (!Array.isArray(db.reviews)) db.reviews = [];
  if (!Array.isArray(db.vouchers)) db.vouchers = SEED_VOUCHERS.map((v) => ({ ...v }));

  db.products.forEach((p) => {
    if (!Array.isArray(p.images)) p.images = [];
    if (!Array.isArray(p.tags)) p.tags = [];
    if (typeof p.weight !== 'number') p.weight = 0.2;
    if (typeof p.sold !== 'number') p.sold = 0;
    if (!Array.isArray(p.variants)) p.variants = [];
    if (p.variants.length) {
      p.variants.forEach((variant, index) => {
        if (!variant.id) variant.id = `variant-${index + 1}`;
        if (typeof variant.label !== 'string') variant.label = `Opsi ${index + 1}`;
        variant.stock = Math.max(0, Number.parseInt(variant.stock, 10) || 0);
      });
      p.stock = p.variants.reduce((sum, variant) => sum + variant.stock, 0);
    }
  });

  if (fromVersion < 5) {
    const seedById = new Map(SEED_PRODUCTS.map((p) => [p.id, p]));
    db.products.forEach((p) => {
      const seed = seedById.get(p.id);
      if (!seed) return;
      ['material', 'dimensions', 'care'].forEach((field) => {
        if (typeof p[field] !== 'string' || !p[field].trim()) p[field] = seed[field];
      });
      if (
        p.id === 'p3' &&
        p.desc === 'Pewarna sogan dari peel kayu sogan sehingga menghasilkan cokelat keemasan yang khas. Motif kawung sebagai simbol keabadian. Bahannya kain katron yang tidak panas di kulit.'
      ) {
        p.desc = seed.desc;
      }
      if (p.id === 'p3' && Array.isArray(p.tags)) {
        p.tags = p.tags.map((tag) => (tag === 'Kain Katron' ? 'Katun' : tag));
      }
      if (p.id === 'p9' && p.name === 'Tas Bek Travel Kulit') {
        p.name = seed.name;
        p.slug = seed.slug;
      }
    });
  }

  if (fromVersion < 6) {
    const seedById = new Map(SEED_PRODUCTS.map((p) => [p.id, p]));
    db.products.forEach((p) => {
      const seed = seedById.get(p.id);
      if (seed && !p.images.length) p.images = seed.images.slice();
    });
  }

  if (fromVersion < 7) {
    const seedById = new Map(SEED_PRODUCTS.map((p) => [p.id, p]));
    db.products.forEach((p) => {
      if (!['p1', 'p8'].includes(p.id)) return;
      const isPlaceholder = p.images[0]?.startsWith('assets/img/products/') && p.images[0].endsWith('.svg');
      if (isPlaceholder) {
        const productImage = seedById.get(p.id).images[0];
        p.images[0] = productImage;
      }
    });

    const existingIds = new Set(db.products.map((p) => p.id));
    SEED_PRODUCTS.filter((p) => ['p17', 'p18', 'p19', 'p20', 'p21', 'p22'].includes(p.id))
      .filter((p) => !existingIds.has(p.id))
      .forEach((p) => db.products.push({ ...p, images: p.images.slice(), tags: p.tags.slice() }));
  }

  if (fromVersion < 8) {
    const photoPaths = {
      p1: 'assets/img/products/batik-tulis-kriya-cpu.jpg',
      p8: 'assets/img/products/dompet-kulit-sapi-cokelat.jpg',
    };
    db.products.forEach((p) => {
      const photo = photoPaths[p.id];
      if (photo && p.images[0] === photo.replace(/\.jpg$/, '.svg')) p.images[0] = photo;
    });
  }

  if (fromVersion < 9) {
    const hasProductPhoto = (product) =>
      Array.isArray(product.images) &&
      product.images.some(
        (src) =>
          typeof src === 'string' &&
          (src.startsWith('data:image/') ||
            /^assets\/img\/products\/[a-z0-9-]+\.(?:jpe?g|png|webp|gif|avif)$/i.test(src))
      );
    const retainedIds = new Set(db.products.filter(hasProductPhoto).map((p) => p.id));
    db.products = db.products.filter((p) => retainedIds.has(p.id));
    db.cart = db.cart.filter((item) => retainedIds.has(item.productId));
    db.reviews = db.reviews.filter((review) => retainedIds.has(review.productId));
  }

  if (fromVersion < 10) {
    db.products.forEach((p) => {
      if (p.category === 'sepatu' || ['p18', 'p19'].includes(p.id)) p.category = 'aksesoris';
    });
  }

  if (fromVersion < 11) {
    const doll = db.products.find((p) => p.id === 'p17');
    if (doll) doll.category = 'aksesoris';
  }

  if (fromVersion < 12) {
    const featuredIds = new Set(['p1', 'p8', 'p17', 'p21']);
    db.products.forEach((p) => {
      if (featuredIds.has(p.id)) p.featured = true;
    });
  }

  if (fromVersion < 13) {
    const product = db.products.find((p) => p.id === 'p1');
    if (product && product.name === 'Batik Tulis Kriya CPU') {
      product.name = 'Batik Tulis Sidoarjo';
      product.slug = 'batik-tulis-sidoarjo';
    }
    const demoOrder = db.orders.find((o) => o.id === 'ORD-2026-0012');
    if (Array.isArray(demoOrder?.items)) demoOrder.items.forEach((item) => {
      if (item.productId === 'p1' && item.name === 'Batik Tulis Kriya CPU') {
        item.name = 'Batik Tulis Sidoarjo';
      }
    });
  }

  /* Produk unggulan ditandai manual lewat admin, jadi data lama diisi dari daftar seed */
  if (fromVersion < 4) {
    const seedFeatured = new Set(SEED_PRODUCTS.filter((p) => p.featured).map((p) => p.id));
    db.products.forEach((p) => {
      if (typeof p.featured !== 'boolean') p.featured = seedFeatured.has(p.id);
    });
  }

  db.users.forEach((u) => {
    if (!Array.isArray(u.addresses)) u.addresses = [];
    if (typeof u.phone !== 'string') u.phone = '';
    /* Alamat dari skema lama belum punya id, padahal picker checkout butuh id */
    const used = new Set();
    u.addresses.forEach((a) => {
      if (!a.id || used.has(a.id)) a.id = uid('addr');
      used.add(a.id);
      if (typeof a.postal !== 'string') a.postal = '';
      if (typeof a.label !== 'string') a.label = 'Alamat';
    });
  });

  db.orders.forEach((o) => {
    if (typeof o.discount !== 'number') o.discount = 0;
    if (!o.voucher) o.voucher = null;
    if (!('resi' in o)) o.resi = null;
    if (!('cancelReason' in o)) o.cancelReason = null;
    if (!('paidAt' in o)) o.paidAt = null;
    if (!o.customer) o.customer = { name: '', phone: '', email: '', address: '', city: '', postal: '', note: '' };
    if (!('note' in o.customer)) o.customer.note = '';
    if (!Array.isArray(o.statusHistory) || !o.statusHistory.length) {
      o.statusHistory = [{ status: o.status, at: o.createdAt, note: 'Status awal pesanan' }];
    }
    const total = (o.subtotal || 0) - (o.discount || 0) + (o.shippingCost || 0) + (o.paymentFee || 0);
    if (typeof o.total !== 'number' || Math.abs(o.total - total) > 1) o.total = total;
  });

  db.reviews.forEach((r) => {
    if (!r.status) r.status = 'published';
    if (!('reply' in r)) r.reply = null;
  });

  /* Toko sekarang fokus kerajinan: buang produk makanan beserta sisanya */
  if (fromVersion < 3) {
    db.products = db.products.filter((p) => !RETIRED_PRODUCT_IDS.includes(p.id));
    db.reviews = db.reviews.filter((r) => !RETIRED_PRODUCT_IDS.includes(r.productId));
    db.cart = db.cart.filter((c) => !RETIRED_PRODUCT_IDS.includes(c.productId));
    db.orders = db.orders
      .map((o) => {
        if (!Array.isArray(o.items)) return o;
        const items = o.items.filter((i) => !RETIRED_PRODUCT_IDS.includes(i.productId));
        if (items.length === o.items.length) return o;
        /* Pesanan lama ikut dirapikan agar totalnya tidak lagi menyesatkan */
        const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
        const total = subtotal - (o.discount || 0) + (o.shippingCost || 0) + (o.paymentFee || 0);
        return { ...o, items, subtotal, total };
      })
      .filter((o) => !Array.isArray(o.items) || o.items.length > 0);
  }

  /* Basis data lama belum punya ulasan, jadi isi dengan ulasan demo */
  if (!db.reviews.length && db.products.length) {
    db.reviews = seedReviews(db.products);
  }
  db.products.forEach((p) => recalcProductRating(db, p.id));

  return db;
}

/* ------------------------------- Store ------------------------------- */

const Store = {
  db: null,
  quotaError: false,

  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      this.db = raw ? migrate(JSON.parse(raw)) : seedDB();
    } catch (e) {
      this.db = seedDB();
    }
    if (!this.db.products.length) this.db.products = SEED_PRODUCTS;
    if (!this.db.users.length) this.db.users = SEED_USERS;
    return this.db;
  },

  save() {
    this.quotaError = false;
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.db));
    } catch (e) {
      this.quotaError = true;
      return false;
    }
    return true;
  },

  /* -------- products -------- */
  products() { return this.db.products; },

  featuredProducts() {
    return this.db.products
      .filter((p) => p.featured && p.stock > 0)
      .sort((a, b) => b.sold - a.sold);
  },

  allTags() {
    const set = new Set();
    this.db.products.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  },

  findProduct(id) {
    return this.db.products.find((p) => p.id === id || p.slug === id);
  },

  productImages(p) {
    return (p.images || []).filter(
      (src) =>
        typeof src === 'string' &&
        (src.startsWith('data:image/') || /^assets\/img\/products\/[a-z0-9-]+\.(?:svg|jpg|webp)$/.test(src))
    );
  },

  saveProduct(data, id) {
    let product;
    if (id) {
      const i = this.db.products.findIndex((p) => p.id === id);
      product = { ...(i > -1 ? this.db.products[i] : {}), ...data, id };
      /* Slug ikut diperbarui saat nama berubah supaya findProduct( slug ) tetap benar */
      if (data.name && (!product.slug || product.slug !== slugify(data.name))) {
        product.slug = slugify(data.name);
      }
      if (i > -1) this.db.products[i] = product;
      else this.db.products.push(product);
    } else {
      product = {
        ...data,
        id: uid('P'),
        slug: slugify(data.name),
        sold: 0,
        reviews: 0,
        rating: 0,
        featured: false,
      };
      this.db.products.unshift(product);
    }

    product.featured = product.featured === true;

    /* Simpan dulu lalu kembalikan status, supaya pemanggil bisa memberi tahu kuota penuh */
    if (!this.save()) {
      this.load();
      return null;
    }
    return product;
  },

  deleteProduct(id) {
    this.db.products = this.db.products.filter((p) => p.id !== id);
    this.db.cart = this.db.cart.filter((c) => c.productId !== id);
    this.db.reviews = this.db.reviews.filter((r) => r.productId !== id);
    this.save();
  },

  /* -------- cart -------- */
  cart() { return this.db.cart; },

  addToCart(productId, qty = 1, variantId = null) {
    const product = this.findProduct(productId);
    if (!product) return { ok: false, error: 'Produk tidak ditemukan.' };
    const variant = product.variants?.length
      ? product.variants.find((item) => item.id === variantId)
      : null;
    if (product.variants?.length && !variant) return { ok: false, error: 'Pilih variasi produk terlebih dahulu.' };
    if (variantId && !variant) return { ok: false, error: 'Variasi tersebut sudah tidak tersedia.' };
    const existing = this.db.cart.find(
      (item) => item.productId === productId && (item.variantId || null) === (variantId || null)
    );
    const nextQty = (existing?.qty || 0) + qty;
    const availableStock = variant ? variant.stock : product.stock;
    if (!Number.isInteger(qty) || qty < 1 || nextQty > availableStock) {
      return { ok: false, error: `Stok tersedia hanya ${availableStock} buah.` };
    }
    if (existing) existing.qty = nextQty;
    else this.db.cart.push({ productId, qty, ...(variant ? { variantId: variant.id } : {}) });
    if (!this.save()) {
      if (existing) existing.qty -= qty;
      else this.db.cart.pop();
      return { ok: false, error: 'Keranjang tidak dapat disimpan di browser ini.' };
    }
    return { ok: true };
  },

  setQty(productId, qty, variantId = null) {
    const item = this.db.cart.find(
      (c) => c.productId === productId && (c.variantId || null) === (variantId || null)
    );
    if (!item) return;
    if (qty <= 0) this.db.cart = this.db.cart.filter(
      (c) => c.productId !== productId || (c.variantId || null) !== (variantId || null)
    );
    else {
      const p = this.findProduct(productId);
      const variant = p?.variants?.find((entry) => entry.id === item.variantId);
      const stock = variant ? variant.stock : p?.stock;
      item.qty = stock == null ? qty : Math.min(qty, stock);
      if (item.qty <= 0) this.db.cart = this.db.cart.filter((c) => c !== item);
    }
    this.save();
  },

  clearCart() { this.db.cart = []; this.save(); },

  cartDetailed() {
    return this.db.cart
      .map((c) => {
        const p = this.findProduct(c.productId);
        if (!p) return null;
        const variant = c.variantId ? p.variants?.find((item) => item.id === c.variantId) : null;
        const variantMissing = Boolean(c.variantId && !variant);
        const variantRequired = Boolean(p.variants?.length && !c.variantId);
        const unitPrice = productSalePrice(p);
        return {
          ...c,
          product: p,
          variantLabel: variant?.label || '',
          variantRequired: variantRequired || variantMissing,
          variantMissing,
          availableStock: variantRequired || variantMissing ? 0 : variant ? variant.stock : p.stock,
          unitPrice,
          lineTotal: unitPrice * c.qty,
          originalLineTotal: p.price * c.qty,
          productDiscountTotal: (p.price - unitPrice) * c.qty,
        };
      })
      .filter(Boolean);
  },

  cartCount() {
    return this.db.cart.reduce((s, c) => s + c.qty, 0);
  },

  cartSubtotal() {
    return this.cartDetailed().reduce((s, i) => s + i.lineTotal, 0);
  },

  cartWeight() {
    return this.cartDetailed().reduce((s, i) => s + (i.product.weight || 0) * i.qty, 0);
  },

  /* -------- users -------- */
  users() { return this.db.users; },

  findUser(id) {
    return this.db.users.find((u) => u.id === id);
  },

  register(data) {
    const email = data.email.trim().toLowerCase();
    if (this.db.users.some((u) => u.email === email)) {
      return { ok: false, error: 'Email sudah terdaftar. Silakan masuk.' };
    }
    const user = {
      id: uid('U'), name: data.name.trim(), email, password: data.password, role: 'customer',
      phone: '', addresses: [],
    };
    this.db.users.push(user);
    this.save();
    return { ok: true, user };
  },

  login(email, password) {
    const user = this.db.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      return { ok: false, error: 'Email atau password salah.' };
    }
    this.db.session = { userId: user.id, at: new Date().toISOString() };
    this.save();
    return { ok: true, user };
  },

  logout() { this.db.session = null; this.save(); },

  currentUser() {
    if (!this.db.session) return null;
    return this.db.users.find((u) => u.id === this.db.session.userId) || null;
  },

  updateProfile(userId, data) {
    const u = this.findUser(userId);
    if (!u) return { ok: false, error: 'Akun tidak ditemukan.' };
    if (data.email && data.email !== u.email) {
      const email = data.email.trim().toLowerCase();
      if (this.db.users.some((x) => x.id !== userId && x.email === email)) {
        return { ok: false, error: 'Email sudah dipakai akun lain.' };
      }
      u.email = email;
    }
    if (typeof data.name === 'string' && data.name.trim().length >= 3) u.name = data.name.trim();
    if (typeof data.phone === 'string') u.phone = data.phone.trim();
    this.save();
    return { ok: true, user: u };
  },

  /* -------- addresses -------- */
  addresses(userId) {
    const u = this.findUser(userId);
    return u ? u.addresses : [];
  },

  defaultAddress(userId) {
    const list = this.addresses(userId);
    return list.find((a) => a.isDefault) || list[0] || null;
  },

  saveAddress(userId, data, id) {
    const u = this.findUser(userId);
    if (!u) return { ok: false, error: 'Akun tidak ditemukan.' };

    const record = {
      label: (data.label || 'Alamat').trim(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      postal: data.postal.trim(),
      isDefault: !!data.isDefault,
    };

    let targetId = id;
    if (targetId) {
      const i = u.addresses.findIndex((a) => a.id === targetId);
      if (i > -1) u.addresses[i] = { ...u.addresses[i], ...record };
      else u.addresses.push({ ...record, id: uid('A') });
      targetId = u.addresses.find((a) => a.id === id) ? id : u.addresses[u.addresses.length - 1].id;
    } else {
      const fresh = { ...record, id: uid('A') };
      u.addresses.push(fresh);
      targetId = fresh.id;
    }

    if (record.isDefault) {
      u.addresses.forEach((a) => { a.isDefault = a.id === targetId; });
    } else if (!u.addresses.some((a) => a.isDefault)) {
      /* Alamat utama yang di-uncheck saat diubah harus tetap punya satu utama,
         kalau tidak checkout akan selalu memaksa isi form manual */
      const fallback = u.addresses.find((a) => a.id === targetId) || u.addresses[0];
      u.addresses.forEach((a) => { a.isDefault = a.id === fallback.id; });
    }

    this.save();
    return { ok: true, id: targetId };
  },

  deleteAddress(userId, id) {
    const u = this.findUser(userId);
    if (!u) return;
    u.addresses = u.addresses.filter((a) => a.id !== id);
    if (u.addresses.length && !u.addresses.some((a) => a.isDefault)) u.addresses[0].isDefault = true;
    this.save();
  },

  setDefaultAddress(userId, id) {
    const u = this.findUser(userId);
    if (!u) return;
    u.addresses.forEach((a) => { a.isDefault = a.id === id; });
    this.save();
  },

  /* -------- reviews -------- */
  reviews(productId, includeHidden) {
    return this.db.reviews
      .filter((r) => r.productId === productId && (includeHidden || r.status === 'published'))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  ratingSummary(productId) {
    const live = this.reviews(productId, false);
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    live.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
    const total = live.length;
    return {
      total,
      dist,
      avg: total ? Math.round((live.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0,
    };
  },

  canReview(productId, userId) {
    if (!userId) return { ok: false, reason: 'Masuk dulu untuk menulis ulasan.' };
    const done = this.db.orders.find(
      (o) => o.userId === userId && o.status === 'selesai' && o.items.some((i) => i.productId === productId)
    );
    if (!done) return { ok: false, reason: 'Ulasan hanya bisa ditulis untuk barang dari pesanan yang sudah selesai.' };
    const exists = this.db.reviews.find(
      (r) => r.productId === productId && r.userId === userId && r.status !== 'hidden'
    );
    if (exists) return { ok: false, reason: 'Kamu sudah menulis ulasan untuk produk ini.' };
    return { ok: true, orderId: done.id };
  },

  addReview(data) {
    const check = this.canReview(data.productId, data.userId);
    if (!check.ok) return check;

    const me = this.findUser(data.userId);
    const review = {
      id: uid('RV'),
      productId: data.productId,
      userId: data.userId,
      author: me ? me.name : 'Pembeli',
      rating: data.rating,
      text: (data.text || '').trim(),
      createdAt: new Date().toISOString(),
      /* Masuk antrean moderasi dulu supaya admin yang menentukan tayang atau tidak */
      status: 'pending',
      reply: null,
      orderId: check.orderId,
    };
    this.db.reviews.unshift(review);
    recalcProductRating(this.db, data.productId);
    this.save();
    return { ok: true, review };
  },

  pendingReviewCount() {
    return this.db.reviews.filter((r) => r.status === 'pending').length;
  },

  allReviews() {
    return this.db.reviews.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  setReviewStatus(id, status) {
    const r = this.db.reviews.find((x) => x.id === id);
    if (!r) return;
    r.status = status;
    recalcProductRating(this.db, r.productId);
    this.save();
  },

  replyReview(id, text) {
    const r = this.db.reviews.find((x) => x.id === id);
    if (!r) return;
    r.reply = text && text.trim() ? text.trim() : null;
    this.save();
  },

  deleteReview(id) {
    const r = this.db.reviews.find((x) => x.id === id);
    if (!r) return;
    this.db.reviews = this.db.reviews.filter((x) => x.id !== id);
    recalcProductRating(this.db, r.productId);
    this.save();
  },

  /* -------- vouchers -------- */
  vouchers() { return this.db.vouchers; },

  findVoucher(code) {
    const key = (code || '').trim().toUpperCase();
    return this.db.vouchers.find((v) => v.code.toUpperCase() === key) || null;
  },

  saveVoucher(data) {
    const code = data.code.trim().toUpperCase();
    const i = this.db.vouchers.findIndex((v) => v.code.toUpperCase() === code);
    const next = {
      code,
      type: data.type || 'percent',
      value: Math.max(0, Number(data.value) || 0),
      minSpend: Math.max(0, Number(data.minSpend) || 0),
      maxDiscount: Math.max(0, Number(data.maxDiscount) || 0),
      quota: Math.max(1, Number(data.quota) || 1),
      used: Math.max(0, Number(data.used) || 0),
      active: data.active !== false,
      expiresAt: data.expiresAt || null,
      desc: data.desc || '',
    };
    if (i === -1) this.db.vouchers.push(next);
    else this.db.vouchers[i] = { ...this.db.vouchers[i], ...next };
    this.save();
    return next;
  },

  deleteVoucher(code) {
    const key = (code || '').trim().toUpperCase();
    this.db.vouchers = this.db.vouchers.filter((v) => v.code.toUpperCase() !== key);
    this.save();
  },

  evaluateVoucher(code, subtotal) {
    const v = this.findVoucher(code);
    if (!v) return { ok: false, error: 'Kode voucher tidak ditemukan.' };
    if (!v.active) return { ok: false, error: 'Voucher ini sedang dinonaktifkan.' };
    if (v.expiresAt && new Date(v.expiresAt) < new Date()) return { ok: false, error: 'Voucher sudah kedaluwarsa.' };
    if (v.used >= v.quota) return { ok: false, error: 'Kuota voucher sudah habis.' };
    if (subtotal < (v.minSpend || 0)) {
      return { ok: false, error: 'Belanja minimal ' + rupiah(v.minSpend) + ' untuk pakai voucher ini.' };
    }
    return { ok: true, voucher: v };
  },

  /* -------- orders -------- */
  orders() { return this.db.orders; },

  findOrder(id) {
    const key = (id || '').trim().toUpperCase();
    return this.db.orders.find((o) => o.id.toUpperCase() === key) || null;
  },

  myOrders() {
    const me = this.currentUser();
    if (!me) return [];
    return this.db.orders.filter((o) => o.userId === me.id);
  },

  nextOrderId() {
    const nums = this.db.orders
      .map((o) => parseInt((o.id || '').split('-').pop(), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 12) + 1;
    return 'ORD-2026-' + String(next).padStart(4, '0');
  },

  makeResi() {
    const d = new Date();
    const stamp =
      String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    return 'TKS' + stamp + String(Math.floor(100000 + Math.random() * 900000));
  },

  createOrder(payload) {
    const details = this.cartDetailed();
    if (!details.length) return { ok: false, error: 'Keranjang masih kosong.' };

    /* Validasi stok terakhir,(admin bisa mengubah stok setelah barang masuk keranjang) */
    for (const i of details) {
      if (i.variantMissing) {
        return { ok: false, error: `${i.product.name} memiliki variasi yang sudah tidak tersedia. Hapus barang tersebut dari keranjang dan pilih opsi yang masih tersedia.` };
      }
      if (i.variantRequired) {
        return {
          ok: false,
          error: `${i.product.name} sekarang memiliki variasi. Hapus barang tersebut dari keranjang, lalu pilih variasi yang diinginkan.`,
        };
      }
      if (i.qty > i.availableStock) {
        return {
          ok: false,
          error: `Stok ${i.product.name}${i.variantLabel ? ` (${i.variantLabel})` : ''} tinggal ${i.availableStock} buah. Perbarui keranjang dulu.`,
        };
      }
    }

    if (payload.payment === 'cod' && !isCodEligible(payload.customer.city)) {
      return { ok: false, error: 'Bayar di tempat hanya tersedia untuk wilayah Sidoarjo dan Surabaya.' };
    }

    const subtotal = details.reduce((s, i) => s + i.lineTotal, 0);
    const originalSubtotal = details.reduce((s, i) => s + i.originalLineTotal, 0);
    const productDiscount = originalSubtotal - subtotal;
    const weight = details.reduce((s, i) => s + (i.product.weight || 0) * i.qty, 0);

    let discount = 0;
    let voucher = null;
    let freeShip = false;

    if (payload.voucherCode) {
      const res = this.evaluateVoucher(payload.voucherCode, subtotal);
      if (!res.ok) return { ok: false, error: res.error };
      voucher = res.voucher;
      if (voucher.type === 'percent') {
        discount = Math.round((subtotal * voucher.value) / 100);
        if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
      } else if (voucher.type === 'fixed') {
        discount = Math.min(voucher.value, subtotal);
      } else if (voucher.type === 'freeship') {
        freeShip = true;
      }
    }

    const afterDiscount = subtotal - discount;
    const shippingCost = shippingCostFor(weight, payload.shipping, {
      base: afterDiscount,
      forceFree: freeShip,
    });
    const fee = (PAYMENT_METHODS.find((m) => m.slug === payload.payment) || {}).fee || 0;

    const order = {
      id: this.nextOrderId(),
      userId: payload.userId,
      createdAt: new Date().toISOString(),
      status: 'menunggu',
      customer: { ...payload.customer },
      payment: payload.payment,
      shipping: payload.shipping,
      items: details.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.unitPrice,
        originalPrice: i.product.price,
        discountPercent: Number(i.product.discountPercent) || 0,
        variantId: i.variantId || null,
        variantLabel: i.variantLabel || '',
        image: Store.productImages(i.product).find(
          (src) => !src.startsWith('data:image/') && !/\.svg(?:[?#].*)?$/i.test(src)
        ) || '',
        qty: i.qty,
        icon: i.product.icon,
        weight: i.product.weight || 0,
      })),
      subtotal,
      originalSubtotal,
      productDiscount,
      discount,
      shippingCost,
      paymentFee: fee,
      total: afterDiscount + shippingCost + fee,
      voucher: voucher
        ? { code: voucher.code, type: voucher.type, value: voucher.value, label: voucherLabel(voucher) }
        : null,
      resi: null,
      paidAt: null,
      cancelReason: null,
      statusHistory: [
        { status: 'menunggu', at: new Date().toISOString(), note: 'Pesanan dibuat, menunggu pembayaran' },
      ],
    };

    this.db.orders.unshift(order);
    details.forEach((i) => {
      const p = this.findProduct(i.product.id);
      if (i.variantId) {
        const variant = p.variants.find((entry) => entry.id === i.variantId);
        variant.stock = Math.max(0, variant.stock - i.qty);
        p.stock = p.variants.reduce((sum, entry) => sum + entry.stock, 0);
      } else p.stock = Math.max(0, p.stock - i.qty);
      p.sold += i.qty;
    });
    if (voucher) voucher.used += 1;
    this.db.cart = [];
    if (!this.save()) {
      this.load();
      return { ok: false, error: 'Pesanan tidak dapat disimpan di browser ini. Keranjang tetap tersedia.' };
    }
    return { ok: true, order };
  },

  pushStatus(o, status, note) {
    o.status = status;
    o.statusHistory.push({ status, at: new Date().toISOString(), note: note || ORDER_STATUS[status].label });
  },

  adjustOrderItemStock(item, direction) {
    const product = this.findProduct(item.productId);
    if (!product) return;
    const variant = item.variantId && product.variants?.find((entry) => entry.id === item.variantId);
    if (variant) {
      variant.stock = Math.max(0, variant.stock + direction * item.qty);
      product.stock = product.variants.reduce((sum, entry) => sum + entry.stock, 0);
    } else {
      product.stock = Math.max(0, product.stock + direction * item.qty);
    }
    product.sold = Math.max(0, product.sold - direction * item.qty);
  },

  setOrderStatus(id, status, opts) {
    const o = this.findOrder(id);
    if (!o) return { ok: false, error: 'Pesanan tidak ditemukan.' };

    const options = opts || {};
    const from = o.status;

    if (from === status && !options.force) return { ok: true, order: o, unchanged: true };

    if (status === 'batal') {
      o.cancelReason = options.reason || 'Dibatalkan';

      /* Stok hanya kembali kalau dibatalkan sebelum barang diterima pembeli */
      if (from !== 'batal' && from !== 'selesai') {
        o.items.forEach((i) => {
          this.adjustOrderItemStock(i, 1);
        });
      }
    }

    /* Batal dari selesai tidak mengembalikan stok karena barang sudah diterima */
    if (from === 'batal' && status !== 'batal') {
      o.items.forEach((i) => {
        this.adjustOrderItemStock(i, -1);
      });
      o.cancelReason = null;
    }

    if (status === 'diproses' && from === 'menunggu') {
      o.paidAt = new Date().toISOString();
      const pay = PAYMENT_METHODS.find((m) => m.slug === o.payment);
      /* o.status wajib ikut berubah, kalau tidak pesanan tetap tampil "menunggu" */
      this.pushStatus(o, 'diproses', options.note || 'Pembayaran diterima via ' + (pay ? pay.name : o.payment));
    } else if (status === 'dikirim') {
      if (!o.resi) o.resi = this.makeResi();
      this.pushStatus(o, 'dikirim', options.note || 'Paket diserahkan ke kurir, resi ' + o.resi);
    } else {
      this.pushStatus(o, status, options.note);
    }

    if (status !== 'menunggu' && status !== 'batal' && from === 'menunggu') {
      o.paidAt = o.paidAt || new Date().toISOString();
    }

    this.save();
    return { ok: true, order: o };
  },

  acceptOrder(id) {
    const order = this.findOrder(id);
    if (!order) return { ok: false, error: 'Pesanan tidak ditemukan.' };
    if (order.status !== 'dikirim') {
      return { ok: false, error: 'Pesanan hanya bisa dikonfirmasi diterima setelah statusnya Dikirim.' };
    }
    return this.setOrderStatus(id, 'selesai', { note: 'Pesanan dikonfirmasi diterima oleh pembeli' });
  },

  cancelOrder(id, reason) {
    return this.setOrderStatus(id, 'batal', { reason: reason || 'Dibatalkan pembeli' });
  },

  deleteOrder(id) {
    const o = this.findOrder(id);
    if (!o) return { ok: false, error: 'Pesanan tidak ditemukan.' };

    /* Barang yang belum diterima pembeli harus kembali ke stok, kalau tidak
       stok berkurang permanen padahal pesanan sudah tidak ada */
    if (o.status !== 'selesai' && o.status !== 'batal') {
      o.items.forEach((i) => {
        this.adjustOrderItemStock(i, 1);
      });
    }

    this.db.orders = this.db.orders.filter((x) => x.id !== id);
    this.save();
    return { ok: true, restored: o.status !== 'selesai' && o.status !== 'batal' };
  },

  /* -------- stats -------- */
  stats() {
    const orders = this.db.orders;
    const revenue = orders
      .filter((o) => o.status !== 'batal')
      .reduce((s, o) => s + o.total, 0);
    return {
      revenue,
      orderCount: orders.length,
      productCount: this.db.products.length,
      lowStock: this.db.products.filter((p) => p.stock > 0 && p.stock <= 10),
      outOfStock: this.db.products.filter((p) => p.stock === 0),
      customerCount: this.db.users.filter((u) => u.role === 'customer').length,
      pendingReviews: this.pendingReviewCount(),
      reviewCount: this.db.reviews.length,
      shipped: orders.filter((o) => o.status === 'dikirim').length,
    };
  },
};

/* Ongkos kirim flat rate, ditambah 10 ribu bila berat di atas 5 kg.
  _opts.base_ dipakai untuk cek gratis ongkir otomatis, _opts.forceFree_ untuk voucher gratis ongkir. */
function shippingCostFor(weight, method, opts) {
  const o = opts || {};
  const baseRate = method === 'express' ? 25000 : method === 'same-day' ? 35000 : 15000;

  if (o.forceFree || (o.base != null && o.base >= FREE_SHIPPING_MIN)) return 0;
  return method === 'reguler' && weight > 5 ? baseRate + 10000 : baseRate;
}

function isCodEligible(city) {
  const key = (city || '').trim().toLowerCase();
  if (!key) return false;
  return COD_ZONES.some((z) => key.includes(z));
}

function voucherLabel(v) {
  if (v.type === 'percent') return 'Diskon ' + v.value + '%';
  if (v.type === 'fixed') return 'Potongan ' + rupiah(v.value);
  return 'Gratis ongkir kirim';
}

function missingForFreeShipping(subtotal) {
  return Math.max(0, FREE_SHIPPING_MIN - subtotal);
}

const SHIPPING_METHODS = [
  { slug: 'reguler', name: 'Reguler', icon: '🚚', desc: '3 sampai 5 hari kerja', cost: 15000 },
  { slug: 'express', name: 'Ekspres', icon: '⚡', desc: '1 sampai 2 hari kerja', cost: 25000 },
  { slug: 'same-day', name: 'Same Day', icon: '🏍️', desc: 'Sidoarjo dan Surabaya saja', cost: 35000 },
];

const PAYMENT_METHODS = [
  { slug: 'transfer', name: 'Transfer Bank', icon: '🏦', desc: 'BCA, BRI, Mandiri, BNI', fee: 0 },
  { slug: 'qris', name: 'QRIS', icon: '📱', desc: 'Satu kode untuk semua e-wallet', fee: 0 },
  { slug: 'ewallet', name: 'E-Wallet', icon: '💳', desc: 'GoPay, OVO, DANA, ShopeePay', fee: 0 },
  { slug: 'cod', name: 'Bayar di Tempat', icon: '💵', desc: 'Area Sidoarjo dan Surabaya', fee: 5000 },
];

const ORDER_STATUS = {
  menunggu: { label: 'Menunggu Pembayaran', color: '#8A6200', bg: '#FFF4D6' },
  diproses:  { label: 'Diproses',            color: '#0B6B5B', bg: '#DFF3EE' },
  dikirim:   { label: 'Dikirim',            color: '#1F5FA8', bg: '#E3EEFB' },
  selesai:   { label: 'Selesai',            color: '#2E7D32', bg: '#E4F4E4' },
  batal:    { label: 'Dibatalkan',         color: '#B3261E', bg: '#FBE7E5' },
};

const REVIEW_STATUS = {
  pending:   { label: 'Menunggu Moderasi', color: '#8A6200', bg: '#FFF4D6' },
  published: { label: 'Tayang',            color: '#0B6B5B', bg: '#DFF3EE' },
  hidden:    { label: 'Disembunyikan',     color: '#5B4A44', bg: '#EFE8E4' },
};

/* Urutan resmi status untuk timeline lacak paket */
const ORDER_FLOW = ['menunggu', 'diproses', 'dikirim', 'selesai'];