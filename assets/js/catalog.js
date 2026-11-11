/* ============================================================================
   Toko Kriya Sidoarjo — catalog.js
   Halaman katalog: filter kategori + harga + pencarian, urutan, dan
   pagination. State tersimpan di URL supaya bisa dibagikan.
   ========================================================================== */

import { initLayout } from './layout.js';
import { icon } from './icons.js';
import {
  qs, qsa, esc, num, urlParams, emptyState, skelCards, productCard,
  bindProductCards, toast, errMsg,
} from './ui.js';
import { getCategories, listProducts, SORT_OPTIONS, UNCONFIGURED } from './api.js';
import { addToCart } from './cart.js';

initLayout({ active: 'katalog' });

const PER_PAGE = 12;

/* State dari URL */
const state = {
  kategori: urlParams().get('kategori') || '',
  q: urlParams().get('q') || '',
  sort: urlParams().get('sort') || 'baru',
  min: Number(urlParams().get('min')) || null,
  max: Number(urlParams().get('max')) || null,
  page: Math.max(1, Number(urlParams().get('page')) || 1),
};

function pushState() {
  const p = new URLSearchParams();
  if (state.kategori) p.set('kategori', state.kategori);
  if (state.q) p.set('q', state.q);
  if (state.sort !== 'baru') p.set('sort', state.sort);
  if (state.min != null) p.set('min', state.min);
  if (state.max != null) p.set('max', state.max);
  if (state.page > 1) p.set('page', String(state.page));
  history.replaceState(null, '', 'katalog.html' + (p.toString() ? '?' + p : ''));
}

/* ------------------------------ Panel filter ------------------------------ */

function filterPanelHTML(cats, counts) {
  const priceVal = (state.min != null ? state.min : '') ;
  const priceMax = (state.max != null ? state.max : '');
  return `
    <div class="card filter-card">
      <h4>Kategori</h4>
      <div class="filter-list">
        <a class="filter-item ${!state.kategori ? 'is-active' : ''}" href="#" data-cat="">
          ${icon('grid')} Semua <span class="count">${num(counts.all)}</span>
        </a>
        ${cats.map((c) => `
        <a class="filter-item ${state.kategori === c.slug ? 'is-active' : ''}" href="#" data-cat="${esc(c.slug)}" style="color:${state.kategori === c.slug ? '' : ''}">
          ${icon(c.icon || 'package')} ${esc(c.name)} <span class="count">${num(counts[c.id] || 0)}</span>
        </a>`).join('')}
      </div>
    </div>

    <div class="card filter-card">
      <h4>Harga (Rp)</h4>
      <form class="price-form" id="price-form">
        <div class="price-inputs">
          <input class="input" type="number" min="0" placeholder="Min" id="price-min" value="${priceVal}" inputmode="numeric">
          <input class="input" type="number" min="0" placeholder="Max" id="price-max" value="${priceMax}" inputmode="numeric">
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary btn-sm" type="submit">${icon('check')} Terapkan</button>
          <button class="btn btn-ghost btn-sm" type="button" id="reset-filters">${icon('refresh')} Reset</button>
        </div>
      </form>
    </div>

    <div class="card filter-card">
      <h4>Cari di katalog</h4>
      <form id="catalog-search-form">
        <div class="row" style="gap:8px">
          <input class="input" type="search" placeholder="Nama produk…" id="catalog-search" value="${esc(state.q)}">
          <button class="icon-btn" type="submit" aria-label="Cari">${icon('search')}</button>
        </div>
      </form>
    </div>`;
}

function bindFilterEvents(root, { isDrawer = false } = {}) {
  root.addEventListener('click', (e) => {
    const cat = e.target.closest('[data-cat]');
    if (cat) {
      e.preventDefault();
      state.kategori = cat.dataset.cat;
      state.page = 1;
      pushState();
      renderAll();
      if (isDrawer) closeFilterDrawer();
    }
  });

  const priceForm = root.querySelector('#price-form');
  if (priceForm) priceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const min = Number(priceForm.querySelector('#price-min').value);
    const max = Number(priceForm.querySelector('#price-max').value);
    state.min = priceForm.querySelector('#price-min').value !== '' && !isNaN(min) ? min : null;
    state.max = priceForm.querySelector('#price-max').value !== '' && !isNaN(max) ? max : null;
    if (state.min != null && state.max != null && state.min > state.max) {
      toast('Harga minimum tidak boleh lebih besar dari maksimum.', 'info');
      return;
    }
    state.page = 1;
    pushState();
    renderAll();
    if (isDrawer) closeFilterDrawer();
  });

  const reset = root.querySelector('#reset-filters');
  if (reset) reset.addEventListener('click', () => {
    state.kategori = ''; state.q = ''; state.min = null; state.max = null; state.page = 1;
    pushState();
    renderAll();
    if (isDrawer) closeFilterDrawer();
    toast('Filter direset', 'info', 1600);
  });

  const searchForm = root.querySelector('#catalog-search-form');
  if (searchForm) searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = searchForm.querySelector('#catalog-search').value.trim();
    state.page = 1;
    pushState();
    renderAll();
    if (isDrawer) closeFilterDrawer();
  });
}

/* ------------------------------ Drawer filter (ponsel) ------------------------------ */

let drawerEls = null;

function openFilterDrawer(html) {
  if (!drawerEls) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('aria-label', 'Filter produk');
    drawer.innerHTML = `
      <div class="drawer-head">
        <h3 class="row" style="gap:8px">${icon('filter')} Filter</h3>
        <button class="icon-btn" data-close-filter aria-label="Tutup">${icon('x')}</button>
      </div>
      <div class="drawer-body" id="filter-drawer-body"></div>`;
    document.body.append(overlay, drawer);
    drawerEls = { overlay, drawer };
    overlay.addEventListener('click', closeFilterDrawer);
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-filter]')) closeFilterDrawer();
    });
  }
  drawerEls.drawer.querySelector('#filter-drawer-body').innerHTML = html;
  drawerEls.overlay.classList.add('is-open');
  drawerEls.drawer.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeFilterDrawer() {
  if (!drawerEls) return;
  drawerEls.drawer.classList.remove('is-open');
  drawerEls.overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ------------------------------ Render ------------------------------ */

let lastItems = [];

async function renderAll() {
  const grid = qs('#catalog-grid');
  const countEl = qs('#result-count');
  const foot = qs('#catalog-foot');
  const title = qs('#catalog-title');

  grid.innerHTML = skelCards(PER_PAGE);
  countEl.textContent = 'Memuat…';

  try {
    const [cats, all] = await Promise.all([
      getCategories().catch(() => []),
      listProducts({ perPage: 200 }).catch(() => ({ items: [], count: 0 })),
    ]);
    const counts = { all: all.count || all.items.length };
    for (const p of all.items) counts[p.category_id] = (counts[p.category_id] || 0) + 1;

    const panelHTML = filterPanelHTML(cats, counts);
    const panel = qs('#filter-panel');
    panel.innerHTML = panelHTML;
    bindFilterEvents(panel);

    const openBtn = qs('#open-filters');
    openBtn.onclick = () => openFilterDrawer(panelHTML);

    const { items, count } = await listProducts({
      category: state.kategori,
      q: state.q,
      sort: state.sort,
      min: state.min,
      max: state.max,
      page: state.page,
      perPage: PER_PAGE,
    });

    lastItems = items;
    const activeCat = cats.find((c) => c.slug === state.kategori);
    title.textContent = state.q
      ? `Hasil cari: "${state.q}"`
      : activeCat ? `Kriya ${activeCat.name}` : 'Katalog Kriya';

    countEl.innerHTML = `<b>${num(count)}</b> produk ditemukan`;

    if (!items.length) {
      grid.innerHTML = emptyState({
        icon: 'search',
        title: 'Tidak ada produk yang cocok',
        text: 'Coba longgarkan filter harga atau ganti kata kunci pencarian.',
        action: '<button class="btn btn-soft btn-sm" id="empty-reset">Reset semua filter</button>',
      });
      qs('#empty-reset', grid).addEventListener('click', () => {
        state.kategori = ''; state.q = ''; state.min = null; state.max = null; state.page = 1;
        pushState(); renderAll();
      });
      foot.innerHTML = '';
      return;
    }

    grid.innerHTML = items.map((p) => productCard(p)).join('');
    bindProductCards(grid, items, addToCart);

    /* Pagination */
    const pages = Math.ceil(count / PER_PAGE);
    if (pages > 1) {
      const btn = (p, label, attr = '') =>
        `<button data-page="${p}" ${attr} class="${p === state.page ? 'is-active' : ''}">${label}</button>`;
      let html = btn(Math.max(1, state.page - 1), '‹', state.page === 1 ? 'disabled' : '');
      const from = Math.max(1, state.page - 2);
      const to = Math.min(pages, state.page + 2);
      if (from > 1) html += btn(1, '1') + (from > 2 ? '<span class="muted">…</span>' : '');
      for (let p = from; p <= to; p++) html += btn(p, String(p));
      if (to < pages) html += (to < pages - 1 ? '<span class="muted">…</span>' : '') + btn(pages, String(pages));
      html += btn(Math.min(pages, state.page + 1), '›', state.page === pages ? 'disabled' : '');
      foot.innerHTML = `<div class="list-foot" style="border:none;padding:22px 0 0"><span>Halaman ${state.page} dari ${pages}</span><div class="pager">${html}</div></div>`;
      qsa('button[data-page]', foot).forEach((b) => b.addEventListener('click', () => {
        state.page = Math.max(1, Number(b.dataset.page));
        pushState();
        renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }));
    } else {
      foot.innerHTML = '';
    }
  } catch (e) {
    grid.innerHTML = `<div style="grid-column:1/-1">${UNCONFIGURED
      ? emptyState({ icon: 'alert-triangle', title: 'Database belum terhubung', text: 'Isi assets/js/config.js dengan kredensial Supabase (lihat README.md).' })
      : emptyState({ icon: 'alert-circle', title: 'Gagal memuat produk', text: errMsg(e) })}</div>`;
    countEl.textContent = '—';
    foot.innerHTML = '';
  }
}

/* Urutan berubah */
qs('#sort-select').value = state.sort;
qs('#sort-select').addEventListener('change', (e) => {
  state.sort = e.target.value;
  state.page = 1;
  pushState();
  renderAll();
});

renderAll();
