/* ============================================================================
   Toko Kriya Sidoarjo — api.js
   Semua akses data (query tabel + RPC) dikumpulkan di sini supaya halaman
   cukup memanggil fungsi siap pakai. Nama parameter RPC harus persis sama
   dengan yang didefinisikan di supabase/schema.sql.
   ========================================================================== */

import { getDb, UNCONFIGURED } from './db.js';

/* ------------------------------ Dasar ------------------------------ */

async function table() {
  const db = await getDb();
  return db;
}

async function rpc(fn, params) {
  const db = await getDb();
  const { data, error } = await db.rpc(fn, params);
  if (error) throw new Error(error.message);
  return data;
}

function assertOk({ data, error }, fallbackMsg = 'Data gagal dimuat.') {
  if (error) throw new Error(error.message || fallbackMsg);
  return data;
}

export { UNCONFIGURED };

/* ------------------------------ Pengaturan toko ------------------------------ */

const FALLBACK_SETTINGS = {
  store_name: 'Toko Kriya Sidoarjo',
  wa_number: '6285745120164',
  free_shipping_min: 500000,
  cod_zones: ['sidoarjo', 'surabaya', 'grosok', 'gedangan', 'tangerang', 'waru', 'krian', 'buduran'],
  cod_fee: 5000,
  regular_cost: 15000,
  express_cost: 25000,
  sameday_cost: 35000,
};

let settingsCache = null;

export async function getSettings(force = false) {
  if (settingsCache && !force) return settingsCache;
  try {
    const db = await getDb();
    const data = assertOk(await db.from('store_settings').select('*').eq('id', 1).maybeSingle());
    settingsCache = data || FALLBACK_SETTINGS;
  } catch {
    settingsCache = FALLBACK_SETTINGS;
  }
  return settingsCache;
}

/* ------------------------------ Kategori ------------------------------ */

export async function getCategories() {
  const db = await getDb();
  const data = assertOk(await db.from('categories').select('*').order('sort').order('name'));
  return data || [];
}

/* ------------------------------ Produk (publik) ------------------------------ */

const PRODUCT_FIELDS = `
  id, slug, name, category_id, price, discount_percent, stock, sold, weight,
  featured, active, short_desc, description, material, dimensions, care,
  tags, images, rating, reviews_count, created_at,
  category:categories ( id, slug, name, icon, color ),
  variants:product_variants ( count )
`;

export const SORT_OPTIONS = [
  { value: 'baru', label: 'Terbaru' },
  { value: 'laris', label: 'Terlaris' },
  { value: 'murah', label: 'Harga terendah' },
  { value: 'mahal', label: 'Harga tertinggi' },
  { value: 'rating', label: 'Rating tertinggi' },
];

export async function listProducts(opts = {}) {
  const {
    category = '', q = '', sort = 'baru', min = null, max = null,
    featured = null, page = 1, perPage = 12, ids = null,
  } = opts;
  const db = await getDb();

  let query = db.from('products').select(PRODUCT_FIELDS, { count: 'exact' }).eq('active', true);

  if (category) {
    const cats = assertOk(await db.from('categories').select('id').eq('slug', category));
    if (!cats?.length) return { items: [], count: 0 };
    query = query.eq('category_id', cats[0].id);
  }
  if (q) query = query.ilike('name', `%${q}%`);
  if (min != null) query = query.gte('price', min);
  if (max != null) query = query.lte('price', max);
  if (featured) query = query.eq('featured', true);
  if (ids) {
    if (!ids.length) return { items: [], count: 0 };
    query = query.in('id', ids);
  }

  switch (sort) {
    case 'laris': query = query.order('sold', { ascending: false }); break;
    case 'murah': query = query.order('price', { ascending: true }); break;
    case 'mahal': query = query.order('price', { ascending: false }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    default: query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
  }

  const from = (page - 1) * perPage;
  const res = await query.range(from, from + perPage - 1);
  const data = assertOk(res);
  return { items: data || [], count: res.count ?? data?.length ?? 0 };
}

export async function getProductBySlug(slug) {
  const db = await getDb();
  const data = assertOk(
    await db.from('products').select(PRODUCT_FIELDS).eq('slug', slug).eq('active', true).maybeSingle()
  );
  if (!data) return null;
  return data;
}

export async function getProductVariants(productId) {
  const db = await getDb();
  const data = assertOk(
    await db.from('product_variants').select('*').eq('product_id', productId).order('sort').order('label')
  );
  return data || [];
}

export async function getRelatedProducts(product, limit = 4) {
  const db = await getDb();
  let query = db.from('products')
    .select(PRODUCT_FIELDS)
    .eq('active', true)
    .neq('id', product.id)
    .limit(limit);
  if (product.category_id) query = query.eq('category_id', product.category_id);
  const data = assertOk(await query);
  return data || [];
}

/* ------------------------------ Ulasan (publik) ------------------------------ */

export async function getProductReviews(productId) {
  const db = await getDb();
  const data = assertOk(
    await db.from('reviews').select('id, author, rating, text, reply, created_at')
      .eq('product_id', productId).eq('status', 'published')
      .order('created_at', { ascending: false }).limit(30)
  );
  return data || [];
}

/* Testimoni untuk beranda: ulasan bagus terbaru + nama produknya */
export async function getTestimonials(limit = 6) {
  const db = await getDb();
  const data = assertOk(
    await db.from('reviews')
      .select('author, rating, text, created_at, products (name, slug)')
      .eq('status', 'published').gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(limit)
  );
  return data || [];
}

/* ------------------------------ RPC: pesanan ------------------------------ */

/* Buat pesanan baru (butuh login). payload: {items, customer, payment, shipping, voucher_code} */
export function placeOrder(payload) {
  return rpc('place_order', { payload });
}

/* Ubah status pesanan (admin / pemilik pesanan) */
export function setOrderStatus(pOrderId, pStatus, pNote = null, pReason = null) {
  return rpc('set_order_status', { p_order_id: pOrderId, p_status: pStatus, p_note: pNote, p_reason: pReason });
}

/* Lacak pesanan tanpa login — cukup nomor pesanan (ORD-...) atau nomor resi */
export function trackOrder(pQuery) {
  return rpc('track_order', { p_query: pQuery.trim() });
}

/* ------------------------------ Pesanan saya (login) ------------------------------ */

export async function getMyOrders() {
  const db = await getDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];
  const data = assertOk(
    await db.from('orders').select('id, status, total, subtotal, discount, shipping_cost, payment_fee, payment, shipping, voucher_code, resi, cancel_reason, created_at, paid_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
  );
  return data || [];
}

export async function getOrderDetail(orderId) {
  const db = await getDb();
  const order = assertOk(
    await db.from('orders').select('*').eq('id', orderId).maybeSingle()
  );
  if (!order) return null;
  const [items, history] = await Promise.all([
    db.from('order_items').select('*').eq('order_id', orderId).order('created_at'),
    db.from('order_status_history').select('*').eq('order_id', orderId).order('created_at'),
  ]);
  return {
    order,
    items: items.data || [],
    history: history.data || [],
  };
}

/* Barang yang sudah dibeli & selesai — untuk tombol "tulisan ulasan" */
export async function getMyDeliveredItems() {
  const db = await getDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];
  const orders = assertOk(
    await db.from('orders').select('id').eq('user_id', user.id).eq('status', 'selesai')
  );
  if (!orders?.length) return [];
  const ids = orders.map((o) => o.id);
  const items = assertOk(
    await db.from('order_items').select('id, order_id, product_id, name, image, price')
      .in('order_id', ids)
  );
  return items || [];
}

export async function getMyReviews() {
  const db = await getDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];
  const data = assertOk(
    await db.from('reviews').select('id, product_id, rating, text, status, reply, created_at, products(name, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  );
  return data || [];
}

/* Kirim ulasan baru (masuk antrian moderasi admin) */
export async function submitReview({ productId, orderId, rating, text }) {
  const db = await getDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Silakan masuk terlebih dahulu.');
  const profile = assertOk(await db.from('profiles').select('full_name').eq('id', user.id).maybeSingle());
  const { error } = await db.from('reviews').insert({
    product_id: productId,
    order_id: orderId || null,
    user_id: user.id,
    author: profile?.full_name || user.email?.split('@')[0] || 'Pembeli',
    rating,
    text,
    status: 'pending',
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteMyReview(reviewId) {
  const db = await getDb();
  const { error } = await db.from('reviews').delete().eq('id', reviewId);
  if (error) throw new Error(error.message);
  return true;
}

/* ------------------------------ Favorit ------------------------------ */

export async function getFavoriteIds() {
  const db = await getDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];
  const data = assertOk(await db.from('favorites').select('product_id').eq('user_id', user.id));
  return (data || []).map((f) => f.product_id);
}

export async function getFavoriteProducts() {
  const db = await getDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];
  const data = assertOk(
    await db.from('favorites').select(`created_at, products (${PRODUCT_FIELDS})`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  );
  return (data || []).map((f) => f.products).filter(Boolean);
}

/* true bila sekarang jadi favorit, false bila dihapus */
export async function toggleFavorite(productId) {
  const db = await getDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('MASUK_DULU');
  const existing = assertOk(
    await db.from('favorites').select('product_id').eq('user_id', user.id).eq('product_id', productId).maybeSingle()
  );
  if (existing) {
    const { error } = await db.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
    if (error) throw new Error(error.message);
    return false;
  }
  const { error } = await db.from('favorites').insert({ user_id: user.id, product_id: productId });
  if (error) throw new Error(error.message);
  return true;
}

/* ------------------------------ Voucher ------------------------------ */

/* Validasi voucher di sisi klien (server tetap memvalidasi ulang saat place_order) */
export async function checkVoucher(code, subtotal) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return { ok: false, error: 'Kode voucher kosong.' };
  const db = await getDb();
  const v = assertOk(await db.from('vouchers').select('*').eq('code', clean).maybeSingle());
  if (!v) return { ok: false, error: 'Kode voucher tidak ditemukan.' };
  if (!v.active) return { ok: false, error: 'Voucher sedang dinonaktifkan.' };
  if (v.expires_at && new Date(v.expires_at) < new Date()) return { ok: false, error: 'Voucher sudah kedaluwarsa.' };
  if (v.used >= v.quota) return { ok: false, error: 'Kuota voucher sudah habis.' };
  if (subtotal < v.min_spend) {
    return { ok: false, error: `Minimal belanja ${'Rp' + Number(v.min_spend).toLocaleString('id-ID')} untuk voucher ini.` };
  }
  let discount = 0;
  let freeShip = false;
  if (v.type === 'percent') {
    discount = Math.round(subtotal * Number(v.value) / 100);
    if (v.max_discount > 0) discount = Math.min(discount, v.max_discount);
  } else if (v.type === 'fixed') {
    discount = Number(v.value);
  } else {
    freeShip = true;
  }
  discount = Math.min(discount, subtotal);
  return { ok: true, voucher: v, discount, freeShip };
}

export async function getActiveVouchers() {
  const db = await getDb();
  const data = assertOk(await db.from('vouchers').select('*').eq('active', true).order('min_spend'));
  return (data || []).filter((v) => !v.expires_at || new Date(v.expires_at) >= new Date());
}

/* ------------------------------ Alat admin ------------------------------ */

/* Ringkasan angka untuk dashboard admin */
export async function adminStats() {
  const db = await getDb();
  const [orders, products, customers, reviews, vouchers] = await Promise.all([
    db.from('orders').select('id, total, status, created_at, user_id'),
    db.from('products').select('id, stock, active, sold, category_id, name, slug, images'),
    db.from('profiles').select('id, role, full_name, created_at'),
    db.from('reviews').select('id, status'),
    db.from('vouchers').select('code, used, quota, active'),
  ]);
  assertOk(orders); assertOk(products); assertOk(customers); assertOk(reviews); assertOk(vouchers);

  const live = (orders.data || []).filter((o) => o.status !== 'batal');
  const revenue = live.reduce((s, o) => s + Number(o.total || 0), 0);
  const byStatus = {};
  for (const o of orders.data || []) byStatus[o.status] = (byStatus[o.status] || 0) + 1;

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const revenueThisMonth = live
    .filter((o) => new Date(o.created_at) >= monthStart)
    .reduce((s, o) => s + Number(o.total || 0), 0);

  return {
    revenue,
    revenueThisMonth,
    ordersCount: orders.data?.length || 0,
    byStatus,
    productsCount: products.data?.length || 0,
    activeProducts: (products.data || []).filter((p) => p.active).length,
    lowStock: (products.data || []).filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 5),
    customersCount: (customers.data || []).filter((c) => c.role === 'customer').length,
    pendingReviews: (reviews.data || []).filter((r) => r.status === 'pending').length,
    vouchersActive: (vouchers.data || []).filter((v) => v.active).length,
    recentOrders: (orders.data || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6),
    topProducts: (products.data || []).slice().sort((a, b) => b.sold - a.sold).slice(0, 5),
  };
}

/* Pendapatan 6 bulan terakhir untuk grafik batang */
export async function adminRevenueChart() {
  const db = await getDb();
  const orders = assertOk(await db.from('orders').select('total, status, created_at'));
  const live = (orders || []).filter((o) => o.status !== 'batal');

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('id-ID', { month: 'short' }),
      year: d.getFullYear(),
      total: 0,
      count: 0,
    });
  }
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]));
  for (const o of live) {
    const d = new Date(o.created_at);
    const m = byKey[`${d.getFullYear()}-${d.getMonth()}`];
    if (m) { m.total += Number(o.total || 0); m.count++; }
  }
  return months;
}

/* Daftar produk untuk admin (termasuk yang disembunyikan) */
export async function adminListProducts({ q = '', page = 1, perPage = 12, category = '' } = {}) {
  const db = await getDb();
  let query = db.from('products').select(PRODUCT_FIELDS, { count: 'exact' });
  if (q) query = query.ilike('name', `%${q}%`);
  if (category) query = query.eq('category_id', category);
  query = query.order('created_at', { ascending: false });
  const from = (page - 1) * perPage;
  const res = await query.range(from, from + perPage - 1);
  const data = assertOk(res);
  return { items: data || [], count: res.count ?? 0 };
}

export async function adminSaveProduct(p) {
  const db = await getDb();
  const row = {
    slug: p.slug,
    name: p.name,
    category_id: p.category_id || null,
    price: Number(p.price) || 0,
    discount_percent: Number(p.discount_percent) || 0,
    stock: Number(p.stock) || 0,
    sold: Number(p.sold) || 0,
    weight: Number(p.weight) || 0.2,
    featured: !!p.featured,
    active: !!p.active,
    short_desc: p.short_desc || '',
    description: p.description || '',
    material: p.material || '',
    dimensions: p.dimensions || '',
    care: p.care || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    images: Array.isArray(p.images) ? p.images : [],
  };
  let result;
  if (p.id) {
    result = await db.from('products').update(row).eq('id', p.id).select().single();
  } else {
    result = await db.from('products').insert(row).select().single();
  }
  assertOk(result);
  return result.data;
}

export async function adminDeleteProduct(id) {
  const db = await getDb();
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function adminSetProductActive(id, active) {
  const db = await getDb();
  const { error } = await db.from('products').update({ active }).eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

/* Variasi produk */
export async function adminListVariants(productId) {
  const db = await getDb();
  const data = assertOk(
    await db.from('product_variants').select('*').eq('product_id', productId).order('sort').order('label')
  );
  return data || [];
}

export async function adminSaveVariant(v) {
  const db = await getDb();
  let res;
  if (v.id) {
    res = await db.from('product_variants')
      .update({ label: v.label, stock: Number(v.stock) || 0, sort: Number(v.sort) || 0 })
      .eq('id', v.id).select().single();
  } else {
    res = await db.from('product_variants')
      .insert({ product_id: v.product_id, label: v.label, stock: Number(v.stock) || 0, sort: Number(v.sort) || 0 })
      .select().single();
  }
  assertOk(res);
  return res.data;
}

export async function adminDeleteVariant(id) {
  const db = await getDb();
  const { error } = await db.from('product_variants').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

/* Kategori */
export async function adminSaveCategory(c) {
  const db = await getDb();
  const row = {
    slug: c.slug,
    name: c.name,
    icon: c.icon || 'package',
    color: c.color || '#c05a30',
    sort: Number(c.sort) || 0,
  };
  let res;
  if (c.id) res = await db.from('categories').update(row).eq('id', c.id).select().single();
  else res = await db.from('categories').insert(row).select().single();
  assertOk(res);
  return res.data;
}

export async function adminDeleteCategory(id) {
  const db = await getDb();
  const { error } = await db.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

/* Pesanan admin */
export async function adminListOrders({ status = '', q = '', page = 1, perPage = 12 } = {}) {
  const db = await getDb();
  let query = db.from('orders').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (q) query = query.ilike('id', `%${q.toUpperCase()}%`);
  query = query.order('created_at', { ascending: false });
  const from = (page - 1) * perPage;
  const res = await query.range(from, from + perPage - 1);
  const data = assertOk(res);
  return { items: data || [], count: res.count ?? 0 };
}

/* Set / ubah nomor resi pesanan (khusus admin) */
export async function adminSetResi(orderId, resi) {
  const db = await getDb();
  const { error } = await db.from('orders').update({ resi: resi || null }).eq('id', orderId);
  if (error) throw new Error(error.message);
  return true;
}

/* Ulasan admin */
export async function adminListReviews({ status = '', page = 1, perPage = 12 } = {}) {
  const db = await getDb();
  let query = db.from('reviews')
    .select(`id, author, rating, text, status, reply, created_at, product_id, products (name, slug)`, { count: 'exact' });
  if (status) query = query.eq('status', status);
  query = query.order('created_at', { ascending: false });
  const from = (page - 1) * perPage;
  const res = await query.range(from, from + perPage - 1);
  const data = assertOk(res);
  return { items: data || [], count: res.count ?? 0 };
}

export async function adminUpdateReview(id, patch) {
  const db = await getDb();
  const { error } = await db.from('reviews').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function adminDeleteReview(id) {
  const db = await getDb();
  const { error } = await db.from('reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

/* Voucher admin */
export async function adminListVouchers() {
  const db = await getDb();
  const data = assertOk(await db.from('vouchers').select('*').order('active', { ascending: false }).order('code'));
  return data || [];
}

export async function adminSaveVoucher(v) {
  const db = await getDb();
  const row = {
    code: String(v.code || '').trim().toUpperCase(),
    type: v.type,
    value: Number(v.value) || 0,
    min_spend: Number(v.min_spend) || 0,
    max_discount: Number(v.max_discount) || 0,
    quota: Number(v.quota) || 1,
    active: !!v.active,
    expires_at: v.expires_at || null,
    description: v.description || '',
  };
  let res;
  if (v._exists) res = await db.from('vouchers').update(row).eq('code', row.code).select().single();
  else res = await db.from('vouchers').insert(row).select().single();
  assertOk(res);
  return res.data;
}

export async function adminDeleteVoucher(code) {
  const db = await getDb();
  const { error } = await db.from('vouchers').delete().eq('code', code);
  if (error) throw new Error(error.message);
  return true;
}

/* Pelanggan admin */
export async function adminListCustomers() {
  const db = await getDb();
  const [profiles, orders] = await Promise.all([
    db.from('profiles').select('*').order('created_at', { ascending: false }),
    db.from('orders').select('user_id, total, status, created_at'),
  ]);
  assertOk(profiles); assertOk(orders);
  const stats = {};
  for (const o of orders.data || []) {
    if (!o.user_id) continue;
    const s = stats[o.user_id] || (stats[o.user_id] = { orders: 0, spend: 0, last: null });
    if (o.status !== 'batal') {
      s.orders++;
      s.spend += Number(o.total || 0);
    }
    if (!s.last || new Date(o.created_at) > new Date(s.last)) s.last = o.created_at;
  }
  return (profiles.data || []).map((p) => ({
    ...p,
    order_stats: stats[p.id] || { orders: 0, spend: 0, last: null },
  }));
}

/* Pengaturan toko admin */
export async function adminSaveSettings(patch) {
  const db = await getDb();
  const { error } = await db.from('store_settings').update(patch).eq('id', 1);
  if (error) throw new Error(error.message);
  settingsCache = null;
  return getSettings(true);
}

/* Unggah foto produk ke bucket storage "products" */
export async function uploadProductImage(file) {
  const db = await getDb();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext) ? ext : 'jpg';
  const path = `produk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const { error } = await db.storage
    .from('products')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('Upload gagal: ' + error.message);
  const { data } = await db.storage.from('products').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProductImage(url) {
  try {
    const db = await getDb();
    const marker = '/object/public/products/';
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = url.slice(idx + marker.length).split('?')[0];
    await db.storage.from('products').remove([path]);
  } catch {
    /* foto lokal / sudah terhapus — diamkan saja */
  }
}
