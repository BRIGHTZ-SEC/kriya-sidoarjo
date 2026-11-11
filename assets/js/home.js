/* ============================================================================
   Toko Kriya Sidoarjo — home.js
   Logika beranda: statistik hero, kategori, produk unggulan & terlaris,
   banner voucher, dan testimoni pembeli.
   ========================================================================== */

import { initLayout } from './layout.js';
import { icon } from './icons.js';
import {
  qs, esc, num, rupiah, stars, productCard, bindProductCards, initials,
  skelCards, emptyState, errorBox, toast, copyText,
} from './ui.js';
import {
  getCategories, listProducts, getActiveVouchers, getTestimonials, UNCONFIGURED,
} from './api.js';
import { addToCart } from './cart.js';

initLayout({ active: 'beranda' });

const DOWN_HINT = emptyState({
  icon: 'alert-triangle',
  title: 'Belum terhubung ke database',
  text: UNCONFIGURED
    ? 'Isi assets/js/config.js dengan URL & anon key Supabase dulu (langkahnya di README.md).'
    : 'Cek koneksi internet lalu muat ulang halaman.',
  action: '<button class="btn btn-soft btn-sm" onclick="location.reload()">Muat ulang</button>',
});

/* ------------------------------ Statistik hero ------------------------------ */

async function renderStats() {
  try {
    const { items, count } = await listProducts({ perPage: 200 });
    const reviews = items.reduce((s, p) => s + Number(p.reviews_count || 0), 0);
    const weighted = items.reduce((s, p) => s + Number(p.rating || 0) * Number(p.reviews_count || 0), 0);
    const avg = reviews > 0 ? weighted / reviews : 0;

    const set = (sel, val) => { const el = qs(sel); if (el) el.textContent = val; };
    set('[data-stat-produk]', num(count));
    set('[data-stat-ulasan]', num(reviews));
    set('[data-stat-rating]', avg ? avg.toFixed(1) + ' ★' : '–');
  } catch { /* biarkan tanda strip */ }
}

/* ------------------------------ Kategori ------------------------------ */

async function renderCategories() {
  const box = qs('#home-cats');
  box.innerHTML = `<div class="card cat-card" style="min-height:160px"><div class="skeleton" style="width:64px;height:64px;border-radius:20px"></div><div class="skeleton" style="height:14px;width:60%"></div><div class="skeleton" style="height:11px;width:40%"></div></div>`.repeat(4);
  try {
    const [cats, { items }] = await Promise.all([getCategories(), listProducts({ perPage: 200 })]);
    if (!cats.length) {
      box.innerHTML = emptyState({ icon: 'grid', title: 'Kategori belum ada', text: 'Tambahkan lewat panel admin.' });
      return;
    }
    box.innerHTML = cats.map((c) => {
      const count = items.filter((p) => p.category_id === c.id).length;
      return `
      <a class="cat-card hover-lift" href="katalog.html?kategori=${encodeURIComponent(c.slug)}" style="--cat-c:${esc(c.color)}">
        <span class="cat-icon">${icon(c.icon || 'package')}</span>
        <span class="cat-name">${esc(c.name)}</span>
        <span class="cat-count">${num(count)} produk</span>
      </a>`;
    }).join('');
  } catch {
    box.innerHTML = DOWN_HINT;
  }
}

/* ------------------------------ Produk unggulan & terlaris ------------------------------ */

async function renderProductGrid(sel, opts, emptyText) {
  const box = qs(sel);
  box.innerHTML = skelCards(opts.perPage || 8);
  try {
    const { items } = await listProducts(opts);
    if (!items.length) {
      box.innerHTML = emptyState({ icon: 'package', title: emptyText, text: 'Coba filter lain atau lihat semua produk.' });
      return;
    }
    box.innerHTML = items.map((p) => productCard(p)).join('');
    bindProductCards(box, items, addToCart);
  } catch {
    box.innerHTML = DOWN_HINT;
  }
}

/* ------------------------------ Banner voucher ------------------------------ */

async function renderPromo() {
  const box = qs('#home-promo');
  try {
    const vouchers = await getActiveVouchers();
    if (!vouchers.length) { box.innerHTML = ''; return; }
    const v = vouchers.find((x) => x.type === 'percent') || vouchers.find((x) => x.type === 'freeship') || vouchers[0];
    const headline = v.type === 'percent'
      ? `Hemat ${Number(v.value)}% buat belanja kriya`
      : v.type === 'freeship'
        ? 'Gratis ongkir kirim se-Indonesia'
        : `Potongan ${rupiah(v.value)} langsung`;

    box.innerHTML = `
    <div class="banner-promo anim-in">
      <div>
        <h3>${esc(headline)}</h3>
        <p>${esc(v.description || 'Pakai kode di bawah saat checkout.')}</p>
        <button class="voucher-chip" data-copy-voucher="${esc(v.code)}">
          ${icon('ticket')} ${esc(v.code)} — klik untuk salin
        </button>
      </div>
      <a class="btn btn-primary btn-lg" href="katalog.html" style="background:#fff;color:var(--clay-strong);border-color:#fff">
        Belanja Sekarang ${icon('arrow-right')}
      </a>
    </div>`;

    box.querySelector('[data-copy-voucher]').addEventListener('click', () => {
      copyText(v.code);
    });
  } catch {
    box.innerHTML = '';
  }
}

/* ------------------------------ Testimoni ------------------------------ */

async function renderTestimonials() {
  const box = qs('#home-testi');
  box.innerHTML = skelCards(4).replace(/p-card/g, 'card card-pad');
  try {
    const list = await getTestimonials(6);
    if (!list.length) {
      box.innerHTML = emptyState({ icon: 'message', title: 'Belum ada ulasan', text: 'Jadilah yang pertama menulis ulasan setelah belanja.' });
      return;
    }
    box.innerHTML = list.slice(0, 6).map((r) => `
      <article class="testi-card">
        ${stars(r.rating)}
        <q>${esc(r.text)}</q>
        <div class="testi-who">
          <span class="avatar">${esc(initials(r.author))}</span>
          <div><b>${esc(r.author)}</b><span>${r.products?.name ? 'membeli ' + esc(r.products.name) : 'pembeli terverifikasi'}</span></div>
        </div>
      </article>`).join('');
  } catch {
    box.innerHTML = DOWN_HINT;
  }
}

/* ------------------------------ Jalan ------------------------------ */

renderStats();
renderCategories();
renderProductGrid('#home-featured', { featured: true, perPage: 8, sort: 'baru' }, 'Belum ada produk unggulan');
renderProductGrid('#home-best', { sort: 'laris', perPage: 8 }, 'Belum ada produk terjual');
renderPromo();
renderTestimonials();

/* Error global yang tidak tertangkap — tampil sebagai toast */
window.addEventListener('unhandledrejection', (e) => {
  console.warn(e.reason);
});
