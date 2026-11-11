/* ============================================================================
   Toko Kriya Sidoarjo — product.js
   Halaman detail produk (?slug=…): galeri, variasi & stok, tombol beli,
   tab deskripsi/spesifikasi/ulasan, favorit, dan produk terkait.
   ========================================================================== */

import { initLayout } from './layout.js';
import { icon } from './icons.js';
import {
  qs, qsa, esc, num, rupiah, stars, urlParams, productImage, placeholder,
  netPrice, productCard, bindProductCards, skelCards, emptyState, toast,
  fmtDate, initials, errMsg, confirmAction,
} from './ui.js';
import {
  getProductBySlug, getProductVariants, getRelatedProducts,
  getProductReviews, toggleFavorite, getFavoriteIds, UNCONFIGURED,
} from './api.js';
import { addToCart, buyNow } from './cart.js';
import { getUser, onAuthChange, requireAuth } from './auth.js';

initLayout({ active: 'katalog' });

const slug = urlParams().get('slug');
let product = null;
let variants = [];
let selectedVariant = null;
let qty = 1;
let isFav = false;

if (!slug) {
  document.getElementById('pd-main').innerHTML = emptyState({
    icon: 'search',
    title: 'Produk tidak ditentukan',
    text: 'Buka lewat katalog supaya dapat link produk yang benar.',
    action: '<a class="btn btn-primary btn-sm" href="katalog.html">Ke Katalog</a>',
  });
} else {
  load();
}

async function load() {
  try {
    product = await getProductBySlug(slug);
    if (!product) {
      document.getElementById('pd-main').innerHTML = emptyState({
        icon: 'package',
        title: 'Produk tidak ditemukan',
        text: 'Mungkin sudah dihapus atau sedang disembunyikan admin.',
        action: '<a class="btn btn-primary btn-sm" href="katalog.html">Lihat produk lain</a>',
      });
      return;
    }
    document.title = `${product.name} — Toko Kriya Sidoarjo`;

    variants = (await getProductVariants(product.id)) || [];
    if (variants.length) {
      const firstAvail = variants.find((v) => v.stock > 0);
      selectedVariant = firstAvail || null;
      qty = 1;
    }

    renderGallery();
    renderInfo();
    renderTabs();
    renderRelated();
    await checkFavorite();
  } catch (e) {
    document.getElementById('pd-main').innerHTML = emptyState({
      icon: UNCONFIGURED ? 'alert-triangle' : 'alert-circle',
      title: UNCONFIGURED ? 'Database belum terhubung' : 'Gagal memuat produk',
      text: UNCONFIGURED
        ? 'Isi assets/js/config.js dengan kredensial Supabase (lihat README.md).'
        : errMsg(e),
    });
  }
}

/* ------------------------------ Galeri ------------------------------ */

function renderGallery() {
  const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const cat = product.category || {};
  const wrap = qs('#pd-main-img-wrap');
  wrap.className = 'pd-main';
  wrap.id = 'pd-main-img-wrap';

  const view = (src) => src
    ? `<img src="${esc(src)}" alt="${esc(product.name)}">`
    : placeholder(cat.color, cat.icon);

  wrap.innerHTML = view(imgs[0] || '');

  const thumbs = qs('#pd-thumbs');
  if (imgs.length > 1) {
    thumbs.innerHTML = imgs.map((src, i) => `
      <button class="pd-thumb-btn ${i === 0 ? 'is-active' : ''}" data-thumb="${esc(src)}" aria-label="Foto ${i + 1}">
        <img src="${esc(src)}" alt="" loading="lazy">
      </button>`).join('');
    qsa('[data-thumb]', thumbs).forEach((b) => b.addEventListener('click', () => {
      qsa('.pd-thumb-btn', thumbs).forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      wrap.innerHTML = view(b.dataset.thumb);
    }));
  } else if (!imgs.length) {
    thumbs.innerHTML = '';
  } else {
    thumbs.innerHTML = '';
  }
}

/* ------------------------------ Info + kotak beli ------------------------------ */

function currentMaxStock() {
  if (variants.length) return selectedVariant ? Number(selectedVariant.stock || 0) : 0;
  return Number(product.stock || 0);
}

function cartItem() {
  return {
    product_id: product.id,
    variant_id: selectedVariant?.id || null,
    name: product.name,
    variant_label: selectedVariant?.label || '',
    price: netPrice(product),
    qty,
    image: (product.images || [])[0] || '',
    weight: Number(product.weight || 0.2),
    max_stock: currentMaxStock(),
  };
}

function renderInfo() {
  const cat = product.category || {};
  const price = netPrice(product);
  const hasDisc = Number(product.discount_percent || 0) > 0;
  const out = currentMaxStock() <= 0;
  const save = hasDisc ? Math.round(product.price) - price : 0;

  document.title = `${product.name} — Toko Kriya Sidoarjo`;

  /* Breadcrumb & kategori */
  const box = qs('.pd-info');
  box.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="index.html">Beranda</a>${icon('chevron-right')}
      <a href="katalog.html">Katalog</a>${icon('chevron-right')}
      <a href="katalog.html?kategori=${encodeURIComponent(cat.slug || '')}">${esc(cat.name || 'Kriya')}</a>${icon('chevron-right')}
      <span class="crumb-current">${esc(product.name)}</span>
    </nav>

    <span class="eyebrow">${icon(cat.icon || 'package')} ${esc(cat.name || 'Kriya')}</span>
    <h1>${esc(product.name)}</h1>

    <div class="pd-meta">
      <span>${stars(product.rating)}</span>
      <b>${num(product.rating || 0)}</b>
      <a href="#tab-ulasan" class="muted">(${num(product.reviews_count || 0)} ulasan)</a>
      <span class="muted">·</span>
      <span class="muted">${num(product.sold || 0)} terjual</span>
      ${out ? '<span class="badge badge-danger">Stok habis</span>' : ''}
    </div>

    <div class="pd-price-row">
      <span class="pd-price">${rupiah(price)}</span>
      ${hasDisc ? `<span class="pd-old price-old">${rupiah(product.price)}</span>` : ''}
      ${save > 0 ? `<span class="badge badge-primary pd-save">Hemat ${rupiah(save)}</span>` : ''}
    </div>

    <p class="pd-short" style="margin-top:14px">${esc(product.short_desc || '')}</p>

    <div class="pd-buybox">
      ${variants.length ? `
      <div class="field">
        <label>${icon('settings')} Pilih variasi</label>
        <div class="variant-list">
          ${variants.map((v) => `
          <button class="variant-btn ${selectedVariant?.id === v.id ? 'is-active' : ''}"
                  data-variant="${esc(v.id)}" ${v.stock <= 0 ? 'disabled' : ''}>
            ${esc(v.label)}${v.stock > 0 ? ` · ${num(v.stock)}` : ' · habis'}
          </button>`).join('')}
        </div>
        ${!selectedVariant ? '<p class="hint" style="color:var(--warn)">Pilih variasi dulu untuk melanjutkan.</p>' : ''}
      </div>` : ''}

      <div class="row-between">
        <div class="field" style="width:auto">
          <label>Jumlah</label>
          <div class="qty-stepper" id="qty-stepper">
            <button data-qty-minus aria-label="Kurangi">${icon('minus')}</button>
            <output id="qty-out">1</output>
            <button data-qty-plus aria-label="Tambah">${icon('plus')}</button>
          </div>
        </div>
        <div class="tiny muted" style="text-align:right">
          Stok tersedia<br><b style="color:var(--ink-strong)">${num(currentMaxStock())} buah</b>
        </div>
      </div>

      <div class="pd-actions">
        <button class="btn btn-ghost" id="btn-fav" aria-label="Simpan ke favorit">
          ${icon(isFav ? 'heart-filled' : 'heart')} <span>${isFav ? 'Favorit' : 'Favorit'}</span>
        </button>
        <button class="btn btn-soft" id="btn-add">${icon('cart')} + Keranjang</button>
        <button class="btn btn-primary" id="btn-buy">${icon('zap')} Beli Sekarang</button>
      </div>

      <ul class="pd-learn">
        <li>${icon('shield')} Garansi rusak saat kirim</li>
        <li>${icon('truck')} Kirim reguler / express / sameday</li>
        <li>${icon('wallet')} COD area Sidoarjo &amp; Surabaya</li>
      </ul>
    </div>`;

  /* Event variasi */
  qsa('[data-variant]', box).forEach((b) => b.addEventListener('click', () => {
    selectedVariant = variants.find((v) => v.id === b.dataset.variant) || null;
    qty = 1;
    renderInfo();
  }));

  /* Qty */
  qs('#qty-minus', box)?.addEventListener('click', () => { setQty(qty - 1); });
  qs('#qty-plus', box)?.addEventListener('click', () => { setQty(qty + 1); });

  function setQty(n) {
    const max = currentMaxStock();
    if (n < 1) return;
    if (n > max) { toast(`Stok tersedia cuma ${num(max)} buah.`, 'info'); return; }
    qty = n;
    qs('#qty-out', box).textContent = String(qty);
  }

  /* Favorit */
  qs('#btn-fav', box).addEventListener('click', async () => {
    try {
      const res = await toggleFavorite(product.id);
      isFav = res;
      const btn = qs('#btn-fav', box);
      btn.innerHTML = `${icon(res ? 'heart-filled' : 'heart')} <span>Favorit</span>`;
      btn.style.color = res ? 'var(--clay-strong)' : '';
      toast(res ? 'Disimpan ke favorit' : 'Dihapus dari favorit', res ? 'ok' : 'info', 1800);
    } catch (e) {
      if (String(e.message || e).includes('MASUK_DULU')) {
        toast('Masuk dulu untuk simpan favorit.', 'info');
        setTimeout(() => requireAuth(`produk.html?slug=${slug}`), 900);
        return;
      }
      toast(errMsg(e), 'error');
    }
  });

  /* Keranjang & beli */
  qs('#btn-add', box).addEventListener('click', () => {
    if (!canBuy()) return;
    addToCart(cartItem());
  });
  qs('#btn-buy', box).addEventListener('click', () => {
    if (!canBuy()) return;
    buyNow(cartItem());
  });

  function canBuy() {
    if (variants.length && !selectedVariant) {
      toast('Pilih variasi dulu ya.', 'info');
      return false;
    }
    if (currentMaxStock() <= 0) {
      toast('Stok produk ini sedang habis.', 'info');
      return false;
    }
    return true;
  }
}

/* ------------------------------ Tab: deskripsi / spesifikasi / ulasan ------------------------------ */

let activeTab = 'deskripsi';

async function renderTabs() {
  const reviews = await getProductReviews(product.id).catch(() => []);

  const dist = [5, 4, 3, 2, 1].map((r) => ({
    r,
    n: reviews.filter((x) => x.rating === r).length,
  }));
  const total = reviews.length || 1;

  const box = qs('#pd-tabs');
  box.innerHTML = `
    <div class="tab-bar" role="tablist">
      <button data-tab="deskripsi" class="${activeTab === 'deskripsi' ? 'is-active' : ''}">Deskripsi</button>
      <button data-tab="spesifikasi" class="${activeTab === 'spesifikasi' ? 'is-active' : ''}">Spesifikasi</button>
      <button data-tab="ulasan" class="${activeTab === 'ulasan' ? 'is-active' : ''}" id="tab-ulasan">Ulasan (${num(reviews.length)})</button>
    </div>
    <div class="tab-body" id="pd-tab-body"></div>`;

  const renderBody = () => {
    const body = qs('#pd-tab-body');
    if (activeTab === 'deskripsi') {
      body.innerHTML = `<div class="pd-desc">${esc(product.description || product.short_desc || 'Belum ada deskripsi.').split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      ${product.tags?.length ? `<div class="pd-tags">${product.tags.map((t) => `<span class="chip" style="pointer-events:none">${icon('tag')} ${esc(t)}</span>`).join('')}</div>` : ''}`;
    } else if (activeTab === 'spesifikasi') {
      const rows = [
        ['Kategori', product.category?.name || '-'],
        ['Bahan', product.material || '-'],
        ['Ukuran', product.dimensions || '-'],
        ['Perawatan', product.care || '-'],
        ['Berat', `${num(product.weight)} kg / buah`],
        ['Stok', `${num(product.stock)} buah`],
      ];
      body.innerHTML = `<dl class="spec-grid">${rows.map(([k, v]) => `<div class="spec-item"><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
    } else {
      body.innerHTML = `
        <div class="card review-summary">
          <div>
            <div class="rs-score">${num(product.rating || 0)}</div>
            ${stars(product.rating)}
            <div class="rs-count">${num(reviews.length)} ulasan terverifikasi</div>
          </div>
          <div class="rs-bars">
            ${dist.map((d) => `
            <div class="rs-bar">
              <span>${d.r} ★</span>
              <div class="meter"><i style="width:${Math.round(d.n / total * 100)}%"></i></div>
              <span>${num(d.n)}</span>
            </div>`).join('')}
          </div>
        </div>
        ${reviews.length ? `<div class="review-list">${reviews.map((r) => `
          <article class="review-card">
            <div class="review-head">
              <span class="avatar" style="width:34px;height:34px;font-size:13px">${esc(initials(r.author))}</span>
              <b>${esc(r.author)}</b>
              <span class="review-time">${fmtDate(r.created_at)}</span>
            </div>
            ${stars(r.rating)}
            <p class="review-text">${esc(r.text)}</p>
            ${r.reply ? `<div class="alert alert-info" style="margin-top:4px">${icon('store')}<div><b>Balasan toko</b><br>${esc(r.reply)}</div></div>` : ''}
          </article>`).join('')}</div>`
        : emptyState({ icon: 'message', title: 'Belum ada ulasan', text: 'Beli produk ini lalu tulis ulasan pertama kamu.' })}`;
    }
  };

  qsa('[data-tab]', box).forEach((b) => b.addEventListener('click', () => {
    activeTab = b.dataset.tab;
    qsa('[data-tab]', box).forEach((x) => x.classList.toggle('is-active', x === b));
    renderBody();
  }));

  renderBody();
}

/* ------------------------------ Favorit ------------------------------ */

async function checkFavorite() {
  if (!getUser()) return;
  try {
    const ids = await getFavoriteIds();
    isFav = ids.includes(product.id);
    if (isFav) {
      const btn = qs('#btn-fav');
      if (btn) {
        btn.innerHTML = `${icon('heart-filled')} <span>Favorit</span>`;
        btn.style.color = 'var(--clay-strong)';
      }
    }
  } catch { /* diamkan */ }
}

/* ------------------------------ Produk terkait ------------------------------ */

async function renderRelated() {
  const box = qs('#pd-related');
  try {
    const items = await getRelatedProducts(product, 4);
    if (!items.length) { box.innerHTML = ''; return; }
    box.innerHTML = `
      <div class="section-head">
        <span class="eyebrow">Mungkin kamu suka</span>
        <h2 style="font-size:clamp(22px,2.6vw,28px)">Kriya lain dari ${esc(product.category?.name || 'etalase kami')}</h2>
      </div>
      <div class="p-grid">${items.map((p) => productCard(p)).join('')}</div>`;
    bindProductCards(box, items, addToCart);
  } catch {
    box.innerHTML = '';
  }
}
