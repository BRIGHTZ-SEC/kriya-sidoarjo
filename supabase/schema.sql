-- ============================================================================
-- Toko Kriya Sidoarjo — Skema Database Supabase (v2)
-- ----------------------------------------------------------------------------
-- Cara pakai:
--   1. Buka project Supabase lu di https://supabase.com
--   2. Masuk menu "SQL Editor" -> "New query"
--   3. Copy seluruh isi file ini, paste, lalu klik "Run"
--
-- File ini membuat: tabel, fungsi (RPC), trigger, kebijakan keamanan (RLS),
-- dan bucket storage untuk foto produk. Aman dijalankan berulang kali.
-- ============================================================================

create extension if not exists pgcrypto;


create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Kategori produk
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null default 'package',
  color text not null default '#c05a30',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- Produk
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  price bigint not null check (price >= 0),
  discount_percent int not null default 0 check (discount_percent between 0 and 90),
  stock int not null default 0 check (stock >= 0),
  sold int not null default 0,
  weight numeric not null default 0.2 check (weight >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  short_desc text not null default '',
  description text not null default '',
  material text not null default '',
  dimensions text not null default '',
  care text not null default '',
  tags text[] not null default '{}',
  images text[] not null default '{}',
  rating numeric not null default 0,
  reviews_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Variasi produk (misal ukuran / warna) dengan stok masing-masing
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  stock int not null default 0 check (stock >= 0),
  sort int not null default 0
);

-- Alamat pengiriman pembeli
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Alamat',
  name text not null,
  phone text not null,
  address text not null,
  city text not null,
  postal text not null default '',
  is_default boolean not null default false
);

-- Voucher / kode promo
create table if not exists public.vouchers (
  code text primary key,
  type text not null check (type in ('percent', 'fixed', 'freeship')),
  value numeric not null default 0,
  min_spend bigint not null default 0,
  max_discount bigint not null default 0,
  quota int not null default 1,
  used int not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  description text not null default ''
);

-- Pesanan
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer jsonb not null,
  payment text not null,
  shipping text not null,
  subtotal bigint not null default 0,
  discount bigint not null default 0,
  shipping_cost bigint not null default 0,
  payment_fee bigint not null default 0,
  total bigint not null default 0,
  voucher_code text references public.vouchers(code) on delete set null,
  resi text,
  paid_at timestamptz,
  cancel_reason text,
  status text not null default 'menunggu'
    check (status in ('menunggu', 'diproses', 'dikirim', 'selesai', 'batal')),
  created_at timestamptz not null default now()
);

-- Barang dalam pesanan
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  price bigint not null,
  qty int not null check (qty > 0),
  image text not null default '',
  weight numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Riwayat perubahan status pesanan (untuk timeline lacak paket)
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- Ulasan produk
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author text not null,
  rating int not null check (rating between 1 and 5),
  text text not null default '',
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  reply text,
  order_id text references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Produk favorit (per user)
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- Pengaturan toko (hanya satu baris, id = 1)
create table if not exists public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Toko Kriya Sidoarjo',
  wa_number text not null default '6285745120164',
  free_shipping_min bigint not null default 500000,
  cod_zones text[] not null default '{sidoarjo,surabaya,grosok,gedangan,tangerang,waru,krian,buduran}',
  cod_fee bigint not null default 5000,
  regular_cost bigint not null default 15000,
  express_cost bigint not null default 25000,
  sameday_cost bigint not null default 35000
);

-- ============================================================================
-- 2. FUNGSI BANTU
-- ============================================================================

-- Apakah user yang sedang masuk adalah admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profil otomatis terbuat saat user baru mendaftar / ditambahkan lewat dashboard
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Cegah user mengangkat dirinya sendiri menjadi admin
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Role tidak boleh diubah sendiri.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
before update of role on public.profiles
for each row execute function public.protect_profile_role();

-- Hitung ulang rating produk setiap kali ulasan berubah
create or replace function public.recalc_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating = coalesce((
      select round(avg(r.rating), 1)
      from public.reviews r
      where r.product_id = v_pid and r.status = 'published'
    ), 0),
    reviews_count = (
      select count(*)
      from public.reviews r
      where r.product_id = v_pid and r.status = 'published'
    )
  where p.id = v_pid;
  return null;
end;
$$;

drop trigger if exists trg_recalc_rating on public.reviews;
create trigger trg_recalc_rating
after insert or update or delete on public.reviews
for each row execute function public.recalc_product_rating();

-- Kembalikan stok dari sebuah pesanan (dipakai saat pesanan dibatalkan)
create or replace function public.restore_order_stock(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.order_items%rowtype;
begin
  for v_item in select * from public.order_items where order_id = p_order_id loop
    if v_item.variant_id is not null then
      update public.product_variants
      set stock = stock + v_item.qty
      where id = v_item.variant_id;

      update public.products p set
        stock = (select coalesce(sum(stock), 0) from public.product_variants v where v.product_id = p.id),
        sold = greatest(0, sold - v_item.qty)
      where p.id = v_item.product_id;
    elsif v_item.product_id is not null then
      update public.products
      set stock = stock + v_item.qty, sold = greatest(0, sold - v_item.qty)
      where id = v_item.product_id;
    end if;
  end loop;
end;
$$;

-- Kurangi lagi stok (dipakai saat pesanan dibangkitkan ulang dari status batal)
create or replace function public.reduce_order_stock(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.order_items%rowtype;
begin
  for v_item in select * from public.order_items where order_id = p_order_id loop
    if v_item.variant_id is not null then
      update public.product_variants
      set stock = greatest(0, stock - v_item.qty)
      where id = v_item.variant_id;

      update public.products p set
        stock = (select coalesce(sum(stock), 0) from public.product_variants v where v.product_id = p.id)
      where p.id = v_item.product_id;
    elsif v_item.product_id is not null then
      update public.products
      set stock = greatest(0, stock - v_item.qty)
      where id = v_item.product_id;
    end if;
  end loop;
end;
$$;

-- ============================================================================
-- 3. FUNGSI RPC (logika backend yang dipanggil frontend)
-- ============================================================================

-- Membuat pesanan baru: validasi stok, voucher, zona COD, hitung ongkir & total,
-- kurangi stok, semua dalam satu transaksi database.
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_settings public.store_settings%rowtype;
  v_items jsonb := payload->'items';
  v_customer jsonb := payload->'customer';
  v_payment text := coalesce(payload->>'payment', '');
  v_shipping text := coalesce(payload->>'shipping', '');
  v_voucher_code text := coalesce(payload->>'voucher_code', '');
  v_order_id text;
  v_subtotal bigint := 0;
  v_discount bigint := 0;
  v_shipping_cost bigint := 0;
  v_fee bigint := 0;
  v_free_ship boolean := false;
  v_voucher public.vouchers%rowtype;
  v_has_voucher boolean := false;
  v_item jsonb;
  v_prod public.products%rowtype;
  v_vari public.product_variants%rowtype;
  v_qty int;
  v_unit bigint;
  v_weight numeric := 0;
  v_total bigint;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Silakan masuk terlebih dahulu.');
  end if;
  if v_items is null or jsonb_array_length(v_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Keranjang masih kosong.');
  end if;
  if v_payment not in ('transfer', 'qris', 'ewallet', 'cod') then
    return jsonb_build_object('ok', false, 'error', 'Metode pembayaran tidak dikenal.');
  end if;
  if v_shipping not in ('reguler', 'express', 'same-day') then
    return jsonb_build_object('ok', false, 'error', 'Metode pengiriman tidak dikenal.');
  end if;
  if v_customer is null
    or nullif(v_customer->>'name', '') is null
    or nullif(v_customer->>'phone', '') is null
    or nullif(v_customer->>'address', '') is null
    or nullif(v_customer->>'city', '') is null then
    return jsonb_build_object('ok', false, 'error', 'Data penerima belum lengkap.');
  end if;

  select * into v_settings from public.store_settings where id = 1;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Pengaturan toko belum tersedia.');
  end if;

  -- Validasi stok dan hitung subtotal + berat
  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty <= 0 then
      return jsonb_build_object('ok', false, 'error', 'Jumlah barang tidak valid.');
    end if;

    select * into v_prod
    from public.products
    where id = (v_item->>'product_id')::uuid and active
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'Ada produk yang sudah tidak tersedia.');
    end if;

    if coalesce(v_item->>'variant_id', '') <> '' then
      select * into v_vari
      from public.product_variants
      where id = (v_item->>'variant_id')::uuid
      for update;

      if not found then
        return jsonb_build_object('ok', false, 'error', 'Variasi ' || v_prod.name || ' sudah tidak tersedia.');
      end if;
      if v_vari.stock < v_qty then
        return jsonb_build_object('ok', false, 'error',
          'Stok ' || v_prod.name || ' (' || v_vari.label || ') tinggal ' || v_vari.stock || ' buah.');
      end if;
    elsif v_prod.stock < v_qty then
      return jsonb_build_object('ok', false, 'error',
        'Stok ' || v_prod.name || ' tinggal ' || v_prod.stock || ' buah.');
    end if;

    v_unit := round(v_prod.price * (100 - least(90, greatest(0, v_prod.discount_percent))) / 100.0);
    v_subtotal := v_subtotal + v_unit * v_qty;
    v_weight := v_weight + coalesce(v_prod.weight, 0) * v_qty;
  end loop;

  -- Validasi dan terapkan voucher
  if v_voucher_code <> '' then
    select * into v_voucher
    from public.vouchers
    where upper(code) = upper(v_voucher_code)
    for update;

    v_has_voucher := found;
    if not v_has_voucher then
      return jsonb_build_object('ok', false, 'error', 'Kode voucher tidak ditemukan.');
    end if;
    if not v_voucher.active then
      return jsonb_build_object('ok', false, 'error', 'Voucher sedang dinonaktifkan.');
    end if;
    if v_voucher.expires_at is not null and v_voucher.expires_at < now() then
      return jsonb_build_object('ok', false, 'error', 'Voucher sudah kedaluwarsa.');
    end if;
    if v_voucher.used >= v_voucher.quota then
      return jsonb_build_object('ok', false, 'error', 'Kuota voucher sudah habis.');
    end if;
    if v_subtotal < v_voucher.min_spend then
      return jsonb_build_object('ok', false, 'error',
        'Belanja minimal ' || v_voucher.min_spend::text || ' untuk pakai voucher ini.');
    end if;

    if v_voucher.type = 'percent' then
      v_discount := round(v_subtotal * v_voucher.value / 100.0);
      if v_voucher.max_discount > 0 then
        v_discount := least(v_discount, v_voucher.max_discount);
      end if;
    elsif v_voucher.type = 'fixed' then
      v_discount := v_voucher.value::bigint;
    else
      v_free_ship := true;
    end if;
    v_discount := least(v_discount, v_subtotal);
  end if;

  -- COD hanya untuk zona tertentu
  if v_payment = 'cod' then
    if not exists (
      select 1
      from unnest(v_settings.cod_zones) z
      where position(z in lower(coalesce(v_customer->>'city', ''))) > 0
    ) then
      return jsonb_build_object('ok', false, 'error',
        'Bayar di tempat hanya tersedia untuk wilayah: ' || array_to_string(v_settings.cod_zones, ', ') || '.');
    end if;
  end if;

  -- Ongkir
  v_shipping_cost := case v_shipping
    when 'express' then v_settings.express_cost
    when 'same-day' then v_settings.sameday_cost
    else v_settings.regular_cost
  end;
  if v_shipping = 'reguler' and v_weight > 5 then
    v_shipping_cost := v_shipping_cost + 10000;
  end if;
  if v_free_ship or (v_subtotal - v_discount) >= v_settings.free_shipping_min then
    v_shipping_cost := 0;
  end if;

  -- Biaya layanan pembayaran
  if v_payment = 'cod' then
    v_fee := v_settings.cod_fee;
  end if;

  v_total := v_subtotal - v_discount + v_shipping_cost + v_fee;
  v_order_id := 'ORD-' || to_char(now(), 'YYYY') || '-'
    || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));

  insert into public.orders (
    id, user_id, customer, payment, shipping,
    subtotal, discount, shipping_cost, payment_fee, total,
    voucher_code, status
  ) values (
    v_order_id, v_user, v_customer, v_payment, v_shipping,
    v_subtotal, v_discount, v_shipping_cost, v_fee, v_total,
    case when v_has_voucher then v_voucher.code end,
    'menunggu'
  );

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := (v_item->>'qty')::int;
    select * into v_prod from public.products where id = (v_item->>'product_id')::uuid for update;
    v_unit := round(v_prod.price * (100 - least(90, greatest(0, v_prod.discount_percent))) / 100.0);

    insert into public.order_items (order_id, product_id, variant_id, name, price, qty, image, weight)
    values (
      v_order_id, v_prod.id,
      nullif(coalesce(v_item->>'variant_id', ''), '')::uuid,
      v_prod.name, v_unit, v_qty,
      coalesce(v_prod.images[1], ''),
      coalesce(v_prod.weight, 0)
    );

    if coalesce(v_item->>'variant_id', '') <> '' then
      update public.product_variants set stock = stock - v_qty
      where id = (v_item->>'variant_id')::uuid;

      update public.products set
        stock = (select coalesce(sum(stock), 0) from public.product_variants where product_id = v_prod.id),
        sold = sold + v_qty
      where id = v_prod.id;
    else
      update public.products set stock = stock - v_qty, sold = sold + v_qty
      where id = v_prod.id;
    end if;
  end loop;

  if v_has_voucher then
    update public.vouchers set used = used + 1 where code = v_voucher.code;
  end if;

  insert into public.order_status_history (order_id, status, note)
  values (v_order_id, 'menunggu', 'Pesanan dibuat, menunggu pembayaran');

  return jsonb_build_object('ok', true, 'order_id', v_order_id, 'total', v_total);
exception when others then
  return jsonb_build_object('ok', false, 'error', 'Pesanan gagal dibuat: ' || sqlerrm);
end;
$$;

-- Ubah status pesanan (admin: semua perubahan; pembeli: batalkan / konfirmasi terima).
-- Otomatis mengelola resi, tanggal bayar, dan pengembalian stok saat dibatalkan.
create or replace function public.set_order_status(
  p_order_id text,
  p_status text,
  p_note text default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_user uuid := auth.uid();
  v_is_admin boolean := public.is_admin();
  v_is_owner boolean;
  v_from text;
begin
  select * into v_order from public.orders
  where id = upper(coalesce(p_order_id, ''))
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Pesanan tidak ditemukan.');
  end if;

  v_is_owner := (v_order.user_id = v_user);
  if v_user is null or not (v_is_admin or v_is_owner) then
    return jsonb_build_object('ok', false, 'error', 'Anda tidak berhak mengubah pesanan ini.');
  end if;

  if p_status not in ('menunggu', 'diproses', 'dikirim', 'selesai', 'batal') then
    return jsonb_build_object('ok', false, 'error', 'Status tidak dikenal.');
  end if;

  -- Pembeli hanya boleh membatalkan pesanan awal, atau konfirmasi barang diterima
  if not v_is_admin then
    if not (
      (p_status = 'batal' and v_order.status in ('menunggu', 'diproses'))
      or (p_status = 'selesai' and v_order.status = 'dikirim')
    ) then
      return jsonb_build_object('ok', false, 'error', 'Aksi ini hanya bisa dilakukan oleh admin.');
    end if;
  end if;

  v_from := v_order.status;
  if v_from = p_status then
    return jsonb_build_object('ok', true, 'unchanged', true, 'resi', v_order.resi);
  end if;

  -- Batalkan: catat alasan, kembalikan stok jika barang belum diterima
  if p_status = 'batal' then
    v_order.cancel_reason := coalesce(nullif(p_reason, ''), 'Dibatalkan');
    if v_from not in ('batal', 'selesai') then
      perform public.restore_order_stock(v_order.id);
    end if;
  end if;

  -- Bangkit ulang dari batal: stok dikurangi lagi
  if v_from = 'batal' and p_status <> 'batal' then
    perform public.reduce_order_stock(v_order.id);
    v_order.cancel_reason := null;
  end if;

  if p_status = 'diproses' and v_from = 'menunggu' and v_order.paid_at is null then
    v_order.paid_at := now();
  end if;

  if p_status = 'dikirim' and (v_order.resi is null or v_order.resi = '') then
    v_order.resi := 'TKS' || to_char(now(), 'YYMMDD')
      || lpad((floor(random() * 900000) + 100000)::text, 6, '0');
  end if;

  update public.orders set
    status = p_status,
    cancel_reason = v_order.cancel_reason,
    paid_at = v_order.paid_at,
    resi = v_order.resi
  where id = v_order.id;

  insert into public.order_status_history (order_id, status, note)
  values (
    v_order.id,
    p_status,
    coalesce(
      nullif(p_note, ''),
      case p_status
        when 'diproses' then 'Pembayaran diterima'
        when 'dikirim' then 'Paket diserahkan ke kurir'
          || case when v_order.resi is not null then ', resi ' || v_order.resi else '' end
        when 'selesai' then 'Pesanan selesai'
        when 'batal' then 'Pesanan dibatalkan'
        else 'Status diperbarui'
      end
    )
  );

  return jsonb_build_object('ok', true, 'status', p_status, 'resi', v_order.resi);
end;
$$;

-- Lacak paket tanpa login (cukup nomor pesanan atau resi).
-- Hanya mengembalikan info status, bukan alamat lengkap pembeli.
create or replace function public.track_order(p_query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
  v_history jsonb;
begin
  select * into v_order from public.orders
  where id = upper(coalesce(p_query, ''))
     or upper(coalesce(resi, '')) = upper(coalesce(p_query, ''))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error',
      'Pesanan tidak ditemukan. Periksa kembali nomor pesanan atau resi.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'qty', qty) order by created_at), '[]'::jsonb)
    into v_items
  from public.order_items where order_id = v_order.id;

  select coalesce(jsonb_agg(
    jsonb_build_object('status', status, 'note', note, 'at', created_at) order by created_at
  ), '[]'::jsonb)
    into v_history
  from public.order_status_history where order_id = v_order.id;

  return jsonb_build_object(
    'ok', true,
    'order', jsonb_build_object(
      'id', v_order.id,
      'status', v_order.status,
      'resi', v_order.resi,
      'created_at', v_order.created_at,
      'total', v_order.total,
      'shipping', v_order.shipping,
      'payment', v_order.payment,
      'city', v_order.customer->>'city',
      'items', v_items,
      'history', v_history
    )
  );
end;
$$;

-- ============================================================================
-- 4. KEAMANAN (Row Level Security)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.vouchers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.store_settings enable row level security;

-- profiles ----------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- categories ---------------------------------------------------------------
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- products -----------------------------------------------------------------
drop policy if exists products_read on public.products;
create policy products_read on public.products
for select using (active or public.is_admin());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- product_variants ----------------------------------------------------------
drop policy if exists variants_read on public.product_variants;
create policy variants_read on public.product_variants
for select using (
  exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and (p.active or public.is_admin())
  )
);

drop policy if exists variants_admin_write on public.product_variants;
create policy variants_admin_write on public.product_variants
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- addresses -----------------------------------------------------------------
drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- vouchers ------------------------------------------------------------------
drop policy if exists vouchers_read on public.vouchers;
create policy vouchers_read on public.vouchers
for select using (true);

drop policy if exists vouchers_admin_write on public.vouchers;
create policy vouchers_admin_write on public.vouchers
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- orders (pembuatan & perubahan status hanya lewat RPC, bukan langsung) ------
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
for delete to authenticated
using (public.is_admin());

-- order_items ---------------------------------------------------------------
drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

-- order_status_history -------------------------------------------------------
drop policy if exists history_read on public.order_status_history;
create policy history_read on public.order_status_history
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

-- reviews ----------------------------------------------------------------
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
for select
using (
  status = 'published'
  or public.is_admin()
  or user_id = auth.uid()
);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
for insert to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews
for update to authenticated
using (
  public.is_admin()
  or (user_id = auth.uid() and status = 'pending')
)
with check (
  public.is_admin()
  or (user_id = auth.uid() and status = 'pending')
);

drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews
for delete to authenticated
using (public.is_admin() or user_id = auth.uid());

-- favorites --------------------------------------------------------------
drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- store_settings ------------------------------------------------------------
drop policy if exists settings_read on public.store_settings;
create policy settings_read on public.store_settings
for select using (true);

drop policy if exists settings_admin_update on public.store_settings;
create policy settings_admin_update on public.store_settings
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- 5. STORAGE (bucket foto produk)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists storage_products_read on storage.objects;
create policy storage_products_read on storage.objects
for select using (bucket_id = 'products');

drop policy if exists storage_products_admin_insert on storage.objects;
create policy storage_products_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'products' and public.is_admin());

drop policy if exists storage_products_admin_update on storage.objects;
create policy storage_products_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'products' and public.is_admin())
with check (bucket_id = 'products' and public.is_admin());

drop policy if exists storage_products_admin_delete on storage.objects;
create policy storage_products_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'products' and public.is_admin());

-- ============================================================================
-- 6. INDEX untuk performa query
-- ============================================================================

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_history_order on public.order_status_history(order_id);
create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_reviews_status on public.reviews(status);
