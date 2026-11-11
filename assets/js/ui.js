/* ============================================================================
   Toko Kriya Sidoarjo — ui.js
   Kumpulan helper tampilan: format angka & tanggal, toast, modal, konfirmasi,
   skeleton loading, bintang rating, placeholder foto produk, dsb.
   ========================================================================== */

import { icon } from './icons.js';

/* ------------------------------ Dasar ------------------------------ */

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

export function num(n) {
  return Number(n || 0).toLocaleString('id-ID');
}

export function rupiah(n) {
  return 'Rp' + num(n);
}

export function debounce(fn, wait = 280) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function urlParams() {
  return new URLSearchParams(location.search);
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

/* ------------------------------ Tanggal ------------------------------ */

const DATE_FMT = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const DATETIME_FMT = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function fmtDate(input) {
  const d = new Date(input);
  if (isNaN(d)) return '-';
  return DATE_FMT.format(d);
}

export function fmtDateTime(input) {
  const d = new Date(input);
  if (isNaN(d)) return '-';
  return DATETIME_FMT.format(d);
}

export function timeAgo(input) {
  const d = new Date(input);
  if (isNaN(d)) return '';
  const s = Math.max(1, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  if (s < 2592000) return Math.floor(s / 86400) + ' hari lalu';
  return fmtDate(d);
}

/* ------------------------------ Toast ------------------------------ */

export function toast(msg, type = 'ok', ms = 3200) {
  let wrap = qs('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const iconName = type === 'error' ? 'alert-circle' : type === 'info' ? 'info' : 'check-circle';
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${icon(iconName)}<span>${esc(msg)}</span>`;
  el.addEventListener('click', () => el.remove());
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 350);
  }, ms);
  return el;
}

/* ------------------------------ Modal ------------------------------ */

let openModals = 0;

export function showModal({ title = '', body = '', footer = '', large = false, onClose = null }) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay is-open';
  const modal = document.createElement('div');
  modal.className = 'modal is-open' + (large ? ' modal-lg' : '');
  modal.innerHTML = `
    <div class="modal-card">
      ${title ? `
      <div class="modal-head">
        <h3>${esc(title)}</h3>
        <button class="icon-btn" data-close aria-label="Tutup">${icon('x')}</button>
      </div>` : `
      <div class="modal-head">
        <h3>&nbsp;</h3>
        <button class="icon-btn" data-close aria-label="Tutup">${icon('x')}</button>
      </div>`}
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    </div>`;
  document.body.append(overlay, modal);
  openModals++;
  if (openModals === 1) document.body.style.overflow = 'hidden';

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    openModals = Math.max(0, openModals - 1);
    if (openModals === 0) document.body.style.overflow = '';
    overlay.remove();
    modal.remove();
    if (onClose) onClose();
  }

  overlay.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      close();
      document.removeEventListener('keydown', onKey);
    }
  });

  return { el: modal, close };
}

/* Dialog konfirmasi: resolve(true) bila pengguna setuju */
export function confirmAction(message, { title = 'Konfirmasi', okText = 'Ya, lanjutkan', danger = false } = {}) {
  return new Promise((resolve) => {
    let decided = false;
    const m = showModal({
      title,
      body: `<p style="color:var(--ink-2);line-height:1.7">${esc(message)}</p>`,
      footer: `
        <button class="btn btn-ghost" data-close>Batal</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(okText)}</button>`,
      onClose: () => { if (!decided) resolve(false); },
    });
    m.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-ok]')) {
        decided = true;
        resolve(true);
        m.close();
      }
    });
  });
}

/* Dialog input satu kolom: resolve(nilai) bila disimpan, null bila dibatalkan */
export function askInput({
  title = 'Isi data', label = '', placeholder = '', value = '',
  okText = 'Simpan', textarea = false, hint = '',
} = {}) {
  return new Promise((resolve) => {
    let decided = false;
    const m = showModal({
      title,
      body: `
        <div class="field">
          ${label ? `<label>${esc(label)}</label>` : ''}
          ${textarea
            ? `<textarea class="input" data-ask rows="4" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
            : `<input class="input" data-ask placeholder="${esc(placeholder)}" value="${esc(value)}">`}
          ${hint ? `<span class="hint">${esc(hint)}</span>` : ''}
        </div>`,
      footer: `
        <button class="btn btn-ghost" data-close>Batal</button>
        <button class="btn btn-primary" data-ok>${esc(okText)}</button>`,
      onClose: () => { if (!decided) resolve(null); },
    });
    const input = m.el.querySelector('[data-ask]');
    if (input) {
      input.focus();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !textarea) {
          e.preventDefault();
          decided = true;
          resolve(input.value);
          m.close();
        }
      });
    }
    m.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-ok]')) {
        decided = true;
        resolve(input ? input.value : '');
        m.close();
      }
    });
  });
}

/* ------------------------------ Tombol sibuk ------------------------------ */

export function setBusy(btn, busy = true) {
  if (!btn) return;
  if (busy) {
    btn.dataset.origText = btn.innerHTML;
    btn.classList.add('is-loading');
    btn.disabled = true;
    btn.innerHTML = `${icon('refresh', 'spin')} <span>Memproses…</span>`;
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
    if (btn.dataset.origText) btn.innerHTML = btn.dataset.origText;
    delete btn.dataset.origText;
  }
}

/* ------------------------------ Bintang rating ------------------------------ */

export function stars(rating = 0) {
  const r = Math.round(Number(rating) || 0);
  let out = '<span class="stars" role="img" aria-label="Rating ' + num(rating) + ' dari 5">';
  for (let i = 1; i <= 5; i++) {
    out += icon(i <= r ? 'star-filled' : 'star', i <= r ? '' : 'empty');
  }
  return out + '</span>';
}

/* ------------------------------ Placeholder & gambar produk ------------------------------
   Produk tanpa foto tetap tampil manis: pola anyaman + ikon kategorinya. */

export function placeholder(color = '#c05a30', iconName = 'package', tag = '') {
  return `<div class="ph" style="--ph-c:${esc(color)}"><span class="ph-icon">${icon(iconName)}</span>${
    tag ? `<span class="ph-tag">${esc(tag)}</span>` : ''
  }</div>`;
}

/* Gambar utama produk (img bila ada foto, placeholder bila belum) */
export function productImage(product, cat = null) {
  const imgs = Array.isArray(product?.images) ? product.images : [];
  if (imgs.length && imgs[0]) {
    return `<img src="${esc(imgs[0])}" alt="${esc(product.name || '')}" loading="lazy">`;
  }
  return placeholder(cat?.color || '#c05a30', cat?.icon || 'package');
}

/* ------------------------------ Skeleton loading ------------------------------ */

export function skelCards(n = 8) {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `
      <div class="p-card">
        <div class="skeleton" style="aspect-ratio:1;border-radius:0"></div>
        <div class="p-body">
          <div class="skeleton" style="height:11px;width:36%"></div>
          <div class="skeleton" style="height:15px;width:82%"></div>
          <div class="skeleton" style="height:15px;width:55%"></div>
          <div class="skeleton" style="height:19px;width:44%;margin-top:8px"></div>
        </div>
      </div>`;
  }
  return out;
}

export function skelRows(n = 5) {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `
      <div class="card card-pad row" style="gap:14px">
        <div class="skeleton" style="width:52px;height:52px;border-radius:12px;flex:none"></div>
        <div class="grow">
          <div class="skeleton" style="height:13px;width:46%"></div>
          <div class="skeleton" style="height:12px;width:28%;margin-top:8px"></div>
        </div>
        <div class="skeleton" style="height:15px;width:70px"></div>
      </div>`;
  }
  return out;
}

export function skelLine(h = 16, w = '60%') {
  return `<div class="skeleton" style="height:${h}px;width:${w}"></div>`;
}

/* ------------------------------ Empty state ------------------------------ */

export function emptyState({ icon: ic = 'package', title = 'Belum ada data', text = '', action = '' }) {
  return `
    <div class="empty-state">
      <div class="es-icon">${icon(ic)}</div>
      <h4>${esc(title)}</h4>
      ${text ? `<p class="small">${esc(text)}</p>` : ''}
      ${action}
    </div>`;
}

/* ------------------------------ Lain-lain ------------------------------ */

export function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => toast('Disalin ke papan klip: ' + text, 'ok'));
  }
  return Promise.reject(new Error('Clipboard tidak tersedia'));
}

/* Ambil pesan error yang ramah dari error Supabase / Error biasa */
export function errMsg(e, fallback = 'Terjadi kesalahan. Coba lagi.') {
  const msg = typeof e === 'string' ? e : e?.message || e?.error?.message || e?.details || '';
  if (!msg) return fallback;
  return String(msg).replace(/^AuthApiError:\s*/i, '').replace(/failed to fetch/i, 'Tidak bisa terhubung ke server. Periksa koneksi internet.');
}

/* Bungkus area konten dengan alert error yang rapi */
export function errorBox(e, retryLabel = 'Coba lagi') {
  return `<div class="alert alert-error">${icon('alert-circle')}<div class="grow">${esc(errMsg(e))}</div></div>`;
}

/* ------------------------------ Kartu produk ------------------------------
   Dipakai di beranda, katalog, produk terkait, dan favorit. */

export function netPrice(p) {
  const price = Number(p?.price || 0);
  const disc = Math.min(90, Math.max(0, Number(p?.discount_percent || 0)));
  return Math.round(price * (100 - disc) / 100);
}

export function productCard(p, { showFlag = true } = {}) {
  const cat = p.category || null;
  const price = netPrice(p);
  const hasDiscount = Number(p.discount_percent || 0) > 0;
  const out = Number(p.stock || 0) <= 0;
  const variantsCount = Number(p.variants?.[0]?.count || 0);
  const hasVariants = variantsCount > 0;

  let flag = '';
  if (showFlag) {
    if (p.featured) flag = '<span class="badge badge-gold p-flag">Unggulan</span>';
    else if (Number(p.sold || 0) >= 50) flag = '<span class="badge badge-primary p-flag">Terlaris</span>';
  }

  const actionBtn = out
    ? `<a class="btn btn-ghost btn-sm p-add" href="produk.html?slug=${esc(p.slug)}">Lihat Detail</a>`
    : hasVariants
      ? `<a class="btn btn-soft btn-sm p-add" href="produk.html?slug=${esc(p.slug)}">Pilih Variasi</a>`
      : `<button class="btn btn-soft btn-sm p-add" data-add="${esc(p.id)}">+ Keranjang</button>`;

  return `
  <article class="p-card hover-lift ${out ? 'is-out' : ''}">
    <a class="p-thumb" href="produk.html?slug=${esc(p.slug)}">
      ${productImage(p, cat)}
      ${hasDiscount ? `<span class="badge badge-danger p-discount">-${Number(p.discount_percent)}%</span>` : ''}
      ${flag}
      ${out ? '<span class="badge badge-outline p-stock-pill">Stok habis</span>' : ''}
    </a>
    <div class="p-body">
      <span class="p-cat">${esc(cat?.name || 'Kriya')}</span>
      <h3 class="p-name"><a href="produk.html?slug=${esc(p.slug)}">${esc(p.name)}</a></h3>
      <div class="p-rating">${stars(p.rating)}<span class="muted">(${num(p.reviews_count || 0)})</span></div>
      <div class="p-price-row">
        <span class="p-price">${rupiah(price)}</span>
        ${hasDiscount ? `<span class="p-old">${rupiah(p.price)}</span>` : ''}
        <span class="p-sold">${Number(p.sold || 0) > 0 ? num(p.sold) + ' terjual' : ''}</span>
      </div>
      ${actionBtn}
    </div>
  </article>`;
}

/* Pasang event klik tombol "+ Keranjang" pada grid kartu produk */
export function bindProductCards(root, products, addToCartFn) {
  if (!root || !addToCartFn) return;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const p = (products || []).find((x) => x.id === btn.dataset.add);
    if (!p || Number(p.stock || 0) <= 0) return;
    addToCartFn({
      product_id: p.id,
      variant_id: null,
      name: p.name,
      variant_label: '',
      price: netPrice(p),
      qty: 1,
      image: (Array.isArray(p.images) && p.images[0]) || '',
      weight: Number(p.weight || 0.2),
      max_stock: Number(p.stock || 0),
    }, { open: false });
    toast(`${p.name} masuk keranjang`, 'ok');
  });
}
