/* ============================================================================
   Toko Kriya Sidoarjo — Icon System (SVG sprite)
   ----------------------------------------------------------------------------
   Semua icon UI memakai sprite SVG inline ini — konsisten di semua browser
   dan sistem operasi, tanpa emoji, tanpa file eksternal.
   Pemakaian di HTML:  <svg class="icon"><use href="#i-nama"/></svg>
   Pemakaian di JS:    icon('nama')  atau  icon('nama', 'icon-lg')
   ========================================================================== */

const SYMBOLS = `
<symbol id="i-menu" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></g></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></g></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7.5"/><path d="M21 21l-4.8-4.8"/></g></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></g></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a7 7 0 0 0 10 10z"/></g></symbol>
<symbol id="i-cart" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2.5 3.5h2.2l2.5 11.8a1.6 1.6 0 0 0 1.6 1.3h7.4a1.6 1.6 0 0 0 1.6-1.25L20 7H6"/></g></symbol>
<symbol id="i-bag" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 7.5h11.6l1.1 11.6a1.9 1.9 0 0 1-1.9 2.1H7a1.9 1.9 0 0 1-1.9-2.1l1.1-11.6z"/><path d="M8.7 10.5V6.2a3.3 3.3 0 0 1 6.6 0v4.3"/></g></symbol>
<symbol id="i-heart" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5C6.2 16.5 3.2 13.3 3.2 9.7 3.2 7 5.2 5 7.7 5c1.7 0 3.2.9 4.3 2.6C13.1 5.9 14.6 5 16.3 5c2.5 0 4.5 2 4.5 4.7 0 3.6-3 6.8-8.8 10.8z"/></g></symbol>
<symbol id="i-heart-filled" viewBox="0 0 24 24"><path fill="currentColor" d="M12 20.5C6.2 16.5 3.2 13.3 3.2 9.7 3.2 7 5.2 5 7.7 5c1.7 0 3.2.9 4.3 2.6C13.1 5.9 14.6 5 16.3 5c2.5 0 4.5 2 4.5 4.7 0 3.6-3 6.8-8.8 10.8z"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.7l-5.4 2.9 1.1-6-4.5-4.2 6.1-.8L12 3z"/></g></symbol>
<symbol id="i-star-filled" viewBox="0 0 24 24"><path fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.7l-5.4 2.9 1.1-6-4.5-4.2 6.1-.8L12 3z"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.8" r="3.8"/><path d="M4.5 20.5c.7-3.9 3.7-6.2 7.5-6.2s6.8 2.3 7.5 6.2"/></g></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c.6-3.4 3.2-5.4 6.5-5.4s5.9 2 6.5 5.4"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.9M17.8 14.9c2.1.6 3.4 2.3 3.7 4.6"/></g></symbol>
<symbol id="i-log-in" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 3.5H18a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-3.5"/><path d="M10 7.5l4.5 4.5-4.5 4.5M14.5 12H3.5"/></g></symbol>
<symbol id="i-log-out" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3.5"/><path d="M16 7.5l4.5 4.5-4.5 4.5M20.5 12H9.5"/></g></symbol>
<symbol id="i-settings" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/></g></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.5L12 3l8.5 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></g></symbol>
<symbol id="i-arrow-right" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12h15M13.5 6l6 6-6 6"/></g></symbol>
<symbol id="i-arrow-left" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12h-15M10.5 6l-6 6 6 6"/></g></symbol>
<symbol id="i-chevron-down" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></g></symbol>
<symbol id="i-chevron-up" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14.5l6-6 6 6"/></g></symbol>
<symbol id="i-chevron-right" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></g></symbol>
<symbol id="i-chevron-left" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6l-6 6 6 6"/></g></symbol>
<symbol id="i-external" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4L11 13"/><path d="M19 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5"/></g></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></g></symbol>
<symbol id="i-minus" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></g></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5L19.5 6.5"/></g></symbol>
<symbol id="i-check-circle" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.2l2.8 2.8L16 9.5"/></g></symbol>
<symbol id="i-alert-circle" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/></g></symbol>
<symbol id="i-alert-triangle" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5L21.5 20h-19L12 3.5z"/><path d="M12 9.5v4M12 16.8h.01"/></g></symbol>
<symbol id="i-info" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></g></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13.5h10L18 7"/><path d="M10 11v6M14 11v6"/></g></symbol>
<symbol id="i-pencil" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5l.9-3.6L16.9 4.4a2.05 2.05 0 0 1 2.9 2.9L8.3 18.8l-3.8.7z"/></g></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></g></symbol>
<symbol id="i-upload" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5V4M6.5 8.5L12 3l5.5 5.5"/><path d="M4 16.5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></g></symbol>
<symbol id="i-download" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11.5M6.5 9.5L12 15l5.5-5.5"/><path d="M4 17v1.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V17"/></g></symbol>
<symbol id="i-printer" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8V4h10v4M7 17H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-3"/><path d="M7 14h10v6H7z"/></g></symbol>
<symbol id="i-filter" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5.5h17l-6.8 7.8v5.2l-3.4-1.9v-3.3L3.5 5.5z"/></g></symbol>
<symbol id="i-image" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.8" cy="9.5" r="1.7"/><path d="M4 17l4.8-4.5 3.7 3.4 3-2.7L20.5 18"/></g></symbol>
<symbol id="i-package" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8l8.2 4.4v9.6L12 21.2l-8.2-4.4V7.2L12 2.8z"/><path d="M12 12l8.2-4.4M12 12v9.2M12 12L3.8 7.6"/></g></symbol>
<symbol id="i-truck" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6h11.5v9.5H2.5z"/><path d="M14 9.5h4l3.5 3.8v2.2H14"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></g></symbol>
<symbol id="i-ticket" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.2a2 2 0 0 0 0 5.6v3.2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3.2a2 2 0 0 1 0-5.6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v3.2z"/><path d="M13.5 5v2.5M13.5 11v2M13.5 16.5V19"/></g></symbol>
<symbol id="i-tag" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6.2L21 14.8a1.8 1.8 0 0 1 0 2.6l-3.6 3.6a1.8 1.8 0 0 1-2.6 0L4 12.2V4z"/><circle cx="8.5" cy="8.5" r="1.3"/></g></symbol>
<symbol id="i-wallet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7.5H5a2.2 2.2 0 0 1 0-4.4h13.5A1.5 1.5 0 0 1 20 4.6v2.9z"/><path d="M20 7.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H5a2.5 2.5 0 0 1-2.5-2.5V5.1"/><circle cx="16.5" cy="13.2" r="1.2"/></g></symbol>
<symbol id="i-credit-card" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.8h19M6.5 14.5h4"/></g></symbol>
<symbol id="i-banknote" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.2 12h.01M17.8 12h.01"/></g></symbol>
<symbol id="i-smartphone" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></g></symbol>
<symbol id="i-bank" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5l9-6.5 9 6.5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/></g></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3.5 7l8.5 6.2L20.5 7"/></g></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.6 4.1 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L7.8 9.9a16 16 0 0 0 6.3 6.3l1.3-1.05a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7a2 2 0 0 1 1.69 2.5z"/></g></symbol>
<symbol id="i-map-pin" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.5S5 15.2 5 10a7 7 0 0 1 14 0c0 5.2-7 11.5-7 11.5z"/><circle cx="12" cy="10" r="2.6"/></g></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g></symbol>
<symbol id="i-flame" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></g></symbol>
<symbol id="i-zap" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></g></symbol>
<symbol id="i-leaf" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.5 12 13 13 12"/></g></symbol>
<symbol id="i-sparkles" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.9L18.8 9.8l-4.9 1.9L12 16.6l-1.9-4.9L5.2 9.8l4.9-1.9L12 3z"/><path d="M19 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/></g></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l7.5 3v5.8c0 4.9-3.2 8.3-7.5 9.9-4.3-1.6-7.5-5-7.5-9.9V5.5l7.5-3z"/><path d="M8.5 11.5l2.5 2.5 4.5-4.7"/></g></symbol>
<symbol id="i-refresh" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 2.6-6.3L3 8"/><path d="M3 3v5h5"/></g></symbol>
<symbol id="i-message" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22l5.9-2z"/></g></symbol>
<symbol id="i-chart" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20.5h18"/><path d="M5.5 20.5V13M11 20.5V5.5M16.5 20.5v-9"/></g></symbol>
<symbol id="i-receipt" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1z"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></g></symbol>
<symbol id="i-store" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16l2.5 5H1.5L4 4z"/><path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 21v-6.5h4V21"/></g></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></g></symbol>
<symbol id="i-list" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 6h12M8.5 12h12M8.5 18h12M4 6h.01M4 12h.01M4 18h.01"/></g></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/></g></symbol>
<symbol id="i-camera" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3.2l2-3h5.6l2 3H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></g></symbol>
<symbol id="i-gift" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="4" rx="1"/><path d="M6 12v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8M12 8v13"/><path d="M12 8s-3.5.2-4.5-1.5S9 3 12 5.5C15 3 16.5 5 15.5 6.5S12 8 12 8z"/></g></symbol>
<symbol id="i-gem" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h12l4 5.5L12 21 2 9l4-5.5z"/><path d="M2 9h20M12 21L8 9l4-5.5L16 9l-4 12"/></g></symbol>
<symbol id="i-batik" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l7 8.5-7 10.5L5 11l7-8.5z"/><path d="M8.6 11L12 6.7 15.4 11 12 15.3 8.6 11z"/></g></symbol>
<symbol id="i-tree" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5L7 9.5h2.5L6 15h2.5L5 20.5h14l-3.5-5.5H18l-3.5-5.5H17L12 2.5z"/><path d="M12 17v4.5"/></g></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></g></symbol>
<symbol id="i-percent" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/></g></symbol>
<symbol id="i-trending" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></g></symbol>
`;

/* Nama icon yang valid — berguna untuk validasi & picker icon admin */
export const ICON_NAMES = [
  'menu', 'x', 'search', 'sun', 'moon', 'cart', 'bag', 'heart', 'heart-filled',
  'star', 'star-filled', 'user', 'users', 'log-in', 'log-out', 'settings',
  'home', 'arrow-right', 'arrow-left', 'chevron-down', 'chevron-up',
  'chevron-right', 'chevron-left', 'external', 'plus', 'minus', 'check',
  'check-circle', 'alert-circle', 'alert-triangle', 'info', 'trash', 'pencil',
  'eye', 'upload', 'download', 'printer', 'filter', 'image', 'package',
  'truck', 'ticket', 'tag', 'wallet', 'credit-card', 'banknote', 'smartphone',
  'bank', 'mail', 'phone', 'map-pin', 'clock', 'flame', 'zap', 'leaf',
  'sparkles', 'shield', 'refresh', 'message', 'chart', 'receipt', 'store',
  'grid', 'list', 'calendar', 'camera', 'gift', 'gem', 'batik', 'tree',
  'lock', 'percent', 'trending',
];

/* Icon yang boleh dipilih untuk kategori produk di panel admin */
export const CATEGORY_ICONS = [
  'batik', 'bag', 'gem', 'tree', 'package', 'tag', 'gift', 'sparkles',
  'leaf', 'flame', 'star', 'heart', 'store', 'camera',
];

/* Sisipkan sprite ke halaman sekali di awal */
export function installIcons() {
  if (document.getElementById('tks-icons')) return;
  const wrap = document.createElement('div');
  wrap.id = 'tks-icons';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.display = 'none';
  wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${SYMBOLS}</svg>`;
  document.body.appendChild(wrap);
}

/* Hasilkan markup icon siap pakai */
export function icon(name, cls = '') {
  if (!ICON_NAMES.includes(name)) name = 'package';
  return `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

/* Pasang sprite otomatis saat modul ini diimpor */
if (typeof document !== 'undefined') {
  if (document.body) installIcons();
  else document.addEventListener('DOMContentLoaded', installIcons);
}
