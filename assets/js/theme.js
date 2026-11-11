/* ============================================================================
   Toko Kriya Sidoarjo — Tema gelap/terang
   Dipasang segera di <head> (script biasa) supaya tidak ada kedipan warna.
   ========================================================================== */
(function () {
  'use strict';
  try {
    var saved = localStorage.getItem('tks_theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {
    /* abaikan kalau localStorage tidak tersedia */
  }
})();
