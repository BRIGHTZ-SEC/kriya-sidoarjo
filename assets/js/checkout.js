/* ============================================================================
   Toko Kriya Sidoarjo — checkout.js
   Halaman checkout (wajib login): data penerima, metode pengiriman,
   metode pembayaran, voucher, lalu buat pesanan lewat RPC place_order.
   Harga & ongkir dihitung ULANG oleh server — tidak percaya hitungan klien.
   ========================================================================== */

import { initLayout } from './layout.js';
import { icon } from './icons.js';
import {
  qs, qsa, esc, num, rupiah, toast, emptyState, errMsg, confirmAction, productImage,
} from './ui.js';
import { getSettings, placeOrder, applyVoucher, UNCONFIGURED } from './api.js';
import { cartSummary, clearCart, getStoredVoucher, clearVoucher } from './cart.js';
import { getUser, initAuth } from './auth.js';

initLayout({ active: 'katalog' });

const root = qs('#co-root');

/* State form */
let shippingMethod = 'reguler';
let paymentMethod = 'transfer';
let voucher = getStoredVoucher();
let placing = false;

const PAYMENTS = [
  { id: 'transfer', label: 'Transfer Bank', desc: 'BCA / BRI / Mandiri — konfirmasi via WhatsApp', icon: 'bank' },
  { id: 'qris', label: 'QRIS', desc: 'Scan semua e-wallet & mobile banking', icon: 'smartphone' },
  { id: 'ewallet', label: 'E-Wallet', desc: 'OVO / GoPay / DANA', icon: 'wallet' },
  { id: 'cod', label: 'Bayar di Tempat (COD)', desc: 'Hanya area Sidoarjo & Surabaya (+biaya Rp5.000)', icon: 'banknote' },
];

function shippingOptions(settings) {
  return [
    { id: 'reguler', label: 'Reguler', desc: 'Estimasi 3–6 hari kerja', cost: Number(settings.regular_cost) },
    { id: 'express', label: 'Express', desc: 'Estimasi 1–3 hari kerja', cost: Number(settings.express_cost) },
    { id: 'same-day', label: 'Same Day', desc: 'Sampai hari ini (area tertentu)', cost: Number(settings.sameday_cost) },
  ];
}

/* Hitung ongkir klien (hanya buat tampilan — server menghitung ulang) */
function calcShipping(settings, summary) {
  let cost = { reguler: settings.regular_cost, express: settings.express_cost, 'same-day': settings.sameday_cost }[shippingMethod];
  cost = Number(cost || 0);
  if (shippingMethod === 'reguler' && summary.weight > 5) cost += 10000;
  const afterDiscount = summary.subtotal - summary.discount;
  if (voucher?.freeShip || afterDiscount >= Number(settings.free_shipping_min || 500000)) cost = 0;
  return cost;
}

function calcFee() {
  return paymentMethod === 'cod' ? 5000 : 0;
}

async function start() {
  /* Harus login dulu */
  const user = getUser();
  if (!user) {
    location.href = 'akun.html?next=' + encodeURIComponent('checkout.html');
    return;
  }

  const summary = await cartSummary();
  if (!summary.items.length) {
    root.innerHTML = `
      <div class="card card-pad">
        ${emptyState({
          icon: 'cart',
          title: 'Keranjangmu kosong',
          text: 'Pilih produk kriya dulu, nanti balik ke sini lagi.',
          action: '<a class="btn btn-primary btn-sm" href="katalog.html">Ke Katalog</a>',
        })}
      </div>`;
    return;
  }

  /* Voucher tersimpan bisa basi kalau subtotal berubah */
  if (voucher && summary.subtotal < (voucher.minSpend || 0)) {
    const res = await applyVoucher(voucher.code, summary.subtotal).catch(() => null);
    if (!res?.ok) {
      voucher = null;
      clearVoucher();
      toast('Voucher dilepas — minimal belanja belum terpenuhi.', 'info');
    } else {
      voucher = getStoredVoucher();
    }
  }

  const settings = await getSettings();
  renderCheckout(summary, settings, user);
}

function renderCheckout(summary, settings, user) {
  const shipCost = calcShipping(settings, summary);
  const fee = calcFee();
  const total = summary.afterDiscount + shipCost + fee;
  const codZones = (settings.cod_zones || []).join(', ');
  const savedCustomer = user.profile || {};

  root.innerHTML = `
  <div class="co-grid">
    <div class="co-main">

      <form id="co-form" class="co-main">
        <!-- 1. Data penerima -->
        <section class="card co-section">
          <h3><span class="step-n">1</span> Data Penerima</h3>
          <div class="form-grid">
            <div class="form-row">
              <div class="field">
                <label for="co-name">Nama lengkap</label>
                <input class="input" id="co-name" required autocomplete="name"
                       placeholder="cth. Bayu Pamungkas" value="${esc(savedCustomer.full_name || '')}">
              </div>
              <div class="field">
                <label for="co-phone">No. HP / WhatsApp</label>
                <input class="input" id="co-phone" required autocomplete="tel" inputmode="tel"
                       placeholder="cth. 081234567890" value="${esc(savedCustomer.phone || '')}">
              </div>
            </div>
            <div class="field">
              <label for="co-address">Alamat lengkap</label>
              <textarea class="input" id="co-address" required autocomplete="street-address" rows="2"
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan">${esc('')}</textarea>
            </div>
            <div class="form-row">
              <div class="field">
                <label for="co-city">Kota / Kecamatan</label>
                <input class="input" id="co-city" required autocomplete="address-level2"
                  placeholder="cth. Sidoarjo" list="cod-zones">
                <datalist id="cod-zones">
                  ${(settings.cod_zones || []).map((z) => `<option value="${esc(z)}">`).join('')}
                </datalist>
                <span class="hint">COD tersedia untuk: ${esc(codZones)}</span>
              </div>
              <div class="field">
                <label for="co-postal">Kode pos</label>
                <input class="input" id="co-postal" inputmode="numeric" placeholder="cth. 61234">
              </div>
            </div>
            <div class="field">
              <label for="co-note">Catatan untuk kurir (opsional)</label>
              <input class="input" id="co-note" placeholder="cth. Titip ke satpam kalau rumah kosong">
            </div>
          </div>
        </section>

        <!-- 2. Pengiriman -->
        <section class="card co-section">
          <h3><span class="step-n">2</span> Metode Pengiriman</h3>
          <div class="option-grid cols-2" id="ship-options">
            ${shippingOptions(settings).map((s) => `
            <label class="option-card ${shippingMethod === s.id ? 'is-active' : ''}" data-ship="${s.id}">
              <input type="radio" name="ship" value="${s.id}" ${shippingMethod === s.id ? 'checked' : ''}>
              <span class="option-icon">${icon('truck')}</span>
              <span class="option-text"><b>${esc(s.label)}</b><span>${esc(s.desc)}</span></span>
              <span class="option-price" data-ship-cost>${num(s.cost) ? rupiah(s.cost) : 'Gratis'}</span>
            </label>`).join('')}
          </div>
          <p class="hint mt-2">${icon('info')} Gratis ongkir otomatis untuk belanja di atas ${rupiah(settings.free_shipping_min)}. Barang di atas 5 kg lewat reguler tambah biaya Rp10.000.</p>
        </section>

        <!-- 3. Pembayaran -->
        <section class="card co-section">
          <h3><span class="step-n">3</span> Metode Pembayaran</h3>
          <div class="option-grid cols-2" id="pay-options">
            ${PAYMENTS.map((p) => `
            <label class="option-card ${paymentMethod === p.id ? 'is-active' : ''}" data-pay="${p.id}">
              <input type="radio" name="pay" value="${p.id}" ${paymentMethod === p.id ? 'checked' : ''}>
              <span class="option-icon">${icon(p.icon)}</span>
              <span class="option-text"><b>${esc(p.label)}</b><span>${esc(p.desc)}</span></span>
            </label>`).join('')}
          </div>
          <div class="alert alert-warn mt-2 hidden" id="cod-warn" style="margin-top:12px">
            ${icon('alert-triangle')}
            <div>Bayar di tempat hanya untuk area <b>${esc(codZones)}</b>. Luar area mohon pilih transfer / QRIS.</div>
          </div>
        </section>

        <!-- 4. Voucher -->
        <section class="card co-section">
          <h3><span class="step-n">4</span> Voucher Diskon</h3>
          <div id="voucher-area">
            ${voucher ? voucherAppliedHTML(voucher) : `
            <div class="voucher-row">
              <input class="input" id="voucher-code" placeholder="cth. KRIYA10" style="text-transform:uppercase">
              <button class="btn btn-soft" type="button" id="voucher-apply">${icon('ticket')} Pakai</button>
            </div>
            <p class="hint mt-1">Coba kode <b>KRIYA10</b> (10% maks. Rp50rb) atau <b>GRATISONGKIR</b>.</p>`}
          </div>
        </section>
      </form>
    </div>

    <!-- Ringkasan -->
    <aside class="summary-card">
      <div class="card co-section">
        <h3><span class="step-n">${icon('receipt')}</span> Ringkasan Pesanan</h3>

        <div class="summary-items">
          ${summary.items.map((it) => `
          <div class="summary-item">
            ${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy">` : productImage({ name: it.name, images: [] }, { color: '#c05a30', icon: 'package' })}
            <div class="grow" style="min-width:0">
              <div class="si-name">${esc(it.name)}</div>
              <div class="si-qty">${it.variant_label ? esc(it.variant_label) + ' · ' : ''}${num(it.qty)} × ${rupiah(it.price)}</div>
            </div>
            <b class="si-price">${rupiah(it.price * it.qty)}</b>
          </div>`).join('')}
        </div>

        <div class="sum-rows">
          <div class="sum-row"><span>Subtotal</span><b>${rupiah(summary.subtotal)}</b></div>
          ${summary.discount > 0 ? `<div class="sum-row"><span>Diskon voucher</span><b style="color:var(--ok)">−${rupiah(summary.discount)}</b></div>` : ''}
          <div class="sum-row"><span>Ongkir (${shippingMethod === 'same-day' ? 'same day' : shippingMethod})</span><b class="${shipCost === 0 ? 'free' : ''}">${shipCost === 0 ? 'GRATIS' : rupiah(shipCost)}</b></div>
          ${fee > 0 ? `<div class="sum-row"><span>Biaya COD</span><b>${rupiah(fee)}</b></div>` : ''}
        </div>

        <div class="sum-total"><span>Total bayar</span><span class="val" id="co-total">${rupiah(total)}</span></div>

        <button class="btn btn-primary btn-lg btn-block mt-2" id="btn-place" type="button">
          ${icon('check')} Buat Pesanan — ${rupiah(total)}
        </button>
        <p class="hint center mt-1">Dengan membuat pesanan, kamu setuju pada syarat toko. Pembayaran dikonfirmasi via WhatsApp.</p>
      </div>
    </aside>
  </div>`;

  bindEvents(summary, settings);
}

function voucherAppliedHTML(v) {
  return `
  <div class="voucher-applied">
    ${icon('ticket')}
    <span>${esc(v.code)} aktif — ${v.discount ? 'hemat ' + rupiah(v.discount) : v.freeShip ? 'gratis ongkir' : 'aktif'}</span>
    <button type="button" class="btn-x" id="voucher-clear" aria-label="Hapus voucher">${icon('x')}</button>
  </div>`;
}

function bindEvents(summary, settings) {
  /* Pilihan pengiriman */
  qsa('[data-ship]', root).forEach((el) => el.addEventListener('click', () => {
    shippingMethod = el.dataset.ship;
    qsa('[data-ship]', root).forEach((x) => x.classList.toggle('is-active', x === el));
    updateTotals(summary, settings);
  }));

  /* Pilihan pembayaran */
  qsa('[data-pay]', root).forEach((el) => el.addEventListener('click', () => {
    paymentMethod = el.dataset.pay;
    qsa('[data-pay]', root).forEach((x) => x.classList.toggle('is-active', x === el));
    updateTotals(summary, settings);
  }));

  /* Terapkan voucher */
  const applyBtn = qs('#voucher-apply', root);
  if (applyBtn) applyBtn.addEventListener('click', async () => {
    const code = qs('#voucher-code', root).value.trim();
    if (!code) { toast('Isi dulu kode vouchernya.', 'info'); return; }
    applyBtn.disabled = true;
    applyBtn.textContent = 'Memeriksa…';
    try {
      const res = await applyVoucher(code, summary.subtotal);
      if (!res.ok) {
        toast(res.error, 'error');
        applyBtn.disabled = false;
        applyBtn.innerHTML = `${icon('ticket')} Pakai`;
        return;
      }
      voucher = getStoredVoucher();
      qs('#voucher-area', root).innerHTML = voucherAppliedHTML(voucher);
      bindVoucherClear(summary, settings);
      updateTotals(summary, settings);
      toast(`Voucher ${voucher.code} dipakai!`, 'ok');
    } catch (e) {
      toast(errMsg(e), 'error');
      applyBtn.disabled = false;
      applyBtn.innerHTML = `${icon('ticket')} Pakai`;
    }
  });
  bindVoucherClear(summary, settings);

  /* Submit pesanan */
  qs('#btn-place', root).addEventListener('click', () => submitOrder(summary, settings));
}

function bindVoucherClear(summary, settings) {
  const btn = qs('#voucher-clear', root);
  if (!btn) return;
  btn.addEventListener('click', () => {
    clearVoucher();
    voucher = null;
    const area = qs('#voucher-area', root);
    area.innerHTML = `
      <div class="voucher-row">
        <input class="input" id="voucher-code" placeholder="cth. KRIYA10" style="text-transform:uppercase">
        <button class="btn btn-soft" type="button" id="voucher-apply">${icon('ticket')} Pakai</button>
      </div>
      <p class="hint mt-1">Coba kode <b>KRIYA10</b> (10% maks. Rp50rb) atau <b>GRATISONGKIR</b>.</p>`;
    bindEvents(summary, settings);
    updateTotals(summary, settings);
    toast('Voucher dilepas.', 'info', 1600);
  });
}

function updateTotals(summary, settings) {
  const shipCost = calcShipping(settings, summary);
  const fee = calcFee();
  const total = summary.afterDiscount + shipCost + fee;

  /* Update label harga per metode kirim (harga tunjuk utk metode aktif doang) */
  const el = qs('#co-total', root);
  const btn = qs('#btn-place', root);
  if (el) el.textContent = rupiah(total);
  if (btn) btn.innerHTML = `${icon('check')} Buat Pesanan — ${rupiah(total)}`;

  /* Tampilkan peringatan COD */
  const warn = qs('#cod-warn', root);
  if (warn) warn.classList.toggle('hidden', paymentMethod !== 'cod');
}

async function submitOrder(summary, settings) {
  if (placing) return;

  /* Validasi form */
  const name = qs('#co-name', root).value.trim();
  const phone = qs('#co-phone', root).value.trim();
  const address = qs('#co-address', root).value.trim();
  const city = qs('#co-city', root).value.trim();
  const postal = qs('#co-postal', root).value.trim();
  const note = qs('#co-note', root).value.trim();

  if (!name || !phone || !address || !city) {
    toast('Lengkapi dulu data penerima ya.', 'info');
    qs('#co-form', root).reportValidity();
    return;
  }
  if (!/^0\d{8,13}$/.test(phone.replace(/[\s-]/g, ''))) {
    toast('Nomor HP kelihatannya belum benar (cth. 081234567890).', 'info');
    return;
  }
  if (paymentMethod === 'cod') {
    const zones = settings.cod_zones || [];
    const okZone = zones.some((z) => city.toLowerCase().includes(z));
    if (!okZone) {
      toast(`COD cuma untuk area: ${zones.join(', ')}. Pilih metode lain ya.`, 'error');
      return;
    }
  }

  const btn = qs('#btn-place', root);
  placing = true;
  btn.disabled = true;
  btn.innerHTML = `${icon('refresh', 'spin')} Membuat pesanan…`;

  try {
    const result = await placeOrder({
      items: summary.items.map((it) => ({
        product_id: it.product_id,
        variant_id: it.variant_id || '',
        qty: it.qty,
      })),
      customer: { name, phone, address, city, postal, note, email: getUser()?.email || '' },
      payment: paymentMethod,
      shipping: shippingMethod,
      voucher_code: voucher?.code || '',
    });

    if (!result || result.ok === false) {
      throw new Error(result?.error || 'Pesanan gagal dibuat.');
    }

    clearCart();

    /* Halaman sukses */
    root.innerHTML = `
    <div class="card card-pad center" style="padding:56px 24px">
      <div class="es-icon" style="margin:0 auto 14px;width:80px;height:80px;background:var(--ok-soft);border-color:var(--ok);color:var(--ok)">
        ${icon('check-circle')}
      </div>
      <h1 style="font-size:30px">Pesanan berhasil dibuat!</h1>
      <p class="muted mt-1" style="max-width:420px;margin:10px auto 0">
        Simpan nomor pesanan di bawah. Instruksi pembayaran dikirim lewat WhatsApp
        (klik tombolnya) supaya admin konfirmasi manual.
      </p>
      <div class="resi-box mt-3" style="max-width:340px;margin-left:auto;margin-right:auto">
        ${icon('receipt')} <b>${esc(result.order_id)}</b>
      </div>
      <p class="muted small mt-1">Total: <b>${rupiah(result.total)}</b> · ${esc(PAYMENTS.find((p) => p.id === paymentMethod)?.label || paymentMethod)}</p>
      <div class="row mt-3" style="justify-content:center;flex-wrap:wrap">
        <a class="btn btn-primary btn-lg" target="_blank" rel="noopener"
           href="https://wa.me/${String(settings.wa_number).replace(/\D/g, '')}?text=${encodeURIComponent(`Halo admin Toko Kriya, saya mau konfirmasi pesanan ${result.order_id} senilai ${rupiah(result.total)} (${paymentMethod}). Nama: ${name}`)}">
          ${icon('message')} Konfirmasi via WhatsApp
        </a>
        <a class="btn btn-ghost btn-lg" href="lacak.html?q=${encodeURIComponent(result.order_id)}">
          ${icon('truck')} Lacak Pesanan
        </a>
        <a class="btn btn-ghost btn-lg" href="akun.html">${icon('user')} Lihat di Akun</a>
      </div>
    </div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('Pesanan dibuat — cek WhatsApp untuk pembayaran!', 'ok', 4500);
  } catch (e) {
    placing = false;
    btn.disabled = false;
    btn.innerHTML = `${icon('refresh')} Buat Pesanan`;
    const msg = errMsg(e);
    const lowStock = /stok/i.test(msg);
    toast(msg, 'error', 5000);
    if (lowStock) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* Halaman tidak dipakai kalau belum login — auth.js sudah redirect */
start().catch((e) => {
  root.innerHTML = `<div class="card card-pad">${emptyState({
    icon: UNCONFIGURED ? 'alert-triangle' : 'alert-circle',
    title: UNCONFIGURED ? 'Database belum terhubung' : 'Checkout bermasalah',
    text: UNCONFIGURED
      ? 'Isi assets/js/config.js dengan kredensial Supabase (lihat README.md).'
      : errMsg(e),
    action: '<a class="btn btn-primary btn-sm" href="katalog.html">Kembali ke katalog</a>',
  })}</div>`;
});
