/* ============================================================================
   Toko Kriya Sidoarjo — track.js
   Halaman lacak pesanan: cari lewat nomor pesanan / resi lewat RPC
   track_order (aman — alamat lengkap pembeli tidak ikut terkirim).
   ========================================================================== */

import { initLayout } from './layout.js';
import { icon } from './icons.js';
import {
  qs, esc, num, rupiah, urlParams, toast, emptyState, fmtDateTime, errMsg,
} from './ui.js';
import { trackOrder, UNCONFIGURED } from './api.js';

initLayout({ active: 'lacak' });

const input = qs('#track-input');
const result = qs('#track-result');

const statusLabel = {
  menunggu: 'Menunggu pembayaran',
  diproses: 'Diproses toko',
  dikirim: 'Dalam perjalanan',
  selesai: 'Selesai',
  batal: 'Dibatalkan',
};
const statusIcon = {
  menunggu: 'clock', diproses: 'settings', dikirim: 'truck',
  selesai: 'check-circle', batal: 'x',
};
const statusDesc = {
  menunggu: 'Pesanan dibuat dan menunggu pembayaran dikonfirmasi.',
  diproses: 'Pembayaran diterima — barang sedang disiapkan & dikemas.',
  dikirim: 'Paket diserahkan ke kurir. Pantau nomor resi di bawah.',
  selesai: 'Paket sudah diterima pembeli. Terima kasih!',
  batal: 'Pesanan ini dibatalkan.',
};
const paymentLabel = {
  transfer: 'Transfer Bank', qris: 'QRIS', ewallet: 'E-Wallet', cod: 'Bayar di Tempat',
};
const shipLabel = { reguler: 'Reguler', express: 'Express', 'same-day': 'Same Day' };

qs('#track-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) {
    toast('Masukkan nomor pesanan atau resi dulu.', 'info');
    input.focus();
    return;
  }
  run(q);
});

/* ?q= di URL langsung lacak (dipakai tombol di checkout & akun) */
const initial = urlParams().get('q');
if (initial) {
  input.value = initial;
  run(initial);
}

async function run(query) {
  result.innerHTML = `
    <div class="card card-pad" style="max-width:560px;margin:0 auto">
      <div class="skeleton" style="height:20px;width:55%"></div>
      <div class="skeleton" style="height:14px;width:80%;margin-top:12px"></div>
      <div class="skeleton" style="height:14px;width:65%;margin-top:8px"></div>
      <div class="skeleton" style="height:70px;margin-top:16px"></div>
    </div>`;

  try {
    const res = await trackOrder(query);
    if (!res || res.ok === false) {
      throw new Error(res?.error || 'Pesanan tidak ditemukan.');
    }
    renderResult(res.order);
    history.replaceState(null, '', 'lacak.html?q=' + encodeURIComponent(query));
  } catch (e) {
    result.innerHTML = `
      <div class="card card-pad">
        ${emptyState({
          icon: UNCONFIGURED ? 'alert-triangle' : 'search',
          title: UNCONFIGURED ? 'Database belum terhubung' : 'Pesanan tidak ketemu',
          text: UNCONFIGURED
            ? 'Isi assets/js/config.js dengan kredensial Supabase (lihat README.md).'
            : errMsg(e) + ' Cek lagi nomornya — format pesanan: ORD-2026-XXXXX.',
        })}
      </div>`;
  }
}

function renderResult(o) {
  const history = o.history || [];
  const lastStatus = o.status;
  const items = o.items || [];

  /* Urutkan langkah: menunggu → diproses → dikirim → selesai, batal terpisah */
  const order = ['menunggu', 'diproses', 'dikirim', 'selesai'];
  const isCancelled = lastStatus === 'batal';
  const currentIdx = order.indexOf(lastStatus);

  const steps = order
    .filter((s) => !isCancelled && (order.indexOf(s) <= currentIdx || currentIdx === -1))
    .map((s) => {
      const rec = history.find((h) => h.status === s);
      return {
        key: s,
        done: order.indexOf(s) <= currentIdx,
        current: s === lastStatus,
        at: rec?.at,
        note: rec?.note || statusDesc[s],
      };
    });

  result.innerHTML = `
  <div class="card order-detail-card anim-in">
    <header class="od-head">
      <div>
        <b>${esc(o.id)}</b>
        <div class="tiny muted" style="margin-top:3px">Dibuat ${fmtDateTime(o.created_at)} · dikirim ke ${esc(o.city || '-')}</div>
      </div>
      <span class="status-pill status-${esc(lastStatus)}">${statusLabel[lastStatus] || lastStatus}</span>
    </header>

    <div class="od-body">
      ${isCancelled ? `
      <div class="alert alert-error">${icon('x')}<div><b>Pesanan dibatalkan.</b> ${esc(history.find((h) => h.status === 'batal')?.note || '')}</div></div>` : `
      <div>
        <h5 class="od-section-title">${icon('truck')} Riwayat pengiriman</h5>
        <div class="timeline">
          ${steps.map((s) => `
          <div class="tl-item ${s.current ? 'is-current' : ''}">
            <span class="tl-dot">${icon(statusIcon[s.key])}</span>
            <div>
              <div class="tl-title">${statusLabel[s.key]}</div>
              <div class="tl-note">${esc(s.note)}</div>
              ${s.at ? `<div class="tl-time">${fmtDateTime(s.at)} WIB</div>` : ''}
            </div>
          </div>`).join('')}
        </div>
      </div>`}

      <div class="od-grid">
        <div>
          <h5 class="od-section-title">${icon('package')} Isi paket</h5>
          <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px">
            ${items.map((it) => `
            <li class="row" style="align-items:flex-start">
              ${icon('check-circle', 'icon-sm')}
              <div class="grow"><b style="font-size:13.5px">${esc(it.name)}</b>
              <span class="tiny muted"> × ${num(it.qty)}</span></div>
            </li>`).join('')}
          </ul>
        </div>
        <div>
          <h5 class="od-section-title">${icon('receipt')} Rincian</h5>
          <div class="od-kv">
            <div><span>Total</span><b>${rupiah(o.total)}</b></div>
            <div><span>Pengiriman</span><b>${esc(shipLabel[o.shipping] || o.shipping)}</b></div>
            <div><span>Pembayaran</span><b>${esc(paymentLabel[o.payment] || o.payment)}</b></div>
            ${o.resi ? `<div><span>No. resi</span><b>${esc(o.resi)}</b></div>` : ''}
          </div>
        </div>
      </div>

      ${o.resi ? `
      <div class="resi-box">
        ${icon('tag')} <b>${esc(o.resi)}</b>
        <span class="tiny muted grow">Serahkan ke kurir manapun bila ditanya resi</span>
      </div>` : ''}
    </div>
  </div>`;
}
