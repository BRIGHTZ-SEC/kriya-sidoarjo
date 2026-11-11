/* ============================================================================
   Toko Kriya Sidoarjo — Konfigurasi Supabase
   ----------------------------------------------------------------------------
   Isi dua nilai di bawah dengan data dari project Supabase lu:
   Project Settings -> API
     - SUPABASE_URL     = Project URL        (contoh: https://abcd1234.supabase.co)
     - SUPABASE_ANON_KEY = Project API keys -> anon / public

   Kedua nilai ini aman dipublikasikan (anon key memang untuk frontend)
   karena akses data sudah dijaga kebijakan RLS di database.
   ========================================================================== */

export const CONFIG = {
  SUPABASE_URL: 'https://mqwugjqriovowtomtnue.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_Ds8qRV-xl9NCFUSLYzE0OA_9sQXtqc5',
};
