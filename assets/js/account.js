/* ============================================================================
   Toko Kriya Sidoarjo — account.js
   Halaman akun: masuk/daftar bila belum login; kalau sudah — pesanan,
   favorit, ulasan saya, profil, dan pintasan panel admin.
   ========================================================================== */

import { initLayout } from './layout.js';
import { icon } from './icons.js';
import {
  qs, qsa, esc, num, rupiah, stars, urlParams, toast, emptyState,
  productCard, bindProductCards, productImage, skelRows, skelCards,
  fmtDate, fmtDateTime, timeAgo, initials, errMsg, showModal, confirmAction, setBusy,
} from './ui.js';
import {
  getMyOrders, getOrderDetail, getFavoriteProducts, getMyReviews,
  getMyDeliveredItems, submitReview, deleteMyReview, setOrderStatus,
  UNCONFIGURED,
} from './api.js';
import {
  login, register, logout, getUser, updateProfile, onAuthChange, isAdmin,
} from './auth.js';
import { addToCart } from './cart.js';

initLayout({ active: 'akun' });

const root = qs('#acct-root');
const nextUrl = urlParams().get('next') || '';
let activeTab = urlParams().get('tab') || 'pesanan';

const statusIcon = {
  menunggu: 'clock', diproses: 'settings', dikirim: 'truck',
  selesai: 'check-circle', batal: 'x',
};
const statusLabel = {
  menunggu: 'Menunggu pembayaran', diproses: 'Diproses', dikirim: 'Dikirim',
  selesai: 'Selesai', batal: 'Dibatalkan',
};

/* ============================== BELUM LOGIN ============================== */

function renderAuth(mode = 'login') {
  const isLogin = mode === 'login';
  root.innerHTML = `
  <div class="auth-wrap">
    <div class="card auth-card anim-in">
      <span class="eyebrow">${icon(isLogin ? 'log-in' : 'sparkles')} ${isLogin ? 'Selamat datang' : 'Gabung kriya'}</span>
      <h1 style="font-size:29px">${isLogin ? 'Masuk ke akunmu' : 'Buat akun baru'}</h1>
      <p class="muted" style="margin-top:6px;margin-bottom:22px;font-size:14px">
        ${isLogin ? 'Lacak pesanan, simpan favorit, dan tulis ulasan.' : 'Cukup 30 detik — langsung bisa belanja.'}
      </p>

      <form id="auth-form" class="form-grid">
        ${!isLogin ? `
        <div class="field">
          <label for="a-name">Nama lengkap</label>
          <input class="input" id="a-name" required autocomplete="name" placeholder="Nama lengkap">
        </div>` : ''}
        <div class="field">
          <label for="a-email">Email</label>
          <input class="input" id="a-email" type="email" required autocomplete="email" placeholder="nama@email.com">
        </div>
        <div class="field">
          <label for="a-pass">Password</label>
          <input class="input" id="a-pass" type="password" required minlength="6"
                 autocomplete="${isLogin ? 'current-password' : 'new-password'}" placeholder="Minimal 6 karakter">
        </div>
        <button class="btn btn-primary btn-lg btn-block mt-1" type="submit">
          ${icon(isLogin ? 'log-in' : 'check')} ${isLogin ? 'Masuk' : 'Daftar Sekarang'}
        </button>
      </form>

      <p class="auth-foot">
        ${isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
        <a href="#" data-mode="${isLogin ? 'register' : 'login'}">${isLogin ? 'Daftar dulu' : 'Masuk di sini'}</a>
      </p>

    </div>
  </div>`;

  root.querySelector('[data-mode]').addEventListener('click', (e) => {
    e.preventDefault();
    renderAuth(e.target.dataset.mode);
  });

  root.querySelector('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    setBusy(btn, true);
    try {
      if (isLogin) {
        await login(qs('#a-email', root).value, qs('#a-pass', root).value);
        toast('Berhasil masuk. Selamat belanja lagi!', 'ok');
      } else {
        await register({
          email: qs('#a-email', root).value,
          password: qs('#a-pass', root).value,
          fullName: qs('#a-name', root).value,
        });
        toast('Akun berhasil dibuat!', 'ok');
      }
      location.href = nextUrl || 'akun.html';
    } catch (err) {
      setBusy(btn, false);
      if (err.message === 'KONFIRMASI_EMAIL') {
        showModal({
          title: 'Cek email kamu',
          body: `<p class="muted">Kami kirim tautan konfirmasi ke <b>${esc(err.email)}</b>. Klik tautan di email itu dulu, baru balik ke sini untuk masuk.</p>`,
          footer: '<button class="btn btn-primary" data-close>Siyap</button>',
        });
      } else {
        toast(errMsg(err), 'error', 4200);
      }
    }
  });
}

/* ============================== SUDAH LOGIN ============================== */

function renderAccount() {
  const user = getUser();
  const name = user.profile?.full_name || user.email?.split('@')[0] || 'Pembeli';

  root.innerHTML = `
  <div class="acct-layout anim-in">
    <aside class="acct-side">
      <div class="card acct-user">
        <span class="avatar avatar-lg">${esc(initials(name))}</span>
        <div class="grow" style="min-width:0">
          <b>${esc(name)}</b>
          <span>${esc(user.email || '')}</span>
          ${isAdmin() ? '<span class="badge badge-primary mt-1" style="align-self:flex-start">Admin</span>' : ''}
        </div>
      </div>

      <nav class="card acct-menu" aria-label="Menu akun">
        <button data-tab="pesanan" class="${activeTab === 'pesanan' ? 'is-active' : ''}">${icon('package')} Pesanan Saya</button>
        <button data-tab="favorit" class="${activeTab === 'favorit' ? 'is-active' : ''}">${icon('heart')} Favorit</button>
        <button data-tab="ulasan" class="${activeTab === 'ulasan' ? 'is-active' : ''}">${icon('star')} Ulasan Saya</button>
        <button data-tab="profil" class="${activeTab === 'profil' ? 'is-active' : ''}">${icon('user')} Profil</button>
        ${isAdmin() ? `<a href="admin.html" class="" style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;font-size:14px;font-weight:700;color:var(--sage)">${icon('settings')} Panel Admin</a>` : ''}
        <button data-tab="keluar" class="danger">${icon('log-out')} Keluar</button>
      </nav>
    </aside>

    <div class="acct-main" id="acct-main"></div>
  </div>`;

  qsa('[data-tab]', root).forEach((b) => b.addEventListener('click', async () => {
    const tab = b.dataset.tab;
    if (tab === 'keluar') {
      const ok = await confirmAction('Yakin mau keluar dari akun?', { okText: 'Keluar', danger: true });
      if (!ok) return;
      await logout();
      toast('Sampai jumpa lagi!', 'info');
      location.href = 'index.html';
      return;
    }
    activeTab = tab;
    history.replaceState(null, '', `akun.html?tab=${tab}`);
    qsa('[data-tab]', root).forEach((x) => x.classList.toggle('is-active', x === b));
    renderTab();
  }));

  renderTab();
}

function renderTab() {
  const main = qs('#acct-main', root);
  main.innerHTML = `<div class="card card-pad">${skelRows(3)}</div>`;
  if (activeTab === 'pesanan') renderOrders(main);
  else if (activeTab === 'favorit') renderFavorites(main);
  else if (activeTab === 'ulasan') renderReviews(main);
  else renderProfile(main);
}

/* ------------------------------ Pesanan saya ------------------------------ */

async function renderOrders(main) {
  try {
    const orders = await getMyOrders();
    if (!orders.length) {
      main.innerHTML = `<div class="card card-pad">${emptyState({
        icon: 'package',
        title: 'Belum ada pesanan',
        text: 'Pesanan pertama kamu menunggu di katalog.',
        action: '<a class="btn btn-primary btn-sm" href="katalog.html">Belanja Sekarang</a>',
      })}</div>`;
      return;
    }

    main.innerHTML = orders.map((o) => `
      <article class="card order-card">
        <header class="order-head">
          <div>
            <b>${esc(o.id)}</b>
            <span class="date"> · ${fmtDate(o.created_at)}</span>
          </div>
          <span class="status-pill status-${esc(o.status)}">${statusLabel[o.status] || o.status}</span>
        </header>
        <div class="order-body" data-order-items="${esc(o.id)}">
          <div class="skeleton" style="height:56px"></div>
        </div>
        <footer class="order-foot">
          <span class="order-total">Total <b>${rupiah(o.total)}</b></span>
          <div class="row" style="flex-wrap:wrap">
            <a class="btn btn-ghost btn-sm" href="lacak.html?q=${encodeURIComponent(o.id)}">${icon('truck')} Lacak</a>
            ${o.status === 'menunggu' || o.status === 'diproses' ? `
            <button class="btn btn-ghost btn-sm" data-cancel="${esc(o.id)}" style="color:var(--danger)">${icon('x')} Batalkan</button>` : ''}
            ${o.status === 'dikirim' ? `
            <button class="btn btn-soft btn-sm" data-received="${esc(o.id)}">${icon('check')} Barang Diterima</button>` : ''}
            ${o.status === 'selesai' ? `
            <button class="btn btn-soft btn-sm" data-review="${esc(o.id)}">${icon('star')} Tulis Ulasan</button>` : ''}
          </div>
        </footer>
        ${o.status === 'batal' && o.cancel_reason ? `
        <div class="alert alert-error" style="margin:0 18px 16px">${icon('info')}<div>${esc(o.cancel_reason)}</div></div>` : ''}
      </article>`).join('');

    /* Isi item tiap pesanan (paralel) */
    const itemsBoxes = qsa('[data-order-items]', main);
    await Promise.all(orders.map(async (o, i) => {
      const box = itemsBoxes[i];
      try {
        const detail = await getOrderDetail(o.id);
        box.innerHTML = detail.items.map((it) => `
          <div class="p-row" style="border:none;padding:10px 0;border-bottom:1px solid var(--line);border-radius:0">
            ${it.image ? `<img src="${esc(it.image)}" alt="" class="p-row-thumb" loading="lazy">` : `<div class="p-row-thumb">${productImage({ name: it.name, images: [] }, { color: '#c05a30', icon: 'package' })}</div>`}
            <div class="grow" style="min-width:0">
              <b style="font-size:13.5px">${esc(it.name)}</b>
              <div class="tiny muted">${num(it.qty)} × ${rupiah(it.price)}</div>
            </div>
            <b>${rupiah(it.price * it.qty)}</b>
          </div>`).join('');
      } catch {
        box.innerHTML = '<p class="tiny muted">Rincian barang tidak dapat dimuat.</p>';
      }
    }));

    /* Aksi pesanan */
    qsa('[data-cancel]', main).forEach((b) => b.addEventListener('click', async () => {
      const id = b.dataset.cancel;
      const reason = prompt('Kenapa dibatalkan? (opsional, buat catatan toko)') || '';
      const ok = await confirmAction(`Batalkan pesanan ${id}? Stok barang langsung dikembalikan.`, { okText: 'Ya, batalkan', danger: true });
      if (!ok) return;
      try {
        const res = await setOrderStatus(id, 'batal', null, reason || 'Dibatalkan pembeli');
        if (res?.ok === false) throw new Error(res.error);
        toast('Pesanan dibatalkan.', 'info');
        renderTab();
      } catch (e) { toast(errMsg(e), 'error'); }
    }));

    qsa('[data-received]', main).forEach((b) => b.addEventListener('click', async () => {
      const id = b.dataset.received;
      const ok = await confirmAction(`Konfirmasi pesanan ${id} sudah diterima?`, { okText: 'Sudah diterima' });
      if (!ok) return;
      try {
        const res = await setOrderStatus(id, 'selesai', 'Paket diterima pembeli', null);
        if (res?.ok === false) throw new Error(res.error);
        toast('Terima kasih! Pesanan selesai.', 'ok');
        renderTab();
      } catch (e) { toast(errMsg(e), 'error'); }
    }));

    qsa('[data-review]', main).forEach((b) => b.addEventListener('click', () => {
      openReviewModal(b.dataset.review);
    }));
  } catch (e) {
    main.innerHTML = `<div class="card card-pad">${emptyState({
      icon: UNCONFIGURED ? 'alert-triangle' : 'alert-circle',
      title: UNCONFIGURED ? 'Database belum terhubung' : 'Gagal memuat pesanan',
      text: UNCONFIGURED ? 'Isi assets/js/config.js dengan kredensial Supabase (lihat README.md).' : errMsg(e),
    })}</div>`;
  }
}

/* Modal tulis ulasan untuk pesanan selesai */
async function openReviewModal(orderId) {
  try {
    const detail = await getOrderDetail(orderId);
    const items = detail.items.filter((it) => it.product_id);
    if (!items.length) {
      toast('Tidak ada produk yang bisa diulas dari pesanan ini.', 'info');
      return;
    }

    const m = showModal({
      title: `Tulis ulasan — ${orderId}`,
      body: `
        <p class="muted small mb-2">Ulasan masuk dulu ke antrian moderasi admin sebelum tampil publik.</p>
        ${items.map((it, i) => `
        <div class="card card-pad mb-2" data-review-item="${i}">
          <div class="row" style="align-items:flex-start">
            ${it.image ? `<img src="${esc(it.image)}" class="p-row-thumb" alt="">` : `<div class="p-row-thumb">${productImage({ name: it.name, images: [] }, null)}</div>`}
            <div class="grow">
              <b style="font-size:14px">${esc(it.name)}</b>
              <div class="field mt-2">
                <label>Bintang</label>
                <div class="stars-picker row" data-stars>
                  ${[1, 2, 3, 4, 5].map((s) => `
                  <button type="button" class="icon-btn" data-star="${s}" aria-label="${s} bintang">
                    ${icon(s <= 5 ? 'star' : 'star')}
                  </button>`).join('')}
                </div>
              </div>
              <div class="field mt-2">
                <label>Ceritakan pengalamanmu</label>
                <textarea class="input" rows="3" placeholder="Bagaimana kualitasnya? Pengiriman cepat?" data-text></textarea>
              </div>
            </div>
          </div>
        </div>`).join('')}
        <div class="alert alert-info">${icon('info')}<div>Satu ulasan per produk. Yang tidak diisi akan dilewati.</div></div>`,
      footer: `<button class="btn btn-ghost" data-close>Nanti saja</button>
               <button class="btn btn-primary" data-send-review>${icon('check')} Kirim Ulasan</button>`,
      large: true,
    });

    /* Bintang bisa diklik */
    qsa('[data-review-item]', m.el).forEach((card) => {
      let val = 5;
      const paint = () => {
        qsa('[data-star]', card).forEach((sb) => {
          const active = Number(sb.dataset.star) <= val;
          sb.innerHTML = icon(active ? 'star-filled' : 'star');
          sb.style.color = active ? 'var(--gold)' : 'var(--ink-3)';
        });
        card.dataset.rating = String(val);
      };
      qsa('[data-star]', card).forEach((sb) => sb.addEventListener('click', () => {
        val = Number(sb.dataset.star);
        paint();
      }));
      paint();
    });

    m.el.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-send-review]')) return;
      let sent = 0;
      for (const card of qsa('[data-review-item]', m.el)) {
        const rating = Number(card.dataset.rating || 0);
        const text = qs('[data-text]', card).value.trim();
        const item = items[Number(card.dataset.reviewItem)];
        if (!rating || !text) continue;
        try {
          await submitReview({ productId: item.product_id, orderId, rating, text });
          sent++;
          card.style.opacity = 0.4;
          card.querySelector('[data-text]').disabled = true;
        } catch (err) {
          toast(errMsg(err), 'error');
        }
      }
      if (sent) {
        toast(`${sent} ulasan terkirim — menunggu moderasi admin. Terima kasih!`, 'ok', 4200);
        m.close();
      } else {
        toast('Isi bintang dan tulisan dulu minimal satu produk.', 'info');
      }
    });
  } catch (e) {
    toast(errMsg(e), 'error');
  }
}

/* ------------------------------ Favorit ------------------------------ */

async function renderFavorites(main) {
  try {
    const products = await getFavoriteProducts();
    if (!products.length) {
      main.innerHTML = `<div class="card card-pad">${emptyState({
        icon: 'heart',
        title: 'Belum ada favorit',
        text: 'Tekan ikon hati di halaman produk untuk menyimpannya di sini.',
        action: '<a class="btn btn-primary btn-sm" href="katalog.html">Cari Favorit</a>',
      })}</div>`;
      return;
    }
    main.innerHTML = `<div class="p-grid">${products.map((p) => productCard(p)).join('')}</div>`;
    bindProductCards(main, products, addToCart);
  } catch (e) {
    main.innerHTML = `<div class="card card-pad">${emptyState({
      icon: 'heart', title: 'Gagal memuat favorit', text: errMsg(e),
    })}</div>`;
  }
}

/* ------------------------------ Ulasan saya ------------------------------ */

async function renderReviews(main) {
  try {
    const reviews = await getMyReviews();
    if (!reviews.length) {
      main.innerHTML = `<div class="card card-pad">${emptyState({
        icon: 'star',
        title: 'Belum ada ulasan',
        text: 'Setelah pesanan selesai, tombol "Tulis Ulasan" muncul di tab Pesanan.',
      })}</div>`;
      return;
    }
    main.innerHTML = reviews.map((r) => `
      <article class="card card-pad">
        <div class="row-between wrap">
          <div>
            ${stars(r.rating)}
            <b style="margin-left:8px">${esc(r.products?.name || 'Produk')}</b>
          </div>
          <span class="badge ${r.status === 'published' ? 'badge-ok' : r.status === 'pending' ? 'badge-warn' : 'badge-outline'}">
            ${r.status === 'published' ? 'Tampil publik' : r.status === 'pending' ? 'Menunggu moderasi' : 'Disembunyikan'}
          </span>
        </div>
        <p class="muted mt-2" style="line-height:1.7">${esc(r.text)}</p>
        ${r.reply ? `<div class="alert alert-info mt-2">${icon('store')}<div><b>Balasan toko</b><br>${esc(r.reply)}</div></div>` : ''}
        <div class="row mt-2">
          <span class="tiny muted">${timeAgo(r.created_at)}</span>
          <span class="grow"></span>
          ${r.status === 'pending' ? `<button class="btn btn-ghost btn-sm" data-del-review="${esc(r.id)}" style="color:var(--danger)">${icon('trash')} Hapus</button>` : ''}
          ${r.products?.slug ? `<a class="btn btn-ghost btn-sm" href="produk.html?slug=${esc(r.products.slug)}">${icon('external')} Lihat produk</a>` : ''}
        </div>
      </article>`).join('');

    qsa('[data-del-review]', main).forEach((b) => b.addEventListener('click', async () => {
      const ok = await confirmAction('Hapus ulasan ini?', { okText: 'Hapus', danger: true });
      if (!ok) return;
      try {
        await deleteMyReview(b.dataset.delReview);
        toast('Ulasan dihapus.', 'info');
        renderTab();
      } catch (e) { toast(errMsg(e), 'error'); }
    }));
  } catch (e) {
    main.innerHTML = `<div class="card card-pad">${emptyState({
      icon: 'star', title: 'Gagal memuat ulasan', text: errMsg(e),
    })}</div>`;
  }
}

/* ------------------------------ Profil ------------------------------ */

function renderProfile(main) {
  const user = getUser();
  const p = user.profile || {};
  main.innerHTML = `
  <div class="card co-section">
    <h3><span class="step-n">${icon('user')}</span> Profil Saya</h3>
    <div class="form-grid">
      <div class="field">
        <label for="p-name">Nama lengkap</label>
        <input class="input" id="p-name" value="${esc(p.full_name || '')}" placeholder="Nama yang tampil di ulasan & pesanan">
      </div>
      <div class="field">
        <label for="p-phone">No. HP / WhatsApp</label>
        <input class="input" id="p-phone" value="${esc(p.phone || '')}" placeholder="cth. 081234567890" inputmode="tel">
      </div>
      <div class="field">
        <label>Email (tidak bisa diubah)</label>
        <input class="input" value="${esc(user.email || '')}" disabled>
      </div>
      <div class="alert alert-info">${icon('info')}<div>Nama &amp; HP otomatis terisi ke form checkout berikutnya.</div></div>
      <button class="btn btn-primary btn-lg" id="btn-save-profile" style="align-self:flex-start">
        ${icon('check')} Simpan Perubahan
      </button>
    </div>
  </div>`;

  qs('#btn-save-profile', main).addEventListener('click', async () => {
    const btn = qs('#btn-save-profile', main);
    setBusy(btn, true);
    try {
      await updateProfile({
        full_name: qs('#p-name', main).value,
        phone: qs('#p-phone', main).value,
      });
      setBusy(btn, false);
      toast('Profil tersimpan.', 'ok');
      renderAccount();
    } catch (e) {
      setBusy(btn, false);
      toast(errMsg(e), 'error');
    }
  });
}

/* ============================== Boot ============================== */

/* Halaman bisa dirender dua arah: sesi tersedia → dashboard, tidak → form masuk.
   onAuthChange memberi sinyal saat sesi selesai dimuat (atau berubah). */
let currentView = null;

onAuthChange((user) => {
  if (user && currentView !== 'account') {
    currentView = 'account';
    renderAccount();
  } else if (!user && currentView !== 'auth') {
    currentView = 'auth';
    renderAuth('login');
  }
});

/* Jaring pengaman: bila auth tidak pernah siap (misal DB belum dikonfigurasi),
   tampilkan form masuk setelah 1.6 detik. */
setTimeout(() => {
  if (currentView === null) {
    currentView = getUser() ? 'account' : 'auth';
    if (currentView === 'account') renderAccount();
    else renderAuth('login');
  }
}, 1600);
