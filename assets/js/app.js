/* =========================================================================
   Toko Kriya Sidoarjo — Logika Halaman Toko
   ========================================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const FAV_KEY = 'tks_favs_v1';
const WA_NUMBER = '6285745120164';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

const state = {
  view: 'home',
  category: 'semua',
  search: '',
  sort: 'terlaris',
  stock: 'semua',
  promoOnly: false,
  priceMin: null,
  priceMax: null,
  tags: [],
  favOnly: false,
  filterOpen: false,
  favorites: [],
  voucherCode: '',
  pendingCheckout: false,
  confirmAction: null,
  checkout: {
    step: 1,
    customer: null,
    addressId: null,
    manual: false,
    shipping: 'reguler',
    payment: 'qris',
    data: {},
  },
};

let pvState = { id: null, qty: 1, img: 0, reviewRating: 0, showReviewForm: false };

/* ------------------------------- Toast ------------------------------- */

function toast(message, type = '') {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' toast-' + type : '');
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.setAttribute('aria-atomic', 'true');
  el.innerHTML = `<span class="t-icon">${type === 'error' ? '!' : type === 'success' ? '✓' : 'i'}</span><span>${esc(message)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 240);
  }, 2600);
}

/* ------------------------- Overlay, modal, focus trap ------------------ */

const overlay = $('#overlay');
const cartDrawer = $('#cartDrawer');

let lastFocused = null;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function anyModalOpen() {
  return $$('.modal.is-open').length > 0;
}

function openModal(id) {
  $$('.modal.is-open').forEach((m) => m.classList.remove('is-open'));
  const modal = $('#' + id);
  if (!modal) return;
  lastFocused = document.activeElement;
  modal.classList.add('is-open');
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  /* Prioritaskan field isian di badan modal, baru tombol di header seperti ✕ */
  const first =
    modal.querySelector('.modal-body ' + FOCUSABLE) || modal.querySelector(FOCUSABLE);
  if (first) setTimeout(() => first.focus(), 30);
}

function closeModals() {
  $$('.modal.is-open').forEach((m) => m.classList.remove('is-open'));
  $('#confirmReasonWrap')?.classList.add('hidden');
  if (!cartDrawer.classList.contains('is-open')) {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  if (lastFocused && document.contains(lastFocused)) {
    lastFocused.focus();
    lastFocused = null;
  }
}

function openCart() {
  renderCart();
  lastFocused = document.activeElement;
  cartDrawer.classList.add('is-open');
  document.body.classList.add('cart-open');
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  const first = cartDrawer.querySelector(FOCUSABLE);
  if (first) setTimeout(() => first.focus(), 30);
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  document.body.classList.remove('cart-open');
  if (!anyModalOpen()) {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;

  const box = $('.modal.is-open') || (cartDrawer.classList.contains('is-open') ? cartDrawer : null);
  if (!box) return;

  const items = $$(FOCUSABLE, box).filter((el) => el.offsetParent !== null);
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* ------------------------------ Favorites ----------------------------- */

function loadFavorites() {
  try {
    state.favorites = JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch (e) {
    state.favorites = [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(state.favorites));
}

function toggleFavorite(id) {
  const i = state.favorites.indexOf(id);
  if (i > -1) state.favorites.splice(i, 1);
  else state.favorites.push(id);
  saveFavorites();
  renderFavCount();
  renderProducts();
  renderFeatured();
  if ($('#productModal').classList.contains('is-open')) openProduct(id);
}

const isFavorite = (id) => state.favorites.includes(id);

function renderFavCount() {
  const pill = $('#favCount');
  if (!pill) return;
  const n = state.favorites.length;
  pill.textContent = n > 99 ? '99+' : n;
  pill.dataset.empty = n === 0 ? 'true' : 'false';
}

/* ------------------------------- Header ------------------------------- */

function renderHeader() {
  const count = Store.cartCount();
  const badge = $('#cartCount');
  badge.textContent = count > 99 ? '99+' : count;
  badge.dataset.empty = count === 0 ? 'true' : 'false';

  const slot = $('#authSlot');
  const me = Store.currentUser();
  if (me) {
    const initials = me.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    slot.innerHTML = `<button class="avatar" id="avatarBtn" title="${esc(me.name)}">${esc(initials)}</button>`;
  } else {
    slot.innerHTML = `<button class="btn btn-sm btn-dark" id="loginBtn">Masuk</button>`;
  }

  $('#statProducts').textContent = Store.products().filter(hasProductPhoto).length;
  renderFavCount();

}

function waLink(message) {
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
}

function renderNav() {
  $$('.main-nav .nav-link').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.nav === state.view);
  });
}

/* ----------------------------- Categories ----------------------------- */

function renderCategories() {
  const all = Store.products().filter(hasProductPhoto);
  const total = all.length;
  const chips = [{ slug: 'semua', name: 'Semua Produk', icon: '🛍️', color: '#2F2119' }].concat(CATEGORIES);
  const categoryImages = {
    batik: 'assets/img/kategori/cat-batik.svg',
    tas: 'assets/img/kategori/cat-anyaman.svg',
    aksesoris: 'assets/img/kategori/cat-anyaman.svg',
    kriya: 'assets/img/kategori/cat-kayu.svg',
  };

  $('#catRow').innerHTML = chips
    .map((c) => {
      const n = c.slug === 'semua' ? total : all.filter((p) => p.category === c.slug).length;
      const icon = categoryImages[c.slug]
        ? `<img src="${categoryImages[c.slug]}" alt="" aria-hidden="true">`
        : c.icon;
      return `
        <button class="cat-chip ${state.category === c.slug ? 'is-active' : ''}" data-cat="${c.slug}">
          <span class="cc-icon" style="background:${c.color}1f">${icon}</span>
          <span>
            <span class="cc-name">${esc(c.name)}</span>
            <span class="cc-count">${n} produk</span>
          </span>
        </button>`;
    })
    .join('');
}

/* ------------------------------ Featured ------------------------------ */

function renderFeatured() {
  const wrap = $('#unggulanSection');
  if (!wrap) return;
  const list = Store.featuredProducts().filter(hasProductPhoto);
  const single = state.view === 'orders' || state.view === 'lacak';
  wrap.hidden = list.length === 0 || single;
  if (!list.length) {
    $('#featuredGrid').innerHTML = '';
    return;
  }
  $('#featuredGrid').innerHTML = list.map(productCard).join('');
}

function renderHeroRecommendations() {
  const wrap = $('#heroRecommendations');
  if (!wrap) return;
  const recommendations = [
    { id: 'p1', detail: 'Motif Jlamprang · batik tulis tangan' },
    { id: 'p13', detail: 'Motif bisa disesuaikan · dibuat per pesanan', custom: true },
    { id: 'p8', detail: 'Kulit sapi · jahitan tangan saddle stitch' },
  ];
  const products = recommendations
    .map((recommendation) => ({
      ...recommendation,
      product: Store.findProduct(recommendation.id),
    }))
    .filter(({ product }) => product && product.stock > 0 && hasProductPhoto(product));

  wrap.innerHTML = '<div class="hero-blob"></div>' + products.map(({ id, detail, custom, product }, index) => {
    const image = Store.productImages(product).find((src) => !/\.svg(?:[?#].*)?$/i.test(src));
    return `
      <article class="hero-card hero-product-card hero-product-${index + 1}">
        <button class="hero-product-image" type="button" data-quick="${esc(product.id)}" aria-label="Lihat detail ${esc(product.name)}">
          <img src="${esc(image)}" alt="${esc(product.name)}">
        </button>
        <div class="hero-product-info">
          <h3><button class="hero-product-name" type="button" data-quick="${esc(product.id)}">${esc(product.name)}</button></h3>
          <b class="hero-product-price">${rupiah(productSalePrice(product))}</b>
          <p>${esc(detail)}</p>
          ${custom
            ? `<button class="btn btn-primary btn-sm hero-product-action" type="button" data-wa="${esc('Halo, saya tertarik memesan ' + product.name + ' dengan motif custom. Bisa tanya detail dan estimasi pengerjaan?')}">Tanya pesanan custom</button>`
            : `<button class="btn btn-sm hero-product-action" type="button" data-quick="${esc(product.id)}">Lihat produk</button>`}
        </div>
      </article>`;
  }).join('');
  wrap.hidden = products.length === 0;
}

/* ------------------------------- Filters ------------------------------ */

function renderTagRow() {
  const tags = Array.from(new Set(
    Store.products()
      .filter(hasProductPhoto)
      .flatMap((product) => product.tags || [])
  )).sort((a, b) => a.localeCompare(b, 'id'));
  if (!tags.length) {
    $('#tagRow').innerHTML = '<span class="fp-hint">Belum ada label produk.</span>';
    return;
  }
  $('#tagRow').innerHTML = tags
    .map(
      (t) =>
        `<button class="tag-chip ${state.tags.includes(t) ? 'is-active' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`
    )
    .join('');
}

function renderFilterState() {
  const bits = [];
  if (state.priceMin != null) bits.push('min ' + rupiah(state.priceMin));
  if (state.priceMax != null) bits.push('maks ' + rupiah(state.priceMax));
  if (state.tags.length) bits.push(state.tags.length + ' label');
  if (state.favOnly) bits.push('hanya tersimpan');
  if (state.promoOnly) bits.push('produk promo');

  $('#filterSummary').textContent = bits.length
    ? 'Filter aktif: ' + bits.join(' · ') + '.'
    : 'Tidak ada filter tambahan.';

  const favBtn = $('#favFilter');
  favBtn.classList.toggle('is-active', state.favOnly);
  favBtn.setAttribute('aria-pressed', state.favOnly ? 'true' : 'false');
  $('#discountFilter').checked = state.promoOnly;
  favBtn.innerHTML = state.favOnly
    ? `♥ Tersimpan <b class="nav-pill" data-empty="false">${state.favorites.length}</b>`
    : '♡ Tersimpan';
}

function clearAdvancedFilters() {
  state.priceMin = null;
  state.priceMax = null;
  state.tags = [];
  state.favOnly = false;
  state.promoOnly = false;
  state.category = 'semua';
  state.search = '';
  state.stock = 'semua';
  $('#priceMin').value = '';
  $('#priceMax').value = '';
  $('#catalogSearch').value = '';
  $('#headerSearch').value = '';
  $('#stockFilter').value = 'semua';
  renderTagRow();
  renderCategories();
  renderFilterState();
  renderProducts();
}

/* ------------------------------- Products ---------------------------- */

function filteredProducts() {
  const q = state.search.trim().toLowerCase();
  const productOrder = new Map(Store.products().map((product, index) => [product.id, index]));
  let list = Store.products().filter(hasProductPhoto).filter((p) => {
    if (state.category !== 'semua' && p.category !== state.category) return false;
    if (state.stock === 'tersedia' && p.stock <= 0) return false;
    if (state.stock === 'menipis' && !(p.stock > 0 && p.stock <= 10)) return false;
    if (state.stock === 'habis' && p.stock !== 0) return false;
    if (state.favOnly && !isFavorite(p.id)) return false;
    if (state.promoOnly && !(Number(p.discountPercent) > 0)) return false;
    const price = productSalePrice(p);
    if (state.priceMin != null && price < state.priceMin) return false;
    if (state.priceMax != null && price > state.priceMax) return false;
    if (state.tags.length && !state.tags.every((t) => (p.tags || []).includes(t))) return false;
    if (q) {
      const hay = (p.name + ' ' + categoryName(p.category) + ' ' + p.short + ' ' + (p.tags || []).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const by = {
    terlaris: (a, b) => b.sold - a.sold,
    terbaru: (a, b) => productOrder.get(a.id) - productOrder.get(b.id),
    'harga-asc': (a, b) => productSalePrice(a) - productSalePrice(b),
    'harga-desc': (a, b) => productSalePrice(b) - productSalePrice(a),
    diskon: (a, b) => (Number(b.discountPercent) || 0) - (Number(a.discountPercent) || 0) || b.sold - a.sold,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    nama: (a, b) => a.name.localeCompare(b.name, 'id'),
  };
  list = list.slice().sort(by[state.sort] || by.terlaris);
  return list;
}

function stockTag(p) {
  if (p.stock === 0) return '<span class="stock-tag stock-out">Habis</span>';
  if (p.stock <= 10) return `<span class="stock-tag stock-low">Sisa ${p.stock}</span>`;
  return '<span class="stock-tag stock-ok">Stok ' + p.stock + '</span>';
}

function starsHtml(rating) {
  const full = Math.round(rating);
  let out = '<span class="stars" aria-hidden="true">';
  for (let i = 1; i <= 5; i++) out += i <= full ? '★' : '<span class="off">★</span>';
  return out + '</span>';
}

function ratingMeta(p) {
  const s = Store.ratingSummary(p.id);
  return { avg: s.avg || p.rating || 0, total: s.total };
}

function productMedia(p) {
  const imgs = Store.productImages(p);
  if (imgs.length) {
    const illustration = imgs[0].endsWith('.svg');
    return `<img class="pc-img${illustration ? ' pc-illustration' : ''}" src="${imgs[0]}" alt="${illustration ? 'Ilustrasi ' : ''}${esc(p.name)}" loading="eager">${
      imgs.length > 1 ? `<span class="img-count">${imgs.length} foto</span>` : ''
    }`;
  }
  const illustration = productIllustration(p);
  return illustration
    ? `<img class="pc-img pc-illustration" src="${illustration}" alt="Ilustrasi ${esc(categoryName(p.category))}" loading="eager">`
    : `<span class="pc-emoji" role="img" aria-label="${esc(p.name)}">${p.icon}</span>`;
}

function hasProductPhoto(product) {
  return Store.productImages(product).some((src) => !/\.svg(?:[?#].*)?$/i.test(src));
}

function productIllustration(p) {
  const files = {
    batik: 'batik.svg',
    tas: 'tas.svg',
    aksesoris: 'kriya.svg',
    kriya: 'kriya.svg',
  };
  const file = files[p.category];
  return file ? 'assets/img/products/' + file : '';
}

function productCard(p) {
  const inCart = Store.cart().find((c) => c.productId === p.id);
  const soldOut = p.stock === 0;
  const meta = ratingMeta(p);
  const off = p.discountPercent;

  return `
    <article class="product-card" data-id="${p.id}">
      <div class="pc-media" data-quick="${p.id}" role="button" tabindex="0" aria-label="Lihat ${esc(p.name)}">
        ${productMedia(p)}
        <div class="pc-flags">
          ${soldOut ? '<span class="badge badge-clay">Habis</span>' : ''}
          ${p.featured && !soldOut ? '<span class="badge badge-dark">⭐ Unggulan</span>' : ''}
          ${off ? `<span class="badge badge-sage">-${off}%</span>` : ''}
        </div>
        <button class="pc-fav ${isFavorite(p.id) ? 'is-on' : ''}" data-fav="${p.id}" aria-label="Simpan ke favorit" aria-pressed="${isFavorite(p.id)}">${isFavorite(p.id) ? '♥' : '♡'}</button>
      </div>
      <div class="pc-body">
        <h3 class="pc-name" data-quick="${p.id}">${esc(p.name)}</h3>
        <p class="pc-short">${esc(p.short)}</p>
        <div class="pc-meta">
          <span class="pc-rating">★ ${meta.avg.toFixed(1)}</span>
          <span>(${meta.total} ulasan)</span>
          <span>·</span>
          <span>${p.sold} terjual</span>
        </div>
        <div class="pc-meta">${stockTag(p)}</div>
        <div class="pc-price">
          <span class="pc-price-values">
            <b class="${off ? 'sale-price' : ''}">${rupiah(productSalePrice(p))}</b>
            ${off ? `<del class="old">${rupiah(p.price)}</del>` : ''}
          </span>
          ${p.weight ? `<span class="tiny muted">${p.weight.toFixed(2)} kg</span>` : ''}
        </div>
        <div class="pc-actions">
          <button class="btn btn-primary btn-sm" data-add="${p.id}" ${soldOut ? 'disabled' : ''}>
            ${p.variants?.length ? 'Pilih opsi' : inCart ? 'Tambah (' + inCart.qty + ')' : '+ Keranjang'}
          </button>
          <button class="btn btn-sm" data-quick="${p.id}">Detail</button>
        </div>
      </div>
    </article>`;
}

function renderProducts() {
  const list = filteredProducts();
  const grid = $('#productGrid');

  const bits = [];
  if (state.category !== 'semua') bits.push(categoryName(state.category));
  if (state.search.trim()) bits.push('kata kunci "' + state.search.trim() + '"');
  if (state.stock !== 'semua') {
    bits.push({ semua: '', tersedia: 'stok tersedia', menipis: 'stok menipis', habis: 'stok habis' }[state.stock]);
  }
  if (state.favOnly) bits.push('hanya produk tersimpan');
  if (state.promoOnly) bits.push('produk promo');
  if (state.priceMin != null) bits.push('minimal ' + rupiah(state.priceMin));
  if (state.priceMax != null) bits.push('maksimal ' + rupiah(state.priceMax));
  if (state.tags.length) bits.push('label ' + state.tags.join(' + '));

  $('#catalogSubtitle').setAttribute('aria-live', 'polite');
  $('#catalogSubtitle').textContent = bits.length
    ? 'Menampilkan ' + list.length + ' produk untuk ' + bits.join(' · ') + '.'
    : 'Menampilkan ' + list.length + ' produk dari total ' + Store.products().filter(hasProductPhoto).length + '.';

  grid.innerHTML = list.length
    ? list.map(productCard).join('')
    : `<div class="empty" style="grid-column:1/-1">
         <div class="e-icon">🔍</div>
         <h3>Produk tidak ditemukan</h3>
         <p>${state.favOnly ? 'Belum ada produk yang kamu tandai dengan hati.' : 'Coba kata kunci lain atau longgarkan filternya.'}</p>
         <div style="margin-top:14px"><button class="btn btn-sm" id="clearFilter">Bersihkan Filter</button></div>
       </div>`;

  const clear = $('#clearFilter');
  if (clear) clear.addEventListener('click', clearAdvancedFilters);
}

/* ------------------ Promo: gratis ongkir & kode voucher ---------------- */

function renderFreeShipping() {
  const subtotal = Store.cartSubtotal();
  const missing = missingForFreeShipping(subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_MIN) * 100));
  const bar = $('#freeShipBar');
  const meter = bar?.parentElement;
  const hint = $('#freeShipHint');

  if (bar) bar.style.width = pct + '%';
  if (meter) meter.classList.toggle('is-done', missing === 0 && subtotal > 0);
  if (hint) {
    hint.textContent = subtotal === 0
      ? 'Keranjang masih kosong.'
      : missing === 0
        ? 'Selamat, ongkir reguler dan ekspres sekarang gratis.'
        : 'Tambah ' + rupiah(missing) + ' lagi untuk gratis ongkir.';
  }
  const min = $('#freeShipMin');
  if (min) min.textContent = rupiah(FREE_SHIPPING_MIN);
  renderPromoBanner();
}

function renderVoucherStrip() {
  const strip = $('#voucherStrip');
  if (!strip) return;

  const usable = Store.vouchers().filter((v) =>
    v.active &&
    (!v.expiresAt || new Date(v.expiresAt) >= new Date()) &&
    (!v.quota || v.used < v.quota)
  );
  if (!usable.length) {
    strip.innerHTML = '<span class="tiny muted">Belum ada kode promo aktif saat ini.</span>';
    return;
  }

  strip.innerHTML = usable
    .map((v) => {
      const used = state.voucherCode.toUpperCase() === v.code.toUpperCase();
      const terms = [v.minSpend ? `Min. ${rupiah(v.minSpend)}` : '', v.quota ? `sisa ${Math.max(0, v.quota - v.used)}` : '', v.expiresAt ? `s.d. ${formatDate(v.expiresAt)}` : ''].filter(Boolean);
      return `<button class="voucher-chip ${used ? 'is-used' : ''}" data-voucher="${esc(v.code)}" title="${esc(v.desc)}"><b>${esc(v.code)}</b><span>${esc(voucherLabel(v))}</span>${terms.length ? `<small>${esc(terms.join(' · '))}</small>` : ''}</button>`;
    })
    .join('');
}

function renderPromoBanner() {
  const banner = $('#promoAnnouncement');
  const content = $('#promoAnnouncementContent');
  if (!banner || !content) return;

  const deals = Store.products().filter((p) => hasProductPhoto(p) && p.stock > 0 && Number(p.discountPercent) > 0);
  const vouchers = Store.vouchers().filter((v) =>
    v.active &&
    (!v.expiresAt || new Date(v.expiresAt) >= new Date()) &&
    (!v.quota || v.used < v.quota)
  );
  const maxDiscount = deals.reduce((max, p) => Math.max(max, Number(p.discountPercent) || 0), 0);
  if (!maxDiscount && !vouchers.length) {
    banner.classList.add('hidden');
    content.innerHTML = '';
    return;
  }

  const voucherTerms = (v) => {
    const terms = [];
    if (v.minSpend) terms.push(`min. ${rupiah(v.minSpend)}`);
    if (v.quota) terms.push(`sisa ${Math.max(0, v.quota - v.used)} kuota`);
    if (v.expiresAt) terms.push(`s.d. ${formatDate(v.expiresAt)}`);
    return terms.length ? ` · ${terms.join(' · ')}` : '';
  };
  const promos = [];
  if (maxDiscount) promos.push(`<span class="promo-deal-chip"><span class="promo-deal-kicker">Produk pilihan</span><b>Hemat hingga ${maxDiscount}%</b></span>`);
  vouchers.slice(0, 2).forEach((v) => {
    const selected = state.voucherCode.toUpperCase() === v.code.toUpperCase();
    promos.push(`<button class="promo-deal-chip promo-voucher-chip${selected ? ' is-selected' : ''}" type="button" data-voucher="${esc(v.code)}" title="${esc(v.desc)}"><span class="promo-deal-kicker">Kode promo</span><b>${esc(v.code)}</b><span>${esc(voucherLabel(v))}${esc(voucherTerms(v))}</span></button>`);
  });
  content.innerHTML = promos.join('');
  banner.classList.remove('hidden');
}

/* --------------------------- Product quick view ----------------------- */

function galleryHtml(p) {
  const imgs = Store.productImages(p);
  if (!imgs.length) {
    const illustration = productIllustration(p);
    if (!illustration) {
      return `<div class="pv-media" style="background:linear-gradient(150deg, ${catColor(p)}18, ${catColor(p)}30); font-size:76px" role="img" aria-label="${esc(p.name)}">${p.icon}</div>`;
    }
    return `<div class="pv-media pv-illustration-wrap">
      <img class="pv-img pv-illustration" src="${illustration}" alt="Ilustrasi kategori ${esc(categoryName(p.category))}">
      <span class="pv-art-note">Ilustrasi kategori · tambahkan foto produk lewat Panel Admin</span>
    </div>`;
  }
  const illustration = imgs[pvState.img].endsWith('.svg');
  return `
    <div class="pv-media" style="background:var(--cream-2)">
      <button class="pv-zoom-trigger" type="button" data-image-zoom aria-label="Perbesar ${illustration ? 'ilustrasi' : 'foto'} ${esc(p.name)}">
        <img class="pv-img${illustration ? ' pv-product-illustration' : ''}" id="pvImg" src="${imgs[pvState.img] || imgs[0]}" alt="${illustration ? 'Ilustrasi ' : ''}${esc(p.name)}">
        <span class="pv-zoom-hint">Perbesar foto</span>
      </button>
      <div class="pv-thumbs">
        ${imgs
          .map(
            (src, i) =>
              `<button class="pv-thumb ${i === pvState.img ? 'is-active' : ''}" data-pv-img="${i}" aria-label="${src.endsWith('.svg') ? 'Ilustrasi' : 'Foto'} ${i + 1}"><img src="${src}" alt=""></button>`
          )
          .join('')}
      </div>
    </div>`;
}

const catColor = (p) => {
  const c = CATEGORIES.find((x) => x.slug === p.category);
  return c ? c.color : '#C2643B';
};

function reviewsHtml(p) {
  const s = Store.ratingSummary(p.id);
  const list = Store.reviews(p.id, false);
  const me = Store.currentUser();
  const can = Store.canReview(p.id, me && me.id);

  const bars = [5, 4, 3, 2, 1]
    .map((star) => {
      const n = s.dist[star] || 0;
      const pct = s.total ? Math.round((n / s.total) * 100) : 0;
      return `<div class="rs-row">
        <span>${star} ★</span>
        <span class="rs-track"><i class="rs-fill" style="width:${pct}%"></i></span>
        <span>${n}</span>
      </div>`;
    })
    .join('');

  /* Ulasan milik sendiri yang masih din moderasi tetap ditampilkan sebagai konfirmasi */
  const pendingMine = me
    ? Store.allReviews().filter(
        (r) => r.userId === me.id && r.productId === p.id && r.status === 'pending'
      )
    : [];
  const shown = pendingMine.concat(list);

  const items = shown.length
    ? shown
        .map(
          (r) => `
        <article class="review-item${r.status === 'pending' ? ' is-mine' : ''}">
          <div class="ri-head">
            <span class="ri-avatar">${esc(r.author.slice(0, 2).toUpperCase())}</span>
            <span>
              <span class="ri-name">${esc(r.author)}</span><br>
              <span class="tiny muted">${formatDate(r.createdAt)}${
                r.status === 'pending' ? ' · Menunggu moderasi' : r.orderId ? ' · Pesanan ' + esc(r.orderId) : ''
              }</span>
            </span>
            <span class="grow"></span>
            ${starsHtml(r.rating)}
          </div>
          <p class="ri-body">${esc(r.text)}</p>
          ${
            r.status === 'pending'
              ? '<div class="ri-reply"><b>Ulasan kamu sedang ditinjau toko.</b> Akan tampil di sini setelah disetujui.</div>'
              : r.reply
                ? `<div class="ri-reply"><b>Balasan Toko Kriya:</b> ${esc(r.reply)}</div>`
                : ''
          }
        </article>`
        )
        .join('')
    : '<p class="muted small" style="padding:12px 0">Belum ada ulasan untuk produk ini.</p>';

  const form = can.ok
    ? `<form class="review-form" id="reviewForm">
        <div class="field">
          <label>Rating kamu</label>
          <div class="star-input" id="starInput" role="radiogroup" aria-label="Pilih rating">
            ${[1, 2, 3, 4, 5]
              .map(
                (i) =>
                  `<button type="button" role="radio" aria-checked="${pvState.reviewRating === i}" aria-label="${i} bintang" data-star="${i}" class="${i <= pvState.reviewRating ? 'is-on' : ''}">★</button>`
              )
              .join('')}
          </div>
        </div>
        <div class="field">
          <label for="reviewText">Ceritakan pengalamanmu</label>
          <textarea class="input" id="reviewText" maxlength="400" placeholder="Kualitas bahannya, kecepatannya, kemasannya"></textarea>
          <span class="hint">Maksimal 400 huruf. Ulasan ditinjau toko dulu sebelum tayang di halaman produk.</span>
        </div>
        <button class="btn btn-primary" type="submit">Kirim Ulasan</button>
      </form>`
    : `<div class="alert alert-info" style="margin-top:14px">
        <span>✍️</span>
        <span>${esc(can.reason)}${me ? '' : ' <button class="btn btn-sm" data-goto-login>Masuk dulu</button>'}</span>
      </div>`;

  return `
    <section class="reviews">
      <h4 style="font-size:16px;margin-bottom:12px">Ulasan Pembeli (${s.total})</h4>
      <div class="review-summary">
        <div class="rs-avg">
          <div class="rs-num">${s.avg.toFixed(1)}</div>
          ${starsHtml(s.avg)}
          <div class="rs-count">${s.total} ulasan</div>
        </div>
        <div class="rs-bars">${bars}</div>
      </div>
      ${items}
      ${form}
    </section>`;
}

function openProduct(id) {
  const p = Store.findProduct(id);
  if (!p || !hasProductPhoto(p)) return;
  const cat = CATEGORIES.find((c) => c.slug === p.category) || { name: p.category, color: '#C2643B', icon: '🛍️' };
  const meta = ratingMeta(p);
  const imgs = Store.productImages(p);

  pvState = { id: p.id, qty: 1, img: 0, reviewRating: 0, showReviewForm: false };
  pvState.variantId = null;

  $('#productModalBody').innerHTML = `
    <div class="pv">
      ${galleryHtml(p)}
      <div class="pv-info">
        <h3 id="pmTitle">${esc(p.name)}</h3>
        <div class="row" style="align-items:baseline;gap:10px">
          <div class="pv-price ${p.discountPercent ? 'sale-price' : ''}">${rupiah(productSalePrice(p))}${p.discountPercent ? ` <del class="pv-old-price">${rupiah(p.price)}</del>` : ''}</div>
          ${p.discountPercent ? `<span class="badge badge-sage">Diskon ${Number(p.discountPercent)}%</span>` : ''}
          ${p.sold > 100 ? `<span class="tiny muted">${p.sold} terjual</span>` : ''}
        </div>
        <div class="pc-meta">
          <span class="pc-rating">★ ${meta.avg.toFixed(1)}</span>
          <span>(${meta.total} ulasan)</span>
          <span>·</span>
          ${stockTag(p)}
        </div>
        <p class="pv-desc">${esc(p.desc)}</p>
        <div class="pv-tags">${(p.tags || []).map((t) => `<span class="badge badge-outline">${esc(t)}</span>`).join('')}</div>
        <dl class="pv-spec">
          ${p.material ? `<dt>Bahan</dt><dd>${esc(p.material)}</dd>` : ''}
          ${p.dimensions ? `<dt>Ukuran</dt><dd>${esc(p.dimensions)}</dd>` : ''}
          ${p.care ? `<dt>Perawatan</dt><dd>${esc(p.care)}</dd>` : ''}
          <dt>Berat kirim</dt><dd>${(p.weight || 0).toFixed(2)} kg</dd>
          <dt>Stok tersedia</dt><dd id="pvStockCount">${p.variants?.length ? 'Pilih variasi' : p.stock + ' buah'}</dd>
          <dt>Toko</dt><dd>Toko Kriya Sidoarjo</dd>
        </dl>
        ${p.variants?.length ? `<div class="field pv-variant-field"><label for="pvVariant">${esc(p.variantName || 'Pilihan')} wajib dipilih</label><select class="input" id="pvVariant" aria-label="${esc(p.variantName || 'Pilih variasi produk')}"><option value="">Pilih ${esc((p.variantName || 'variasi').toLowerCase())}</option>${p.variants.map((v) => `<option value="${esc(v.id)}" ${v.stock <= 0 ? 'disabled' : ''}>${esc(v.label)}${v.stock > 0 ? ` · sisa ${v.stock}` : ' · habis'}</option>`).join('')}</select></div>` : ''}
        <div class="pv-shipping-note"><b>Perkiraan ongkir</b><span>${SHIPPING_METHODS.map((method) => `${esc(method.name)} ${shippingCostFor(p.weight || 0, method.slug, { base: productSalePrice(p) }) === 0 ? 'gratis' : rupiah(shippingCostFor(p.weight || 0, method.slug, { base: productSalePrice(p) }))}`).join(' · ')}</span><small>Gratis ongkir mulai belanja ${rupiah(FREE_SHIPPING_MIN)}. Same Day hanya area Sidoarjo dan Surabaya.</small></div>
        <div class="row" style="gap:8px">
          <div class="qty">
            <button data-pv-qty="-1" aria-label="Kurangi jumlah">−</button>
            <span id="pvQty">1</span>
            <button data-pv-qty="1" aria-label="Tambah jumlah" ${p.stock <= 1 ? 'disabled' : ''}>+</button>
          </div>
          <button class="btn btn-primary grow" data-pv-add="${p.id}" ${p.stock === 0 || (p.variants?.length && !p.variants.some((v) => v.stock > 0)) ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Stok Habis' : p.variants?.length ? 'Pilih variasi' : 'Masuk Keranjang'}
          </button>
          <button class="btn" data-pv-fav="${p.id}" title="Favorit" aria-pressed="${isFavorite(p.id)}">${isFavorite(p.id) ? '♥' : '♡'}</button>
        </div>
        ${p.stock > 0 && p.stock <= 10 ? `<div class="alert alert-warn"><span>⚠️</span><span>Tinggal ${p.stock} buah. Kalau mau aman, simpan dulu ke favorit.</span></div>` : ''}
        <a class="btn btn-soft btn-sm" href="https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo, saya mau tanya soal ' + p.name + '.')}" target="_blank" rel="noopener">💬 WhatsApp: 0857-4512-0164</a>
        ${reviewsHtml(p)}
      </div>
    </div>`;

  openModal('productModal');
  const variantSelect = $('#pvVariant');
  if (variantSelect) variantSelect.addEventListener('change', () => {
    pvState.variantId = variantSelect.value || null;
    const variant = p.variants.find((item) => item.id === pvState.variantId);
    $('#pvStockCount').textContent = variant ? `${variant.stock} buah · ${variant.label}` : 'Pilih variasi';
    const inCartQty = Store.cart().find((item) => item.productId === p.id && item.variantId === pvState.variantId)?.qty || 0;
    const remaining = variant ? Math.max(0, variant.stock - inCartQty) : 0;
    const addButton = $('#productModalBody [data-pv-add]');
    addButton.disabled = !variant || variant.stock <= 0;
    addButton.textContent = variant ? variant.stock > 0 ? 'Masuk Keranjang' : 'Stok Habis' : 'Pilih variasi';
    pvState.qty = 1;
    $('#pvQty').textContent = '1';
    $('#productModalBody [data-pv-qty="1"]').disabled = remaining <= 1;
    addButton.disabled = !variant || remaining <= 0;
  });
}

function openPhotoZoom() {
  const p = Store.findProduct(pvState.id);
  if (!p) return;
  const images = Store.productImages(p);
  if (!images.length) return;
  const lightbox = $('#photoLightbox');
  lightbox.dataset.count = String(images.length);
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  updatePhotoZoom();
  $('#photoLightboxClose').focus();
}

function updatePhotoZoom(step = 0) {
  const p = Store.findProduct(pvState.id);
  if (!p) return;
  const images = Store.productImages(p);
  if (!images.length) return;
  pvState.img = (pvState.img + step + images.length) % images.length;
  const image = $('#photoLightboxImage');
  image.src = images[pvState.img];
  image.alt = `Foto ${pvState.img + 1} dari ${images.length}: ${p.name}`;
  $('#photoLightboxCount').textContent = `${pvState.img + 1} / ${images.length}`;
  $('#photoLightboxPrev').hidden = images.length < 2;
  $('#photoLightboxNext').hidden = images.length < 2;
}

function closePhotoZoom() {
  const lightbox = $('#photoLightbox');
  if (!lightbox.classList.contains('is-open')) return false;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  $('#productModalBody [data-image-zoom]')?.focus();
  return true;
}

function bumpPvQty(delta) {
  const p = Store.findProduct(pvState.id);
  if (!p) return;
  const variant = p.variants?.find((item) => item.id === pvState.variantId);
  const inCartQty = Store.cart().find((item) => item.productId === p.id && (item.variantId || null) === (pvState.variantId || null))?.qty || 0;
  const stock = variant ? variant.stock : p.stock;
  const maxQty = Math.max(1, stock - inCartQty);
  pvState.qty = Math.max(1, Math.min(maxQty, pvState.qty + delta));
  const el = $('#pvQty');
  if (el) el.textContent = pvState.qty;
  const plus = $('#productModalBody [data-pv-qty="1"]');
  if (plus) plus.disabled = pvState.qty >= maxQty || (p.variants?.length && !variant);
}

function submitReview(e) {
  e.preventDefault();
  const me = Store.currentUser();
  if (!me) return toast('Masuk dulu untuk menulis ulasan.', 'error');
  if (!pvState.reviewRating) return toast('Pilih rating dulu.', 'error');

  const text = $('#reviewText')?.value.trim() || '';
  if (text.length < 10) return toast('Ulasan minimal 10 huruf.', 'error');

  const res = Store.addReview({
    productId: pvState.id,
    userId: me.id,
    rating: pvState.reviewRating,
    text,
  });

  if (!res.ok) return toast(res.reason || res.error || 'Ulasan gagal disimpan.', 'error');

  openProduct(pvState.id);
  toast('Ulasanmu tersimpan dan sedang ditinjau toko. Terima kasih!', 'success');
}

/* -------------------------------- Cart -------------------------------- */

function addToCart(id, qty = 1, variantId = null) {
  const p = Store.findProduct(id);
  if (!p) return false;
  if (p.variants?.length && !variantId) {
    openProduct(id);
    toast(`Pilih ${p.variantName || 'variasi'} ${p.name} terlebih dahulu.`, 'error');
    return false;
  }
  const variant = p.variants?.find((item) => item.id === variantId);
  const availableStock = variant ? variant.stock : p.stock;
  const inCart = Store.cart().find((c) => c.productId === id && (c.variantId || null) === (variantId || null));
  const nextQty = (inCart ? inCart.qty : 0) + qty;
  if (nextQty > availableStock) {
    toast(`Stok ${p.name}${variant ? ` (${variant.label})` : ''} hanya ${availableStock} buah.`, 'error');
    return false;
  }
  const result = Store.addToCart(id, qty, variantId);
  if (!result.ok) {
    toast(result.error, 'error');
    return false;
  }
  renderAfterCartChange();
  toast(`${p.name}${variant ? ` · ${variant.label}` : ''} masuk keranjang`, 'success');
  return true;
}

function renderAfterCartChange() {
  renderHeader();
  renderProducts();
  renderFeatured();
  renderCart();
  renderFreeShipping();
  renderPromoBanner();
}

function renderCart() {
  const items = Store.cartDetailed();
  const body = $('#cartBody');
  const foot = $('#cartFoot');

  if (!items.length) {
    if (state.voucherCode) {
      state.voucherCode = '';
      renderVoucherStrip();
    }
    body.innerHTML = `
      <div class="empty">
        <div class="e-icon">🛒</div>
        <h3>Keranjang masih kosong</h3>
        <p>Telusuri katalog dan pilih barang yang kamu suka.</p>
      </div>`;
    foot.innerHTML = `<button class="btn btn-primary btn-block" data-nav="katalog">Mulai Belanja</button>`;
    return;
  }

  /* Hitung dulu supaya voucher yang jadi tidak berlaku ikut hilang dari tampilan */
  const t = checkoutTotals();

  body.innerHTML =
    `<div class="voucher-box">
      <input class="input" id="voucherInput" placeholder="Kode promo" aria-label="Kode voucher" value="${esc(state.voucherCode)}">
      <button class="btn" id="voucherApply">Pakai</button>
    </div>` +
    (state.voucherCode ? voucherAppliedHtml() : '') +
    items
      .map((i) => {
        const over = i.qty > i.availableStock;
        const image = Store.productImages(i.product).find((src) => !/\.svg(?:[?#].*)?$/i.test(src));
        return `
        <div class="cart-item">
          <div class="ci-media">
            ${image
              ? `<img src="${esc(image)}" alt="${esc(i.product.name)}">`
              : `<span role="img" aria-label="${esc(i.product.name)}">${esc(i.product.icon || '')}</span>`}
          </div>
          <div>
            <div class="ci-name">${esc(i.product.name)}</div>
            ${i.variantLabel ? `<div class="tiny muted">${esc(i.product.variantName || 'Pilihan')}: ${esc(i.variantLabel)}</div>` : i.variantRequired ? `<div class="tiny field-error">${i.variantMissing ? 'Opsi ini tidak lagi tersedia. Hapus dan pilih ulang.' : 'Pilih variasi produk dengan menghapus item ini lalu membukanya kembali.'}</div>` : ''}
            <div class="tiny muted">${i.product.discountPercent ? `<del>${rupiah(i.product.price)}</del> <b class="sale-price">${rupiah(i.unitPrice)}</b>` : rupiah(i.unitPrice)} × ${i.qty}</div>
            ${over ? '<div class="tiny stock-out">Melebihi stok tersedia</div>' : ''}
            <div class="ci-row">
              <div class="qty">
                <button data-cart-dec="${i.product.id}" data-cart-variant="${esc(i.variantId || '')}" aria-label="Kurangi jumlah ${esc(i.product.name)}${i.variantLabel ? ' ' + esc(i.variantLabel) : ''}">−</button>
                <span>${i.qty}</span>
                <button data-cart-inc="${i.product.id}" data-cart-variant="${esc(i.variantId || '')}" aria-label="Tambah jumlah ${esc(i.product.name)}${i.variantLabel ? ' ' + esc(i.variantLabel) : ''}" ${i.qty >= i.availableStock ? 'disabled' : ''}>+</button>
              </div>
              <span class="ci-price">${rupiah(i.lineTotal)}</span>
            </div>
            <div style="margin-top:6px">
              <button class="btn btn-sm btn-ghost" data-cart-rm="${i.product.id}" data-cart-variant="${esc(i.variantId || '')}" style="height:32px;padding:0 10px">Hapus</button>
            </div>
          </div>
        </div>`;
      })
      .join('');

  foot.innerHTML = `
    ${t.productDiscount ? `<div class="summary-row"><span>Subtotal awal (${Store.cartCount()} barang)</span><span>${rupiah(t.originalSubtotal)}</span></div><div class="summary-row discount-row"><span>Diskon produk</span><span>−${rupiah(t.productDiscount)}</span></div>` : ''}
    <div class="summary-row"><span>Subtotal${t.productDiscount ? ' setelah diskon' : ` (${Store.cartCount()} barang)`}</span><span><b>${rupiah(t.subtotal)}</b></span></div>
    ${t.discount ? `<div class="summary-row discount-row"><span>Diskon ${esc(state.voucherCode.toUpperCase())}</span><span>−${rupiah(t.discount)}</span></div>` : ''}
    <div class="summary-row"><span>Ongkos kirim (${t.weight.toFixed(2)} kg)</span><span>${t.shipping === 0 ? '<span class="free">Gratis</span>' : rupiah(t.shipping)}</span></div>
      ${t.fee ? `<div class="summary-row"><span>Biaya layanan</span><span>${rupiah(t.fee)}</span></div>` : ''}
      <div class="summary-row total"><span>Total</span><span>${rupiah(t.total)}</span></div>
    ${
      t.missingFreeShip > 0
        ? `<div class="tiny muted" style="margin-top:6px">Belanja ${rupiah(t.subtotal - t.discount)} lagi, kurang <b>${rupiah(t.missingFreeShip)}</b> untuk gratis ongkir.</div>`
        : ''
    }
    <button class="btn btn-primary btn-lg btn-block" id="goCheckout" style="margin-top:14px">Lanjut ke Checkout</button>
    <button class="btn btn-ghost btn-sm btn-block" id="clearCartBtn" style="margin-top:6px">Kosongkan keranjang</button>`;
}

function voucherAppliedHtml() {
  const v = Store.findVoucher(state.voucherCode);
  const label = v ? voucherLabel(v) : 'Voucher';
  return `
    <div class="voucher-on">
      <span style="font-size:18px">🎟️</span>
      <div class="grow">
        <div class="vo-code">${esc(state.voucherCode.toUpperCase())} aktif</div>
        <div class="vo-desc">${esc(label)}${v ? ' · ' + esc(v.desc) : ''}</div>
      </div>
      <button class="btn btn-sm" data-voucher-remove aria-label="Hapus voucher">Hapus</button>
    </div>`;
}

function applyVoucher() {
  const code = ($('#voucherInput')?.value || state.voucherCode).trim();
  if (!code) return toast('Ketik kode voucher dulu.', 'error');

  const res = Store.evaluateVoucher(code, Store.cartSubtotal());
  if (!res.ok) return toast(res.error, 'error');

  state.voucherCode = res.voucher.code;
  renderCart();
  renderVoucherStrip();
  renderPromoBanner();
  toast('Voucher ' + res.voucher.code + ' dipakai.', 'success');
}

/* -------------------------------- Auth -------------------------------- */

let authMode = 'login';

function openAuth(mode = 'login') {
  authMode = mode;
  renderAuthForm();
  openModal('authModal');
}

function renderAuthForm() {
  $('#tabLogin').classList.toggle('is-active', authMode === 'login');
  $('#tabRegister').classList.toggle('is-active', authMode === 'register');
  $('#authTitle').textContent = authMode === 'login' ? 'Masuk ke Toko Kriya' : 'Daftar Akun Baru';
  $('#authError').classList.add('hidden');

  const form = $('#authForm');
  if (authMode === 'login') {
    form.innerHTML = `
      <div class="field">
        <label for="liEmail">Email</label>
        <input class="input" type="email" id="liEmail" placeholder="nama@email.com" autocomplete="email">
      </div>
      <div class="field">
        <label for="liPass">Password</label>
        <input class="input" type="password" id="liPass" placeholder="••••••" autocomplete="current-password">
      </div>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Masuk</button>
      <div class="alert alert-info" style="margin-top:4px">
        <span>🔑</span>
        <span>Akun demo: <b>bayu@mail.com</b> / <b>bayu123</b>. Admin: <b>admin@tokokriya.id</b> / <b>admin123</b>.</span>
      </div>`;
  } else {
    form.innerHTML = `
      <div class="field">
        <label for="rgName">Nama lengkap</label>
        <input class="input" type="text" id="rgName" placeholder="Nama sesuai KTP" autocomplete="name">
      </div>
      <div class="field">
        <label for="rgPhone">Nomor HP <span class="muted">(opsional)</span></label>
        <input class="input" type="tel" id="rgPhone" placeholder="08xxxxxxxxxx" autocomplete="tel">
      </div>
      <div class="field">
        <label for="rgEmail">Email</label>
        <input class="input" type="email" id="rgEmail" placeholder="nama@email.com" autocomplete="email">
      </div>
      <div class="field">
        <label for="rgPass">Password</label>
        <input class="input" type="password" id="rgPass" placeholder="Minimal 6 karakter" autocomplete="new-password">
      </div>
      <div class="field">
        <label for="rgPass2">Ulangi password</label>
        <input class="input" type="password" id="rgPass2" placeholder="Ketik ulang password" autocomplete="new-password">
      </div>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Buat Akun</button>`;
  }

  const emailInput = form.querySelector('input[type="email"]');
  if (emailInput) emailInput.focus();
}

function showAuthError(msg) {
  const box = $('#authError');
  box.textContent = msg;
  box.classList.remove('hidden');
}

function handleAuthSubmit(e) {
  e.preventDefault();

  if (authMode === 'login') {
    const email = $('#liEmail').value.trim();
    const pass = $('#liPass').value;
    if (!email || !pass) return showAuthError('Email dan password wajib diisi.');
    const res = Store.login(email, pass);
    if (!res.ok) return showAuthError(res.error);
    closeModals();
    afterLogin(res.user);
    return;
  }

  const name = $('#rgName').value.trim();
  const phone = $('#rgPhone').value.trim();
  const email = $('#rgEmail').value.trim();
  const pass = $('#rgPass').value;
  const pass2 = $('#rgPass2').value;

  if (name.length < 3) return showAuthError('Nama minimal 3 huruf.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showAuthError('Format email belum benar.');
  if (pass.length < 6) return showAuthError('Password minimal 6 karakter.');
  if (pass !== pass2) return showAuthError('Ulangi password tidak sama.');

  const res = Store.register({ name, email, password: pass });
  if (!res.ok) return showAuthError(res.error);
  Store.login(email, pass);
  if (phone) Store.updateProfile(res.user.id, { phone });
  closeModals();
  afterLogin(Store.currentUser());
  toast('Akun dibuat. Selamat belanja!', 'success');
}

function afterLogin(user) {
  renderHeader();
  renderAccountIfOpen();
  renderOrders();
  renderCart();
  toast('Selamat datang, ' + user.name + '!', 'success');
  if (state.pendingCheckout) {
    state.pendingCheckout = false;
    setTimeout(openCheckout, 250);
  }
}

/* ------------------------------- Account ------------------------------ */

function openAccount() {
  const me = Store.currentUser();
  if (!me) return openAuth('login');
  renderAccountIfOpen();
  openModal('accountModal');
}

function renderAccountIfOpen() {
  const me = Store.currentUser();
  const body = $('#accountBody');
  if (!body) return;

  if (!me) {
    body.innerHTML = `<div class="empty"><div class="e-icon">👤</div><h3>Belum masuk</h3><p>Pembelian dan riwayat pesanan hanya bisa dilihat setelah masuk.</p></div>`;
    return;
  }

  const orders = Store.myOrders();
  const spent = orders.filter((o) => o.status !== 'batal').reduce((s, o) => s + o.total, 0);
  const addresses = Store.addresses(me.id);
  const reviewable = orders
    .filter((o) => o.status === 'selesai')
    .flatMap((o) => o.items)
    .filter((i) => Store.canReview(i.productId, me.id).ok);

  body.innerHTML = `
    <div class="row" style="gap:14px;margin-bottom:16px">
      <span class="avatar" style="width:54px;height:54px;font-size:19px">${esc(me.name.slice(0, 2).toUpperCase())}</span>
      <div class="grow">
        <b style="font-size:16px">${esc(me.name)}</b>
        <div class="small muted">${esc(me.email)}${me.phone ? ' · ' + esc(me.phone) : ''}</div>
        <span class="badge ${me.role === 'admin' ? 'badge-clay' : 'badge-sage'}" style="margin-top:5px">${me.role === 'admin' ? 'Administrator' : 'Pembeli'}</span>
      </div>
      <button class="btn btn-sm" id="editProfileBtn">Ubah</button>
    </div>

    <div id="profileFormWrap"></div>

    <div class="review-box">
      <header><span>Ringkasan Belanja</span></header>
      <div class="rb-body">
        <div class="rb-row"><span>Jumlah pesanan</span><span>${orders.length}</span></div>
        <div class="rb-row"><span>Total belanja</span><span>${rupiah(spent)}</span></div>
        <div class="rb-row"><span>Alamat tersimpan</span><span>${addresses.length}</span></div>
        <div class="rb-row"><span>Ulasan menunggu ditulis</span><span>${reviewable.length}</span></div>
      </div>
    </div>

    <div class="row-between" style="margin:18px 0 10px">
      <b style="font-size:14px">Alamat Tersimpan</b>
      <button class="btn btn-sm" id="addAddrBtn">+ Tambah</button>
    </div>
    <div id="addrWrap">${addressesHtml()}</div>

    ${me.role === 'admin' ? '<a href="admin.html" class="btn btn-dark btn-block" style="margin-top:18px">Buka Panel Admin</a>' : ''}
    <button class="btn btn-block" style="margin-top:8px" id="acctOrders">Lihat Pesanan Saya</button>`;

  const btn = $('#acctOrders');
  if (btn) btn.addEventListener('click', () => { closeModals(); navigate('orders'); });

  $('#editProfileBtn').addEventListener('click', toggleProfileForm);
  $('#addAddrBtn').addEventListener('click', () => openAddressForm(null));
}

function addressesHtml() {
  const me = Store.currentUser();
  if (!me) return '';
  const list = Store.addresses(me.id);
  if (!list.length) {
    return '<p class="muted small">Belum ada alamat tersimpan. Alamat ini dipakai otomatis saat checkout.</p>';
  }

  return (
    `<div class="addr-list">${list
      .map(
        (a) => `
      <div class="addr-card ${a.isDefault ? 'is-default' : ''}">
        <div class="addr-label">${esc(a.label)}${a.isDefault ? '<span class="badge badge-clay">Utama</span>' : ''}</div>
        <div><b>${esc(a.name)}</b> · ${esc(a.phone)}</div>
        <div class="addr-line">${esc(a.address)}, ${esc(a.city)} ${esc(a.postal)}</div>
        <div class="addr-actions">
          ${a.isDefault ? '' : `<button class="btn btn-sm" data-addr-default="${a.id}">Jadikan utama</button>`}
          <button class="btn btn-sm" data-addr-edit="${a.id}">Ubah</button>
          <button class="btn btn-sm btn-danger" data-addr-del="${a.id}">Hapus</button>
        </div>
      </div>`
      )
      .join('')}</div>`
  );
}

function toggleProfileForm() {
  const wrap = $('#profileFormWrap');
  const me = Store.currentUser();
  if (!wrap || !me) return;

  if (wrap.innerHTML) {
    wrap.innerHTML = '';
    return;
  }

  wrap.innerHTML = `
    <form class="review-box" id="profileForm">
      <header><span>Ubah Data Diri</span></header>
      <div class="rb-body" style="gap:12px">
        <div class="field"><label for="pfName">Nama lengkap</label><input class="input" id="pfName" value="${esc(me.name)}"></div>
        <div class="field"><label for="pfEmail">Email</label><input class="input" type="email" id="pfEmail" value="${esc(me.email)}"></div>
        <div class="field"><label for="pfPhone">Nomor HP</label><input class="input" type="tel" id="pfPhone" value="${esc(me.phone || '')}" placeholder="08xxxxxxxxxx"></div>
        <button class="btn btn-primary btn-sm" type="submit">Simpan Perubahan</button>
      </div>
    </form>`;

  $('#profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const res = Store.updateProfile(me.id, {
      name: $('#pfName').value.trim(),
      email: $('#pfEmail').value.trim(),
      phone: $('#pfPhone').value.trim(),
    });
    if (!res.ok) return toast(res.error, 'error');
    renderHeader();
    renderAccountIfOpen();
    toast('Data diri diperbarui.', 'success');
  });
}

function openAddressForm(id) {
  const me = Store.currentUser();
  if (!me) return;
  const wrap = $('#addrWrap');
  const a = id ? Store.addresses(me.id).find((x) => x.id === id) : null;

  wrap.innerHTML = `
    <form class="addr-card" id="addrForm">
      <b style="font-size:13.5px">${a ? 'Ubah Alamat' : 'Alamat Baru'}</b>
      <div class="form-grid" style="margin-top:10px">
        <div class="form-row">
          <div class="field"><label for="afLabel">Label</label><input class="input" id="afLabel" value="${esc(a ? a.label : 'Rumah')}" placeholder="Rumah, Kantor"></div>
          <div class="field"><label for="afName">Nama penerima</label><input class="input" id="afName" value="${esc(a ? a.name : me.name)}"></div>
        </div>
        <div class="form-row">
          <div class="field"><label for="afPhone">Nomor HP</label><input class="input" type="tel" id="afPhone" value="${esc(a ? a.phone : me.phone || '')}"></div>
          <div class="field"><label for="afPostal">Kode pos</label><input class="input" id="afPostal" maxlength="5" value="${esc(a ? a.postal : '')}"></div>
        </div>
        <div class="field"><label for="afAddr">Alamat lengkap</label><textarea class="input" id="afAddr" placeholder="Nama jalan, nomor rumah, RT/RW, patokan">${esc(a ? a.address : '')}</textarea></div>
        <div class="field"><label for="afCity">Kota / Kabupaten</label><input class="input" id="afCity" value="${esc(a ? a.city : '')}" placeholder="Sidoarjo"></div>
        <label class="row small" style="gap:8px;font-weight:600">
          <input type="checkbox" id="afDefault" ${!a || a.isDefault ? 'checked' : ''}> Jadikan alamat utama
        </label>
        <div class="row" style="gap:8px">
          <button class="btn btn-primary btn-sm" type="submit">Simpan</button>
          <button class="btn btn-sm" type="button" id="afCancel">Batal</button>
        </div>
      </div>
    </form>`;

  const errBox = document.createElement('div');
  errBox.className = 'alert alert-error hidden';
  errBox.style.marginTop = '12px';
  wrap.querySelector('#addrForm').after(errBox);

  $('#afCancel').addEventListener('click', () => { wrap.innerHTML = addressesHtml(); });

  /* Nama penerima dan telepon ikut diisi ulang dari profil supaya tidak diketik ulang */
  const nameInput = $('#afName');
  const phoneInput = $('#afPhone');
  if (!a) {
    if (!nameInput.value.trim()) nameInput.value = me.name;
    if (!phoneInput.value.trim() && me.phone) phoneInput.value = me.phone;
  }

  $('#addrForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      label: $('#afLabel').value,
      name: $('#afName').value.trim(),
      phone: $('#afPhone').value.trim(),
      address: $('#afAddr').value.trim(),
      city: $('#afCity').value.trim(),
      postal: $('#afPostal').value.trim(),
      isDefault: $('#afDefault').checked,
    };
    const err = validateCustomer(data);
    if (err) {
      errBox.textContent = err;
      errBox.classList.remove('hidden');
      return;
    }

    const res = Store.saveAddress(me.id, data, id);
    if (!res.ok) {
      errBox.textContent = res.error;
      errBox.classList.remove('hidden');
      return;
    }

    wrap.innerHTML = addressesHtml();
    toast('Alamat disimpan.', 'success');
  });
}

function deleteAddress(id) {
  const me = Store.currentUser();
  if (!me) return;
  askConfirm('Hapus alamat ini dari daftar?', () => {
    Store.deleteAddress(me.id, id);
    $('#addrWrap').innerHTML = addressesHtml();
    toast('Alamat dihapus.');
  });
}

function validateCustomer(d) {
  if (d.name.length < 3) return 'Nama penerima minimal 3 huruf.';
  if (!/^[0-9+\-\s]{9,15}$/.test(d.phone)) return 'Nomor HP belum benar.';
  if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return 'Format email belum benar.';
  if (d.address.length < 10) return 'Alamat terlalu pendek, tambahkan RT/RW atau patokan.';
  if (d.city.length < 3) return 'Tulis kota atau kabupaten tujuan.';
  if (!/^[0-9]{5}$/.test(d.postal)) return 'Kode pos harus 5 angka.';
  return null;
}

/* ------------------------------- Orders ------------------------------- */

function orderActionsHtml(o) {
  const btns = [`<button class="btn btn-sm" data-order="${o.id}">Lihat Detail</button>`];
  if (o.status === 'menunggu') {
    btns.push(`<button class="btn btn-sm btn-primary" data-pay="${o.id}">Bayar Sekarang</button>`);
    btns.push(`<button class="btn btn-sm btn-danger" data-cancel="${o.id}">Batalkan</button>`);
  }
  if (o.status === 'dikirim') {
    btns.push(`<button class="btn btn-sm btn-primary" data-accept="${o.id}">Pesanan Diterima</button>`);
  }
  return btns.join('');
}

function renderOrders() {
  const section = $('#ordersSection');
  const box = $('#ordersList');
  if (!section || !box) return;

  const me = Store.currentUser();
  if (!me) {
    section.hidden = false;
    box.innerHTML = `
      <div class="empty">
        <div class="e-icon">🔐</div>
        <h3>Masuk dulu untuk melihat pesanan</h3>
        <p>Riwayat pesanan hanya bisa dilihat oleh akun yang sedang masuk.</p>
        <div style="margin-top:14px"><button class="btn btn-primary" id="ordersLogin">Masuk</button></div>
      </div>`;
    $('#ordersLogin').addEventListener('click', () => openAuth('login'));
    return;
  }

  const orders = Store.myOrders();
  if (!orders.length) {
    box.innerHTML = `
      <div class="empty">
        <div class="e-icon">📦</div>
        <h3>Belum ada pesanan</h3>
        <p>Pesanan yang kamu buat akan muncul di sini beserta status pengirimannya.</p>
      </div>`;
    return;
  }

  box.innerHTML = orders
    .map((o) => {
      const st = ORDER_STATUS[o.status] || ORDER_STATUS.menunggu;
      const pay = PAYMENT_METHODS.find((m) => m.slug === o.payment);
      const ship = SHIPPING_METHODS.find((m) => m.slug === o.shipping);
      const totalItems = o.items.reduce((s, i) => s + i.qty, 0);
      return `
        <div class="order-card">
          <header>
            <div>
              <div class="oc-id">${o.id}</div>
              <div class="oc-date">${formatDateTime(o.createdAt)} · ${totalItems} barang · ${esc(pay ? pay.name : o.payment)}</div>
            </div>
            <span class="status" style="background:${st.bg};color:${st.color}">${st.label}</span>
          </header>
          <div class="order-items">
            ${o.items
              .map(
                (i) => `
              <div class="order-item">
                ${orderItemImage(i)
                  ? `<img class="order-thumb" src="${esc(orderItemImage(i))}" alt="${esc(i.name)}">`
                  : `<span class="oi-icon" role="img" aria-label="${esc(i.name)}">${esc(i.icon || '')}</span>`}
                <span class="grow">
                  <span class="oi-name">${esc(i.name)}</span><br>
                  ${i.variantLabel ? `<span class="oi-qty">${esc(i.variantLabel)} · </span>` : ''}
                  <span class="oi-qty">${i.qty} × ${rupiah(i.price)}</span>
                </span>
                <b>${rupiah(i.price * i.qty)}</b>
              </div>`
              )
              .join('')}
          </div>
          <div class="order-total">
            <span class="small muted">
              Pengiriman ${esc(ship ? ship.name : o.shipping)} · Ongkir ${o.shippingCost === 0 ? 'gratis' : rupiah(o.shippingCost)}
              ${o.resi ? ' · Resi ' + esc(o.resi) : ''}
            </span>
            <span><b style="font-size:16px">${rupiah(o.total)}</b></span>
          </div>
          <div style="padding:0 15px 14px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
            ${orderActionsHtml(o)}
          </div>
        </div>`;
    })
    .join('');
}

/* --------------------------- Order detail modal ----------------------- */

function timelineHtml(o) {
  if (o.status === 'batal') {
    const last = (o.statusHistory || []).slice(-1)[0];
    return `
      <div class="timeline">
        <div class="tl-item is-cancel">
          <div class="tl-rail"><span class="tl-dot"></span><span class="tl-line"></span></div>
          <div class="tl-body">
            <div class="tl-title">Pesanan dibatalkan</div>
            <div class="tl-note">${esc(o.cancelReason || 'Pesanan dibatalkan')}. Stok produk dikembalikan ke gudang.</div>
            <div class="tl-time">${formatDateTime((last && last.at) || o.createdAt)}</div>
          </div>
        </div>
      </div>`;
  }

  const flow = ORDER_FLOW;
  const currentIdx = flow.indexOf(o.status);
  const stamps = {};
  (o.statusHistory || []).forEach((h) => { stamps[h.status] = h; });

  return `
    <div class="timeline">
      ${flow
        .map((key, i) => {
          const meta = ORDER_STATUS[key];
          const hit = stamps[key];
          const done = currentIdx > i;
          const current = currentIdx === i;
          const note = hit
            ? hit.note
            : i === 0
              ? 'Pesanan dibuat, menunggu pembayaran'
              : 'Menunggu tahap sebelumnya';
          return `
          <div class="tl-item ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}">
            <div class="tl-rail"><span class="tl-dot"></span><span class="tl-line"></span></div>
            <div class="tl-body">
              <div class="tl-title">${meta.label}</div>
              <div class="tl-note">${esc(note)}</div>
              <div class="tl-time">${hit ? formatDateTime(hit.at) : 'Belum terjadi'}</div>
            </div>
          </div>`;
        })
        .join('')}
    </div>`;
}

function openOrderDetail(id) {
  const o = Store.orders().find((x) => x.id === id);
  if (!o) return;
  const st = ORDER_STATUS[o.status] || ORDER_STATUS.menunggu;
  const pay = PAYMENT_METHODS.find((m) => m.slug === o.payment);
  const ship = SHIPPING_METHODS.find((m) => m.slug === o.shipping);

  $('#odTitle').textContent = 'Pesanan ' + o.id;
  $('#orderBody').innerHTML = `
    <div class="row-between" style="margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <span class="status" style="background:${st.bg};color:${st.color}">${st.label}</span>
      <span class="small muted">${formatDateTime(o.createdAt)}</span>
    </div>

    ${
      o.resi
        ? `<div class="alert alert-info" style="margin-bottom:12px">
             <span>📦</span>
             <span class="track-resi">Nomor resi <b>${esc(o.resi)}</b> · Kurir ${esc(ship ? ship.name : o.shipping)}</span>
           </div>`
        : ''
    }

    <div class="review-box" style="margin-bottom:12px">
      <header><span>Riwayat Status</span></header>
      <div class="rb-body">${timelineHtml(o)}</div>
    </div>

    <div class="review-box" style="margin-bottom:12px">
      <header><span>Penerima</span></header>
      <div class="rb-body">
        <div><b>${esc(o.customer.name)}</b></div>
        <div class="small muted">${esc(o.customer.phone)} · ${esc(o.customer.email)}</div>
        <div class="small">${esc(o.customer.address)}, ${esc(o.customer.city)} ${esc(o.customer.postal)}</div>
        ${o.customer.note ? '<div class="small muted">Catatan: ' + esc(o.customer.note) + '</div>' : ''}
      </div>
    </div>

    <div class="review-box" style="margin-bottom:12px">
      <header><span>Barang</span><span>${o.items.reduce((s, i) => s + i.qty, 0)} barang</span></header>
      <div class="rb-body">
        ${o.items
          .map(
            (i) => `
          <div class="order-line">
            ${orderItemImage(i)
              ? `<img class="order-thumb" src="${esc(orderItemImage(i))}" alt="${esc(i.name)}">`
              : `<span class="oi-icon" role="img" aria-label="${esc(i.name)}">${esc(i.icon || '')}</span>`}
            <span class="order-line-info"><b>${esc(i.name)}</b>${i.variantLabel ? `<small>${esc(i.variantLabel)}</small>` : ''}<small>${i.qty} × ${rupiah(i.price)}${i.originalPrice > i.price ? ` · harga awal ${rupiah(i.originalPrice)}` : ''}</small></span>
            <b class="order-line-price">${rupiah(i.price * i.qty)}</b>
          </div>`
          )
          .join('')}
      </div>
    </div>

    <div class="review-box">
      <header><span>Rincian Bayar</span></header>
      <div class="rb-body">
        ${o.productDiscount ? `<div class="rb-row"><span>Subtotal awal</span><span>${rupiah(o.originalSubtotal)}</span></div><div class="rb-row"><span>Diskon produk</span><span style="color:#2e7d32">−${rupiah(o.productDiscount)}</span></div>` : ''}
        <div class="rb-row"><span>Subtotal</span><span>${rupiah(o.subtotal)}</span></div>
        ${
          o.discount
            ? `<div class="rb-row"><span>Diskon ${esc(o.voucher ? o.voucher.code : '')}</span><span style="color:#2e7d32">−${rupiah(o.discount)}</span></div>`
            : ''
        }
        <div class="rb-row"><span>Ongkos kirim (${esc(ship ? ship.name : o.shipping)})</span><span>${o.shippingCost === 0 ? 'Gratis' : rupiah(o.shippingCost)}</span></div>
        ${o.paymentFee ? `<div class="rb-row"><span>Biaya layanan</span><span>${rupiah(o.paymentFee)}</span></div>` : ''}
        <div class="rb-row"><span style="font-weight:800">Total</span><span style="font-weight:800">${rupiah(o.total)}</span></div>
        <div class="rb-row"><span>Metode bayar</span><span>${pay ? pay.icon + ' ' + esc(pay.name) : esc(o.payment)}</span></div>
      </div>
    </div>

    <div class="alert alert-info" style="margin-top:12px">
      <span>💡</span>
      <span>Prototype. Status di atas disimpan di browser, belum dikirim ke payment gateway atau kurir sungguhan.</span>
    </div>`;

  const foot = $('#orderModal').querySelector('.modal-foot');
  foot.innerHTML = `
    ${o.status === 'dikirim' ? `<button class="btn btn-primary" data-accept="${o.id}">Pesanan Diterima</button>` : ''}
    ${o.status === 'menunggu' ? `<button class="btn btn-danger" data-cancel="${o.id}">Batalkan</button>` : ''}
    <button class="btn" data-close>Tutup</button>`;

  openModal('orderModal');
}

/* ------------------------------ Checkout ------------------------------ */

function checkoutTotals() {
  const items = Store.cartDetailed();
  const subtotal = Store.cartSubtotal();
  const originalSubtotal = items.reduce((sum, item) => sum + item.originalLineTotal, 0);
  const productDiscount = originalSubtotal - subtotal;
  const weight = Store.cartWeight();

  let discount = 0;
  let freeShip = false;

  const code = state.voucherCode.trim();
  if (code) {
    const res = Store.evaluateVoucher(code, subtotal);
    if (res.ok) {
      const v = res.voucher;
      if (v.type === 'percent') {
        discount = Math.round((subtotal * v.value) / 100);
        if (v.maxDiscount) discount = Math.min(discount, v.maxDiscount);
      } else if (v.type === 'fixed') {
        discount = Math.min(v.value, subtotal);
      } else if (v.type === 'freeship') {
        freeShip = true;
      }
    } else {
      state.voucherCode = '';
    }
  }

  const afterDiscount = subtotal - discount;
  const shipping = shippingCostFor(weight, state.checkout.shipping, { base: afterDiscount, forceFree: freeShip });
  const fee = (PAYMENT_METHODS.find((m) => m.slug === state.checkout.payment) || {}).fee || 0;

  return {
    items,
    subtotal,
    originalSubtotal,
    productDiscount,
    weight,
    discount,
    freeShip,
    shipping,
    fee,
    total: afterDiscount + shipping + fee,
    missingFreeShip: missingForFreeShipping(afterDiscount),
  };
}

function openCheckout() {
  if (!Store.cartCount()) {
    toast('Keranjang masih kosong.', 'error');
    return;
  }
  const invalidVariant = Store.cartDetailed().find((item) => item.variantRequired);
  if (invalidVariant) {
    toast(
      invalidVariant.variantMissing
        ? `${invalidVariant.product.name} memiliki opsi yang sudah tidak tersedia. Hapus barang itu dan pilih ulang.`
        : `${invalidVariant.product.name} memiliki variasi. Hapus barang itu lalu pilih opsi sebelum checkout.`,
      'error'
    );
    return;
  }
  const me = Store.currentUser();
  if (!me) {
    state.pendingCheckout = true;
    openAuth('login');
    return;
  }

  closeCart();

  const saved = Store.defaultAddress(me.id);
  state.checkout.step = 1;
  state.checkout.addressId = saved ? saved.id : null;
  state.checkout.manual = !saved;
  state.checkout.data = saved
    ? { ...saved, email: me.email }
    : {
        label: 'Rumah',
        name: me.name,
        phone: me.phone || '',
        email: me.email,
        address: '',
        city: '',
        postal: '',
        note: '',
      };

  renderCheckout();
  openModal('checkoutModal');
}

function renderCheckout() {
  const step = state.checkout.step;
  const d = state.checkout.data;
  const body = $('#checkoutBody');
  const foot = $('#checkoutFoot');

  const stepsHtml = `
    <div class="steps">
      <span class="step ${step === 1 ? 'is-active' : step > 1 ? 'is-done' : ''}"><span class="s-num">1</span><span>Alamat</span></span>
      <span class="step-line"></span>
      <span class="step ${step === 2 ? 'is-active' : step > 2 ? 'is-done' : ''}"><span class="s-num">2</span><span>Kirim &amp; Bayar</span></span>
      <span class="step-line"></span>
      <span class="step ${step === 3 ? 'is-active' : ''}"><span class="s-num">3</span><span>Review</span></span>
    </div>`;

  if (step === 1) {
    const me = Store.currentUser();
    const saved = Store.addresses(me.id);

    const picker = saved.length
      ? `<div class="addr-picker">
          ${saved
            .map(
              (a) => `
            <button class="opt ${!state.checkout.manual && state.checkout.addressId === a.id ? 'is-active' : ''}" data-addr="${a.id}">
              <span class="o-icon">📍</span>
              <span class="o-text">
                <span class="o-name">${esc(a.label)}${a.isDefault ? ' · utama' : ''} — ${esc(a.name)}</span>
                <span class="o-desc">${esc(a.address)}, ${esc(a.city)} ${esc(a.postal)} · ${esc(a.phone)}</span>
              </span>
              <span class="o-radio"></span>
            </button>`
            )
            .join('')}
        </div>
        <button class="manual-toggle" id="useManual">${state.checkout.manual ? '‹ Pilih alamat tersimpan' : '+ Pakai alamat baru'}</button>`
      : '';

    const form = state.checkout.manual || !saved.length
      ? `<div class="form-grid" style="margin-top:14px">
          <div class="form-row">
            <div class="field"><label for="coName">Nama penerima</label><input class="input" id="coName" value="${esc(d.name)}"></div>
            <div class="field"><label for="coPhone">Nomor HP</label><input class="input" type="tel" id="coPhone" placeholder="08xxxxxxxxxx" value="${esc(d.phone)}"></div>
          </div>
          <div class="field"><label for="coEmail">Email</label><input class="input" id="coEmail" type="email" value="${esc(d.email)}"><span class="hint">Dipakai untuk kirim invoice dan nomor resi.</span></div>
          <div class="field"><label for="coAddr">Alamat lengkap</label><textarea class="input" id="coAddr" placeholder="Nama jalan, nomor rumah, RT/RW, patokan">${esc(d.address)}</textarea></div>
          <div class="form-row">
            <div class="field"><label for="coCity">Kota / Kabupaten</label><input class="input" id="coCity" placeholder="Sidoarjo" value="${esc(d.city)}"></div>
            <div class="field"><label for="coPostal">Kode pos</label><input class="input" id="coPostal" inputmode="numeric" maxlength="5" value="${esc(d.postal)}"></div>
          </div>
          <div class="field"><label for="coNote">Catatan untuk penjual <span class="muted">(opsional)</span></label><textarea class="input" id="coNote" placeholder="Contoh: titip ke satpam bila rumah kosong">${esc(d.note)}</textarea></div>
          <label class="row small" style="gap:8px;font-weight:600">
            <input type="checkbox" id="coSaveAddr" ${d.address ? 'checked' : ''}> Simpan alamat ini untuk pesanan berikutnya
          </label>
        </div>`
      : '';

    body.innerHTML = stepsHtml + `
      <div class="alert alert-info" style="margin-bottom:14px">
        <span>📍</span><span>Alamat ini dipakai untuk menghitung ongkos kirim dan jadi tujuan paket.</span>
      </div>
      ${picker}
      ${form}`;

    /* Wadah error per langkah supaya pesan validasi tidak hilang di dalam toast */
    const stepErr = document.createElement('div');
    stepErr.id = 'coStepError';
    stepErr.className = 'alert alert-error hidden';
    stepErr.style.marginTop = '14px';
    body.appendChild(stepErr);

    foot.innerHTML = `
      <button class="btn" data-close>Kembali</button>
      <button class="btn btn-primary" id="coNext1">Lanjut</button>`;

    $('#coNext1').addEventListener('click', () => {
      let data;

      if (state.checkout.manual || !saved.length) {
        data = {
          label: d.label || 'Rumah',
          name: $('#coName').value.trim(),
          phone: $('#coPhone').value.trim(),
          email: $('#coEmail').value.trim(),
          address: $('#coAddr').value.trim(),
          city: $('#coCity').value.trim(),
          postal: $('#coPostal').value.trim(),
          note: $('#coNote').value.trim(),
        };
        const err = validateCustomer(data);
        if (err) {
          stepErr.textContent = err;
          stepErr.classList.remove('hidden');
          return;
        }
        data.save = $('#coSaveAddr')?.checked;
      } else {
        const chosen = saved.find((a) => a.id === state.checkout.addressId);
        if (!chosen) return toast('Pilih salah satu alamat tersimpan.', 'error');
        data = { ...chosen, email: me.email, note: d.note || '' };
      }

      state.checkout.data = data;
      state.checkout.step = 2;
      renderCheckout();
    });

    const useManual = $('#useManual');
    if (useManual) {
      useManual.addEventListener('click', () => {
        state.checkout.manual = !state.checkout.manual;
        renderCheckout();
      });
    }

    return;
  }

  if (step === 2) {
    const t = checkoutTotals();
    const codOk = isCodEligible(d.city);

    body.innerHTML = stepsHtml + `
      <div class="field" style="margin-bottom:16px">
        <label>Metode pengiriman</label>
        <div class="opt-list">
          ${SHIPPING_METHODS.map((s) => {
            const cost = shippingCostFor(t.weight, s.slug, {
              base: t.subtotal - t.discount,
              forceFree: t.freeShip,
            });
            return `
            <button class="opt ${state.checkout.shipping === s.slug ? 'is-active' : ''}" data-ship="${s.slug}">
              <span class="o-icon">${s.icon}</span>
              <span class="o-text">
                <span class="o-name">${esc(s.name)}</span>
                <span class="o-desc">${esc(s.desc)}</span>
              </span>
              <span class="o-cost">${cost === 0 ? 'Gratis' : rupiah(cost)}</span>
              <span class="o-radio"></span>
            </button>`;
          }).join('')}
        </div>
      </div>

      <div class="field">
        <label>Metode pembayaran</label>
        <div class="opt-list">
          ${PAYMENT_METHODS.map((m) => {
            const blocked = m.slug === 'cod' && !codOk;
            return `
            <button class="opt ${state.checkout.payment === m.slug ? 'is-active' : ''}" data-pay-m="${m.slug}" ${blocked ? 'disabled' : ''} title="${blocked ? 'Bayar di tempat hanya untuk wilayah Sidoarjo dan Surabaya' : ''}">
              <span class="o-icon">${m.icon}</span>
              <span class="o-text">
                <span class="o-name">${esc(m.name)}</span>
                <span class="o-desc">${esc(m.desc)}${blocked ? ' · tidak tersedia di kotamu' : ''}${m.fee ? ' · biaya layanan ' + rupiah(m.fee) : ''}</span>
              </span>
              <span class="o-cost">${m.fee ? rupiah(m.fee) : 'Gratis'}</span>
              <span class="o-radio"></span>
            </button>`;
          }).join('')}
        </div>
      </div>

      ${
        state.checkout.payment === 'cod'
          ? `<div class="alert alert-info" style="margin-top:14px"><span>💵</span><span>Siapkan uang tunai Rp${t.total.toLocaleString('id-ID')} saat paket diterima.</span></div>`
          : ''
      }

      <div class="alert alert-warn" style="margin-top:14px">
        <span>⚠️</span>
        <span>Prototype. Tidak ada pembayaran sungguhan yang terjadi. Melanjutkan berarti membuat pesanan simulasi.</span>
      </div>`;

    foot.innerHTML = `
      <button class="btn" id="coBack2">Kembali</button>
      <button class="btn btn-primary" id="coNext2">Review Pesanan</button>`;

    $('#coBack2').addEventListener('click', () => { state.checkout.step = 1; renderCheckout(); });
    $('#coNext2').addEventListener('click', () => {
      if (state.checkout.payment === 'cod' && !codOk) {
        state.checkout.payment = 'qris';
        toast('Bayar di tempat tidak tersedia untuk kotamu. Pilih metode lain.', 'error');
      }
      state.checkout.step = 3;
      renderCheckout();
    });
    return;
  }

  const t = checkoutTotals();
  const pay = PAYMENT_METHODS.find((m) => m.slug === state.checkout.payment);
  const ship = SHIPPING_METHODS.find((m) => m.slug === state.checkout.shipping);

  body.innerHTML = stepsHtml + `
    <div class="review-box" style="margin-bottom:12px">
      <header><span>Dikirim ke</span><button class="btn btn-sm btn-ghost" id="editAddr" style="height:26px;padding:0 8px">Ubah</button></header>
      <div class="rb-body">
        <div><b>${esc(d.name)}</b> · ${esc(d.phone)}</div>
        <div class="small">${esc(d.address)}, ${esc(d.city)} ${esc(d.postal)}</div>
        ${d.note ? '<div class="small muted">Catatan: ' + esc(d.note) + '</div>' : ''}
      </div>
    </div>

    <div class="review-box" style="margin-bottom:12px">
      <header><span>${t.items.length} produk</span><span>${Store.cartCount()} barang</span></header>
      <div class="rb-body">
        ${t.items
          .map(
            (i) => `
          <div class="order-line">
            ${orderItemImage({ productId: i.product.id })
              ? `<img class="order-thumb" src="${esc(orderItemImage({ productId: i.product.id }))}" alt="${esc(i.product.name)}">`
              : `<span class="oi-icon" role="img" aria-label="${esc(i.product.name)}">${esc(i.product.icon || '')}</span>`}
            <span class="order-line-info"><b>${esc(i.product.name)}</b>${i.variantLabel ? `<small>${esc(i.variantLabel)}</small>` : ''}<small>${i.qty} × ${rupiah(i.unitPrice)}</small>${i.product.discountPercent ? `<small><del>${rupiah(i.originalLineTotal)}</del></small>` : ''}</span>
            <b class="order-line-price">${rupiah(i.lineTotal)}</b>
          </div>`
          )
          .join('')}
      </div>
    </div>

    <div class="review-box" style="margin-bottom:12px">
      <header><span>Pengiriman &amp; pembayaran</span></header>
      <div class="rb-body">
        <div class="rb-row"><span>Pengiriman</span><span>${ship.icon} ${esc(ship.name)} · ${esc(ship.desc)}</span></div>
        <div class="rb-row"><span>Pembayaran</span><span>${pay.icon} ${esc(pay.name)}</span></div>
        <div class="rb-row"><span>Berat total</span><span>${t.weight.toFixed(2)} kg</span></div>
        ${state.voucherCode ? `<div class="rb-row"><span>Voucher</span><span>${esc(state.voucherCode.toUpperCase())}</span></div>` : ''}
      </div>
    </div>

    <div class="review-box">
      <header><span>Total yang dibayar</span></header>
      <div class="rb-body">
        ${t.productDiscount ? `<div class="rb-row"><span>Subtotal awal</span><span>${rupiah(t.originalSubtotal)}</span></div><div class="rb-row"><span>Diskon produk</span><span style="color:#2e7d32">−${rupiah(t.productDiscount)}</span></div>` : ''}
        <div class="rb-row"><span>Subtotal</span><span>${rupiah(t.subtotal)}</span></div>
        ${t.discount ? `<div class="rb-row"><span>Diskon</span><span style="color:#2e7d32">−${rupiah(t.discount)}</span></div>` : ''}
        <div class="rb-row"><span>Ongkos kirim</span><span>${t.shipping === 0 ? 'Gratis' : rupiah(t.shipping)}</span></div>
        ${t.fee ? `<div class="rb-row"><span>Biaya layanan</span><span>${rupiah(t.fee)}</span></div>` : ''}
        <div class="rb-row"><span style="font-weight:800">Total</span><span style="font-weight:800;font-size:17px">${rupiah(t.total)}</span></div>
      </div>
    </div>`;

  foot.innerHTML = `
    <button class="btn" id="coBack3">Kembali</button>
    <button class="btn btn-primary" id="coPlace">Buat Pesanan</button>`;

  $('#editAddr').addEventListener('click', () => { state.checkout.step = 1; renderCheckout(); });
  $('#coBack3').addEventListener('click', () => { state.checkout.step = 2; renderCheckout(); });
  $('#coPlace').addEventListener('click', placeOrder);
}

function placeOrder() {
  const me = Store.currentUser();
  if (!me) return toast('Sesi berakhir, silakan masuk lagi.', 'error');

  const d = state.checkout.data;
  const res = Store.createOrder({
    userId: me.id,
    customer: {
      name: d.name,
      phone: d.phone,
      email: d.email || me.email,
      address: d.address,
      city: d.city,
      postal: d.postal,
      note: d.note || '',
    },
    shipping: state.checkout.shipping,
    payment: state.checkout.payment,
    voucherCode: state.voucherCode.trim(),
  });

  if (!res.ok) return toast(res.error, 'error');

  const order = res.order;

  if (d.save && !d.id) {
    Store.saveAddress(me.id, { ...d, isDefault: Store.addresses(me.id).length === 0 });
  }

  state.voucherCode = '';
  renderHeader();
  renderProducts();
  renderCart();
  renderOrders();
  renderVoucherStrip();
  renderFreeShipping();

  const pay = PAYMENT_METHODS.find((m) => m.slug === order.payment);

  $('#checkoutBody').innerHTML = `
    <div class="success-wrap">
      <div class="success-icon">✅</div>
      <h3>Pesanan berhasil dibuat</h3>
      <p class="muted" style="margin-top:6px">Simpan nomor pesanan ini untuk mengecek status pengiriman.</p>
      <div class="order-code">${order.id}</div>
      <div class="review-box" style="margin-top:18px;text-align:left">
        <header><span>Produk dipesan</span><span>${order.items.reduce((sum, item) => sum + item.qty, 0)} barang</span></header>
        <div class="rb-body">
          ${order.items.map((item) => `
            <div class="order-line">
              ${orderItemImage(item)
                ? `<img class="order-thumb" src="${esc(orderItemImage(item))}" alt="${esc(item.name)}">`
                : `<span class="oi-icon" role="img" aria-label="${esc(item.name)}">${esc(item.icon || '')}</span>`}
              <span class="order-line-info"><b>${esc(item.name)}</b>${item.variantLabel ? `<small>${esc(item.variantLabel)}</small>` : ''}<small>${item.qty} × ${rupiah(item.price)}</small></span>
              <b class="order-line-price">${rupiah(item.price * item.qty)}</b>
            </div>`).join('')}
        </div>
      </div>
      <div class="review-box" style="margin-top:12px;text-align:left">
        <header><span>Ringkasan</span></header>
        <div class="rb-body">
          <div class="rb-row"><span>Total</span><span><b>${rupiah(order.total)}</b></span></div>
          <div class="rb-row"><span>Metode bayar</span><span>${pay ? pay.icon + ' ' + esc(pay.name) : esc(order.payment)}</span></div>
          <div class="rb-row"><span>Status awal</span><span>${(ORDER_STATUS[order.status] || {}).label}</span></div>
          ${order.discount ? `<div class="rb-row"><span>Voucher</span><span>${esc(order.voucher.code)} (−${rupiah(order.discount)})</span></div>` : ''}
        </div>
      </div>
      ${
        order.status === 'menunggu'
          ? `<div class="alert alert-warn" style="margin-top:14px;text-align:left">
               <span>⏳</span>
               <span>Pesanan menunggu pembayaran. Tekan <b>Bayar Sekarang</b> di daftar pesanan untuk melanjutkan.</span>
             </div>`
          : ''
      }
      <div class="alert alert-info" style="margin-top:14px;text-align:left">
        <span>💡</span>
        <span>Ini pesanan simulasi. Cek Panel Admin untuk melihat pesanan ini masuk ke daftar admin.</span>
      </div>
    </div>`;

  $('#checkoutFoot').innerHTML = `
    <button class="btn" data-close>Tutup</button>
    <button class="btn btn-primary" id="successOrders">Lihat Pesanan Saya</button>`;

  $('#successOrders').addEventListener('click', () => {
    closeModals();
    navigate('orders');
  });

  toast('Pesanan ' + order.id + ' dibuat', 'success');
}

/* ---------------------------- Lacak paket ----------------------------- */

function findOrderByQuery(q) {
  const key = q.trim();
  if (!key) return null;
  const byId = Store.findOrder(key);
  if (byId) return byId;
  const byResi = Store.orders().find((o) => o.resi && o.resi.toUpperCase() === key.toUpperCase());
  return byResi || null;
}

function renderTrack(query) {
  const box = $('#trackResult');
  const errBox = $('#trackError');
  const o = query ? findOrderByQuery(query) : null;

  if (!query) {
    errBox.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  if (!o) {
    errBox.textContent = 'Pesanan dengan nomor "' + query + '" tidak ditemukan. Periksa lagi nomor pesanan atau resinya.';
    errBox.classList.remove('hidden');
    box.innerHTML = '';
    return;
  }

  errBox.classList.add('hidden');
  const st = ORDER_STATUS[o.status] || ORDER_STATUS.menunggu;
  const ship = SHIPPING_METHODS.find((m) => m.slug === o.shipping);
  const items = o.items.reduce((s, i) => s + i.qty, 0);

  box.innerHTML = `
    <div class="track-head">
      <div>
        <div class="th-id">${o.id}</div>
        <div class="small muted">Dibuat ${formatDateTime(o.createdAt)} · ${items} barang · ${rupiah(o.total)}</div>
      </div>
      <span class="status" style="background:${st.bg};color:${st.color}">${st.label}</span>
    </div>
    ${
      o.resi
        ? `<div class="alert alert-info" style="margin-top:12px">
             <span>📦</span>
             <span class="track-resi">Nomor resi <b>${esc(o.resi)}</b> · Kurir ${esc(ship ? ship.name : o.shipping)} · ${esc(ship ? ship.desc : '')}</span>
           </div>`
        : '<div class="alert alert-warn" style="margin-top:12px"><span>📦</span><span>Nomor resi belum terbit. Pesanan masih diproses di toko.</span></div>'
    }
    <div class="review-box" style="margin-top:12px">
      <header><span>Tujuan Paket</span></header>
      <div class="rb-body">
        <div><b>${esc(o.customer.name)}</b> · ${esc(o.customer.phone)}</div>
        <div class="small">${esc(o.customer.address)}, ${esc(o.customer.city)} ${esc(o.customer.postal)}</div>
      </div>
    </div>
    <div class="review-box" style="margin-top:12px">
      <header><span>Riwayat Status</span></header>
      <div class="rb-body">${timelineHtml(o)}</div>
    </div>`;
}

/* ------------------------------ Navigation ---------------------------- */

const HIDEABLE = ['.hero', '#kategori', '#promo', '#katalog', '#about'];

function navigate(view) {
  closeCart();
  closeModals();

  if (view === 'favorit') {
    state.favOnly = true;
    state.category = 'semua';
    renderCategories();
    renderFilterState();
    renderProducts();
    navigate('katalog');
    return;
  }

  if (view === 'katalog' && !state.favOnly) renderFilterState();
  if (view !== 'favorit') state.view = view;

  const single = view === 'orders' || view === 'lacak';
  HIDEABLE.forEach((sel) => { const el = $(sel); if (el) el.hidden = single; });
  $('#ordersSection').hidden = view !== 'orders';
  $('#lacakSection').hidden = view !== 'lacak';

  /* Section unggulan hanya boleh tampil kalau memang ada produk unggulan */
  const feat = $('#unggulanSection');
  if (feat) feat.hidden = single || Store.featuredProducts().filter(hasProductPhoto).length === 0;

  renderNav();
  renderOrders();

  if (view === 'orders' || view === 'lacak') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (view === 'about') {
    $('#about').scrollIntoView({ behavior: 'smooth' });
  } else if (view === 'katalog') {
    $('#katalog').scrollIntoView({ behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ------------------------------ Confirm ------------------------------- */

function askConfirm(text, action, withReason) {
  state.confirmAction = action;
  $('#confirmText').textContent = text;
  $('#confirmReasonWrap').classList.toggle('hidden', !withReason);
  $('#confirmReason').value = '';
  openModal('confirmModal');
}

function cancelOwnOrder(id) {
  askConfirm(
    'Batalkan pesanan ' + id + '? Stok barang akan dikembalikan ke gudang.',
    () => {
      const reason = $('#confirmReason')?.value.trim() || 'Dibatalkan pembeli';
      Store.cancelOrder(id, reason);
      closeModals();
      renderAfterCartChange();
      renderOrders();
      if ($('#orderModal').classList.contains('is-open')) closeModals();
      toast('Pesanan ' + id + ' dibatalkan.', 'success');
    },
    true
  );
}

function acceptOwnOrder(id) {
  const o = Store.findOrder(id);
  if (!o) return;
  if (o.status !== 'dikirim') {
    toast('Pesanan bisa dikonfirmasi diterima setelah statusnya Dikirim.', 'error');
    return;
  }
  const stars = '★'.repeat(Math.max(1, Math.min(5, Math.ceil(o.items.length / 2) + 2)));
  askConfirm(
    'Konfirmasi paket ' + id + ' sudah diterima? Setelah itu kamu bisa menulis ulasan.',
    () => {
      const result = Store.acceptOrder(id);
      if (!result.ok) return toast(result.error, 'error');
      closeModals();
      renderOrders();
      renderProducts();
      renderFeatured();
      renderTrack($('#trackInput').value);
      toast('Terima kasih, pesanan ditandai selesai ' + stars, 'success');
    }
  );
}

/* -------------------------------- Events ------------------------------ */

function bindEvents() {
  overlay.addEventListener('click', () => { closeModals(); closeCart(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (closePhotoZoom()) return;
      closeModals();
      closeCart();
    }
    if ($('#photoLightbox').classList.contains('is-open')) {
      if (e.key === 'ArrowRight') updatePhotoZoom(1);
      if (e.key === 'ArrowLeft') updatePhotoZoom(-1);
    }
  });

  $('#confirmOk').addEventListener('click', () => {
    const action = state.confirmAction;
    state.confirmAction = null;
    if (action) action();
    else closeModals();
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'reviewForm') submitReview(e);
  });

  document.addEventListener('click', (e) => {
    const wa = e.target.closest('[data-wa]');
    if (wa) {
      e.preventDefault();
      window.open(waLink(wa.dataset.wa), '_blank', 'noopener');
      return;
    }

    const nav = e.target.closest('[data-nav]');
    if (nav) {
      e.preventDefault();
      navigate(nav.dataset.nav);
      return;
    }

    if (e.target.closest('[data-close]')) { closeModals(); return; }

    if (e.target.closest('[data-image-zoom]')) { openPhotoZoom(); return; }

    const zoomClose = e.target.closest('[data-lightbox-close]');
    if (zoomClose || e.target.id === 'photoLightbox') { closePhotoZoom(); return; }

    const zoomNav = e.target.closest('[data-lightbox-step]');
    if (zoomNav) {
      updatePhotoZoom(Number(zoomNav.dataset.lightboxStep));
      return;
    }

    if (e.target.closest('[data-goto-login]')) { openAuth('login'); return; }

    const ship = e.target.closest('[data-ship]');
    if (ship) { state.checkout.shipping = ship.dataset.ship; renderCheckout(); return; }

    const payM = e.target.closest('[data-pay-m]');
    if (payM) { state.checkout.payment = payM.dataset.payM; renderCheckout(); return; }

    const addrPick = e.target.closest('[data-addr]');
    if (addrPick) {
      state.checkout.addressId = addrPick.dataset.addr;
      state.checkout.manual = false;
      renderCheckout();
      return;
    }

    const cat = e.target.closest('[data-cat]');
    if (cat) {
      state.category = cat.dataset.cat;
      renderCategories();
      renderProducts();
      $('#katalog').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const tag = e.target.closest('[data-tag]');
    if (tag) {
      const name = tag.dataset.tag;
      const i = state.tags.indexOf(name);
      if (i > -1) state.tags.splice(i, 1);
      else state.tags.push(name);
      renderTagRow();
      renderFilterState();
      renderProducts();
      return;
    }

    const voucher = e.target.closest('[data-voucher]');
    if (voucher) {
      state.voucherCode = voucher.dataset.voucher;
      renderCart();
      renderVoucherStrip();
      renderPromoBanner();
      toast('Voucher ' + voucher.dataset.voucher + ' siap dipakai di keranjang.', 'success');
      return;
    }

    const voucherRemove = e.target.closest('[data-voucher-remove]');
    if (voucherRemove) {
      state.voucherCode = '';
      renderCart();
      renderVoucherStrip();
      renderPromoBanner();
      return;
    }

    const filterToggle = e.target.closest('#favFilter');
    if (filterToggle) {
      state.favOnly = !state.favOnly;
      renderFilterState();
      renderProducts();
      if (state.favOnly) $('#katalog').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const resetFilters = e.target.closest('#resetFilterBtn');
    if (resetFilters) {
      clearAdvancedFilters();
      toast('Filter dibersihkan.');
      return;
    }

    const add = e.target.closest('[data-add]');
    if (add) {
      const product = Store.findProduct(add.dataset.add);
      if (product?.variants?.length) openProduct(product.id);
      else addToCart(add.dataset.add);
      return;
    }

    /* Tombol favorit berada di dalam area yang bisa dibuka, jadi dicek lebih dulu */
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      toggleFavorite(fav.dataset.fav);
      return;
    }

    const quick = e.target.closest('[data-quick]');
    if (quick) { openProduct(quick.dataset.quick); return; }

    const pvQty = e.target.closest('[data-pv-qty]');
    if (pvQty) { bumpPvQty(Number(pvQty.dataset.pvQty)); return; }

    const pvImg = e.target.closest('[data-pv-img]');
    if (pvImg) {
      pvState.img = Number(pvImg.dataset.pvImg);
      $$('.pv-thumb', $('#productModalBody')).forEach((b) =>
        b.classList.toggle('is-active', b === pvImg)
      );
      const main = $('#pvImg');
      if (main) main.src = pvImg.querySelector('img').src;
      return;
    }

    const pvAdd = e.target.closest('[data-pv-add]');
    if (pvAdd) {
      const product = Store.findProduct(pvAdd.dataset.pvAdd);
      if (product?.variants?.length && !pvState.variantId) {
        return toast(`Pilih ${product.variantName || 'variasi'} terlebih dahulu.`, 'error');
      }
      if (addToCart(pvAdd.dataset.pvAdd, pvState.qty, pvState.variantId)) closeModals();
      return;
    }

    const pvFav = e.target.closest('[data-pv-fav]');
    if (pvFav) { toggleFavorite(pvFav.dataset.pvFav); return; }

    const star = e.target.closest('[data-star]');
    if (star) {
      pvState.reviewRating = Number(star.dataset.star);
      $$('#starInput button').forEach((b) =>
        b.classList.toggle('is-on', Number(b.dataset.star) <= pvState.reviewRating)
      );
      return;
    }

    const cartOpen = e.target.closest('#cartBtn');
    if (cartOpen) { openCart(); return; }

    const dec = e.target.closest('[data-cart-dec]');
    if (dec) {
      const variantId = dec.dataset.cartVariant || null;
      const item = Store.cart().find((c) => c.productId === dec.dataset.cartDec && (c.variantId || null) === variantId);
      Store.setQty(dec.dataset.cartDec, (item ? item.qty : 1) - 1, variantId);
      renderAfterCartChange();
      return;
    }

    const inc = e.target.closest('[data-cart-inc]');
    if (inc) {
      const variantId = inc.dataset.cartVariant || null;
      const detail = Store.cartDetailed().find((c) => c.productId === inc.dataset.cartInc && (c.variantId || null) === variantId);
      if (detail && detail.qty >= detail.availableStock) return toast('Stok tidak mencukupi.', 'error');
      Store.setQty(inc.dataset.cartInc, (detail ? detail.qty : 0) + 1, variantId);
      renderAfterCartChange();
      return;
    }

    const rm = e.target.closest('[data-cart-rm]');
    if (rm) {
      Store.setQty(rm.dataset.cartRm, 0, rm.dataset.cartVariant || null);
      renderAfterCartChange();
      toast('Barang dihapus dari keranjang');
      return;
    }

    const clearBtn = e.target.closest('#clearCartBtn');
    if (clearBtn) {
      Store.clearCart();
      state.voucherCode = '';
      renderAfterCartChange();
      renderVoucherStrip();
      toast('Keranjang dikosongkan');
      return;
    }

    const applyVoucherBtn = e.target.closest('#voucherApply');
    if (applyVoucherBtn) { applyVoucher(); return; }

    if (e.target.closest('#goCheckout')) { openCheckout(); return; }
    if (e.target.closest('#loginBtn')) { openAuth('login'); return; }
    if (e.target.closest('#avatarBtn')) { openAccount(); return; }
    if (e.target.closest('#logoutBtn')) {
      Store.logout();
      closeModals();
      renderHeader();
      renderOrders();
      renderCart();
      toast('Kamu sudah keluar');
      return;
    }

    const addrDefault = e.target.closest('[data-addr-default]');
    if (addrDefault) {
      Store.setDefaultAddress(Store.currentUser().id, addrDefault.dataset.addrDefault);
      $('#addrWrap').innerHTML = addressesHtml();
      toast('Alamat utama diperbarui.');
      return;
    }

    const addrEdit = e.target.closest('[data-addr-edit]');
    if (addrEdit) { openAddressForm(addrEdit.dataset.addrEdit); return; }

    const addrDel = e.target.closest('[data-addr-del]');
    if (addrDel) { deleteAddress(addrDel.dataset.addrDel); return; }

    const order = e.target.closest('[data-order]');
    if (order) { openOrderDetail(order.dataset.order); return; }

    const pay = e.target.closest('[data-pay]');
    if (pay) {
      const res = Store.setOrderStatus(pay.dataset.pay, 'diproses');
      if (!res.ok) return toast(res.error, 'error');
      renderOrders();
      openOrderDetail(pay.dataset.pay);
      toast('Status pembayaran dikonfirmasi (simulasi)', 'success');
      return;
    }

    const accept = e.target.closest('[data-accept]');
    if (accept) { acceptOwnOrder(accept.dataset.accept); return; }

    const cancel = e.target.closest('[data-cancel]');
    if (cancel) { cancelOwnOrder(cancel.dataset.cancel); return; }

    if (e.target.closest('#closeCart')) { closeCart(); return; }
    if (e.target.closest('#burgerBtn')) { openModal('navModal'); return; }
  });

  let searchTimer;
  const onSearch = (value) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = value;
      renderProducts();
    }, 180);
  };

  $('#catalogSearch').addEventListener('input', (e) => {
    $('#headerSearch').value = e.target.value;
    onSearch(e.target.value);
  });

  $('#headerSearch').addEventListener('input', (e) => {
    $('#catalogSearch').value = e.target.value;
    onSearch(e.target.value);
  });

  $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; renderProducts(); });

  $('#stockFilter').addEventListener('change', (e) => { state.stock = e.target.value; renderProducts(); });
  $('#discountFilter').addEventListener('change', (e) => {
    state.promoOnly = e.target.checked;
    renderFilterState();
    renderProducts();
  });

  const readPrice = () => {
    const min = parseInt($('#priceMin').value, 10);
    const max = parseInt($('#priceMax').value, 10);
    state.priceMin = Number.isFinite(min) && min >= 0 ? min : null;
    state.priceMax = Number.isFinite(max) && max >= 0 ? max : null;
    if (state.priceMin != null && state.priceMax != null && state.priceMin > state.priceMax) {
      [state.priceMin, state.priceMax] = [state.priceMax, state.priceMin];
    }
    renderFilterState();
    renderProducts();
  };
  $('#priceMin').addEventListener('input', readPrice);
  $('#priceMax').addEventListener('input', readPrice);

  $$('[data-authtab]').forEach((btn) =>
    btn.addEventListener('click', () => { authMode = btn.dataset.authtab; renderAuthForm(); })
  );

  $('#authForm').addEventListener('submit', handleAuthSubmit);

  $('#trackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    renderTrack($('#trackInput').value);
  });

  document.addEventListener('keydown', (e) => {
    /* e.target bisa dokumen/simpul teks, jadiclosest harus dijaga */
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    /* Enter atau spasi pada kartu produk membuka detail, tapi bukan dari tombol di dalamnya */
    if (el.closest('button, a, input, select, textarea')) return;
    const quick = el.closest('.pc-media');
    if (quick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openProduct(quick.dataset.quick);
    }
  });
}

/* --------------------------------- Init -------------------------------- */

function buildOrdersSection() {
  if ($('#ordersSection')) return;
  const section = document.createElement('section');
  section.className = 'section';
  section.id = 'ordersSection';
  section.hidden = true;
  section.innerHTML = `
    <div class="container">
      <div class="section-head">
        <h2>Pesanan Saya</h2>
        <p>Riwayat pesanan beserta status pengiriman.</p>
      </div>
      <div id="ordersList" style="display:grid;gap:14px"></div>
    </div>`;
  $('.site-footer').before(section);
}

function renderAll() {
  renderHeader();
  renderCategories();
  renderHeroRecommendations();
  renderFeatured();
  renderPromoBanner();
  renderTagRow();
  renderFilterState();
  renderProducts();
  renderCart();
  renderOrders();
  renderVoucherStrip();
  renderFreeShipping();
  renderTrack($('#trackInput').value);
}

function init() {
  Store.load();
  loadFavorites();
  state.view = 'home';
  buildOrdersSection();
  $('#lacakSection').hidden = true;
  bindEvents();
  renderAll();

  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY) {
      Store.load();
      renderAll();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);