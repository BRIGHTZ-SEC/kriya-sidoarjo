/* ============================================================================
   Toko Kriya Sidoarjo — auth.js
   Autentikasi Supabase (login/daftar/keluar) + profil (nama, telepon, role).
   Password di-hash oleh Supabase Auth — tidak pernah disimpan polos.
   ========================================================================== */

import { getDb, UNCONFIGURED } from './db.js';

let listenerReady = false;
const authListeners = [];

/* Format sesi internal: { id, email, profile } atau null */
let currentUser = null;

async function loadProfile(db, user) {
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return {
    id: user.id,
    email: user.email || '',
    profile: profile || { full_name: '', phone: '', role: 'customer' },
  };
}

export function initAuth() {
  if (listenerReady) return;
  listenerReady = true;
  getDb().then(async (db) => {
    /* Muat sesi awal */
    try {
      const { data: { session } } = await db.auth.getSession();
      if (session?.user) currentUser = await loadProfile(db, session.user);
    } catch { /* biarkan null */ }

    /* Dengarkan perubahan (login, logout, token refresh) */
    db.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        currentUser = null;
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        currentUser = await loadProfile(db, session.user);
      }
      for (const fn of authListeners) {
        try { fn(currentUser, event); } catch { /* jangan biarkan error satu listener menyebar */ }
      }
    });

    /* Notifikasi awal untuk listener yang terlanjur daftar */
    for (const fn of authListeners) {
      try { fn(currentUser, 'INIT'); } catch { /* abaikan */ }
    }
  }).catch(() => {
    /* DB belum dikonfigurasi — semua tetap null */
  });
}

export function onAuthChange(fn) {
  authListeners.push(fn);
  return () => {
    const i = authListeners.indexOf(fn);
    if (i >= 0) authListeners.splice(i, 1);
  };
}

export function getUser() {
  return currentUser;
}

export function isAdmin() {
  return currentUser?.profile?.role === 'admin';
}

export function requireAuth(nextUrl = '') {
  if (currentUser) return currentUser;
  const next = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : '';
  location.href = `akun.html${next}`;
  return null;
}

/* ------------------------------ Login & daftar ------------------------------ */

export async function login(email, password) {
  const db = await getDb();
  const { data, error } = await db.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    const msg = String(error.message || '');
    if (/invalid login credentials/i.test(msg)) throw new Error('Email atau password salah.');
    if (/email not confirmed/i.test(msg)) throw new Error('Email belum dikonfirmasi. Cek inbox email lu dulu.');
    if (/too many requests/i.test(msg)) throw new Error('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.');
    throw new Error(msg || 'Gagal masuk.');
  }
  currentUser = await loadProfile(db, data.user);
  return currentUser;
}

export async function register({ email, password, fullName, phone }) {
  const db = await getDb();
  const { data, error } = await db.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        phone: String(phone || '').trim(),
      },
    },
  });
  if (error) {
    const msg = String(error.message || '');
    if (/already registered|already exists/i.test(msg)) throw new Error('Email ini sudah terdaftar. Coba masuk saja.');
    if (/password/i.test(msg) && /at least/i.test(msg)) throw new Error('Password minimal 6 karakter.');
    if (/weak password/i.test(msg)) throw new Error('Password terlalu lemah — pakai minimal 6 karakter.');
    throw new Error(msg || 'Gagal mendaftar.');
  }
  if (!data.session) {
    /* Supabase meminta konfirmasi email */
    const err = new Error('KONFIRMASI_EMAIL');
    err.email = data.user?.email || email;
    throw err;
  }
  currentUser = await loadProfile(db, data.user);
  return currentUser;
}

export async function logout() {
  try {
    const db = await getDb();
    await db.auth.signOut();
  } catch { /* abaikan */ }
  currentUser = null;
}

/* ------------------------------ Profil ------------------------------ */

export async function updateProfile({ full_name, phone }) {
  const db = await getDb();
  if (!currentUser) throw new Error('Belum masuk.');
  const { error } = await db.from('profiles')
    .update({ full_name: full_name.trim(), phone: String(phone || '').trim() })
    .eq('id', currentUser.id);
  if (error) throw new Error(error.message);
  currentUser = {
    ...currentUser,
    profile: { ...currentUser.profile, full_name: full_name.trim(), phone: String(phone || '').trim() },
  };
  return currentUser;
}

export { UNCONFIGURED };
