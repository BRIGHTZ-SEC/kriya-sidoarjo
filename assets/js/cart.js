/* ============================================================================
   Toko Kriya Sidoarjo — cart.js
   Keranjang belanja (localStorage) + kode voucher + drawer keranjang.
   Keranjang disimpan lokal supaya tetap ada walau halaman pindah-pindah;
   saat checkout, server menghitung ulang semua harga (aman dari manipulasi).
   ========================================================================== */

import { icon } from './icons.js';
import { qs, qsa, esc, rupiah, num, toast, confirmAction, productImage, showModal, errMsg } from './ui.js';
import { checkVoucher, getSettings } from './api.js';
import { getUser, requireAuth } from './auth.js';

const CART_KEY = 'tks_cart';
const VOUCHER_KEY = 'tks_voucher';

const CART_EVENT = 'tks:cart';

/* ------------------------------ Data keranjang ------------------------------ */

export function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((it) => it && it.product_id && it.qty > 0);
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { items } }));
}

export function cartCount() {
  return getCart().reduce((s, it) => s + it.qty, 0);
}

export function cartSubtotal() {
  return getCart().reduce((s, it) => s + Number(it.price || 0) * it.qty, 0);
}

export function cartWeight() {
  return getCart().reduce((s, it) => s + Number(it.weight || 0) * it.qty, 0);
}

/* Tambah produk. item: {product_id, variant_id, name, variant_label, price, qty, image, weight, max_stock} */
export function addToCart(item, { silent = false, open = true } = {}) {
  const items = getCart();
  const key = (it) => it.product_id + '|' + (it.variant_id || '');
  const found = items.find((it) => key(it) === key(item));

  if (found) {
    const max = Number(found.max_stock || item.max_stock || 999);
    const next = Math.min(found.qty + item.qty, max);
    if (next === found.qty) {
      if (!silent) toast(`Stok ${item.name} cuma ${max} buah, sudah ada semua di keranjang.`, 'info');
      return false;
    }
    found.qty = next;
  } else {
    items.push({ ...item, qty: Math.max(1, item.qty) });
  }

  saveCart(items);
  if (!silent) toast(`${item.name} masuk keranjang`, 'ok');
  if (open) openCartDrawer();
  return true;
}

export function setQty(index, qty) {
  const items = getCart();
  const it = items[index];
  if (!it) return;
  const max = Number(it.max_stock || 999);
  it.qty = Math.max(1, Math.min(qty, max));
  saveCart(items);
}

export function removeItem(index) {
  const items = getCart();
  items.splice(index, 1);
  saveCart(items);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  clearVoucher();
  document.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { items: [] } }));
}

/* Beli langsung dari halaman produk: simpan lalu lompat ke checkout */
export function buyNow(item) {
  addToCart(item, { silent: true, open: false });
  if (!requireAuth('checkout.html')) return;
  location.href = 'checkout.html';
}

/* ------------------------------ Voucher tersimpan ------------------------------ */

export function getStoredVoucher() {
  try {
    const v = JSON.parse(localStorage.getItem(VOUCHER_KEY) || 'null');
    if (!v || !v.code) return null;
    if (v.expires && Date.now() - v.expires > 1000 * 60 * 60 * 6) return null; /* basi setelah 6 jam */
    return v;
  } catch {
    return null;
  }
}

export async function applyVoucher(code, subtotal) {
  const res = await checkVoucher(code, subtotal);
  if (res.ok) {
    const v = {
      code: res.voucher.code,
      type: res.voucher.type,
      discount: res.discount,
      freeShip: res.freeShip,
      label: res.voucher.description,
      expires: Date.now(),
    };
    localStorage.setItem(VOUCHER_KEY, JSON.stringify(v));
  } else {
    clearVoucher();
  }
  return res;
}

export function clearVoucher() {
  localStorage.removeItem(VOUCHER_KEY);
}

/* ------------------------------ Drawer keranjang ------------------------------ */

let drawerBuilt = false;

function buildDrawer() {
  if (drawerBuilt) return;
  drawerBuilt = true;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'cart-overlay';

  const drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.id = 'cart-drawer';
  drawer.setAttribute('aria-label', 'Keranjang belanja');
  drawer.innerHTML = `
    <div class="drawer-head">
      <h3 class="row" style="gap:9px">${icon('cart')} Keranjang</h3>
      <button class="icon-btn" data-cart-close aria-label="Tutup">${icon('x')}</button>
    </div>
    <div class="drawer-body" id="cart-drawer-body"></div>
    <div class="drawer-foot" id="cart-drawer-foot"></div>`;

  document.body.append(overlay, drawer);

  overlay.addEventListener('click', closeCartDrawer);
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-close]')) closeCartDrawer();
    if (e.target.closest('[data-go-checkout]')) {
      if (!requireAuth('checkout.html')) return;
      closeCartDrawer();
      location.href = 'checkout.html';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCartDrawer();
  });
}

export function openCartDrawer() {
  buildDrawer();
  renderCartDrawer();
  qs('#cart-drawer').classList.add('is-open');
  qs('#cart-overlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

export function closeCartDrawer() {
  const d = qs('#cart-drawer');
  const o = qs('#cart-overlay');
  if (d) d.classList.remove('is-open');
  if (o) o.classList.remove('is-open');
  if (d && !d.classList.contains('is-open') && !qs('.modal.is-open')) document.body.style.overflow = '';
}

async function renderCartDrawer() {
  const body = qs('#cart-drawer-body');
  const foot = qs('#cart-drawer-foot');
  if (!body || !foot) return;

  const items = getCart();
  const subtotal = cartSubtotal();
  const settings = await getSettings().catch(() => null);
  const freeMin = Number(settings?.free_shipping_min || 500000);
  const voucher = getStoredVoucher();
  const discount = voucher ? Math.min(voucher.discount || 0, subtotal) : 0;

  if (!items.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">${icon('cart')}</div>
        <h4>Keranjang masih kosong</h4>
        <p class="small">Yuk intip koleksi kriya khas Sidoarjo.</p>
        <a class="btn btn-primary btn-sm" href="katalog.html">Lihat Katalog</a>
      </div>`;
    foot.innerHTML = '';
    return;
  }

  body.innerHTML = items.map((it, i) => `
    <div class="cart-item">
      ${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy">` : productImage({ name: it.name, images: [] }, { color: '#c05a30', icon: 'package' })}
      <div class="ci-body">
        <div class="ci-name">${esc(it.name)}${it.variant_label ? ` <span class="muted small">· ${esc(it.variant_label)}</span>` : ''}</div>
        <div class="ci-row">
          <div class="qty-stepper" data-index="${i}">
            <button data-minus aria-label="Kurangi">${icon('minus')}</button>
            <output>${num(it.qty)}</output>
            <button data-plus aria-label="Tambah">${icon('plus')}</button>
          </div>
          <b class="ci-price">${rupiah(it.price * it.qty)}</b>
          <button class="ci-remove" data-remove="${i}" aria-label="Hapus">${icon('trash')}</button>
        </div>
      </div>
    </div>`).join('');

  const freeGap = freeMin - (subtotal - discount);
  foot.innerHTML = `
    ${freeGap > 0 ? `
    <div class="mb-2">
      <div class="row-between tiny" style="margin-bottom:5px">
        <span class="muted">Tambah ${rupiah(freeGap)} lagi untuk <b>gratis ongkir</b></span>
        <span class="muted">${num(Math.min(100, Math.round((subtotal - discount) / freeMin * 100)))}%</span>
      </div>
      <div class="meter"><i style="width:${Math.min(100, Math.round((subtotal - discount) / freeMin * 100))}%"></i></div>
    </div>` : `<div class="alert alert-ok tiny" style="padding:8px 12px">${icon('truck')} <span>Selamat — pesanan ini <b>gratis ongkir</b>!</span></div>`}
    ${voucher ? `
    <div class="voucher-applied mb-2">
      ${icon('ticket')}
      <span>${esc(voucher.code)} aktif${voucher.discount ? ` · hemat ${rupiah(voucher.discount)}` : voucher.freeShip ? ' · gratis ongkir' : ''}</span>
      <button class="btn-x" data-voucher-clear aria-label="Hapus voucher">${icon('x')}</button>
    </div>` : ''}
    <div class="row-between mb-2">
      <span class="muted small">Subtotal (${cartCount()} barang)</span>
      <b>${rupiah(subtotal - discount)}</b>
    </div>
    <button class="btn btn-primary btn-block btn-lg" data-go-checkout>
      ${icon('arrow-right')} Lanjut ke Checkout
    </button>`;

  /* Event tombol */
  qsa('[data-minus]', body).forEach((b) => b.addEventListener('click', () => {
    const i = +b.closest('[data-index]').dataset.index;
    setQty(i, getCart()[i].qty - 1);
    renderCartDrawer();
    toast('Jumlah dikurangi', 'info', 1400);
  }));
  qsa('[data-plus]', body).forEach((b) => b.addEventListener('click', () => {
    const i = +b.closest('[data-index]').dataset.index;
    const it = getCart()[i];
    if (it.qty >= Number(it.max_stock || 999)) {
      toast(`Stok tersisa ${it.max_stock} buah.`, 'info');
      return;
    }
    setQty(i, it.qty + 1);
    renderCartDrawer();
  }));
  qsa('[data-remove]', body).forEach((b) => b.addEventListener('click', async () => {
    const i = +b.dataset.remove;
    const ok = await confirmAction(`Hapus ${getCart()[i].name} dari keranjang?`, { okText: 'Hapus', danger: true });
    if (!ok) return;
    removeItem(i);
    renderCartDrawer();
    toast('Barang dihapus dari keranjang', 'info', 1800);
  }));
  const vc = qs('[data-voucher-clear]', foot);
  if (vc) vc.addEventListener('click', () => {
    clearVoucher();
    renderCartDrawer();
    toast('Voucher dilepas', 'info', 1600);
  });
}

/* Hitung ringkasan total checkout (dipakai halaman checkout juga) */
export async function cartSummary() {
  const items = getCart();
  const subtotal = cartSubtotal();
  const voucher = getStoredVoucher();
  const discount = voucher ? Math.min(voucher.discount || 0, subtotal) : 0;
  return {
    items,
    count: cartCount(),
    subtotal,
    discount,
    voucher,
    weight: cartWeight(),
    afterDiscount: subtotal - discount,
  };
}

/* Dengarkan perubahan keranjang — dipakai layout.js untuk update badge */
export function onCartChange(fn) {
  document.addEventListener(CART_EVENT, fn);
}
