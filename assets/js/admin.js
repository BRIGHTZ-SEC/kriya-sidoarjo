/* Toko Kriya Sidoarjo - admin.js */
import { icon, CATEGORY_ICONS } from './icons.js';
import { qs, qsa, esc, num, rupiah, toast, showModal, confirmAction, askInput, setBusy, stars, placeholder, productImage, fmtDate, fmtDateTime, timeAgo, initials, emptyState, errMsg, skelRows, skelCards, netPrice } from './ui.js';
import { adminStats, adminRevenueChart, adminListProducts, adminSaveProduct, adminDeleteProduct, adminSetProductActive, adminListVariants, adminSaveVariant, adminDeleteVariant, adminSaveCategory, adminDeleteCategory, adminListOrders, adminSetResi, adminListReviews, adminUpdateReview, adminDeleteReview, adminListVouchers, adminSaveVoucher, adminDeleteVoucher, adminListCustomers, adminSaveSettings, uploadProductImage, deleteProductImage, getCategories, getSettings, getOrderDetail, setOrderStatus, UNCONFIGURED } from './api.js';
import { initAuth, onAuthChange, getUser, isAdmin, logout } from './auth.js';

initAuth();

const VIEWS = {
  dashboard: { label: 'Dashboard', crumb: 'Ringkasan toko', icon: 'chart' },
  pesanan: { label: 'Pesanan', crumb: 'Kelola & proses pesanan', icon: 'truck' },
  produk: { label: 'Produk', crumb: 'Katalog & variasi', icon: 'package' },
  kategori: { label: 'Kategori', crumb: 'Kategori produk', icon: 'grid' },
  ulasan: { label: 'Ulasan', crumb: 'Moderasi ulasan pembeli', icon: 'star' },
  voucher: { label: 'Voucher', crumb: 'Kode diskon & promo', icon: 'ticket' },
  pelanggan: { label: 'Pelanggan', crumb: 'Data akun pembeli', icon: 'users' },
  pengaturan: { label: 'Pengaturan', crumb: 'Konfigurasi toko', icon: 'settings' },
};
const NAV_GROUPS = [
  { label: 'Utama', items: ['dashboard', 'pesanan'] },
  { label: 'Katalog', items: ['produk', 'kategori', 'ulasan'] },
  { label: 'Toko', items: ['voucher', 'pelanggan', 'pengaturan'] },
];
const STATUS_LABEL = { menunggu: 'Menunggu bayar', diproses: 'Diproses', dikirim: 'Dikirim', selesai: 'Selesai', batal: 'Dibatalkan' };
const PAYMENT_LABEL = { transfer: 'Transfer Bank', qris: 'QRIS', ewallet: 'E-Wallet', cod: 'Bayar di Tempat' };
const SHIPPING_LABEL = { reguler: 'Reguler', express: 'Express', 'same-day': 'Same Day' };
const COLORS = ['#c05a30', '#2d6a4f', '#b8860b', '#4a6fa5', '#9b59b6', '#c94b4b', '#7f8c8d', '#34495e'];
const STATUS_ICON = { menunggu: 'clock', diproses: 'settings', dikirim: 'truck', selesai: 'check-circle', batal: 'x' };

let currentView = 'dashboard';
let viewEl = null;
let booted = false;
let statsCache = null;

function renderLoginPrompt() {
  const root = document.getElementById('admin-view');
  root.innerHTML = '<div class="card card-pad center" style="padding:64px 24px;max-width:560px;margin:0 auto"><div class="es-icon" style="margin:0 auto 16px;width:72px;height:72px">' + icon('lock') + '</div><h2 style="font-size:26px">Masuk sebagai admin dulu</h2><p class="muted mt-1" style="max-width:400px;margin:10px auto 0">Panel ini khusus admin toko. Silakan masuk di halaman akun dengan akun admin, lalu kembali ke sini.</p><div class="row mt-3" style="justify-content:center;gap:10px"><a class="btn btn-primary btn-lg" href="akun.html?next=admin.html">Masuk / Daftar</a><a class="btn btn-ghost btn-lg" href="index.html">Kembali ke toko</a></div></div>';
}
function renderDenied(user) {
  const root = document.getElementById('admin-view');
  root.innerHTML = '<div class="card card-pad center" style="padding:64px 24px;max-width:560px;margin:0 auto"><div class="es-icon" style="margin:0 auto 16px;width:72px;height:72px;background:var(--danger-soft);border-color:var(--danger);color:var(--danger)">' + icon('shield') + '</div><h2 style="font-size:26px">Akses ditolak</h2><p class="muted mt-1" style="max-width:420px;margin:10px auto 0">Akun <b>' + esc(user && user.email || '-') + '</b> tidak memiliki peran admin.</p><div class="row mt-3" style="justify-content:center;gap:10px"><a class="btn btn-ghost btn-lg" href="index.html">Kembali ke toko</a></div></div>';
}
function boot() {
  booted = true;
  const user = getUser();
  const name = (user && user.profile && user.profile.full_name) || (user && user.email && user.email.split('@')[0]) || 'Admin';
  const avatar = document.getElementById('admin-avatar');
  if (avatar) avatar.textContent = initials(name);
  document.getElementById('admin-name').textContent = name;
  document.getElementById('admin-email').textContent = (user && user.email) || '-';
  buildNav();
  buildTopbarTheme();
  bindBurger();
  bindAvatarLogout();
  const hash = (location.hash || '').replace(/^#\/?/, '');
  if (hash && VIEWS[hash]) currentView = hash;
  window.addEventListener('hashchange', function () {
    const h = (location.hash || '').replace(/^#\/?/, '');
    if (h && VIEWS[h] && h !== currentView) switchView(h);
  });
  switchView(currentView);
  refreshNavPills();
}
function buildNav() {
  const nav = document.getElementById('admin-nav');
  nav.innerHTML = NAV_GROUPS.map(function (g) {
    return '<div class="nav-label">' + g.label + '</div>' + g.items.map(function (v) {
      const meta = VIEWS[v];
      return '<a class="a-nav" data-view="' + v + '">' + icon(meta.icon) + ' ' + meta.label + ' <i class="nav-pill" data-pill="' + v + '" hidden></i></a>';
    }).join('');
  }).join('');
  qsa('.a-nav', nav).forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      switchView(a.dataset.view);
      document.getElementById('admin-side').classList.remove('is-open');
    });
  });
}
function buildTopbarTheme() {
  document.getElementById('admin-theme').addEventListener('click', function () {
    const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', now);
    try { localStorage.setItem('tks_theme', now); } catch (e) { /* ignore */ }
  });
}
function bindBurger() {
  const burger = document.getElementById('admin-burger');
  const side = document.getElementById('admin-side');
  burger.addEventListener('click', function () { side.classList.toggle('is-open'); });
  document.addEventListener('click', function (e) {
    if (side.classList.contains('is-open') && !side.contains(e.target) && !burger.contains(e.target)) side.classList.remove('is-open');
  });
}
function bindAvatarLogout() {
  const u = document.querySelector('.admin-user');
  if (!u) return;
  u.style.cursor = 'pointer';
  u.title = 'Klik untuk keluar';
  u.addEventListener('click', async function () {
    const ok = await confirmAction('Keluar dari panel admin?', { okText: 'Keluar', danger: true });
    if (!ok) return;
    await logout();
    location.href = 'index.html';
  });
}
function switchView(name) {
  if (!VIEWS[name]) return;
  currentView = name;
  location.hash = '#/' + name;
  const meta = VIEWS[name];
  document.getElementById('admin-title').textContent = meta.label;
  document.getElementById('admin-crumb').textContent = meta.crumb;
  qsa('.a-nav').forEach(function (a) { a.classList.toggle('is-active', a.dataset.view === name); });
  viewEl = document.getElementById('admin-view');
  viewEl.innerHTML = '';
  try { meta.render(viewEl); } catch (e) { viewEl.innerHTML = '<div class="alert alert-error">' + icon('alert-circle') + '<div class="grow">' + esc(errMsg(e)) + '</div></div>'; console.error(e); }
}
async function refreshNavPills() {
  try {
    statsCache = await adminStats();
    const menunggu = (statsCache.byStatus && statsCache.byStatus.menunggu) || 0;
    const pending = statsCache.pendingReviews || 0;
    const p1 = document.querySelector('[data-pill="pesanan"]');
    const p2 = document.querySelector('[data-pill="ulasan"]');
    if (p1) { p1.textContent = menunggu; p1.hidden = menunggu === 0; }
    if (p2) { p2.textContent = pending; p2.hidden = pending === 0; }
  } catch (e) { /* ignore */ }
}
let bootedGate = false;
onAuthChange(function (user) {
  if (bootedGate) return;
  if (user) {
    if (isAdmin()) { bootedGate = true; boot(); }
    else { bootedGate = true; renderDenied(user); }
  }
});
setTimeout(function () {
  if (bootedGate) return;
  bootedGate = true;
  const user = getUser();
  if (user) { if (isAdmin()) boot(); else renderDenied(user); }
  else renderLoginPrompt();
}, 1600);

function statCard(tone, ic, label, value, hint) {
  return '<div class="stat-card tone-' + tone + '"><span class="stat-icon">' + icon(ic) + '</span><span class="stat-label">' + esc(label) + '</span><span class="stat-value">' + value + '</span><span class="stat-hint">' + esc(hint) + '</span></div>';
}
function qfact(ic, label, value, hint) {
  return '<div class="qfact">' + icon(ic) + '<div><b>' + esc(label) + '</b><span>' + esc(hint) + '</span></div><span class="val">' + value + '</span></div>';
}
function slugify(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9\\s-]/g, '').replace(/[\\s-]+/g, '-').replace(/^-+|-+$/g, '') || ('produk-' + Date.now().toString(36));
}
function errorBoxMsg(e) { return '<div class="alert alert-error">' + icon('alert-circle') + '<div class="grow">' + esc(errMsg(e)) + '</div></div>'; }
/* ========== DASHBOARD ========== */
async function renderDashboard(el) {
  el.innerHTML = '<div class="dash-top">' + skelCards(4) + '</div><div class="dash-grid"><div class="panel"><div class="panel-body">' + skelRows(4) + '</div></div><div class="panel"><div class="panel-body">' + skelRows(4) + '</div></div></div>';
  try {
    const [stats, chart] = await Promise.all([adminStats(), adminRevenueChart()]);
    statsCache = stats;
    refreshNavPills();
    const max = Math.max.apply(null, chart.map(function (m) { return m.total; }).concat([1]));
    const cols = chart.map(function (m) {
      const pct = m.total ? Math.max(6, Math.round(m.total / max * 100)) : 6;
      return '<div class="chart-col"><div class="chart-bar ' + (m.total ? '' : 'is-empty') + '" style="height:' + pct + '%"><span class="bar-tip">' + rupiah(m.total) + ' · ' + m.count + ' pesanan</span></div><span class="chart-label">' + esc(m.label) + '</span></div>';
    }).join('');
    const recent = (stats.recentOrders || []).slice(0, 6);
    const lowStock = stats.lowStock || [];
    const topProducts = stats.topProducts || [];
    el.innerHTML = '<div class="dash-top">' +
      statCard('clay', 'wallet', 'Pendapatan', rupiah(stats.revenue), num(stats.ordersCount) + ' pesanan sukses') +
      statCard('sage', 'cart', 'Pesanan', num(stats.ordersCount), num(stats.byStatus && stats.byStatus.menunggu || 0) + ' menunggu bayar') +
      statCard('gold', 'package', 'Produk', num(stats.productsCount), num(stats.activeProducts) + ' aktif · ' + num(lowStock.length) + ' stok tipis') +
      statCard('info', 'users', 'Pelanggan', num(stats.customersCount), num(stats.pendingReviews) + ' ulasan pending') +
      '</div><div class="dash-grid"><div class="panel"><div class="panel-head"><div><h4>Pendapatan 6 bulan terakhir</h4><p class="hint">Pesanan yang tidak dibatalkan</p></div></div><div class="panel-body"><div class="chart">' + cols + '</div><p class="tiny muted mt-2">Bulan ini: <b>' + rupiah(stats.revenueThisMonth) + '</b></p></div></div><div class="quick-facts">' +
      qfact('refresh', 'Stok menipis (≤5)', num(lowStock.length), lowStock.length ? 'Segera restok' : 'Aman') +
      qfact('star', 'Ulasan pending', num(stats.pendingReviews), 'Menunggu moderasi') +
      qfact('ticket', 'Voucher aktif', num(stats.vouchersActive), 'Kode berjalan') +
      qfact('chart', 'Rata per pesanan', rupiah(stats.ordersCount ? Math.round(stats.revenue / stats.ordersCount) : 0), 'AOV') +
      '</div></div><div class="dash-grid"><div class="panel"><div class="panel-head"><h4>Pesanan terbaru</h4><a class="btn btn-ghost btn-sm" data-goto="pesanan">Lihat semua ' + icon('arrow-right') + '</a></div><div class="panel-body" style="padding:0 20px">' +
      (recent.length ? '<div class="mini-list">' + recent.map(function (o) {
        return '<div class="mini-item" style="cursor:pointer" data-order="' + esc(o.id) + '"><div class="thumb" style="display:flex;align-items:center;justify-content:center;background:var(--surface-2);color:var(--clay-strong);font-family:var(--font-display);font-weight:800;font-size:11px">' + esc(String(o.id).slice(-4)) + '</div><div class="mi-body"><b>' + esc(o.id) + '</b><span>' + fmtDateTime(o.created_at) + ' · ' + esc(STATUS_LABEL[o.status] || o.status) + '</span></div><b style="font-family:var(--font-display);font-size:14px">' + rupiah(o.total) + '</b></div>';
      }).join('') + '</div>' : emptyState({ icon: 'cart', title: 'Belum ada pesanan', text: 'Pesanan pertama akan muncul di sini.' })) +
      '</div></div><div class="panel"><div class="panel-head"><h4>Stok menipis & terlaris</h4></div><div class="panel-body" style="padding:0 20px">' +
      '<p class="tiny muted" style="margin-bottom:8px">Stok ≤ 5 buah</p>' +
      (lowStock.length ? '<div class="mini-list">' + lowStock.map(function (p) {
        return '<div class="mini-item" data-goto="produk" style="cursor:pointer"><div class="thumb">' + productImage(p, p.category) + '</div><div class="mi-body"><b>' + esc(p.name) + '</b><span>' + esc(p.category && p.category.name || 'Kriya') + '</span></div><span class="badge badge-danger">' + num(p.stock) + ' buah</span></div>';
      }).join('') + '</div>' : '<p class="tiny muted mb-2">Semua stok aman.</p>') +
      '<p class="tiny muted" style="margin:12px 0 8px">Terlaris</p>' +
      (topProducts.length ? '<div class="mini-list">' + topProducts.map(function (p) {
        return '<div class="mini-item" data-goto="produk" style="cursor:pointer"><div class="thumb">' + productImage(p, p.category) + '</div><div class="mi-body"><b>' + esc(p.name) + '</b><span>' + esc(p.category && p.category.name || 'Kriya') + '</span></div><span class="badge badge-gold">' + num(p.sold) + ' terjual</span></div>';
      }).join('') + '</div>' : '') +
      '</div></div></div>';
    qsa('[data-order]', el).forEach(function (row) { row.addEventListener('click', function () { openOrderDrawer(row.dataset.order); }); });
    qsa('[data-goto]', el).forEach(function (btn) { btn.addEventListener('click', function () { switchView(btn.dataset.goto); }); });
  } catch (e) { el.innerHTML = errorBoxMsg(e); }
}/* ========== PRODUK ========== */
const pState = { q: '', category: '', page: 1, perPage: 10 };
async function renderProducts(el) {
  const cats = await getCategories().catch(function () { return []; });
  el.innerHTML = '<div class="view-head"><div><h3>Produk</h3><p>' + icon('package') + ' Kelola produk, foto, variasi, stok, dan diskon.</p></div><div class="view-actions"><button class="btn btn-primary" id="p-add">' + icon('plus') + ' Tambah Produk</button></div></div><div class="panel"><div class="list-toolbar"><div class="search-box">' + icon('search') + '<input class="input" id="p-search" placeholder="Cari nama produk…" value="' + esc(pState.q) + '"></div><select class="input" id="p-cat-filter"><option value="">Semua kategori</option>' + cats.map(function (c) { return '<option value="' + esc(c.id) + '" ' + (pState.category === c.id ? 'selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div><div id="p-table-wrap" style="padding:0"><div class="panel-body">' + skelRows(6) + '</div></div><div id="p-foot" class="list-foot"></div></div>';
  const search = document.getElementById('p-search');
  const catFilter = document.getElementById('p-cat-filter');
  let t = null;
  search.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { pState.q = search.value.trim(); pState.page = 1; loadProductsTable(); }, 320); });
  catFilter.addEventListener('change', function () { pState.category = catFilter.value; pState.page = 1; loadProductsTable(); });
  document.getElementById('p-add').addEventListener('click', function () { openProductModal(null); });
  loadProductsTable();
}
async function loadProductsTable() {
  const wrap = document.getElementById('p-table-wrap');
  const foot = document.getElementById('p-foot');
  if (!wrap) return;
  wrap.innerHTML = '<div class="panel-body">' + skelRows(6) + '</div>';
  try {
    const res = await adminListProducts({ q: pState.q, category: pState.category, page: pState.page, perPage: pState.perPage });
    const items = res.items || [];
    const count = res.count || 0;
    if (!items.length) {
      wrap.innerHTML = '<div class="panel-body">' + emptyState({ icon: 'package', title: 'Produk tidak ditemukan', text: 'Coba kata kunci lain, atau tambah produk baru.', action: '<button class="btn btn-primary btn-sm" id="p-add2">' + icon('plus') + ' Tambah Produk</button>' }) + '</div>';
      const b = document.getElementById('p-add2'); if (b) b.addEventListener('click', function () { openProductModal(null); });
      foot.innerHTML = '';
      return;
    }
    const rows = items.map(function (p) {
      const variants = Number((p.variants && p.variants[0] && p.variants[0].count) || 0);
      const price = netPrice(p);
      return '<tr><td><div class="row" style="align-items:center"><div class="row-thumb">' + productImage(p, p.category) + '</div><div><div class="td-main">' + esc(p.name) + '</div><div class="td-sub">' + esc(p.category && p.category.name || '—') + ' · ' + esc(p.slug) + (variants ? ' · ' + variants + ' variasi' : '') + '</div></div></div></td><td><div class="td-main">' + rupiah(price) + '</div>' + (Number(p.discount_percent) > 0 ? '<div class="td-sub"><s>' + rupiah(p.price) + '</s> · -' + Number(p.discount_percent) + '%</div>' : '') + '</td><td><b>' + num(p.stock) + '</b></td><td>' + num(p.sold) + '</td><td><button class="switch ' + (p.active ? 'is-on' : '') + '" data-toggle-active="' + p.id + '" aria-label="Aktifkan"></button></td><td class="td-actions"><button class="icon-btn" data-edit="' + p.id + '" title="Edit">' + icon('pencil') + '</button><button class="icon-btn" data-del="' + p.id + '" title="Hapus" style="color:var(--danger)">' + icon('trash') + '</button></td></tr>';
    }).join('');
    wrap.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Produk</th><th>Harga</th><th>Stok</th><th>Terjual</th><th>Aktif</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    const pages = Math.max(1, Math.ceil(count / pState.perPage));
    if (pages > 1) {
      let html = '<span>Halaman ' + pState.page + ' dari ' + pages + ' (' + num(count) + ' produk)</span><div class="pager">';
      html += '<button data-pg="' + Math.max(1, pState.page - 1) + '" ' + (pState.page === 1 ? 'disabled' : '') + '>‹</button>';
      const from = Math.max(1, pState.page - 2);
      const to = Math.min(pages, pState.page + 2);
      if (from > 1) html += '<button data-pg="1">1</button>' + (from > 2 ? '<span class="muted">…</span>' : '');
      for (let pg = from; pg <= to; pg++) html += '<button data-pg="' + pg + '" class="' + (pg === pState.page ? 'is-active' : '') + '">' + pg + '</button>';
      if (to < pages) html += (to < pages - 1 ? '<span class="muted">…</span>' : '') + '<button data-pg="' + pages + '">' + pages + '</button>';
      html += '<button data-pg="' + Math.min(pages, pState.page + 1) + '" ' + (pState.page === pages ? 'disabled' : '') + '>›</button></div>';
      foot.innerHTML = html;
      qsa('button[data-pg]', foot).forEach(function (b) { b.addEventListener('click', function () { pState.page = Number(b.dataset.pg); loadProductsTable(); }); });
    } else { foot.innerHTML = '<span>' + num(count) + ' produk</span>'; }
    qsa('[data-toggle-active]', wrap).forEach(function (sw) {
      sw.addEventListener('click', async function () {
        const id = sw.dataset.toggleActive;
        const nowActive = !sw.classList.contains('is-on');
        try { await adminSetProductActive(id, nowActive); sw.classList.toggle('is-on', nowActive); toast(nowActive ? 'Produk diaktifkan' : 'Produk disembunyikan', 'ok', 1600); }
        catch (e) { toast(errMsg(e), 'error'); }
      });
    });
    qsa('[data-edit]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        const prod = items.find(function (x) { return x.id === b.dataset.edit; });
        if (prod) openProductModal(prod);
      });
    });
    qsa('[data-del]', wrap).forEach(function (b) {
      b.addEventListener('click', async function () {
        const prod = items.find(function (x) { return x.id === b.dataset.del; });
        const ok = await confirmAction('Hapus produk "' + (prod && prod.name) + '"? Foto & variasi ikut terhapus.', { okText: 'Hapus', danger: true });
        if (!ok) return;
        try { await adminDeleteProduct(b.dataset.del); for (const u of (prod && prod.images) || []) await deleteProductImage(u); toast('Produk dihapus', 'ok'); loadProductsTable(); }
        catch (e) { toast(errMsg(e), 'error'); }
      });
    });
  } catch (e) { wrap.innerHTML = '<div class="panel-body">' + errorBoxMsg(e) + '</div>'; foot.innerHTML = ''; }
}/* ========== PRODUCT MODAL ========== */
let pmState = null;
async function openProductModal(editing) {
  pmState = { editing: editing, images: Array.isArray(editing && editing.images) ? [...editing.images] : [], variants: [], removedVariants: [], slugAuto: !editing };
  let variants = [];
  if (editing) { try { variants = await adminListVariants(editing.id); } catch (e) { variants = []; } }
  pmState.variants = (variants || []).map(function (v) { return { id: v.id, label: v.label, stock: v.stock, sort: v.sort }; });
  const cats = await getCategories().catch(function () { return []; });
  const catOpts = cats.map(function (c) { return '<option value="' + esc(c.id) + '" ' + (editing && editing.category_id === c.id ? 'selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
  const m = showModal({
    title: editing ? ('Edit produk - ' + editing.name) : 'Tambah produk baru',
    body: '<div class="form-sections"><div class="fs-grid">' +
      '<div class="field span-2"><label>Nama produk</label><input class="input" data-pm="name" required value="' + esc(editing && editing.name || '') + '" placeholder="cth. Batik Tulis Jlamprang Sidoarjo"></div>' +
      '<div class="field"><label>Slug (URL)</label><input class="input" data-pm="slug" value="' + esc(editing && editing.slug || '') + '" placeholder="auto-dari-nama"></div>' +
      '<div class="field"><label>Kategori</label><select class="input" data-pm="category_id"><option value="">— pilih kategori —</option>' + catOpts + '</select></div>' +
      '<div class="field"><label>Harga (Rp)</label><div class="price-unit"><input class="input" type="number" min="0" data-pm="price" value="' + Number(editing && editing.price || 0) + '"></div></div>' +
      '<div class="field"><label>Diskon (%)</label><input class="input" type="number" min="0" max="90" data-pm="discount_percent" value="' + Number(editing && editing.discount_percent || 0) + '"></div>' +
      '<div class="field"><label>Stok</label><input class="input" type="number" min="0" data-pm="stock" value="' + Number(editing && editing.stock || 0) + '"></div>' +
      '<div class="field"><label>Berat (kg)</label><input class="input" type="number" step="0.1" min="0" data-pm="weight" value="' + Number(editing && editing.weight || 0.2) + '"></div>' +
      '<div class="field"><label>Terjual (manual)</label><input class="input" type="number" min="0" data-pm="sold" value="' + Number(editing && editing.sold || 0) + '"></div>' +
      '<div class="field"><label class="row" style="gap:8px;align-items:center;cursor:pointer"><input type="checkbox" data-pm="featured" ' + (editing && editing.featured ? 'checked' : '') + '> Unggulan</label></div>' +
      '<div class="field"><label class="row" style="gap:8px;align-items:center;cursor:pointer"><input type="checkbox" data-pm="active" ' + (editing && editing.active !== false ? 'checked' : 'checked') + '> Aktif (tampil di toko)</label></div>' +
      '</div>' +
      '<div class="field"><label>Deskripsi singkat</label><input class="input" data-pm="short_desc" value="' + esc(editing && editing.short_desc || '') + '" placeholder="Satu kalimat yang muncul di kartu produk"></div>' +
      '<div class="field"><label>Deskripsi lengkap</label><textarea class="input" data-pm="description" rows="4">' + esc(editing && editing.description || '') + '</textarea></div>' +
      '<div class="fs-grid">' +
        '<div class="field"><label>Bahan</label><input class="input" data-pm="material" value="' + esc(editing && editing.material || '') + '"></div>' +
        '<div class="field"><label>Ukuran</label><input class="input" data-pm="dimensions" value="' + esc(editing && editing.dimensions || '') + '"></div>' +
        '<div class="field"><label>Perawatan</label><input class="input" data-pm="care" value="' + esc(editing && editing.care || '') + '"></div>' +
        '<div class="field"><label>Tag (pisah koma)</label><input class="input" data-pm="tags" value="' + esc((editing && editing.tags || []).join(', ')) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Foto produk</label><div class="uploader" data-pm-uploader><span class="up-icon">' + icon('upload') + '</span><b>Klik atau seret foto ke sini</b><span>JPG, PNG, WebP — maks. 5 MB per foto</span></div><input type="file" accept="image/*" multiple hidden data-pm-file><div class="upload-list mt-2" data-pm-upload-list></div></div>' +
      '<div class="field"><label>Variasi produk (ukuran / warna)</label><div class="variant-editor" data-pm-variants></div><button type="button" class="btn btn-ghost btn-sm mt-1" data-pm-add-variant>' + icon('plus') + ' Tambah variasi</button><span class="hint">Kosongkan kalau produk tidak punya variasi.</span></div>' +
    '</div>',
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-pm-save>' + icon('check') + ' ' + (editing ? 'Simpan Perubahan' : 'Tambah Produk') + '</button>',
    large: true,
  });
  const modalEl = m.el;
  const nameInput = modalEl.querySelector('[data-pm="name"]');
  const slugInput = modalEl.querySelector('[data-pm="slug"]');
  nameInput.addEventListener('input', function () { if (pmState.slugAuto) slugInput.value = slugify(nameInput.value); });
  slugInput.addEventListener('input', function () { pmState.slugAuto = false; });
  renderUploadList(modalEl);
  renderVariantEditor(modalEl);
  const uploader = modalEl.querySelector('[data-pm-uploader]');
  const fileInput = modalEl.querySelector('[data-pm-file]');
  uploader.addEventListener('click', function () { fileInput.click(); });
  uploader.addEventListener('dragover', function (e) { e.preventDefault(); uploader.classList.add('is-drag'); });
  uploader.addEventListener('dragleave', function () { uploader.classList.remove('is-drag'); });
  uploader.addEventListener('drop', function (e) { e.preventDefault(); uploader.classList.remove('is-drag'); handleUploadFiles(e.dataTransfer.files, modalEl); });
  fileInput.addEventListener('change', function () { handleUploadFiles(fileInput.files, modalEl); fileInput.value = ''; });
  modalEl.querySelector('[data-pm-add-variant]').addEventListener('click', function () {
    pmState.variants.push({ id: null, label: '', stock: 0, sort: pmState.variants.length });
    renderVariantEditor(modalEl);
  });
  modalEl.addEventListener('click', async function (e) {
    if (e.target.closest('[data-pm-save]')) { await saveProductModal(m, modalEl, editing); }
    const rm = e.target.closest('[data-rm-variant]');
    if (rm) {
      const idx = Number(rm.dataset.rmVariant);
      const v = pmState.variants[idx];
      if (v && v.id) pmState.removedVariants.push(v.id);
      pmState.variants.splice(idx, 1);
      renderVariantEditor(modalEl);
    }
  });
}
function renderUploadList(modalEl) {
  const list = modalEl.querySelector('[data-pm-upload-list]');
  if (!pmState.images.length) { list.innerHTML = '<p class="tiny muted">Belum ada foto - produk akan pakai placeholder anyaman.</p>'; return; }
  list.innerHTML = pmState.images.map(function (url, i) {
    return '<div class="upload-item ' + (i === 0 ? 'is-primary' : '') + '"><img src="' + esc(url) + '" alt="" loading="lazy">' + (i === 0 ? '<span class="up-tag">Utama</span>' : '') + '<button class="up-del" data-rm-img="' + i + '" aria-label="Hapus foto">' + icon('x') + '</button>' + (i > 0 ? '<button class="up-make" data-make-main="' + i + '">Jadikan utama</button>' : '') + '</div>';
  }).join('');
  qsa('[data-rm-img]', list).forEach(function (b) {
    b.addEventListener('click', async function () {
      const i = Number(b.dataset.rmImg);
      const url = pmState.images[i];
      pmState.images.splice(i, 1);
      renderUploadList(modalEl);
      await deleteProductImage(url);
    });
  });
  qsa('[data-make-main]', list).forEach(function (b) {
    b.addEventListener('click', function () {
      const i = Number(b.dataset.makeMain);
      const u = pmState.images.splice(i, 1)[0];
      pmState.images.unshift(u);
      renderUploadList(modalEl);
    });
  });
}
async function handleUploadFiles(files, modalEl) {
  if (!files || !files.length) return;
  const uploader = modalEl.querySelector('[data-pm-uploader]');
  uploader.classList.add('is-drag');
  toast('Mengunggah foto...', 'info', 2000);
  for (const file of [...files]) {
    if (!file.type.startsWith('image/')) { toast('File bukan gambar, dilewati.', 'info'); continue; }
    if (file.size > 5 * 1024 * 1024) { toast('Foto terlalu besar (maks 5 MB).', 'error'); continue; }
    try { const url = await uploadProductImage(file); pmState.images.push(url); renderUploadList(modalEl); }
    catch (e) { toast(errMsg(e), 'error'); }
  }
  uploader.classList.remove('is-drag');
  toast('Foto selesai diunggah.', 'ok', 1800);
}
function renderVariantEditor(modalEl) {
  const box = modalEl.querySelector('[data-pm-variants]');
  box.innerHTML = '<div class="variant-editor">' + pmState.variants.map(function (v, i) {
    return '<div class="variant-row"><input class="input" placeholder="cth. Merah · XL" value="' + esc(v.label) + '" data-v-field="label" data-v-idx="' + i + '"><input class="input" type="number" min="0" placeholder="Stok" value="' + Number(v.stock) + '" data-v-field="stock" data-v-idx="' + i + '"><button type="button" class="icon-btn" style="color:var(--danger)" data-rm-variant="' + i + '" title="Hapus variasi">' + icon('trash') + '</button></div>';
  }).join('') + '</div>';
  qsa('[data-v-field]', box).forEach(function (inp) {
    inp.addEventListener('input', function () {
      const i = Number(inp.dataset.vIdx);
      const field = inp.dataset.vField;
      if (field === 'stock') pmState.variants[i].stock = Number(inp.value);
      else pmState.variants[i][field] = inp.value;
    });
  });
}
async function saveProductModal(m, modalEl, editing) {
  const btn = modalEl.querySelector('[data-pm-save]');
  const val = function (f) { const el = modalEl.querySelector('[data-pm="' + f + '"]'); return el ? el.value : ''; };
  const chk = function (f) { const el = modalEl.querySelector('[data-pm="' + f + '"]'); return el ? el.checked : false; };
  const name = val('name').trim();
  if (!name) { toast('Nama produk wajib diisi.', 'info'); return; }
  const slug = val('slug').trim() || slugify(name);
  const price = Number(val('price')) || 0;
  if (price <= 0) { toast('Harga harus lebih dari 0.', 'info'); return; }
  setBusy(btn, true);
  try {
    const saved = await adminSaveProduct({
      id: editing && editing.id, slug: slug, name: name, category_id: val('category_id') || null,
      price: price, discount_percent: Number(val('discount_percent')) || 0, stock: Number(val('stock')) || 0,
      weight: Number(val('weight')) || 0.2, sold: Number(val('sold')) || 0, featured: chk('featured'), active: chk('active'),
      short_desc: val('short_desc').trim(), description: val('description').trim(), material: val('material').trim(),
      dimensions: val('dimensions').trim(), care: val('care').trim(),
      tags: val('tags').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      images: pmState.images,
    });
    for (let i = 0; i < pmState.variants.length; i++) {
      const v = pmState.variants[i];
      if (!String(v.label).trim()) continue;
      await adminSaveVariant({ id: v.id, product_id: saved.id, label: String(v.label).trim(), stock: Number(v.stock) || 0, sort: i });
    }
    for (const id of pmState.removedVariants) { try { await adminDeleteVariant(id); } catch (e) { /* ignore */ } }
    toast(editing ? 'Produk diperbarui' : 'Produk ditambahkan', 'ok');
    m.close();
    loadProductsTable();
  } catch (e) {
    setBusy(btn, false);
    toast(errMsg(e), 'error', 5000);
  }
}/* ========== KATEGORI ========== */
async function renderCategories(el) {
  el.innerHTML = '<div class="view-head"><div><h3>Kategori</h3><p>' + icon('grid') + ' Atur kategori produk, ikon, dan warna label.</p></div><div class="view-actions"><button class="btn btn-primary" id="c-add">' + icon('plus') + ' Tambah Kategori</button></div></div><div class="p-grid" id="c-grid">' + skelCards(4) + '</div>';
  document.getElementById('c-add').addEventListener('click', function () { openCategoryModal(null); });
  await loadCategories();
}
async function loadCategories() {
  const grid = document.getElementById('c-grid');
  if (!grid) return;
  try {
    const cats = await getCategories();
    const prodRes = await adminListProducts({ perPage: 500 }).catch(function () { return { items: [] }; });
    const items = prodRes.items || [];
    const counts = {};
    for (const p of items) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    if (!cats.length) { grid.innerHTML = emptyState({ icon: 'grid', title: 'Belum ada kategori', text: 'Tambahkan kategori pertama.' }); return; }
    grid.innerHTML = cats.map(function (c) {
      return '<div class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><div class="cat-preview" style="--cat-c:' + esc(c.color) + ';padding:12px"><span class="cat-icon" style="--cat-c:' + esc(c.color) + '">' + icon(c.icon || 'package') + '</span><div><b style="font-size:15px">' + esc(c.name) + '</b><div class="tiny muted">' + num(counts[c.id] || 0) + ' produk · /' + esc(c.slug) + '</div></div></div><div class="row" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-edit-cat="' + c.id + '">' + icon('pencil') + ' Edit</button><button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-del-cat="' + c.id + '">' + icon('trash') + ' Hapus</button></div></div>';
    }).join('');
    qsa('[data-edit-cat]', grid).forEach(function (b) {
      b.addEventListener('click', function () { const c = cats.find(function (x) { return x.id === b.dataset.editCat; }); if (c) openCategoryModal(c); });
    });
    qsa('[data-del-cat]', grid).forEach(function (b) {
      b.addEventListener('click', async function () {
        const c = cats.find(function (x) { return x.id === b.dataset.delCat; });
        const ok = await confirmAction('Hapus kategori "' + (c && c.name) + '"? Produk di kategori ini tidak ikut terhapus.', { okText: 'Hapus', danger: true });
        if (!ok) return;
        try { await adminDeleteCategory(b.dataset.delCat); toast('Kategori dihapus', 'ok'); loadCategories(); }
        catch (e) { toast(errMsg(e), 'error'); }
      });
    });
  } catch (e) { grid.innerHTML = errorBoxMsg(e); }
}
function openCategoryModal(editing) {
  let selectedIcon = (editing && editing.icon) || 'package';
  let selectedColor = (editing && editing.color) || '#c05a30';
  const iconButtons = CATEGORY_ICONS.map(function (ic) { return '<button type="button" data-cat-icon="' + ic + '" class="' + (ic === selectedIcon ? 'is-active' : '') + '">' + icon(ic) + '</button>'; }).join('');
  const colorButtons = COLORS.map(function (col) { return '<button type="button" data-cat-color="' + col + '" style="background:' + col + '" class="' + (col === selectedColor ? 'is-active' : '') + '" aria-label="' + col + '"></button>'; }).join('');
  const m = showModal({
    title: editing ? ('Edit kategori - ' + editing.name) : 'Tambah kategori baru',
    body: '<div class="form-grid"><div class="field"><label>Nama kategori</label><input class="input" data-c="name" value="' + esc(editing && editing.name || '') + '" placeholder="cth. Batik Tulis"></div><div class="field"><label>Slug (URL)</label><input class="input" data-c="slug" value="' + esc(editing && editing.slug || '') + '" placeholder="auto-dari-nama"></div><div class="field"><label>Urutan (sort)</label><input class="input" type="number" data-c="sort" value="' + Number(editing && editing.sort || 0) + '"></div></div><div class="field"><label>Pilih ikon</label><div class="icon-picker" data-c-icons>' + iconButtons + '</div></div><div class="field"><label>Pilih warna label</label><div class="color-picker" data-c-colors>' + colorButtons + '</div></div><div class="field"><label>Preview</label><div class="cat-preview" data-c-preview style="--cat-c:' + esc(selectedColor) + '"><span class="cat-icon" style="--cat-c:' + esc(selectedColor) + '" data-c-preview-icon>' + icon(selectedIcon) + '</span><div><b data-c-preview-name>' + esc(editing && editing.name || 'Nama Kategori') + '</b><div class="tiny muted">0 produk</div></div></div></div>',
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-c-save>' + icon('check') + ' Simpan</button>',
  });
  const modalEl = m.el;
  const nameIn = modalEl.querySelector('[data-c="name"]');
  const slugIn = modalEl.querySelector('[data-c="slug"]');
  let slugAuto = !editing;
  nameIn.addEventListener('input', function () { if (slugAuto) slugIn.value = slugify(nameIn.value); modalEl.querySelector('[data-c-preview-name]').textContent = nameIn.value || 'Nama Kategori'; });
  slugIn.addEventListener('input', function () { slugAuto = false; });
  qsa('[data-cat-icon]', modalEl).forEach(function (b) { b.addEventListener('click', function () { selectedIcon = b.dataset.catIcon; qsa('[data-cat-icon]', modalEl).forEach(function (x) { x.classList.toggle('is-active', x === b); }); modalEl.querySelector('[data-c-preview-icon]').innerHTML = icon(selectedIcon); }); });
  qsa('[data-cat-color]', modalEl).forEach(function (b) { b.addEventListener('click', function () { selectedColor = b.dataset.catColor; qsa('[data-cat-color]', modalEl).forEach(function (x) { x.classList.toggle('is-active', x === b); }); var preview = modalEl.querySelector('[data-c-preview]'); var pIcon = modalEl.querySelector('[data-c-preview-icon]'); preview.style.setProperty('--cat-c', selectedColor); pIcon.style.setProperty('--cat-c', selectedColor); }); });
  modalEl.addEventListener('click', async function (e) {
    if (!e.target.closest('[data-c-save]')) return;
    const btn = modalEl.querySelector('[data-c-save]');
    const name = nameIn.value.trim();
    if (!name) { toast('Nama kategori wajib diisi.', 'info'); return; }
    const slug = slugIn.value.trim() || slugify(name);
    setBusy(btn, true);
    try {
      await adminSaveCategory({ id: editing && editing.id, slug: slug, name: name, icon: selectedIcon, color: selectedColor, sort: Number(modalEl.querySelector('[data-c="sort"]').value) || 0 });
      toast(editing ? 'Kategori diperbarui' : 'Kategori ditambahkan', 'ok');
      m.close();
      loadCategories();
    } catch (e) { setBusy(btn, false); toast(errMsg(e), 'error'); }
  });
}/* ========== PESANAN ========== */
const oState = { status: '', q: '', page: 1, perPage: 10 };
async function renderOrders(el) {
  el.innerHTML = '<div class="view-head"><div><h3>Pesanan</h3><p>' + icon('truck') + ' Pantau & proses pesanan pelanggan.</p></div></div><div class="panel"><div class="status-tabs" id="o-tabs"></div><div class="list-toolbar"><div class="search-box">' + icon('search') + '<input class="input" id="o-search" placeholder="Cari nomor pesanan (ORD-…)" value="' + esc(oState.q) + '"></div></div><div id="o-table-wrap" style="padding:0"><div class="panel-body">' + skelRows(6) + '</div></div><div id="o-foot" class="list-foot"></div></div>';
  const tabs = ['semua', 'menunggu', 'diproses', 'dikirim', 'selesai', 'batal'];
  const tabLabels = { semua: 'Semua', menunggu: 'Menunggu', diproses: 'Diproses', dikirim: 'Dikirim', selesai: 'Selesai', batal: 'Batal' };
  document.getElementById('o-tabs').innerHTML = tabs.map(function (t) { return '<button class="chip ' + (oState.status === (t === 'semua' ? '' : t) ? 'is-active' : '') + '" data-ostatus="' + (t === 'semua' ? '' : t) + '">' + tabLabels[t] + '</button>'; }).join('');
  qsa('[data-ostatus]', document.getElementById('o-tabs')).forEach(function (b) {
    b.addEventListener('click', function () { oState.status = b.dataset.ostatus; oState.page = 1; qsa('[data-ostatus]').forEach(function (x) { x.classList.toggle('is-active', x === b); }); loadOrdersTable(); });
  });
  const search = document.getElementById('o-search');
  let t = null;
  search.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { oState.q = search.value.trim(); oState.page = 1; loadOrdersTable(); }, 320); });
  loadOrdersTable();
}
async function loadOrdersTable() {
  const wrap = document.getElementById('o-table-wrap');
  const foot = document.getElementById('o-foot');
  if (!wrap) return;
  wrap.innerHTML = '<div class="panel-body">' + skelRows(6) + '</div>';
  try {
    const res = await adminListOrders({ status: oState.status, q: oState.q, page: oState.page, perPage: oState.perPage });
    const items = res.items || [];
    const count = res.count || 0;
    if (!items.length) { wrap.innerHTML = '<div class="panel-body">' + emptyState({ icon: 'truck', title: 'Tidak ada pesanan', text: 'Coba filter lain.' }) + '</div>'; foot.innerHTML = ''; return; }
    const rows = items.map(function (o) {
      const c = o.customer || {};
      return '<tr><td><div class="td-main">' + esc(o.id) + '</div><div class="td-sub">' + fmtDateTime(o.created_at) + '</div></td><td><div class="td-main">' + esc(c.name || '-') + '</div><div class="td-sub">' + esc(c.city || '') + ' · ' + esc(c.phone || '') + '</div></td><td><b>' + rupiah(o.total) + '</b><div class="td-sub">' + esc(PAYMENT_LABEL[o.payment] || o.payment) + '</div></td><td><span class="status-pill status-' + esc(o.status) + '">' + (STATUS_LABEL[o.status] || o.status) + '</span></td><td class="td-actions"><button class="btn btn-ghost btn-sm" data-detail="' + esc(o.id) + '">' + icon('eye') + ' Detail</button></td></tr>';
    }).join('');
    wrap.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    const pages = Math.max(1, Math.ceil(count / oState.perPage));
    if (pages > 1) {
      let html = '<span>Halaman ' + oState.page + ' dari ' + pages + '</span><div class="pager">';
      html += '<button data-pg="' + Math.max(1, oState.page - 1) + '" ' + (oState.page === 1 ? 'disabled' : '') + '>‹</button>';
      const from = Math.max(1, oState.page - 2);
      const to = Math.min(pages, oState.page + 2);
      if (from > 1) html += '<button data-pg="1">1</button>' + (from > 2 ? '<span class="muted">…</span>' : '');
      for (let pg = from; pg <= to; pg++) html += '<button data-pg="' + pg + '" class="' + (pg === oState.page ? 'is-active' : '') + '">' + pg + '</button>';
      if (to < pages) html += (to < pages - 1 ? '<span class="muted">…</span>' : '') + '<button data-pg="' + pages + '">' + pages + '</button>';
      html += '<button data-pg="' + Math.min(pages, oState.page + 1) + '" ' + (oState.page === pages ? 'disabled' : '') + '>›</button></div>';
      foot.innerHTML = html;
      qsa('button[data-pg]', foot).forEach(function (b) { b.addEventListener('click', function () { oState.page = Number(b.dataset.pg); loadOrdersTable(); }); });
    } else { foot.innerHTML = '<span>' + num(count) + ' pesanan</span>'; }
    qsa('[data-detail]', wrap).forEach(function (b) { b.addEventListener('click', function () { openOrderDrawer(b.dataset.detail); }); });
  } catch (e) { wrap.innerHTML = '<div class="panel-body">' + errorBoxMsg(e) + '</div>'; foot.innerHTML = ''; }
}
async function openOrderDrawer(orderId) {
  let overlay = document.getElementById('order-overlay');
  let drawer = document.getElementById('order-drawer');
  if (!drawer) {
    overlay = document.createElement('div'); overlay.id = 'order-overlay'; overlay.className = 'overlay';
    drawer = document.createElement('aside'); drawer.id = 'order-drawer'; drawer.className = 'drawer order-drawer';
    drawer.innerHTML = '<div class="drawer-head"><h3 id="od-title" class="row" style="gap:8px">' + icon('truck') + ' Detail Pesanan</h3><button class="icon-btn" data-od-close aria-label="Tutup">' + icon('x') + '</button></div><div class="drawer-body" id="od-body"></div>';
    document.body.append(overlay, drawer);
    overlay.addEventListener('click', closeOrderDrawer);
    drawer.addEventListener('click', function (e) { if (e.target.closest('[data-od-close]')) closeOrderDrawer(); });
  }
  overlay.classList.add('is-open');
  drawer.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  const body = document.getElementById('od-body');
  body.innerHTML = '<div class="panel-body">' + skelRows(4) + '</div>';
  try {
    const detail = await getOrderDetail(orderId);
    const o = detail.order;
    const items = detail.items || [];
    const history = detail.history || [];
    const c = o.customer || {};
    const waPhone = String(c.phone || '').replace(/\D/g, '').replace(/^0/, '62');
    const statusActions = [];
    if (o.status === 'menunggu') { statusActions.push('<button class="btn btn-soft" data-od-action="diproses">' + icon('settings') + ' Proses & Konfirmasi Bayar</button>'); statusActions.push('<button class="btn btn-danger" data-od-action="batal">' + icon('x') + ' Batalkan</button>'); }
    else if (o.status === 'diproses') { statusActions.push('<button class="btn btn-soft" data-od-action="kirim">' + icon('truck') + ' Kirim Paket</button>'); statusActions.push('<button class="btn btn-danger" data-od-action="batal">' + icon('x') + ' Batalkan</button>'); }
    else if (o.status === 'dikirim') { statusActions.push('<button class="btn btn-soft" data-od-action="selesai">' + icon('check') + ' Tandai Selesai</button>'); statusActions.push('<button class="btn btn-ghost" data-od-action="resi">' + icon('tag') + ' Ubah Resi</button>'); }
    else if (o.status === 'selesai') { statusActions.push('<button class="btn btn-ghost" data-od-action="resi">' + icon('tag') + ' Ubah Resi</button>'); }
    body.innerHTML = '<div class="od-section" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><div class="td-main" style="font-size:16px">' + esc(o.id) + '</div><div class="td-sub">' + fmtDateTime(o.created_at) + '</div></div><span class="status-pill status-' + esc(o.status) + '">' + (STATUS_LABEL[o.status] || o.status) + '</span></div>' +
      '<div class="od-section"><h5>' + icon('settings') + ' Aksi status</h5><div class="od-status-actions">' + (statusActions.length ? statusActions.join('') : '<p class="tiny muted">Tidak ada aksi untuk status ini.</p>') + '</div></div>' +
      '<div class="od-section"><h5>' + icon('package') + ' Isi pesanan (' + items.length + ' barang)</h5><div class="mini-list">' + items.map(function (it) {
        return '<div class="mini-item"><div class="thumb">' + (it.image ? '<img src="' + esc(it.image) + '" alt="">' : productImage({ name: it.name, images: [] }, null)) + '</div><div class="mi-body"><b>' + esc(it.name) + '</b><span>' + num(it.qty) + ' × ' + rupiah(it.price) + '</span></div><b>' + rupiah(it.price * it.qty) + '</b></div>';
      }).join('') + '</div></div>' +
      '<div class="od-section"><h5>' + icon('user') + ' Data penerima</h5><div class="od-kv"><div><span>Nama</span><b>' + esc(c.name || '-') + '</b></div><div><span>HP</span><b>' + esc(c.phone || '-') + '</b></div><div><span>Kota</span><b>' + esc(c.city || '-') + (c.postal ? ' ' + esc(c.postal) : '') + '</b></div><div><span>Alamat</span><b style="text-align:left;max-width:220px">' + esc(c.address || '-') + '</b></div>' + (c.note ? '<div><span>Catatan</span><b style="text-align:left;max-width:220px">' + esc(c.note) + '</b></div>' : '') + (c.email ? '<div><span>Email</span><b>' + esc(c.email) + '</b></div>' : '') + '</div>' + (waPhone ? '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo ' + (c.name || '') + ', pesanan ' + o.id + ' (Toko Kriya)') + '" style="margin-top:12px">' + icon('message') + ' Chat WhatsApp</a>' : '') + '</div>' +
      '<div class="od-section"><h5>' + icon('receipt') + ' Pembayaran & pengiriman</h5><div class="od-kv"><div><span>Metode bayar</span><b>' + esc(PAYMENT_LABEL[o.payment] || o.payment) + '</b></div><div><span>Pengiriman</span><b>' + esc(SHIPPING_LABEL[o.shipping] || o.shipping) + '</b></div><div><span>Ongkir</span><b>' + rupiah(o.shipping_cost) + '</b></div>' + (o.payment_fee ? '<div><span>Biaya COD</span><b>' + rupiah(o.payment_fee) + '</b></div>' : '') + (o.discount ? '<div><span>Diskon</span><b style="color:var(--ok)">−' + rupiah(o.discount) + '</b></div>' : '') + (o.voucher_code ? '<div><span>Voucher</span><b>' + esc(o.voucher_code) + '</b></div>' : '') + '<div><span>Subtotal</span><b>' + rupiah(o.subtotal) + '</b></div><div><span>Total</span><b style="font-family:var(--font-display);color:var(--clay-strong)">' + rupiah(o.total) + '</b></div>' + (o.resi ? '<div><span>No. resi</span><b>' + esc(o.resi) + '</b></div>' : '') + (o.paid_at ? '<div><span>Dibayar</span><b>' + fmtDateTime(o.paid_at) + '</b></div>' : '') + (o.cancel_reason ? '<div><span>Alasan batal</span><b style="color:var(--danger)">' + esc(o.cancel_reason) + '</b></div>' : '') + '</div></div>' +
      '<div class="od-section"><h5>' + icon('calendar') + ' Riwayat status</h5><div class="timeline compact">' + history.map(function (h) {
        return '<div class="tl-item ' + (h.status === o.status ? 'is-current' : '') + '"><span class="tl-dot">' + icon(STATUS_ICON[h.status] || 'circle') + '</span><div><div class="tl-title">' + (STATUS_LABEL[h.status] || h.status) + '</div><div class="tl-note">' + esc(h.note || '') + '</div><div class="tl-time">' + fmtDateTime(h.created_at) + '</div></div></div>';
      }).join('') + '</div></div>';
    qsa('[data-od-action]', body).forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const action = btn.dataset.odAction;
        try {
          if (action === 'batal') {
            const reason = await askInput({ title: 'Batalkan pesanan', label: 'Alasan pembatalan', placeholder: 'cth. Stok tidak tersedia', textarea: true, okText: 'Batalkan' });
            if (reason === null) return;
            const ok = await confirmAction('Batalkan pesanan ' + orderId + '? Stok dikembalikan.', { okText: 'Ya, batalkan', danger: true });
            if (!ok) return;
            const res = await setOrderStatus(orderId, 'batal', null, reason || 'Dibatalkan admin');
            if (res && res.ok === false) throw new Error(res.error);
            toast('Pesanan dibatalkan.', 'info');
          } else if (action === 'kirim') {
            const resi = await askInput({ title: 'Kirim paket', label: 'Nomor resi (opsional, kosongkan untuk auto-generate)', placeholder: 'cth. JNE1234567890', okText: 'Kirim' });
            if (resi === null) return;
            if (resi.trim()) await adminSetResi(orderId, resi.trim());
            const res = await setOrderStatus(orderId, 'dikirim', 'Paket diserahkan ke kurir', null);
            if (res && res.ok === false) throw new Error(res.error);
            toast('Paket dikirim' + (res && res.resi ? ' · resi ' + res.resi : '') + '.', 'ok');
          } else if (action === 'resi') {
            const val = await askInput({ title: 'Ubah nomor resi', label: 'Nomor resi', value: o.resi || '', placeholder: 'cth. JNE1234567890', okText: 'Simpan' });
            if (val === null) return;
            await adminSetResi(orderId, val.trim());
            toast('Resi diperbarui.', 'ok');
          } else {
            const note = action === 'diproses' ? 'Pembayaran dikonfirmasi admin' : 'Pesanan selesai';
            const res = await setOrderStatus(orderId, action, note, null);
            if (res && res.ok === false) throw new Error(res.error);
            toast('Status diubah ke ' + (STATUS_LABEL[action] || action) + '.', 'ok');
          }
          closeOrderDrawer();
          loadOrdersTable();
          refreshNavPills();
        } catch (e) { toast(errMsg(e), 'error'); }
      });
    });
  } catch (e) { body.innerHTML = '<div class="panel-body">' + errorBoxMsg(e) + '</div>'; }
}
function closeOrderDrawer() {
  const o = document.getElementById('order-overlay'); if (o) o.classList.remove('is-open');
  const d = document.getElementById('order-drawer'); if (d) d.classList.remove('is-open');
  document.body.style.overflow = '';
}/* ========== ULASAN ========== */
const rState = { status: '', page: 1, perPage: 12 };
async function renderReviews(el) {
  el.innerHTML = '<div class="view-head"><div><h3>Ulasan</h3><p>' + icon('star') + ' Moderasi ulasan pembeli — publish, sembunyikan, balas.</p></div></div><div class="panel"><div class="status-tabs" id="r-tabs"></div><div id="r-table-wrap" style="padding:0"><div class="panel-body">' + skelRows(6) + '</div></div><div id="r-foot" class="list-foot"></div></div>';
  const tabs = ['', 'pending', 'published', 'hidden'];
  const labels = { '': 'Semua', pending: 'Pending', published: 'Published', hidden: 'Hidden' };
  document.getElementById('r-tabs').innerHTML = tabs.map(function (t) { return '<button class="chip ' + (rState.status === t ? 'is-active' : '') + '" data-rstatus="' + t + '">' + labels[t] + '</button>'; }).join('');
  qsa('[data-rstatus]').forEach(function (b) { b.addEventListener('click', function () { rState.status = b.dataset.rstatus; rState.page = 1; qsa('[data-rstatus]').forEach(function (x) { x.classList.toggle('is-active', x === b); }); loadReviewsTable(); }); });
  loadReviewsTable();
}
async function loadReviewsTable() {
  const wrap = document.getElementById('r-table-wrap');
  const foot = document.getElementById('r-foot');
  if (!wrap) return;
  wrap.innerHTML = '<div class="panel-body">' + skelRows(6) + '</div>';
  try {
    const res = await adminListReviews({ status: rState.status, page: rState.page, perPage: rState.perPage });
    const items = res.items || [];
    const count = res.count || 0;
    if (!items.length) { wrap.innerHTML = '<div class="panel-body">' + emptyState({ icon: 'star', title: 'Tidak ada ulasan', text: 'Ulasan pembeli akan muncul di sini.' }) + '</div>'; foot.innerHTML = ''; return; }
    const rows = items.map(function (r) {
      return '<tr><td><div class="row" style="gap:6px;align-items:center">' + stars(r.rating) + '<span class="tiny muted">' + timeAgo(r.created_at) + '</span></div><div class="td-sub" style="margin-top:4px;max-width:320px">' + esc(String(r.text || '').slice(0, 110)) + (String(r.text || '').length > 110 ? '…' : '') + '</div>' + (r.reply ? '<div class="td-sub" style="color:var(--info);margin-top:4px">↳ balasan: ' + esc(String(r.reply).slice(0, 80)) + '</div>' : '') + '</td><td><div class="td-main">' + esc(r.products && r.products.name || '-') + '</div><div class="td-sub">oleh ' + esc(r.author) + '</div></td><td><span class="badge ' + (r.status === 'published' ? 'badge-ok' : r.status === 'pending' ? 'badge-warn' : 'badge-outline') + '">' + (r.status === 'published' ? 'Published' : r.status === 'pending' ? 'Pending' : 'Hidden') + '</span></td><td class="td-actions">' + (r.status !== 'published' ? '<button class="icon-btn" data-pub="' + r.id + '" title="Publish">' + icon('check') + '</button>' : '') + (r.status !== 'hidden' ? '<button class="icon-btn" data-hide="' + r.id + '" title="Sembunyikan">' + icon('eye') + '</button>' : '') + '<button class="icon-btn" data-reply="' + r.id + '" title="Balas">' + icon('message') + '</button><button class="icon-btn" style="color:var(--danger)" data-delrev="' + r.id + '" title="Hapus">' + icon('trash') + '</button></td></tr>';
    }).join('');
    wrap.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Ulasan</th><th>Produk</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    const pages = Math.max(1, Math.ceil(count / rState.perPage));
    if (pages > 1) {
      let html = '<span>Halaman ' + rState.page + ' dari ' + pages + '</span><div class="pager">';
      html += '<button data-pg="' + Math.max(1, rState.page - 1) + '" ' + (rState.page === 1 ? 'disabled' : '') + '>‹</button>';
      const from = Math.max(1, rState.page - 2); const to = Math.min(pages, rState.page + 2);
      if (from > 1) html += '<button data-pg="1">1</button>' + (from > 2 ? '<span class="muted">…</span>' : '');
      for (let pg = from; pg <= to; pg++) html += '<button data-pg="' + pg + '" class="' + (pg === rState.page ? 'is-active' : '') + '">' + pg + '</button>';
      if (to < pages) html += (to < pages - 1 ? '<span class="muted">…</span>' : '') + '<button data-pg="' + pages + '">' + pages + '</button>';
      html += '<button data-pg="' + Math.min(pages, rState.page + 1) + '" ' + (rState.page === pages ? 'disabled' : '') + '>›</button></div>';
      foot.innerHTML = html;
      qsa('button[data-pg]', foot).forEach(function (b) { b.addEventListener('click', function () { rState.page = Number(b.dataset.pg); loadReviewsTable(); }); });
    } else { foot.innerHTML = '<span>' + num(count) + ' ulasan</span>'; }
    qsa('[data-pub]', wrap).forEach(function (b) { b.addEventListener('click', async function () { try { await adminUpdateReview(b.dataset.pub, { status: 'published' }); toast('Ulasan dipublish.', 'ok'); loadReviewsTable(); refreshNavPills(); } catch (e) { toast(errMsg(e), 'error'); } }); });
    qsa('[data-hide]', wrap).forEach(function (b) { b.addEventListener('click', async function () { try { await adminUpdateReview(b.dataset.hide, { status: 'hidden' }); toast('Ulasan disembunyikan.', 'info'); loadReviewsTable(); refreshNavPills(); } catch (e) { toast(errMsg(e), 'error'); } }); });
    qsa('[data-reply]', wrap).forEach(function (b) { b.addEventListener('click', async function () { const r = items.find(function (x) { return x.id === b.dataset.reply; }); const val = await askInput({ title: 'Balas ulasan', label: 'Balasan toko', placeholder: 'Tulis balasan untuk pembeli…', value: (r && r.reply) || '', textarea: true, okText: 'Simpan balasan' }); if (val === null) return; try { await adminUpdateReview(b.dataset.reply, { reply: val.trim() || null }); toast('Balasan disimpan.', 'ok'); loadReviewsTable(); } catch (e) { toast(errMsg(e), 'error'); } }); });
    qsa('[data-delrev]', wrap).forEach(function (b) { b.addEventListener('click', async function () { const ok = await confirmAction('Hapus ulasan ini permanen?', { okText: 'Hapus', danger: true }); if (!ok) return; try { await adminDeleteReview(b.dataset.delrev); toast('Ulasan dihapus.', 'info'); loadReviewsTable(); refreshNavPills(); } catch (e) { toast(errMsg(e), 'error'); } }); });
  } catch (e) { wrap.innerHTML = '<div class="panel-body">' + errorBoxMsg(e) + '</div>'; foot.innerHTML = ''; }
}

/* ========== VOUCHER ========== */
async function renderVouchers(el) {
  el.innerHTML = '<div class="view-head"><div><h3>Voucher</h3><p>' + icon('ticket') + ' Kelola kode diskon, kuota, dan masa berlaku.</p></div><div class="view-actions"><button class="btn btn-primary" id="v-add">' + icon('plus') + ' Tambah Voucher</button></div></div><div class="panel"><div id="v-table-wrap" style="padding:0"><div class="panel-body">' + skelRows(5) + '</div></div></div>';
  document.getElementById('v-add').addEventListener('click', function () { openVoucherModal(null); });
  await loadVouchers();
}
async function loadVouchers() {
  const wrap = document.getElementById('v-table-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<div class="panel-body">' + skelRows(5) + '</div>';
  try {
    const items = await adminListVouchers();
    if (!items.length) { wrap.innerHTML = '<div class="panel-body">' + emptyState({ icon: 'ticket', title: 'Belum ada voucher', text: 'Tambahkan voucher pertama.' }) + '</div>'; return; }
    const rows = items.map(function (v) {
      const valLabel = v.type === 'percent' ? (Number(v.value) + '%') : v.type === 'fixed' ? rupiah(v.value) : 'Gratis ongkir';
      const expired = v.expires_at && new Date(v.expires_at) < new Date();
      return '<tr><td><div class="td-main" style="font-family:var(--font-display);letter-spacing:0.05em">' + esc(v.code) + '</div><div class="td-sub">' + esc(v.description || '—') + '</div></td><td><div class="td-main">' + esc(valLabel) + '</div><div class="td-sub">' + (v.type === 'percent' ? 'maks ' + rupiah(v.max_discount) : v.type === 'freeship' ? 'ongkir 0' : 'potongan tetap') + '</div></td><td>' + rupiah(v.min_spend) + '</td><td><div class="td-main">' + num(v.used) + ' / ' + num(v.quota) + '</div><div class="meter mt-1" style="width:90px"><i style="width:' + Math.min(100, Math.round(v.used / Math.max(1, v.quota) * 100)) + '%"></i></div></td><td><button class="switch ' + (v.active ? 'is-on' : '') + '" data-v-toggle="' + esc(v.code) + '"></button>' + (expired ? '<div class="td-sub" style="color:var(--danger)">kedaluwarsa</div>' : '') + '</td><td class="td-sub">' + (v.expires_at ? fmtDate(v.expires_at) : 'Tanpa batas') + '</td><td class="td-actions"><button class="icon-btn" data-vedit="' + esc(v.code) + '" title="Edit">' + icon('pencil') + '</button><button class="icon-btn" style="color:var(--danger)" data-vdel="' + esc(v.code) + '" title="Hapus">' + icon('trash') + '</button></td></tr>';
    }).join('');
    wrap.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Kode</th><th>Nilai</th><th>Min. belanja</th><th>Kuota</th><th>Aktif</th><th>Kedaluwarsa</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    qsa('[data-v-toggle]', wrap).forEach(function (sw) { sw.addEventListener('click', async function () { const code = sw.dataset.vToggle; const v = items.find(function (x) { return x.code === code; }); const nowActive = !sw.classList.contains('is-on'); try { await adminSaveVoucher(Object.assign({}, v, { active: nowActive, _exists: true })); sw.classList.toggle('is-on', nowActive); toast(nowActive ? 'Voucher diaktifkan' : 'Voucher dinonaktifkan', 'ok', 1600); } catch (e) { toast(errMsg(e), 'error'); } }); });
    qsa('[data-vedit]', wrap).forEach(function (b) { b.addEventListener('click', function () { const v = items.find(function (x) { return x.code === b.dataset.vedit; }); if (v) openVoucherModal(v); }); });
    qsa('[data-vdel]', wrap).forEach(function (b) { b.addEventListener('click', async function () { const ok = await confirmAction('Hapus voucher ' + b.dataset.vdel + '?', { okText: 'Hapus', danger: true }); if (!ok) return; try { await adminDeleteVoucher(b.dataset.vdel); toast('Voucher dihapus', 'ok'); loadVouchers(); } catch (e) { toast(errMsg(e), 'error'); } }); });
  } catch (e) { wrap.innerHTML = '<div class="panel-body">' + errorBoxMsg(e) + '</div>'; }
}
function openVoucherModal(editing) {
  let type = (editing && editing.type) || 'percent';
  const m = showModal({
    title: editing ? ('Edit voucher - ' + editing.code) : 'Tambah voucher baru',
    body: '<div class="form-grid"><div class="field"><label>Kode voucher</label><input class="input" data-v="code" value="' + esc(editing && editing.code || '') + '" placeholder="cth. KRIYA10" style="text-transform:uppercase" ' + (editing ? 'disabled' : '') + '></div><div class="field"><label>Tipe</label><select class="input" data-v="type"><option value="percent" ' + (type === 'percent' ? 'selected' : '') + '>Persen (%)</option><option value="fixed" ' + (type === 'fixed' ? 'selected' : '') + '>Potongan tetap (Rp)</option><option value="freeship" ' + (type === 'freeship' ? 'selected' : '') + '>Gratis ongkir</option></select></div><div class="field"><label>Nilai</label><input class="input" type="number" min="0" data-v="value" value="' + Number(editing && editing.value || 0) + '"></div><div class="field"><label>Min. belanja (Rp)</label><input class="input" type="number" min="0" data-v="min_spend" value="' + Number(editing && editing.min_spend || 0) + '"></div><div class="field"><label>Maks. diskon (Rp, 0 = tanpa batas)</label><input class="input" type="number" min="0" data-v="max_discount" value="' + Number(editing && editing.max_discount || 0) + '"></div><div class="field"><label>Kuota pemakaian</label><input class="input" type="number" min="1" data-v="quota" value="' + Number(editing && editing.quota || 1) + '"></div><div class="field"><label>Kedaluwarsa</label><input class="input" type="date" data-v="expires_at" value="' + (editing && editing.expires_at ? String(editing.expires_at).slice(0, 10) : '') + '"></div><div class="field span-2" style="grid-column:1/-1"><label>Deskripsi</label><input class="input" data-v="description" value="' + esc(editing && editing.description || '') + '" placeholder="Tampil di banner promo"></div><div class="field"><label class="row" style="gap:8px;align-items:center;cursor:pointer"><input type="checkbox" data-v="active" ' + (editing && editing.active !== false ? 'checked' : 'checked') + '> Aktif</label></div></div>',
    footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-vsave>' + icon('check') + ' Simpan</button>',
  });
  const modalEl = m.el;
  const typeSel = modalEl.querySelector('[data-v="type"]');
  const sync = function () {
    type = typeSel.value;
    const isFree = type === 'freeship';
    const valueIn = modalEl.querySelector('[data-v="value"]');
    const maxIn = modalEl.querySelector('[data-v="max_discount"]');
    valueIn.disabled = isFree;
    maxIn.disabled = isFree || type === 'fixed';
    if (isFree) { valueIn.value = 0; maxIn.value = 0; }
  };
  typeSel.addEventListener('change', sync);
  sync();
  modalEl.addEventListener('click', async function (e) {
    if (!e.target.closest('[data-vsave]')) return;
    const btn = modalEl.querySelector('[data-vsave]');
    const code = modalEl.querySelector('[data-v="code"]').value.trim().toUpperCase();
    if (!code) { toast('Kode voucher wajib diisi.', 'info'); return; }
    const expires = modalEl.querySelector('[data-v="expires_at"]').value;
    setBusy(btn, true);
    try {
      await adminSaveVoucher({
        code: code, type: typeSel.value,
        value: Number(modalEl.querySelector('[data-v="value"]').value) || 0,
        min_spend: Number(modalEl.querySelector('[data-v="min_spend"]').value) || 0,
        max_discount: Number(modalEl.querySelector('[data-v="max_discount"]').value) || 0,
        quota: Number(modalEl.querySelector('[data-v="quota"]').value) || 1,
        active: modalEl.querySelector('[data-v="active"]').checked,
        expires_at: expires ? new Date(expires).toISOString() : null,
        description: modalEl.querySelector('[data-v="description"]').value.trim(),
        _exists: !!editing,
      });
      toast(editing ? 'Voucher diperbarui' : 'Voucher ditambahkan', 'ok');
      m.close();
      loadVouchers();
    } catch (e) { setBusy(btn, false); toast(errMsg(e), 'error'); }
  });
}

/* ========== PELANGGAN ========== */
async function renderCustomers(el) {
  el.innerHTML = '<div class="view-head"><div><h3>Pelanggan</h3><p>' + icon('users') + ' Daftar akun pembeli & ringkasan belanja.</p></div></div><div class="panel"><div id="cu-table-wrap" style="padding:0"><div class="panel-body">' + skelRows(6) + '</div></div></div>';
  const wrap = document.getElementById('cu-table-wrap');
  try {
    const items = await adminListCustomers();
    if (!items.length) { wrap.innerHTML = '<div class="panel-body">' + emptyState({ icon: 'users', title: 'Belum ada pelanggan', text: 'Akun pembeli akan muncul di sini.' }) + '</div>'; return; }
    const rows = items.map(function (u) {
      const st = u.order_stats || {};
      return '<tr><td><div class="row" style="align-items:center"><span class="avatar" style="width:36px;height:36px;font-size:13px">' + esc(initials(u.full_name || u.email || '?')) + '</span><div><div class="td-main">' + esc(u.full_name || '-') + '</div><div class="td-sub">' + esc(u.email || '-') + '</div></div></div></td><td>' + esc(u.phone || '—') + '</td><td><b>' + num(st.orders || 0) + '</b></td><td>' + rupiah(st.spend || 0) + '</td><td class="td-sub">' + (st.last ? fmtDateTime(st.last) : '—') + '</td><td>' + (u.role === 'admin' ? '<span class="badge badge-primary">Admin</span>' : '<span class="badge badge-outline">Customer</span>') + '</td></tr>';
    }).join('');
    wrap.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Pelanggan</th><th>No. HP</th><th>Pesanan</th><th>Total belanja</th><th>Terakhir</th><th>Peran</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  } catch (e) { wrap.innerHTML = '<div class="panel-body">' + errorBoxMsg(e) + '</div>'; }
}

/* ========== PENGATURAN ========== */
async function renderSettings(el) {
  el.innerHTML = '<div class="view-head"><div><h3>Pengaturan Toko</h3><p>' + icon('settings') + ' Konfigurasi umum toko, ongkir, dan zona COD.</p></div></div><div class="card co-section" style="max-width:760px"><div class="form-grid" id="settings-form"><div class="skeleton" style="height:44px"></div><div class="skeleton" style="height:44px"></div><div class="skeleton" style="height:44px"></div></div></div>';
  const settings = await getSettings(true).catch(function () { return null; });
  const form = document.getElementById('settings-form');
  form.innerHTML = '<div class="field"><label>Nama toko</label><input class="input" data-s="store_name" value="' + esc(settings && settings.store_name || '') + '"></div><div class="field"><label>No. WhatsApp (format 628…)</label><input class="input" data-s="wa_number" value="' + esc(settings && settings.wa_number || '') + '" placeholder="6285745120164"></div><div class="field"><label>Minimal belanja gratis ongkir (Rp)</label><input class="input" type="number" min="0" data-s="free_shipping_min" value="' + Number(settings && settings.free_shipping_min || 0) + '"></div><div class="field"><label>Biaya COD (Rp)</label><input class="input" type="number" min="0" data-s="cod_fee" value="' + Number(settings && settings.cod_fee || 0) + '"></div><div class="field"><label>Ongkir reguler (Rp)</label><input class="input" type="number" min="0" data-s="regular_cost" value="' + Number(settings && settings.regular_cost || 0) + '"></div><div class="field"><label>Ongkir express (Rp)</label><input class="input" type="number" min="0" data-s="express_cost" value="' + Number(settings && settings.express_cost || 0) + '"></div><div class="field"><label>Ongkir same day (Rp)</label><input class="input" type="number" min="0" data-s="sameday_cost" value="' + Number(settings && settings.sameday_cost || 0) + '"></div><div class="field span-2" style="grid-column:1/-1"><label>Zona COD (pisah koma)</label><textarea class="input" rows="3" data-s="cod_zones">' + esc((settings && settings.cod_zones || []).join(', ')) + '</textarea><span class="hint">Kota/kecamatan yang mendukung bayar di tempat.</span></div><div class="mt-2"><button class="btn btn-primary btn-lg" data-ssave>' + icon('check') + ' Simpan Pengaturan</button></div>';
  form.querySelector('[data-ssave]').addEventListener('click', async function () {
    const btn = form.querySelector('[data-ssave]');
    const zones = form.querySelector('[data-s="cod_zones"]').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    setBusy(btn, true);
    try {
      await adminSaveSettings({
        store_name: form.querySelector('[data-s="store_name"]').value.trim(),
        wa_number: form.querySelector('[data-s="wa_number"]').value.trim(),
        free_shipping_min: Number(form.querySelector('[data-s="free_shipping_min"]').value) || 0,
        cod_fee: Number(form.querySelector('[data-s="cod_fee"]').value) || 0,
        regular_cost: Number(form.querySelector('[data-s="regular_cost"]').value) || 0,
        express_cost: Number(form.querySelector('[data-s="express_cost"]').value) || 0,
        sameday_cost: Number(form.querySelector('[data-s="sameday_cost"]').value) || 0,
        cod_zones: zones,
      });
      toast('Pengaturan disimpan.', 'ok');
    } catch (e) { setBusy(btn, false); toast(errMsg(e), 'error'); }
  });
}

/* ========== WIRE VIEWS ========== */
VIEWS.dashboard.render = renderDashboard;
VIEWS.pesanan.render = renderOrders;
VIEWS.produk.render = renderProducts;
VIEWS.kategori.render = renderCategories;
VIEWS.ulasan.render = renderReviews;
VIEWS.voucher.render = renderVouchers;
VIEWS.pelanggan.render = renderCustomers;
VIEWS.pengaturan.render = renderSettings;