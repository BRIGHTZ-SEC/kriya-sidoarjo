/* ============================================================================
   Toko Kriya Sidoarjo — layout.js
   Kerangka halaman yang dipakai bersama: header (pencarian + tema + keranjang),
   nav bawah untuk ponsel, footer, tombol WhatsApp mengambang, dan banner
   pemberitahuan bila Supabase belum dikonfigurasi.
   Dipanggil tiap halaman: initLayout({ active: 'katalog' })
   ========================================================================== */

import { icon } from './icons.js';
import { qs, esc, initials } from './ui.js';
import { getSettings, getCategories } from './api.js';
import { initAuth, getUser, onAuthChange, isAdmin } from './auth.js';
import { onCartChange, cartCount, openCartDrawer } from './cart.js';
import { UNCONFIGURED } from './db.js';

const NAV = [
  { key: 'beranda', href: 'index.html', label: 'Beranda', icon: 'home' },
  { key: 'katalog', href: 'katalog.html', label: 'Katalog', icon: 'grid' },
  { key: 'lacak', href: 'lacak.html', label: 'Lacak', icon: 'truck' },
  { key: 'akun', href: 'akun.html', label: 'Akun', icon: 'user' },
];

export function initLayout({ active = '' } = {}) {
  initAuth();

  /* ---------- Banner "belum terhubung database" ---------- */
  if (UNCONFIGURED) {
    const notice = document.createElement('div');
    notice.className = 'setup-notice';
    notice.innerHTML = `
      ${icon('alert-triangle')}
      <div class="grow">Mode demo — database belum terhubung. Isi <code>assets/js/config.js</code> dengan URL &amp; anon key project Supabase lu (lihat <code>README.md</code> untuk langkah lengkapnya).</div>
      <a href="https://supabase.com" target="_blank" rel="noopener">Buka Supabase</a>`;
    document.body.prepend(notice);
  }

  /* ---------- Header ---------- */
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="container header-inner">
      <a href="index.html" class="brand" aria-label="Toko Kriya Sidoarjo — beranda">
        <span class="brand-logo">${icon('batik')}</span>
        <span class="brand-name">
          <span class="brand-jawa" lang="jv" aria-hidden="true">ꦠꦺꦴꦏꦺꦴ ꦏꦿꦶꦪ</span>
          <span class="brand-latin">Toko <b>Kriya</b></span>
        </span>
      </a>

      <nav class="header-nav" aria-label="Menu utama">
        ${NAV.map((n) => `<a href="${n.href}" class="nav-link ${n.key === active ? 'is-active' : ''}">${n.label}</a>`).join('')}
        <a href="admin.html" class="nav-link" data-admin-link>Admin</a>
      </nav>

      <form class="header-search" role="search">
        ${icon('search')}
        <input type="search" placeholder="Cari batik, tas, ukiran…" aria-label="Cari produk">
      </form>

      <div class="header-actions">
        <button class="icon-btn theme-toggle" aria-label="Ganti tema terang/gelap">
          ${icon('sun')}${icon('moon')}
        </button>
        <a class="icon-btn" href="akun.html" aria-label="Akun saya" data-acct-btn>${icon('user')}</a>
        <button class="icon-btn cart-btn" aria-label="Keranjang belanja">
          ${icon('cart')}<i class="nav-pill" data-cart-pill hidden>0</i>
        </button>
      </div>
    </div>`;
  document.body.prepend(header);

  /* ---------- Banner judul aksara Jawa (paling atas situs) ---------- */
  const jawaBanner = document.createElement('div');
  jawaBanner.className = 'jawa-banner';
  jawaBanner.innerHTML = `
    <div class="jawa-banner-batik" aria-hidden="true"></div>
    <svg class="jawa-flourish jawa-flourish-l" viewBox="0 0 180 120" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 60h44"/>
        <path d="M48 60c0-16 12-28 28-28 12 0 22 9 22 21 0 10-8 18-18 18-8 0-14-6-14-14 0-6 5-11 11-11 5 0 9 4 9 9"/>
        <path d="M48 60c0 16 12 28 28 28 12 0 22-9 22-21"/>
        <path d="M94 32c10-8 24-8 34 0M94 88c10 8 24 8 34 0"/>
        <path d="M128 60h44"/>
        <circle cx="92" cy="60" r="3.5" fill="currentColor"/>
      </g>
    </svg>
    <svg class="jawa-flourish jawa-flourish-r" viewBox="0 0 180 120" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 60h44"/>
        <path d="M48 60c0-16 12-28 28-28 12 0 22 9 22 21 0 10-8 18-18 18-8 0-14-6-14-14 0-6 5-11 11-11 5 0 9 4 9 9"/>
        <path d="M48 60c0 16 12 28 28 28 12 0 22-9 22-21"/>
        <path d="M94 32c10-8 24-8 34 0M94 88c10 8 24 8 34 0"/>
        <path d="M128 60h44"/>
        <circle cx="92" cy="60" r="3.5" fill="currentColor"/>
      </g>
    </svg>
    <svg class="jawa-gunungan" viewBox="0 0 240 220" aria-hidden="true">
      <path d="M120 10C132 44 176 58 188 96c10 32-10 70-40 78-12 3-20-2-28-8-8 6-16 11-28 8-30-8-50-46-40-78 12-38 56-52 68-86Z"
        fill="currentColor" opacity=".12"/>
      <path d="M120 10C132 44 176 58 188 96c10 32-10 70-40 78-12 3-20-2-28-8-8 6-16 11-28 8-30-8-50-46-40-78 12-38 56-52 68-86Z"
        fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/>
      <path d="M120 52v96M120 84c-14 0-24-7-28-18 11-2 21 1 28 10 7-9 17-12 28-10-4 11-14 18-28 18Zm0 32c-16 0-27-8-31-21 12-2 23 2 31 12 8-10 19-14 31-12-4 13-15 21-31 21Z"
        fill="currentColor" opacity=".16" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="120" cy="64" r="4.5" fill="currentColor" opacity=".4"/>
      <path d="M100 150c6 6 13 9 20 9s14-3 20-9" fill="none" stroke="currentColor" stroke-width="2" opacity=".32"/>
    </svg>

    <div class="container jawa-banner-inner">
      <span class="jawa-kicker" lang="jv" aria-hidden="true">ꦱꦸꦒꦼꦁꦫꦮꦸꦃ</span>
      <a class="jawa-title" href="index.html" lang="jv" aria-label="Toko Kriya Sidoarjo">ꦠꦺꦴꦏꦺꦴ ꦏꦿꦶꦪ ꦱꦶꦢꦺꦴꦲꦂꦗꦺꦴ</a>
      <svg class="jawa-divider" viewBox="0 0 280 24" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 12h92M182 12h92"/>
          <path d="M112 12c6-7 16-7 22 0-6 7-16 7-22 0Z"/>
          <path d="M168 12c-6-7-16-7-22 0 6 7 16 7 22 0Z"/>
          <path d="M140 5.5l6.5 6.5-6.5 6.5-6.5-6.5z"/>
        </g>
        <circle cx="140" cy="12" r="2.2" fill="currentColor"/>
      </svg>
      <span class="jawa-sub">Toko Kriya Sidoarjo · Batik Tulis, Kulit &amp; Ukiran Kayu</span>
    </div>
    <div class="jawa-tumpal" aria-hidden="true"></div>`;
  document.body.prepend(jawaBanner);

  /* ---------- Nav bawah (ponsel) ---------- */
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-nav';
  bottomNav.setAttribute('aria-label', 'Menu bawah');
  bottomNav.innerHTML = `
    <ul>
      ${NAV.map((n) => `
        <li>
          <a href="${n.href}" class="${n.key === active ? 'is-active' : ''}" ${n.key === 'akun' ? 'data-acct-nav' : ''}>
            ${icon(n.icon)}
            <span>${n.label}</span>
            ${n.key === 'akun' ? '<i class="nav-pill" data-cart-pill-account hidden>0</i>' : ''}
          </a>
        </li>`).join('')}
    </ul>`;
  document.body.appendChild(bottomNav);

  /* ---------- Footer ---------- */
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="brand">
            <span class="brand-logo">${icon('batik')}</span>
            <span class="brand-name">
              <span class="brand-jawa" lang="jv" aria-hidden="true">ꦠꦺꦴꦏꦺꦴ ꦏꦿꦶꦪ ꦱꦶꦢꦺꦴꦲꦂꦗꦺꦴ</span>
              <span class="brand-latin">Toko <b>Kriya</b></span>
            </span>
          </a>
          <p>Kriya asli tangan perajin Sidoarjo — batik tulis, kulit, dan ukiran kayu jati. Dibuat pelan-pelan, dipakai bertahun-tahun.</p>
          <ul class="footer-contact">
            <li>${icon('message')}<span><b data-wa>WhatsApp</b> — balas cepat jam kerja</span></li>
            <li>${icon('map-pin')}<span>Sidoarjo, Jawa Timur, Indonesia</span></li>
            <li>${icon('clock')}<span>Setiap hari, 08.00 – 20.00 WIB</span></li>
          </ul>
        </div>

        <div>
          <h4>Jelajahi</h4>
          <ul class="footer-links">
            <li><a href="index.html">Beranda</a></li>
            <li><a href="katalog.html">Katalog Produk</a></li>
            <li><a href="lacak.html">Lacak Pesanan</a></li>
            <li><a href="akun.html">Akun Saya</a></li>
            <li><a href="admin.html">Panel Admin</a></li>
          </ul>
        </div>

        <div>
          <h4>Kategori</h4>
          <ul class="footer-links" data-footer-cats>
            <li><a href="katalog.html">Semua produk</a></li>
          </ul>
        </div>

        <div>
          <h4>Bantuan</h4>
          <ul class="footer-links">
            <li><a href="lacak.html">Cek resi pengiriman</a></li>
            <li><a data-wa-link href="#">Chat admin toko</a></li>
            <li><a href="katalog.html?sort=laris">Produk terlaris</a></li>
            <li><a href="index.html#ulasan">Kata pembeli</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} <b data-store-name>Toko Kriya Sidoarjo</b> — dibuat dengan sabar di Sidoarjo.</span>
        <span>Vue? Nggak. Vanilla JS + Supabase 🤙</span>
      </div>
    </div>`;
  document.body.appendChild(footer);

  /* ---------- Tombol WhatsApp mengambang ---------- */
  const waFab = document.createElement('a');
  waFab.className = 'fab-wa';
  waFab.target = '_blank';
  waFab.rel = 'noopener';
  waFab.setAttribute('aria-label', 'Chat WhatsApp');
  waFab.innerHTML = icon('message');
  document.body.appendChild(waFab);

  /* ============================== Perilaku ============================== */

  /* Toggle tema terang/gelap */
  const themeBtn = qs('.theme-toggle', header);
  themeBtn.addEventListener('click', () => {
    const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', now);
    try { localStorage.setItem('tks_theme', now); } catch { /* abaikan */ }
  });

  /* Pencarian header → katalog */
  const searchForm = qs('.header-search', header);
  const searchInput = qs('input', searchForm);
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    location.href = 'katalog.html' + (q ? `?q=${encodeURIComponent(q)}` : '');
  });

  /* Keranjang */
  const cartBtn = qs('.cart-btn', header);
  cartBtn.addEventListener('click', openCartDrawer);
  const refreshPills = () => {
    const n = cartCount();
    document.querySelectorAll('[data-cart-pill], [data-cart-pill-account]').forEach((el) => {
      el.textContent = String(n);
      el.hidden = n === 0;
      el.dataset.empty = n === 0;
    });
  };
  refreshPills();
  onCartChange(refreshPills);
  window.addEventListener('storage', refreshPills);

  /* Tombol akun: ganti ikon jadi inisial nama saat sudah masuk */
  const renderAcct = () => {
    const user = getUser();
    const btn = qs('[data-acct-btn]', header);
    const nav = qs('[data-acct-nav]', bottomNav);
    const adminLink = qs('[data-admin-link]', header);
    const footerAdmin = qs('a[href="admin.html"]', footer);
    const showAdmin = !!user && isAdmin();
    if (adminLink) adminLink.hidden = !showAdmin;
    if (footerAdmin) footerAdmin.parentElement.hidden = !showAdmin;
    if (user) {
      const name = user.profile?.full_name || user.email || '';
      if (btn) {
        btn.innerHTML = `<span class="avatar" title="${esc(name)}">${esc(initials(name))}</span>`;
      }
      if (nav) {
        nav.title = `Akun: ${name}`;
        const ic = nav.querySelector('.icon');
        if (ic) ic.style.color = 'var(--clay-strong)';
      }
    }
  };
  renderAcct();
  onAuthChange(renderAcct);

  /* ---------- Data toko (nama, WA, kategori footer) ---------- */
  (async () => {
    try {
      const s = await getSettings();
      const waNumber = String(s.wa_number || '').replace(/\D/g, '');
      const waText = encodeURIComponent('Halo Toko Kriya Sidoarjo! Saya mau tanya produk.');
      waFab.href = `https://wa.me/${waNumber}?text=${waText}`;
      const waLink = qs('[data-wa-link]', footer);
      if (waLink) waLink.href = `https://wa.me/${waNumber}?text=${waText}`;
      const waLabel = qs('[data-wa]', footer);
      if (waLabel) waLabel.textContent = `+${waNumber}`;
      const storeName = qs('[data-store-name]', footer);
      if (storeName) storeName.textContent = s.store_name || 'Toko Kriya Sidoarjo';
    } catch { /* biarkan default */ }

    try {
      const cats = await getCategories();
      const box = qs('[data-footer-cats]', footer);
      if (box && cats.length) {
        box.innerHTML = `
          <li><a href="katalog.html">Semua produk</a></li>
          ${cats.map((c) => `<li><a href="katalog.html?kategori=${encodeURIComponent(c.slug)}">${esc(c.name)}</a></li>`).join('')}`;
      }
    } catch { /* biarkan default */ }
  })();
}
