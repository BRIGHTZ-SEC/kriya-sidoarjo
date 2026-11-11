/* ============================================================================
   Toko Kriya Sidoarjo — db.js
   Pemuat client Supabase (diambil dari CDN hanya saat dibutuhkan).
   Bila config.js belum diisi, semua halaman tetap tampil dengan mode
   "belum terhubung" — tidak crash.
   ========================================================================== */

import { CONFIG } from './config.js';

export const UNCONFIGURED =
  !/^https?:\/\//i.test(CONFIG.SUPABASE_URL) ||
  !CONFIG.SUPABASE_ANON_KEY ||
  CONFIG.SUPABASE_ANON_KEY.startsWith('PASTE');

let clientPromise = null;

/* Promise client Supabase (dibuat sekali, dipakai bersama) */
export function getDb() {
  if (UNCONFIGURED) {
    return Promise.reject(new Error(
      'Supabase belum terhubung. Buka assets/js/config.js lalu isi SUPABASE_URL dan SUPABASE_ANON_KEY dari project Supabase lu.'
    ));
  }
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then((mod) => mod.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }))
      .catch((e) => {
        clientPromise = null;
        throw new Error('Gagal memuat modul Supabase dari CDN. Periksa koneksi internet lu.');
      });
  }
  return clientPromise;
}

/* Cek cepat: apakah database bisa dihubungi? */
export async function pingDb() {
  const db = await getDb();
  const { error } = await db.from('store_settings').select('id').limit(1);
  return !error;
}
