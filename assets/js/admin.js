/* =========================================================================
   Panel Admin — Logika
   ========================================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

function productPhoto(p, className = 'product-photo') {
  const src = Store.productImages(p)[0];
  const alt = esc(`Foto ${p.name}`);
  return `<span class="${className}${src ? '' : ' is-empty'}">${src
    ? `<img src="${esc(src)}" alt="${alt}" loading="lazy" onerror="this.remove();this.parentElement.classList.add('is-empty')">`
    : `<span class="photo-missing">Foto belum tersedia</span>`}</span>`;
}

const num = (v) => {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const starsHtml = (rating) => {
  const full = Math.round(Number(rating) || 0);
  return `<span class="stars-sm" aria-label="Rating ${full} dari 5">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span>`;
};

const admin = {
  view: 'dashboard',
  /* Pencarian pesanan dan produk terpisah, kalau tidak satu view-warisan milik view lain */
  orderSearch: '',
  productSearch: '',
  statusFilter: 'semua',
  reviewFilter: 'semua',
  editingId: null,
  editingVoucher: null,
  images: [],
  primaryImage: 0,
  confirmAction: null,
};

/* ------------------------------- Toast -------------------------------- */

function toast(message, type = '') {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' toast-' + type : '');
  el.innerHTML = `<span class="t-icon">${type === 'error' ? '!' : type === 'success' ? '✓' : 'i'}</span><span>${esc(message)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 240);
  }, 2600);
}

/* ------------------------------- Modal -------------------------------- */

const overlay = $('#overlay');

function openModal(id) {
  $$('.modal.is-open').forEach((m) => m.classList.remove('is-open'));
  const modal = $('#' + id);
  if (!modal) return;
  modal.classList.add('is-open');
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  $('#adminSide').classList.remove('is-open');
}

function closeModals() {
  $$('.modal.is-open').forEach((m) => m.classList.remove('is-open'));
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

/* -------------------------------- Auth -------------------------------- */

function isAdmin() {
  const me = Store.currentUser();
  return !!me && me.role === 'admin';
}

function showLogin() {
  $('#adminApp').classList.add('hidden');
  $('#adminLogin').classList.remove('hidden');
  $('#loginError').textContent = '';
  $('#loginError').classList.add('hidden');
}

function showApp() {
  $('#adminLogin').classList.add('hidden');
  $('#adminApp').classList.remove('hidden');
  $('#adminAvatar').textContent = (Store.currentUser().name || 'A').slice(0, 2).toUpperCase();
  renderAll();
}

function handleLogin(e) {
  e.preventDefault();
  const email = $('#adEmail').value.trim();
  const pass = $('#adPass').value;
  const box = $('#loginError');

  if (!email || !pass) {
    box.textContent = 'Email dan password wajib diisi.';
    box.classList.remove('hidden');
    return;
  }

  const res = Store.login(email, pass);
  if (!res.ok) {
    box.textContent = res.error;
    box.classList.remove('hidden');
    return;
  }

  if (res.user.role !== 'admin') {
    Store.logout();
    box.textContent = 'Akun ini bukan akun admin. Gunakan admin@tokokriya.id.';
    box.classList.remove('hidden');
    return;
  }

  showApp();
  toast('Selamat datang, ' + res.user.name, 'success');
}

/* ------------------------------- Header ------------------------------- */

const VIEW_META = {
  dashboard: { title: 'Dashboard', sub: 'Ringkasan toko dan aktivitas terbaru' },
  orders: { title: 'Pesanan', sub: 'Kelola status pengiriman pembayaran' },
  products: { title: 'Produk', sub: 'Tambah, ubah, dan hapus produk' },
  reviews: { title: 'Ulasan', sub: 'Moderasi ulasan dan balas pembeli' },
  vouchers: { title: 'Voucher', sub: 'Kode promo, kuota, dan masa berlaku' },
  customers: { title: 'Pembeli', sub: 'Daftar akun yang terdaftar' },
};

function updateClock() {
  const el = $('#adminClock');
  if (el) el.textContent = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function setView(view) {
  admin.view = view;
  $$('.admin-nav-link').forEach((b) => b.classList.toggle('is-active', b.dataset.view === view));
  $$('.admin-view').forEach((s) => s.classList.add('hidden'));
  const section = $('#view-' + view);
  if (section) section.classList.remove('hidden');

  const meta = VIEW_META[view] || VIEW_META.dashboard;
  $('#adminViewTitle').textContent = meta.title;
  $('#adminViewSub').textContent = meta.sub;

  $('#adminSide').classList.remove('is-open');
  renderView(view);
}

/* ------------------------------ Dashboard ----------------------------- */

function renderDashboard() {
  const s = Store.stats();
  const orders = Store.orders();

  const pending = orders.filter((o) => o.status === 'menunggu').length;
  const shipped = orders.filter((o) => o.status === 'dikirim').length;

  const revenueToday = orders
    .filter((o) => o.status !== 'batal' && (Date.now() - new Date(o.createdAt).getTime()) < 86400000)
    .reduce((sum, o) => sum + o.total, 0);

  const byCat = {};
  Store.products().forEach((p) => {
    byCat[p.category] = (byCat[p.category] || 0) + p.sold;
  });
  const catRows = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const catMax = catRows.length ? catRows[0][1] : 1;

  const topProducts = Store.products().slice().sort((a, b) => b.sold - a.sold).slice(0, 5);
  const topMax = topProducts.length ? topProducts[0].sold : 1;

  const lowStockList = s.lowStock.concat(s.outOfStock);

  $('#view-dashboard').innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="sc-top">
          <span class="sc-label">Total Pendapatan</span>
          <span class="sc-icon" style="background:#f7e8e0">💰</span>
        </div>
        <div class="sc-value">${rupiah(s.revenue)}</div>
        <div class="sub">dari ${s.orderCount} pesanan</div>
      </div>
      <div class="stat-card">
        <div class="sc-top">
          <span class="sc-label">Pesanan 24 Jam</span>
          <span class="sc-icon" style="background:#eaf0e4">🧾</span>
        </div>
        <div class="sc-value">${rupiah(revenueToday)}</div>
        <div class="sub">${orders.filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000).length} pesanan masuk</div>
      </div>
      <div class="stat-card">
        <div class="sc-top">
          <span class="sc-label">Menunggu Bayar</span>
          <span class="sc-icon" style="background:#fff6dc">⏳</span>
        </div>
        <div class="sc-value">${pending}</div>
        <div class="sub">${shipped} pesanan sedang dikirim</div>
      </div>
      <div class="stat-card">
        <div class="sc-top">
          <span class="sc-label">Stok Perlu Perhatian</span>
          <span class="sc-icon" style="background:#fbe7e5">📦</span>
        </div>
        <div class="sc-value">${lowStockList.length}</div>
        <div class="sub">produk sisa 10 atau kurang</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <header>
          <h3>Pesanan Terbaru</h3>
          <button class="btn btn-sm" data-goto="orders">Lihat Semua</button>
        </header>
        <div class="panel-body flush">
          ${orders.length
            ? `<div class="table-scroll"><table class="data recent-orders-table">
                <thead>
                  <tr><th>Nomor</th><th>Pembeli</th><th>Total</th><th>Status</th><th>Tanggal</th><th></th></tr>
                </thead>
                <tbody>
                  ${orders.slice(0, 6).map((o) => {
                    const st = ORDER_STATUS[o.status] || ORDER_STATUS.menunggu;
                    return `<tr>
                      <td class="nowrap"><b>${o.id}</b></td>
                      <td>${esc(o.customer.name)}</td>
                      <td class="num">${rupiah(o.total)}</td>
                      <td><span class="status" style="background:${st.bg};color:${st.color}">${st.label}</span></td>
                      <td class="nowrap small muted">${formatDate(o.createdAt)}</td>
                      <td class="num"><button class="mini-btn" data-order="${o.id}">Detail</button></td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table></div>`
            : '<div class="panel-body"><p class="muted small">Belum ada pesanan masuk.</p></div>'}
        </div>
      </div>

      <div class="panel">
        <header>
          <h3>Perlu Tindakan</h3>
          <span class="badge badge-outline">${s.pendingReviews + pending} item</span>
        </header>
        <div class="panel-body">
          <div style="display:grid;gap:9px">
            <button class="todo-row" data-goto="reviews">
              <span class="tp-icon">⭐</span>
              <span class="grow">
                <b>Ulasan menunggu moderasi</b><br>
                <span class="tiny muted">${s.pendingReviews} ulasan belum ditayangkan</span>
              </span>
              <span class="todo-badge ${s.pendingReviews ? 'is-hot' : ''}">${s.pendingReviews}</span>
            </button>
            <button class="todo-row" data-goto="orders">
              <span class="tp-icon">⏳</span>
              <span class="grow">
                <b>Pesanan menunggu pembayaran</b><br>
                <span class="tiny muted">${pending} pesanan belum dibayar</span>
              </span>
              <span class="todo-badge ${pending ? 'is-hot' : ''}">${pending}</span>
            </button>
            <button class="todo-row" data-goto="products">
              <span class="tp-icon">📦</span>
              <span class="grow">
                <b>Stok menipis atau habis</b><br>
                <span class="tiny muted">${lowStockList.length} produk perlu diisi ulang</span>
              </span>
              <span class="todo-badge ${lowStockList.length ? 'is-hot' : ''}">${lowStockList.length}</span>
            </button>
          </div>
          <div class="warn-box" style="margin-top:14px">
            <span>💡</span>
            <span>Prototype. Angka dihitung dari data yang tersimpan di browser ini, bukan dari server.</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <header>
          <h3>Penjualan per Kategori</h3>
        </header>
        <div class="panel-body">
          <div class="bars">
            ${catRows
              .map(
                ([cat, sold]) => `
              <div class="bar-row">
                <span class="bar-name">${esc(categoryName(cat))}</span>
                <span class="bar-track"><span class="bar-fill" style="width:${Math.round((sold / catMax) * 100)}%"></span></span>
                <span class="bar-val">${sold}</span>
              </div>`
              )
              .join('') || '<p class="muted small">Belum ada data penjualan.</p>'}
          </div>
        </div>
      </div>

      <div class="panel">
        <header>
          <h3>Produk Terlaris</h3>
          <button class="btn btn-sm" data-goto="products">Kelola Produk</button>
        </header>
        <div class="panel-body">
          <div class="bars">
            ${topProducts
              .map(
                (p) => `
              <div class="bar-row">
                <span class="bar-name top-product-name">${productPhoto(p, 'product-photo product-photo-sm')}<span>${esc(p.name)}</span></span>
                <span class="bar-track"><span class="bar-fill" style="width:${Math.round((p.sold / topMax) * 100)}%"></span></span>
                <span class="bar-val">${p.sold}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top:18px">
      <header>
        <h3>Stok Menipis</h3>
        <button class="btn btn-sm" data-goto="products">Isi Ulang Stok</button>
      </header>
      <div class="panel-body">
        ${lowStockList.length
          ? `<div style="display:grid;gap:9px">
              ${lowStockList
                .map(
                  (p) => `
                <div class="row-between">
                  <span class="row" style="gap:9px">
                    ${productPhoto(p, 'product-photo')}
                    <span>
                      <span style="font-weight:700;font-size:13.5px">${esc(p.name)}</span><br>
                      <span class="tiny muted">${esc(categoryName(p.category))}</span>
                    </span>
                  </span>
                  <span class="${p.stock === 0 ? 'stock-tag stock-out' : 'stock-tag stock-low'}">
                    ${p.stock === 0 ? 'Habis' : 'Sisa ' + p.stock}
                  </span>
                </div>`
                )
                .join('')}
            </div>`
          : '<p class="muted small">Semua produk punya stok di atas 10 buah.</p>'}
      </div>
    </div>`;
}

/* -------------------------------- Orders ------------------------------ */

function filteredOrders() {
  const q = admin.orderSearch.trim().toLowerCase();
  return Store.orders().filter((o) => {
    if (admin.statusFilter !== 'semua' && o.status !== admin.statusFilter) return false;
    if (q) {
      const hay = (o.id + ' ' + o.customer.name + ' ' + o.customer.city).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderOrders() {
  const list = filteredOrders();
  const counts = { semua: Store.orders().length };
  Object.keys(ORDER_STATUS).forEach((k) => {
    counts[k] = Store.orders().filter((o) => o.status === k).length;
  });

  $('#view-orders').innerHTML = `
    <div class="admin-toolbar">
      <div class="search-wrap">
        <span class="s-icon">🔍</span>
        <input type="search" id="ordSearch" placeholder="Cari nomor pesanan, nama, atau kota…" aria-label="Cari pesanan" value="${esc(admin.orderSearch)}">
      </div>
      <select class="input" id="ordStatus" aria-label="Saring status pesanan" style="height:40px">
        <option value="semua">Semua status (${counts.semua})</option>
        ${Object.entries(ORDER_STATUS)
          .map(([k, v]) => `<option value="${k}" ${admin.statusFilter === k ? 'selected' : ''}>${v.label} (${counts[k]})</option>`)
          .join('')}
      </select>
      <button class="btn btn-sm" id="ordExport">Ekspor CSV</button>
    </div>

    <div class="panel">
      <div class="panel-body flush">
        ${list.length
          ? `<div class="table-scroll"><table class="data">
              <thead>
                <tr><th>Nomor</th><th>Pembeli</th><th>Item</th><th>Total</th><th>Pembayaran</th><th>Status</th><th>Tanggal</th><th></th></tr>
              </thead>
              <tbody>
                ${list
                  .map((o) => {
                    const st = ORDER_STATUS[o.status] || ORDER_STATUS.menunggu;
                    const pay = PAYMENT_METHODS.find((m) => m.slug === o.payment);
                    const items = o.items.reduce((s, i) => s + i.qty, 0);
                    return `<tr>
                      <td class="nowrap"><b>${o.id}</b></td>
                      <td>
                        <div style="font-weight:700">${esc(o.customer.name)}</div>
                        <div class="tiny muted">${esc(o.customer.city)} ${esc(o.customer.postal)}</div>
                      </td>
                      <td class="num">${items}</td>
                      <td class="num"><b>${rupiah(o.total)}</b></td>
                      <td class="nowrap small">${pay ? pay.icon + ' ' + esc(pay.name) : esc(o.payment)}</td>
                      <td><span class="status" style="background:${st.bg};color:${st.color}">${st.label}</span></td>
                      <td class="nowrap small muted">${formatDate(o.createdAt)}</td>
                      <td class="num">
                        <div class="row-actions">
                          <button class="mini-btn" data-order="${o.id}">Detail</button>
                          <button class="mini-btn mini-btn-danger" data-del-order="${o.id}">Hapus</button>
                        </div>
                      </td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
            </table></div>`
          : '<div class="panel-body"><p class="muted small">Tidak ada pesanan yang cocok dengan filter.</p></div>'}
      </div>
    </div>`;

  $('#ordSearch').addEventListener('input', (e) => {
    admin.orderSearch = e.target.value;
    const pos = e.target.selectionStart;
    renderOrders();
    const input = $('#ordSearch');
    input.focus();
    input.setSelectionRange(pos, pos);
  });

  $('#ordStatus').addEventListener('change', (e) => {
    admin.statusFilter = e.target.value;
    renderOrders();
  });

  $('#ordExport').addEventListener('click', exportCsv);
}

function exportCsv() {
  const rows = [['Nomor', 'Tanggal', 'Nama', 'Telepon', 'Kota', 'Item', 'Subtotal', 'Ongkir', 'Total', 'Bayar', 'Status']];
  filteredOrders().forEach((o) => {
    rows.push([
      o.id,
      formatDateTime(o.createdAt),
      o.customer.name,
      o.customer.phone,
      o.customer.city,
      o.items.reduce((s, i) => s + i.qty, 0),
      o.subtotal,
      o.shippingCost,
      o.total,
      o.payment,
      (ORDER_STATUS[o.status] || {}).label || o.status,
    ]);
  });

  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pesanan-toko-kriya.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV berhasil diunduh', 'success');
}

function openOrder(id) {
  const o = Store.orders().find((x) => x.id === id);
  if (!o) return;
  const st = ORDER_STATUS[o.status] || ORDER_STATUS.menunggu;
  const pay = PAYMENT_METHODS.find((m) => m.slug === o.payment);
  const ship = SHIPPING_METHODS.find((m) => m.slug === o.shipping);

  $('#odTitle').textContent = 'Pesanan ' + o.id;
  $('#orderBody').innerHTML = `
    <div class="row-between" style="margin-bottom:14px">
      <span class="status" style="background:${st.bg};color:${st.color}">${st.label}</span>
      <span class="small muted">${formatDateTime(o.createdAt)}</span>
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
            <span class="order-line-info"><b>${esc(i.name)}</b>${i.variantLabel ? `<small>${esc(i.variantLabel)}</small>` : ''}<small>${i.qty} × ${rupiah(i.price)}</small></span>
            <b class="order-line-price">${rupiah(i.price * i.qty)}</b>
          </div>`
          )
          .join('')}
      </div>
    </div>

    <div class="review-box">
      <header><span>Rincian</span></header>
      <div class="rb-body">
        <div class="rb-row"><span>Subtotal</span><span>${rupiah(o.subtotal)}</span></div>
        <div class="rb-row"><span>Ongkos kirim (${esc(ship ? ship.name : o.shipping)})</span><span>${rupiah(o.shippingCost)}</span></div>
        ${o.paymentFee ? `<div class="rb-row"><span>Biaya layanan</span><span>${rupiah(o.paymentFee)}</span></div>` : ''}
        <div class="rb-row"><span style="font-weight:800">Total</span><span style="font-weight:800">${rupiah(o.total)}</span></div>
        <div class="rb-row"><span>Metode bayar</span><span>${pay ? pay.icon + ' ' + esc(pay.name) : esc(o.payment)}</span></div>
      </div>
    </div>

    <div class="review-box" style="margin-top:12px">
      <header><span>Riwayat Status</span><span>${o.statusHistory.length} perubahan</span></header>
      <div class="rb-body">
        ${o.statusHistory
          .slice()
          .reverse()
          .map((h) => {
            const hs = ORDER_STATUS[h.status] || ORDER_STATUS.menunggu;
            return `<div class="rb-row">
              <span><span class="status" style="background:${hs.bg};color:${hs.color}">${hs.label}</span> <span class="small muted">${esc(h.note || '')}</span></span>
              <span class="small muted nowrap">${formatDateTime(h.at)}</span>
            </div>`;
          })
          .join('')}
      </div>
    </div>

    <div class="field" style="margin-top:14px">
      <label for="odResi">Nomor resi</label>
      <div class="row" style="gap:8px">
        <input class="input" id="odResi" value="${esc(o.resi || '')}" placeholder="Kosongkan untuk dibuat otomatis">
        <button class="btn" id="odResiSave">Simpan</button>
        <button class="btn btn-ghost" id="odResiNew">Buat Baru</button>
      </div>
      <span class="hint">Resi otomatis dibuat saat status diubah ke Dikirim, tapi tetap bisa diganti manual.</span>
    </div>

    <div class="field" style="margin-top:14px">
      <label>Ubah status pesanan</label>
      <div class="opt-list">
        ${Object.entries(ORDER_STATUS)
          .map(
            ([k, v]) => `
          <button class="opt ${o.status === k ? 'is-active' : ''}" data-set-status="${k}">
            <span class="o-icon" style="background:${v.bg};color:${v.color}">●</span>
            <span class="o-text"><span class="o-name">${v.label}</span></span>
            <span class="o-radio"></span>
          </button>`
          )
          .join('')}
      </div>
    </div>

    <div class="field" style="margin-top:14px">
      <label for="odCancelReason">Alasan pembatalan</label>
      <input class="input" id="odCancelReason" value="${esc(o.cancelReason || '')}" placeholder="Wajib diisi kalau statusnya Batal">
      <span class="hint">Alasan ini muncul di halaman lacik paket dan akun pembeli.</span>
    </div>`;

  $('#orderFoot').innerHTML = `
    <button class="btn" id="odDelete">Hapus</button>
    <button class="btn btn-primary" data-close>Tutup</button>`;

  $('#odDelete').addEventListener('click', () => {
    admin.confirmAction = () => {
      Store.deleteOrder(o.id);
      closeModals();
      renderAll();
      toast('Pesanan ' + o.id + ' dihapus', 'success');
    };
    $('#confirmText').textContent = 'Hapus pesanan ' + o.id + '? Tindakan ini tidak bisa dibatalkan.';
    openModal('confirmModal');
  });

  $('#odResiSave').addEventListener('click', () => {
    const resi = $('#odResi').value.trim().toUpperCase();
    const fresh = Store.orders().find((x) => x.id === o.id);
    if (!fresh) return;
    fresh.resi = resi || null;
    Store.save();
    openOrder(o.id);
    renderAll();
    toast(resi ? 'Resi disimpan' : 'Resi dikosongkan', 'success');
  });

  $('#odResiNew').addEventListener('click', () => {
    const fresh = Store.orders().find((x) => x.id === o.id);
    if (!fresh) return;
    fresh.resi = Store.makeResi();
    Store.save();
    openOrder(o.id);
    renderAll();
    toast('Resi baru dibuat: ' + fresh.resi, 'success');
  });

  $('#orderBody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-set-status]');
    if (!btn) return;
    const status = btn.dataset.setStatus;
    const reason = $('#odCancelReason').value.trim();

    if (status === 'batal' && !reason) {
      toast('Isi alasan pembatalan dulu.', 'error');
      $('#odCancelReason').focus();
      return;
    }

    const resi = $('#odResi').value.trim().toUpperCase();
    if (resi) {
      const fresh = Store.orders().find((x) => x.id === o.id);
      if (fresh) fresh.resi = resi;
    }

    const res = Store.setOrderStatus(o.id, status, { reason: reason || undefined });
    if (!res.ok) return toast(res.error, 'error');

    renderAll();
    openOrder(o.id);
    toast('Status diubah ke ' + ORDER_STATUS[status].label, 'success');
  });

  openModal('orderModal');
}

/* ------------------------------- Products ----------------------------- */

function renderProducts() {
  const q = admin.productSearch.trim().toLowerCase();
  const list = Store.products().filter((p) => {
    if (!q) return true;
    return (p.name + ' ' + categoryName(p.category)).toLowerCase().includes(q);
  });

  $('#view-products').innerHTML = `
    <div class="admin-toolbar">
      <div class="search-wrap">
        <span class="s-icon">🔍</span>
        <input type="search" id="prodSearch" placeholder="Cari produk…" aria-label="Cari produk" value="${esc(admin.productSearch)}">
      </div>
      <select class="input" id="prodCat" aria-label="Saring kategori produk" style="height:40px">
        <option value="semua">Semua kategori</option>
        ${CATEGORIES.map((c) => `<option value="${c.slug}">${c.name}</option>`).join('')}
      </select>
      <button class="btn btn-primary" id="prodAdd">+ Tambah Produk</button>
    </div>

    <div class="panel">
      <div class="panel-body flush">
        ${list.length
          ? `<div class="table-scroll"><table class="data">
              <thead>
                <tr><th>Produk</th><th>Harga</th><th>Stok</th><th>Terjual</th><th>Rating</th><th class="num">Aksi</th></tr>
              </thead>
              <tbody>
                ${list
                  .map((p) => {
                    const pct = Math.min(100, (p.stock / 40) * 100);
                    const level = p.stock === 0 ? 'out' : p.stock <= 10 ? 'low' : '';
                    return `<tr data-cat="${p.category}">
                      <td>
                        <div class="td-product">
                          ${productPhoto(p, 'product-photo')}
                          <span>
                            <span class="tp-name">${esc(p.name)}</span>${p.featured ? ' <span class="tag-featured" title="Tampil di Produk Unggulan">⭐ unggulan</span>' : ''}<br>
                            <span class="tp-cat">${esc(categoryName(p.category))}</span>
                          </span>
                        </div>
                      </td>
                      <td class="num nowrap">
                        <b>${rupiah(productSalePrice(p))}</b>
                        ${p.discountPercent ? `<br><del class="admin-old-price">${rupiah(p.price)}</del> <span class="tag-featured">-${Number(p.discountPercent)}%</span>` : ''}
                      </td>
                      <td class="nowrap">
                        <div class="row" style="gap:8px">
                          <span class="meter ${level}"><i style="width:${pct}%"></i></span>
                          <span class="${p.stock === 0 ? 'stock-tag stock-out' : p.stock <= 10 ? 'stock-tag stock-low' : 'stock-tag stock-ok'}">${p.stock}</span>
                        </div>
                      </td>
                      <td class="num">${p.sold}</td>
                      <td class="nowrap small">★ ${p.rating.toFixed(1)} <span class="muted">(${p.reviews})</span></td>
                      <td>
                        <div class="row-actions">
                          <button class="mini-btn" data-edit="${p.id}">Ubah</button>
                          <button class="mini-btn mini-btn-danger" data-del="${p.id}">Hapus</button>
                        </div>
                      </td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
            </table></div>`
          : '<div class="panel-body"><p class="muted small">Produk tidak ditemukan.</p></div>'}
      </div>
    </div>`;

  const applyCat = () => {
    const value = $('#prodCat').value;
    $$('#view-products tbody tr').forEach((tr) => {
      tr.hidden = value !== 'semua' && tr.dataset.cat !== value;
    });
  };

  $('#prodSearch').addEventListener('input', (e) => {
    admin.productSearch = e.target.value;
    const pos = e.target.selectionStart;
    renderProducts();
    const input = $('#prodSearch');
    input.focus();
    input.setSelectionRange(pos, pos);
  });

  $('#prodCat').addEventListener('change', applyCat);
  applyCat();

  $('#prodAdd').addEventListener('click', () => openProductForm(null));
}

function openProductForm(id) {
  const p = id ? Store.findProduct(id) : null;
  admin.editingId = id || null;
  $('#pfTitle').textContent = p ? 'Ubah Produk' : 'Tambah Produk';
  /* Teks pesan lama ikut dibersihkan, bukan cuma disembunyikan */
  $('#pfError').textContent = '';
  $('#pfError').classList.add('hidden');

  if (!$('#pfCat').options.length) {
    $('#pfCat').innerHTML = CATEGORIES.map((c) => `<option value="${c.slug}">${c.icon} ${c.name}</option>`).join('');
  }

  $('#pfName').value = p ? p.name : '';
  $('#pfCat').value = p ? p.category : CATEGORIES[0].slug;
  $('#pfPrice').value = p ? p.price : '';
  $('#pfStock').value = p ? p.stock : '';
  $('#pfVariantName').value = p ? p.variantName || '' : '';
  $('#pfVariants').value = p && p.variants?.length
    ? p.variants.map((variant) => `${variant.label} | ${variant.stock}`).join('\n')
    : '';
  syncVariantStock();
  $('#pfWeight').value = p ? p.weight ?? '' : '';
  $('#pfShort').value = p ? p.short : '';
  $('#pfDesc').value = p ? p.desc : '';
  $('#pfMaterial').value = p ? p.material || '' : '';
  $('#pfDimensions').value = p ? p.dimensions || '' : '';
  $('#pfCare').value = p ? p.care || '' : '';
  $('#pfTags').value = p ? (p.tags || []).join(', ') : '';
  $('#pfDiscount').value = p ? p.discountPercent || 0 : 0;
  $('#pfFeatured').checked = p ? p.featured === true : false;
  $('#pfImages').value = '';

  admin.images = p ? Store.productImages(p).slice() : [];
  admin.primaryImage = 0;
  renderImageStrip();

  openModal('productFormModal');
  $('#pfName').focus();
}

/* ------------------------- Foto produk (kompresi) --------------------- */

const MAX_IMAGES = 4;
const MAX_EDGE = 720;
const JPEG_QUALITY = 0.72;

function renderImageStrip() {
  const wrap = $('#pfImageWrap');
  const strip = $('#pfImageStrip');
  if (!wrap || !strip) return;

  if (!admin.images.length) {
    wrap.classList.add('hidden');
    strip.innerHTML = '';
    return;
  }

  wrap.classList.remove('hidden');
  strip.innerHTML = admin.images
    .map(
      (src, i) => `
      <div class="img-cell">
        <img src="${src}" alt="Foto produk ${i + 1}">
        <button class="img-star ${admin.primaryImage === i ? 'is-on' : ''}" data-img-main="${i}" title="Jadikan foto utama">★</button>
        <button class="img-rm" data-img-rm="${i}" title="Hapus foto">✕</button>
      </div>`
    )
    .join('');
}

/* Canvas supaya foto yang disimpan tetap ringan untuk localStorage */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File tidak terbaca.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format foto tidak didukung.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleImagePick(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const room = MAX_IMAGES - admin.images.length;
  if (room <= 0) return toast('Maksimal ' + MAX_IMAGES + ' foto per produk.', 'error');

  toast('Memproses ' + Math.min(files.length, room) + ' foto...');
  let added = 0;
  for (const file of files.slice(0, room)) {
    if (!/^image\//.test(file.type)) continue;
    try {
      admin.images.push(await compressImage(file));
      added += 1;
    } catch (err) {
      toast(file.name + ' gagal diproses.', 'error');
    }
  }
  renderImageStrip();
  if (added) toast(added + ' foto ditambahkan ke draft produk.', 'success');
  e.target.value = '';
}

function showFormError(msg) {
  const box = $('#pfError');
  box.textContent = msg;
  box.classList.remove('hidden');
}

function parseProductVariants() {
  const lines = $('#pfVariants').value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { ok: true, variants: [], total: null };
  if (lines.length > 100) return { ok: false, error: 'Maksimal 100 pilihan variasi per produk.' };
  const variants = [];
  const seen = new Set();
  for (const line of lines) {
    const separator = line.lastIndexOf('|');
    if (separator < 1) return { ok: false, error: 'Setiap opsi variasi harus memakai format Nama opsi | stok.' };
    const label = line.slice(0, separator).trim();
    const stockText = line.slice(separator + 1).trim();
    if (!label || label.length > 60 || !/^\d+$/.test(stockText)) {
      return { ok: false, error: 'Nama opsi maksimal 60 karakter dan stok harus berupa bilangan bulat nol atau lebih.' };
    }
    const id = variantIdForLabel(label);
    if (seen.has(id)) return { ok: false, error: 'Nama opsi variasi harus unik.' };
    seen.add(id);
    const stock = Number(stockText);
    if (!Number.isSafeInteger(stock)) {
      return { ok: false, error: 'Stok variasi harus berupa bilangan bulat yang aman disimpan.' };
    }
    variants.push({ id, label, stock });
  }
  const total = variants.reduce((sum, variant) => sum + variant.stock, 0);
  if (!Number.isSafeInteger(total)) return { ok: false, error: 'Jumlah stok seluruh variasi terlalu besar.' };
  return { ok: true, variants, total };
}

function syncVariantStock() {
  const stockInput = $('#pfStock');
  const hint = $('#pfStockHint');
  const parsed = parseProductVariants();
  if ($('#pfVariants').value.trim()) {
    stockInput.readOnly = true;
    if (parsed.ok) stockInput.value = parsed.total;
    hint.textContent = parsed.ok ? 'Stok total dihitung dari semua opsi variasi.' : parsed.error;
    hint.classList.toggle('field-error', !parsed.ok);
  } else {
    stockInput.readOnly = false;
    hint.textContent = 'Untuk produk bervariasi, stok total dihitung dari setiap opsi.';
    hint.classList.remove('field-error');
  }
}

function saveProduct() {
  const name = $('#pfName').value.trim();
  const category = $('#pfCat').value;
  const price = parseInt($('#pfPrice').value, 10);
  const stockRaw = $('#pfStock').value.trim();
  const parsedVariants = parseProductVariants();
  if (!parsedVariants.ok) return showFormError(parsedVariants.error);
  const variants = parsedVariants.variants;
  const variantName = $('#pfVariantName').value.trim();
  const stock = variants.length ? parsedVariants.total : /^\d+$/.test(stockRaw) ? Number(stockRaw) : NaN;
  /* Jangan pakai "|| 0.2" karena 0 dianggap kosong lalu jadi 0.2 diam-diam */
  const weightRaw = $('#pfWeight').value.trim();
  const weight = weightRaw === '' ? 0.2 : parseFloat(weightRaw);
  const short = $('#pfShort').value.trim();
  const desc = $('#pfDesc').value.trim();
  const material = $('#pfMaterial').value.trim();
  const dimensions = $('#pfDimensions').value.trim();
  const care = $('#pfCare').value.trim();
  const tags = $('#pfTags').value.split(',').map((t) => t.trim()).filter(Boolean);
  const discountPercent = num($('#pfDiscount').value);
  const featured = $('#pfFeatured').checked;

  if (name.length < 3) return showFormError('Nama produk minimal 3 huruf.');
  if (variants.length && !variantName) return showFormError('Isi nama variasi, misalnya Ukuran atau Warna.');
  if (!Number.isFinite(price) || price <= 0) return showFormError('Harga harus angka lebih besar dari nol.');
  if (!Number.isSafeInteger(stock) || stock < 0) return showFormError('Stok harus bilangan bulat nol atau lebih.');
  if (short.length < 10) return showFormError('Ringkasan singkat minimal 10 huruf.');
  if (desc.length < 20) return showFormError('Deskripsi minimal 20 huruf.');
  if (!Number.isFinite(weight) || weight <= 0) return showFormError('Berat harus lebih besar dari nol.');
  if (discountPercent < 0 || discountPercent > 90) return showFormError('Diskon harus antara 0 sampai 90 persen.');

  const existing = admin.editingId ? Store.findProduct(admin.editingId) : null;

  /* Foto utama selalu disimpan di urutan pertama supaya galeri storefront konsisten */
  const images = admin.images.slice();
  if (admin.primaryImage > 0 && images.length) {
    images.unshift(images.splice(admin.primaryImage, 1)[0]);
  }
  if (!images.length) return showFormError('Tambahkan minimal satu foto produk.');

  const payload = {
    name,
    category,
    price,
    stock,
    variantName: variants.length ? variantName : '',
    variants,
    icon: existing?.icon || '',
    weight,
    short,
    desc,
    material,
    dimensions,
    care,
    tags,
    discountPercent,
    featured,
    images,
    rating: existing ? existing.rating : 0,
    reviews: existing ? existing.reviews : 0,
    sold: existing ? existing.sold : 0,
  };

  const saved = Store.saveProduct(payload, admin.editingId);
  if (!saved) {
    Store.load();
    return showFormError('Foto terlalu besar untuk disimpan di browser. Kurangi jumlah foto atau gunakan foto yang lebih kecil.');
  }

  closeModals();
  renderAll();
  toast(admin.editingId ? 'Produk diperbarui' : 'Produk ditambahkan', 'success');
  admin.editingId = null;
  admin.images = [];
  admin.primaryImage = 0;
}

function deleteProduct(id) {
  const p = Store.findProduct(id);
  if (!p) return;
  admin.confirmAction = () => {
    Store.deleteProduct(id);
    closeModals();
    renderAll();
    toast(p.name + ' dihapus', 'success');
  };
  $('#confirmText').textContent = 'Hapus produk "' + p.name + '"? Barang ini juga akan hilang dari keranjang pembeli.';
  openModal('confirmModal');
}

function deleteOrder(id) {
  const o = Store.orders().find((x) => x.id === id);
  if (!o) return;
  admin.confirmAction = () => {
    const res = Store.deleteOrder(id);
    closeModals();
    renderAll();
    toast('Pesanan ' + id + ' dihapus' + (res && res.restored ? ', stok dikembalikan' : ''), 'success');
  };
  const backStock = o.status !== 'selesai' && o.status !== 'batal';
  $('#confirmText').textContent =
    'Hapus pesanan ' + id + ' dari ' + o.customer.name + '?' +
    (backStock ? ' Barang yang belum diterima akan dikembalikan ke stok.' : '');
  openModal('confirmModal');
}

/* ------------------------------ Customers ----------------------------- */

function renderCustomers() {
  const customers = Store.users().filter((u) => u.role === 'customer');

  $('#view-customers').innerHTML = `
    <div class="panel">
      <header><h3>Daftar Pembeli</h3><span class="badge badge-outline">${customers.length} akun</span></header>
      <div class="panel-body flush">
        ${customers.length
          ? `<div class="table-scroll"><table class="data">
              <thead>
                <tr><th>Nama</th><th>Email</th><th>Pesanan</th><th>Total Belanja</th><th>Bergabung</th></tr>
              </thead>
              <tbody>
                ${customers
                  .map((u) => {
                    const orders = Store.orders().filter((o) => o.userId === u.id);
                    const spent = orders.filter((o) => o.status !== 'batal').reduce((s, o) => s + o.total, 0);
                    return `<tr>
                      <td>
                        <div class="row" style="gap:10px">
                          <span class="avatar" style="width:32px;height:32px;font-size:12px">${esc(u.name.slice(0, 2).toUpperCase())}</span>
                          <b>${esc(u.name)}</b>
                        </div>
                      </td>
                      <td class="small muted">${esc(u.email)}</td>
                      <td class="num">${orders.length}</td>
                      <td class="num"><b>${rupiah(spent)}</b></td>
                      <td class="nowrap small muted">${orders.length ? formatDate(orders[orders.length - 1].createdAt) : '-'}</td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
            </table></div>`
          : '<div class="panel-body"><p class="muted small">Belum ada pembeli terdaftar.</p></div>'}
      </div>
    </div>

    <div class="warn-box" style="margin-top:16px">
      <span>🔒</span>
      <span>Password pada prototype ini disimpan apa adanya di localStorage. Jangan pernah melakukan hal ini di server sungguhan.</span>
    </div>`;
}

/* ------------------------------ Reviews ------------------------------- */

function filteredReviews() {
  let rows = Store.allReviews().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (admin.reviewFilter !== 'semua') rows = rows.filter((r) => r.status === admin.reviewFilter);
  return rows;
}

function renderReviews() {
  const rows = filteredReviews();
  const all = Store.allReviews();
  const counts = {
    semua: all.length,
    pending: all.filter((r) => r.status === 'pending').length,
    published: all.filter((r) => r.status === 'published').length,
    hidden: all.filter((r) => r.status === 'hidden').length,
  };

  $('#view-reviews').innerHTML = `
    <div class="panel">
      <header>
        <h3>Moderasi Ulasan</h3>
        <div class="seg" role="tablist" aria-label="Saring ulasan">
          ${[
            ['semua', 'Semua'],
            ['pending', 'Menunggu'],
            ['published', 'Tayang'],
            ['hidden', 'Disembunyikan'],
          ]
            .map(
              ([slug, label]) =>
                `<button class="seg-btn ${admin.reviewFilter === slug ? 'is-active' : ''}" data-rfilter="${slug}">${label} (${counts[slug]})</button>`
            )
            .join('')}
        </div>
      </header>
      <div class="panel-body">
        ${
          rows.length
            ? `<div style="display:grid;gap:12px">
                ${rows
                  .map((r) => {
                    const p = Store.findProduct(r.productId);
                    const st = REVIEW_STATUS[r.status] || REVIEW_STATUS.pending;
                    return `
                    <article class="review-item is-${r.status}">
                      <div class="ri-head">
                        <span class="avatar" style="width:34px;height:34px;font-size:12px">${esc(r.author.slice(0, 2).toUpperCase())}</span>
                        <span class="grow">
                          <b>${esc(r.author)}</b>
                          <span class="tiny muted">• ${formatDate(r.createdAt)}</span>
                          <br>
                          ${p ? `<span class="review-product">${productPhoto(p, 'product-photo product-photo-xs')}<span class="tiny muted">${esc(p.name)}</span></span>` : '<span class="tiny muted">Produk sudah dihapus</span>'}
                        </span>
                        <span class="status" style="background:${st.bg};color:${st.color}">${st.label}</span>
                      </div>
                      <div class="ri-stars">${starsHtml(r.rating)}<span class="tiny muted">${r.rating} dari 5</span></div>
                      <p class="ri-text">${esc(r.text)}</p>
                      ${r.reply ? `<div class="ri-reply"><b>Balasan toko</b><br>${esc(r.reply)}</div>` : ''}
                      <div class="ri-actions">
                        ${
                          r.status !== 'published'
                            ? `<button class="btn btn-sm btn-primary" data-rpub="${r.id}">Tayangkan</button>`
                            : ''
                        }
                        ${
                          r.status !== 'hidden'
                            ? `<button class="btn btn-sm" data-rhide="${r.id}">Sembunyikan</button>`
                            : ''
                        }
                        ${
                          r.status === 'pending'
                            ? `<button class="btn btn-sm" data-rdel="${r.id}">Tolak</button>`
                            : `<button class="btn btn-sm btn-ghost" data-rdel="${r.id}">Hapus</button>`
                        }
                        <button class="btn btn-sm btn-ghost" data-rreply="${r.id}">${r.reply ? 'Ubah Balasan' : 'Balas'}</button>
                      </div>
                    </article>`;
                  })
                  .join('')}
              </div>`
            : '<div class="empty"><div class="e-icon">⭐</div><h3>Belum ada ulasan di saringan ini</h3><p>Ulasan pembeli akan muncul di sini setelah pesanan selesai.</p></div>'
        }
      </div>
    </div>`;
}

/* ------------------------------ Vouchers ------------------------------ */

function voucherStateLabel(v) {
  if (!v.active) return { label: 'Nonaktif', cls: 'stock-out' };
  if (v.expiresAt && new Date(v.expiresAt).getTime() < Date.now()) return { label: 'Kedaluwarsa', cls: 'stock-out' };
  if (v.quota && v.used >= v.quota) return { label: 'Kuota Habis', cls: 'stock-low' };
  return { label: 'Aktif', cls: 'stock-in' };
}

function voucherValueLabel(v) {
  if (v.type === 'percent') return v.value + '%';
  if (v.type === 'freeship') return 'Gratis ongkir';
  return rupiah(v.value);
}

function renderVouchers() {
  const rows = Store.vouchers().slice().sort((a, b) => (a.code < b.code ? -1 : 1));
  const activeCount = rows.filter((v) => voucherStateLabel(v).label === 'Aktif').length;

  $('#view-vouchers').innerHTML = `
    <div class="panel">
      <header>
        <h3>Daftar Voucher <span class="muted small">${activeCount} aktif dari ${rows.length}</span></h3>
        <button class="btn btn-primary btn-sm" id="vAdd">+ Voucher Baru</button>
      </header>
      <div class="panel-body flush">
        ${
          rows.length
            ? `<div class="table-scroll"><table class="data">
                <thead>
                  <tr><th>Kode</th><th>Potongan</th><th>Minimum</th><th>Kuota</th><th>Berlaku</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  ${rows
                    .map((v) => {
                      const st = voucherStateLabel(v);
                      return `<tr>
                        <td><b>${esc(v.code)}</b><br><span class="tiny muted">${esc(v.desc || '')}</span></td>
                        <td class="nowrap">${voucherValueLabel(v)}</td>
                        <td class="num nowrap">${v.minSpend ? rupiah(v.minSpend) : '-'}</td>
                        <td class="num">${v.used} / ${v.quota || '∞'}</td>
                        <td class="nowrap small muted">${v.expiresAt ? formatDate(v.expiresAt) : 'Tanpa batas'}</td>
                        <td><span class="stock-tag ${st.cls}">${st.label}</span></td>
                        <td class="num nowrap">
                          <button class="mini-btn" data-vedit="${esc(v.code)}">Ubah</button>
                          <button class="mini-btn" data-vtoggle="${esc(v.code)}">${v.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                          <button class="mini-btn danger" data-vdel="${esc(v.code)}">Hapus</button>
                        </td>
                      </tr>`;
                    })
                    .join('')}
                </tbody>
              </table></div>`
            : '<div class="panel-body"><p class="muted small">Belum ada voucher.</p></div>'
        }
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <header><h3>Cara Kerja Voucher di Storefront</h3></header>
      <div class="panel-body">
        <ul class="mini-list">
          <li>Potongan persen dan tetap dihitung setelah subtotal, sebelum ongkir.</li>
          <li>Voucher gratis ongkir membebaskan ongkir selama total belanja masih di bawah ambang gratis ongkir.</li>
          <li>Potongan punya batas maksimal per pemakaian supaya tidak melebihi subtotal.</li>
          <li>Voucher aktif ditampilkan otomatis pada promo di halaman depan.</li>
          <li>Kuota bertambah setiap kali pembeli menekan tombol bayar di halaman checkout.</li>
          <li>Voucher nonaktif atau kedaluwarsa otomatis ditolak di halaman checkout.</li>
        </ul>
      </div>
    </div>`;
}

function openVoucherForm(code) {
  const v = code ? Store.findVoucher(code) : null;
  admin.editingVoucher = v ? v.code : null;
  $('#vfTitle').textContent = v ? 'Ubah Voucher ' + v.code : 'Tambah Voucher';
  $('#vfError').textContent = '';
  $('#vfError').classList.add('hidden');
  $('#vfCode').value = v ? v.code : '';
  $('#vfCode').disabled = !!v;
  $('#vfType').value = v ? v.type : 'percent';
  $('#vfValue').value = v ? v.value : '';
  $('#vfMax').value = v ? v.maxDiscount || 0 : 0;
  $('#vfMin').value = v ? v.minSpend || 0 : 0;
  $('#vfQuota').value = v ? v.quota || 0 : 100;
  $('#vfExpires').value = v && v.expiresAt ? v.expiresAt.slice(0, 10) : '';
  $('#vfDesc').value = v ? v.desc || '' : '';
  openModal('voucherFormModal');
}

function saveVoucher() {
  const err = $('#vfError');
  const show = (msg) => {
    err.textContent = msg;
    err.classList.remove('hidden');
  };

  const existing = admin.editingVoucher ? Store.findVoucher(admin.editingVoucher) : null;
  const code = (existing ? existing.code : $('#vfCode').value.trim().toUpperCase());
  const type = $('#vfType').value;
  const value = num($('#vfValue').value);
  const maxDiscount = num($('#vfMax').value);
  const minSpend = num($('#vfMin').value);
  const quota = num($('#vfQuota').value);
  const desc = $('#vfDesc').value.trim();
  const expiresRaw = $('#vfExpires').value;

  if (!code) return show('Kode voucher wajib diisi.');
  if (!/^[A-Z0-9]{3,20}$/.test(code)) return show('Kode voucher 3-20 karakter, hanya huruf dan angka.');
  if (type !== 'freeship' && value <= 0) return show('Nilai voucher harus lebih dari nol.');
  if (type === 'percent' && value > 90) return show('Diskon persen maksimal 90%.');
  if (quota <= 0) return show('Kuota pemakaian harus lebih dari nol.');
  if (minSpend < 0 || maxDiscount < 0) return show('Nominal tidak boleh negatif.');
  if (quota < (existing ? existing.used : 0)) {
    return show('Kuota tidak boleh lebih kecil dari jumlah pemakaian (' + (existing ? existing.used : 0) + ').');
  }
  if (!existing && Store.findVoucher(code)) return show('Kode voucher sudah dipakai.');

  const expiresAt = expiresRaw ? new Date(expiresRaw + 'T23:59:59').toISOString() : null;

  Store.saveVoucher({
    code,
    type,
    value: type === 'freeship' ? 0 : value,
    maxDiscount,
    minSpend,
    quota,
    used: existing ? existing.used : 0,
    active: existing ? existing.active : true,
    expiresAt,
    desc,
  });

  closeModals();
  renderAll();
  toast('Voucher ' + code + (admin.editingVoucher ? ' diperbarui' : ' dibuat'), 'success');
}

function toggleVoucher(code) {
  const v = Store.findVoucher(code);
  if (!v) return;
  Store.saveVoucher({ ...v, active: !v.active });
  renderAll();
  toast('Voucher ' + code + (v.active ? ' dinonaktifkan' : ' diaktifkan'), 'success');
}

function deleteVoucher(code) {
  const v = Store.findVoucher(code);
  if (!v) return;
  admin.confirmAction = () => {
    Store.deleteVoucher(code);
    renderAll();
    toast('Voucher ' + code + ' dihapus', 'success');
  };
  $('#confirmText').textContent = 'Hapus voucher ' + code + '? Voucher yang sudah dipakai tidak akan dikembalikan kuotanya.';
  openModal('confirmModal');
}

function replyToReview(id) {
  const r = Store.allReviews().find((x) => x.id === id);
  if (!r) return;

  const box = $('#reviewReplyModal');
  $('#rrId').textContent = r.id;
  $('#rrName').textContent = r.author;
  $('#rrText').textContent = r.text;
  $('#rrInput').value = r.reply || '';
  openModal('reviewReplyModal');
  $('#rrInput').focus();
}

function saveReviewReply() {
  const id = $('#rrId').textContent;
  const text = $('#rrInput').value.trim();
  Store.replyReview(id, text);
  closeModals();
  renderAll();
  toast(text ? 'Balasan tersimpan' : 'Balasan dihapus', 'success');
}

function deleteReview(id) {
  const r = Store.allReviews().find((x) => x.id === id);
  if (!r) return;
  const isPending = r.status === 'pending';
  admin.confirmAction = () => {
    Store.deleteReview(id);
    renderAll();
    toast(isPending ? 'Ulasan ditolak' : 'Ulasan ' + id + ' dihapus', 'success');
  };
  $('#confirmText').textContent = isPending
    ? 'Tolak ulasan dari ' + r.author + '? Ulasan tidak akan tayang dan rating produk dihitung ulang.'
    : 'Hapus ulasan ' + id + ' dari ' + r.author + '? Rating produk ikut dihitung ulang.';
  openModal('confirmModal');
}

function setReviewStatus(id, status, label) {
  Store.setReviewStatus(id, status);
  renderAll();
  toast('Ulasan ' + label.toLowerCase() + ' untuk ' + id, 'success');
}

function deleteReview(id) {
  admin.confirmAction = () => {
    Store.deleteReview(id);
    renderAll();
    toast('Ulasan ' + id + ' dihapus', 'success');
  };
  $('#confirmText').textContent = 'Hapus ulasan ' + id + '? Rating produk ikut dihitung ulang.';
  openModal('confirmModal');
}

/* ------------------------------ Render all ---------------------------- */

function renderView(view) {
  if (view === 'dashboard') renderDashboard();
  else if (view === 'orders') renderOrders();
  else if (view === 'products') renderProducts();
  else if (view === 'reviews') renderReviews();
  else if (view === 'vouchers') renderVouchers();
  else if (view === 'customers') renderCustomers();
}

function renderAll() {
  const pendingOrders = Store.orders().filter((o) => o.status === 'menunggu').length;
  const pendingReviews = Store.allReviews().filter((r) => r.status === 'pending').length;

  const orderPill = $('#navOrderCount');
  if (orderPill) {
    orderPill.textContent = pendingOrders;
    orderPill.classList.toggle('is-hot', pendingOrders > 0);
  }
  const reviewPill = $('#navReviewCount');
  if (reviewPill) {
    reviewPill.textContent = pendingReviews;
    reviewPill.classList.toggle('is-hot', pendingReviews > 0);
  }

  renderView(admin.view);
}

/* -------------------------------- Events ------------------------------ */

function bindEvents() {
  overlay.addEventListener('click', closeModals);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModals();
  });

  $('#adminLoginForm').addEventListener('submit', handleLogin);

  $('#adminLogout').addEventListener('click', () => {
    Store.logout();
    showLogin();
    toast('Kamu sudah keluar dari panel admin');
  });

  $('#adminBurger').addEventListener('click', () => {
    $('#adminSide').classList.toggle('is-open');
    overlay.classList.toggle('is-open', $('#adminSide').classList.contains('is-open'));
  });

  $('#pfSave').addEventListener('click', saveProduct);
  $('#pfImages').addEventListener('change', handleImagePick);
  $('#pfVariants').addEventListener('input', syncVariantStock);
  $('#vfSave').addEventListener('click', saveVoucher);
  $('#vfType').addEventListener('change', () => {
    const type = $('#vfType').value;
    $('#vfValueHint').textContent =
      type === 'percent'
        ? 'Contoh: 10 berarti diskon 10 persen.'
        : type === 'fixed'
          ? 'Potongan dalam rupiah, contoh: 25000.'
          : 'Nilai diabaikan, gratis ongkir cukup dari belanja minimal.';
  });
  $('#rrSave').addEventListener('click', saveReviewReply);

  $('#confirmOk').addEventListener('click', () => {
    const action = admin.confirmAction;
    admin.confirmAction = null;
    closeModals();
    if (action) action();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeModals(); return; }

    const nav = e.target.closest('[data-view]');
    if (nav) { setView(nav.dataset.view); return; }

    const goto = e.target.closest('[data-goto]');
    if (goto) { setView(goto.dataset.goto); return; }

    const edit = e.target.closest('[data-edit]');
    if (edit) { openProductForm(edit.dataset.edit); return; }

    const del = e.target.closest('[data-del]');
    if (del) { deleteProduct(del.dataset.del); return; }

    const order = e.target.closest('[data-order]');
    if (order) { openOrder(order.dataset.order); return; }

    const delOrder = e.target.closest('[data-del-order]');
    if (delOrder) { deleteOrder(delOrder.dataset.delOrder); return; }

    /* ---------- ulasan ---------- */
    const rFilter = e.target.closest('[data-rfilter]');
    if (rFilter) { admin.reviewFilter = rFilter.dataset.rfilter; renderReviews(); return; }

    const rPub = e.target.closest('[data-rpub]');
    if (rPub) { setReviewStatus(rPub.dataset.rpub, 'published', 'Ditayangkan'); return; }

    const rHide = e.target.closest('[data-rhide]');
    if (rHide) { setReviewStatus(rHide.dataset.rhide, 'hidden', 'Disembunyikan'); return; }

    const rReply = e.target.closest('[data-rreply]');
    if (rReply) { replyToReview(rReply.dataset.rreply); return; }

    const rDel = e.target.closest('[data-rdel]');
    if (rDel) { deleteReview(rDel.dataset.rdel); return; }

    /* ---------- voucher ---------- */
    if (e.target.closest('#vAdd')) { openVoucherForm(null); return; }

    const vEdit = e.target.closest('[data-vedit]');
    if (vEdit) { openVoucherForm(vEdit.dataset.vedit); return; }

    const vToggle = e.target.closest('[data-vtoggle]');
    if (vToggle) { toggleVoucher(vToggle.dataset.vtoggle); return; }

    const vDel = e.target.closest('[data-vdel]');
    if (vDel) { deleteVoucher(vDel.dataset.vdel); return; }

    /* ---------- foto produk ---------- */
    const imgMain = e.target.closest('[data-img-main]');
    if (imgMain) { admin.primaryImage = Number(imgMain.dataset.imgMain); renderImageStrip(); return; }

    const imgRm = e.target.closest('[data-img-rm]');
    if (imgRm) {
      const idx = Number(imgRm.dataset.imgRm);
      admin.images.splice(idx, 1);
      if (admin.primaryImage >= admin.images.length) admin.primaryImage = 0;
      else if (admin.primaryImage > idx) admin.primaryImage -= 1;
      renderImageStrip();
      return;
    }
  });

  setInterval(updateClock, 30000);
}

/* --------------------------------- Init -------------------------------- */

function init() {
  Store.load();
  bindEvents();
  updateClock();

  if (isAdmin()) {
    showApp();
    setView('dashboard');
  } else {
    showLogin();
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'tks_db_v1') {
      Store.load();
      if (!isAdmin()) showLogin();
      else renderAll();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);