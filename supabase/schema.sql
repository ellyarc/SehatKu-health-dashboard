-- =====================================================================
-- SehatKu: skema lengkap (semua fitur).
-- AMAN DIJALANKAN BERULANG: bagian paling atas menghapus semua tabel dan
-- fungsi lama di schema public, lalu membuatnya lagi dari nol.
-- PERHATIAN: seluruh DATA di schema public ikut terhapus (antrean, pasien,
-- dll). Akun login di Authentication tidak terhapus, dan profilnya dipulihkan
-- otomatis di bagian paling bawah file ini.
-- =====================================================================

-- ======================= BERSIHKAN VERSI LAMA =======================
drop trigger if exists on_auth_user_created on auth.users;

do $$
declare r record;
begin
  -- tabel (beserta policy, trigger, dan relasinya)
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute 'drop table if exists public.' || quote_ident(r.tablename) || ' cascade';
  end loop;
  -- fungsi milik aplikasi (bukan milik extension)
  for r in
    select p.oid::regprocedure::text as sig from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end $$;

-- ======================= TABEL =======================
create table faskes (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  alamat text,
  jenis text default 'puskesmas'
);

create table poli (
  id uuid primary key default gen_random_uuid(),
  faskes_id uuid not null references faskes(id) on delete cascade,
  nama_poli text not null,
  rata2_durasi_menit int not null default 10,
  nomor_sekarang int not null default 0,
  tarif int not null default 0            -- tarif umum (rupiah)
);

-- Akun login + peran
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text,
  role text not null default 'pasien'
    check (role in ('pasien','petugas','dokter','apoteker','kader')),
  faskes_id uuid references faskes(id)
);

-- Data orang (pemilik rekam medis). Bisa akun sendiri, anggota keluarga,
-- anak, atau pasien loket tanpa HP. Rekam medis diikat ke NIK di sini.
create table pasien (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  nik text unique check (nik is null or nik ~ '^[0-9]{16}$'),
  nama text not null,
  tgl_lahir date,
  jenis_kelamin text check (jenis_kelamin in ('L','P')),
  no_hp text,
  alamat text,
  penjamin text not null default 'umum' check (penjamin in ('bpjs','asuransi','umum')),
  no_penjamin text,
  status_penjamin text not null default 'aktif' check (status_penjamin in ('aktif','nonaktif')),
  faskes_tingkat1_id uuid references faskes(id),
  kontak_darurat_nama text,
  kontak_darurat_hp text,
  alergi text,
  created_at timestamptz default now()
);

-- Siapa boleh melihat/mendaftarkan siapa (diri sendiri, anak, orang tua)
create table akses_pasien (
  user_id uuid not null references auth.users(id) on delete cascade,
  pasien_id uuid not null references pasien(id) on delete cascade,
  hubungan text not null default 'keluarga',
  primary key (user_id, pasien_id)
);

create table antrean (
  id uuid primary key default gen_random_uuid(),
  pasien_id uuid not null references pasien(id),
  poli_id uuid not null references poli(id),
  tanggal date not null default ((now() at time zone 'Asia/Jakarta')::date),
  nomor int not null,
  status text not null default 'menunggu'
    check (status in ('menunggu','dipanggil','selesai','batal')),
  urgensi text not null default 'rutin' check (urgensi in ('rutin','segera')),
  jawaban_triase jsonb not null default '{}'::jsonb,
  sumber text not null default 'aplikasi' check (sumber in ('aplikasi','kiosk')),
  estimasi_biaya int not null default 0,
  dibuat_oleh uuid references auth.users(id),
  mulai_at timestamptz,
  selesai_at timestamptz,
  created_at timestamptz default now(),
  unique (poli_id, tanggal, nomor)
);

create table kunjungan (
  id uuid primary key default gen_random_uuid(),
  antrean_id uuid unique references antrean(id),
  pasien_id uuid not null references pasien(id),
  dokter_id uuid references profiles(id),
  faskes_id uuid references faskes(id),
  poli_id uuid references poli(id),
  tanggal date not null default ((now() at time zone 'Asia/Jakarta')::date),
  keluhan text,
  diagnosa text,
  tindakan text,
  instruksi text,            -- tugas pasien: cara perawatan di rumah
  pantangan text,
  tanda_bahaya text,
  tgl_kontrol date,
  biaya_konsul int not null default 0,
  biaya_obat int not null default 0,
  selisih_bayar int not null default 0,   -- yang harus dibayar sendiri
  status_biaya text not null default 'belum' check (status_biaya in ('belum','terverifikasi')),
  diverifikasi_at timestamptz,
  diverifikasi_oleh uuid references auth.users(id),
  created_at timestamptz default now()
);

create table lab_hasil (
  id uuid primary key default gen_random_uuid(),
  kunjungan_id uuid not null references kunjungan(id) on delete cascade,
  pasien_id uuid not null references pasien(id),
  nama_tes text not null,
  hasil text,
  satuan text,
  tanggal date not null default ((now() at time zone 'Asia/Jakarta')::date)
);

create table obat (
  id uuid primary key default gen_random_uuid(),
  faskes_id uuid not null references faskes(id) on delete cascade,
  nama text not null,
  kelompok text not null,                 -- dasar pencarian obat pengganti
  satuan text not null default 'tablet',
  stok int not null default 0 check (stok >= 0),
  harga int not null default 0,
  ditanggung boolean not null default true
);

create table resep (
  id uuid primary key default gen_random_uuid(),
  kunjungan_id uuid not null unique references kunjungan(id) on delete cascade,
  pasien_id uuid not null references pasien(id),
  faskes_id uuid not null references faskes(id),
  status text not null default 'menunggu' check (status in ('menunggu','diserahkan')),
  diserahkan_at timestamptz,
  created_at timestamptz default now()
);

create table resep_item (
  id uuid primary key default gen_random_uuid(),
  resep_id uuid not null references resep(id) on delete cascade,
  obat_id uuid references obat(id) on delete set null,
  nama_obat text not null,
  jumlah int not null check (jumlah > 0),
  aturan_pakai text,
  frekuensi_per_hari int not null default 1,
  durasi_hari int not null default 5,
  resep_luar boolean not null default false,   -- dibeli di apotek luar
  kronis boolean not null default false
);

create table pengingat_obat (
  id uuid primary key default gen_random_uuid(),
  pasien_id uuid not null references pasien(id) on delete cascade,
  kunjungan_id uuid references kunjungan(id) on delete cascade,
  nama_obat text not null,
  aturan text,
  jam text[] not null,
  mulai date not null default ((now() at time zone 'Asia/Jakarta')::date),
  selesai date,
  kronis boolean not null default false,
  aktif boolean not null default true,
  dibuat_oleh uuid references auth.users(id),
  created_at timestamptz default now()
);

create table log_minum (
  id uuid primary key default gen_random_uuid(),
  pengingat_id uuid not null references pengingat_obat(id) on delete cascade,
  pasien_id uuid not null references pasien(id) on delete cascade,
  tanggal date not null,
  jam text not null,
  dikonfirmasi_at timestamptz not null default now(),
  unique (pengingat_id, tanggal, jam)
);

create table rujukan (
  id uuid primary key default gen_random_uuid(),
  pasien_id uuid not null references pasien(id),
  kunjungan_id uuid references kunjungan(id) on delete set null,
  faskes_asal_id uuid references faskes(id),
  tujuan text not null,
  poli_tujuan text,
  diagnosa text,
  berlaku_sampai date not null,
  status text not null default 'aktif' check (status in ('aktif','diajukan','ditolak')),
  jumlah_perpanjangan int not null default 0,
  catatan_dokter text,
  diajukan_at timestamptz,
  dibuat_oleh uuid references auth.users(id),
  created_at timestamptz default now()
);

create table pengukuran_anak (
  id uuid primary key default gen_random_uuid(),
  pasien_id uuid not null references pasien(id) on delete cascade,
  tanggal date not null default ((now() at time zone 'Asia/Jakarta')::date),
  berat_kg numeric(5,2),
  tinggi_cm numeric(5,1),
  lingkar_kepala_cm numeric(4,1),
  dicatat_oleh uuid references auth.users(id),
  created_at timestamptz default now()
);

create table imunisasi_master (
  id int primary key,
  nama text not null,
  usia_bulan int not null,
  urutan int not null
);

create table imunisasi_catatan (
  id uuid primary key default gen_random_uuid(),
  pasien_id uuid not null references pasien(id) on delete cascade,
  master_id int not null references imunisasi_master(id),
  tanggal date not null default ((now() at time zone 'Asia/Jakarta')::date),
  dicatat_oleh uuid references auth.users(id),
  unique (pasien_id, master_id)
);

create table sos_event (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  pasien_id uuid references pasien(id),
  lat double precision,
  lng double precision,
  pesan text,
  status text not null default 'baru' check (status in ('baru','ditangani','selesai')),
  ditangani_oleh uuid references auth.users(id),
  created_at timestamptz default now()
);

create table pengaduan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  kategori text not null,
  isi text not null,
  status text not null default 'baru' check (status in ('baru','diproses','selesai')),
  balasan text,
  created_at timestamptz default now()
);

create table akses_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  pasien_id uuid references pasien(id) on delete cascade,
  tindakan text,
  created_at timestamptz default now()
);

create table jadwal_dokter (
  id uuid primary key default gen_random_uuid(),
  poli_id uuid not null references poli(id) on delete cascade,
  nama_dokter text not null,
  hari int not null check (hari between 1 and 7),   -- 1 = Senin
  jam_mulai time not null,
  jam_selesai time not null
);

-- ======================= FUNGSI BANTU =======================
create function tanggal_wib() returns date language sql stable as $$
  select (now() at time zone 'Asia/Jakarta')::date
$$;

create function punya_peran(p text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = any(p) from profiles where id = auth.uid()), false)
$$;

create function faskes_saya() returns uuid
language sql stable security definer set search_path = public as $$
  select faskes_id from profiles where id = auth.uid()
$$;

create function akses_ok(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from akses_pasien where user_id = auth.uid() and pasien_id = p)
$$;

create function staf_faskes(f uuid, p text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles
                 where id = auth.uid() and role = any(p) and faskes_id = f)
$$;

create function staf_poli(p_poli uuid, p text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles pr join poli po on po.faskes_id = pr.faskes_id
    where pr.id = auth.uid() and pr.role = any(p) and po.id = p_poli)
$$;

-- SIMULASI verifikasi keaktifan penjamin (pengganti API resmi BPJS/asuransi).
-- BPJS: 13 digit angka dan tidak berakhiran 0 dianggap aktif.
create function cek_penjamin(p_jenis text, p_no text) returns text
language sql immutable as $$
  select case
    when p_jenis = 'umum' then 'aktif'
    when p_jenis = 'bpjs' and p_no ~ '^[0-9]{13}$' and right(p_no,1) <> '0' then 'aktif'
    when p_jenis = 'asuransi' and length(coalesce(p_no,'')) >= 6 then 'aktif'
    else 'nonaktif' end
$$;

-- Pra-triase berbasis aturan baku (bukan diagnosis).
create function hitung_urgensi(j jsonb) returns text
language plpgsql immutable as $$
declare k text; v jsonb; hasil text := 'rutin';
begin
  for k, v in select * from jsonb_each(coalesce(j, '{}'::jsonb)) loop
    if v = 'true'::jsonb then
      if k in ('sesak_berat','nyeri_dada','tidak_sadar','kejang','perdarahan_hebat','lumpuh_mendadak') then
        return 'darurat';
      elsif k in ('demam_3hari','nyeri_berat','muntah_terus','sesak_ringan','hamil_keluhan','luka_infeksi') then
        hasil := 'segera';
      end if;
    end if;
  end loop;
  return hasil;
end $$;

-- ======================= PROFIL OTOMATIS =======================
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid; nm text := coalesce(new.raw_user_meta_data->>'nama', 'Pengguna');
begin
  insert into profiles (id, nama) values (new.id, nm);
  insert into pasien (user_id, nama) values (new.id, nm) returning id into pid;
  insert into akses_pasien (user_id, pasien_id, hubungan) values (new.id, pid, 'diri sendiri');
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ======================= ROW LEVEL SECURITY =======================
alter table faskes enable row level security;
alter table poli enable row level security;
alter table profiles enable row level security;
alter table pasien enable row level security;
alter table akses_pasien enable row level security;
alter table antrean enable row level security;
alter table kunjungan enable row level security;
alter table lab_hasil enable row level security;
alter table obat enable row level security;
alter table resep enable row level security;
alter table resep_item enable row level security;
alter table pengingat_obat enable row level security;
alter table log_minum enable row level security;
alter table rujukan enable row level security;
alter table pengukuran_anak enable row level security;
alter table imunisasi_master enable row level security;
alter table imunisasi_catatan enable row level security;
alter table sos_event enable row level security;
alter table pengaduan enable row level security;
alter table akses_log enable row level security;
alter table jadwal_dokter enable row level security;

create policy "faskes_baca" on faskes for select to authenticated using (true);
create policy "poli_baca" on poli for select to authenticated using (true);
create policy "jadwal_baca" on jadwal_dokter for select to authenticated using (true);
create policy "imun_master_baca" on imunisasi_master for select to authenticated using (true);

create policy "profil_baca" on profiles for select to authenticated
  using (id = auth.uid() or role <> 'pasien');

create policy "pasien_baca" on pasien for select to authenticated
  using (akses_ok(id) or punya_peran('{petugas,dokter,apoteker,kader}'));

create policy "akses_baca" on akses_pasien for select to authenticated
  using (user_id = auth.uid());

create policy "antrean_baca" on antrean for select to authenticated
  using (akses_ok(pasien_id) or staf_poli(poli_id, '{petugas,dokter,apoteker,kader}'));

create policy "kunjungan_baca" on kunjungan for select to authenticated
  using (akses_ok(pasien_id) or punya_peran('{dokter}')
         or staf_faskes(faskes_id, '{petugas,apoteker}'));

create policy "lab_baca" on lab_hasil for select to authenticated
  using (akses_ok(pasien_id) or punya_peran('{dokter}'));

-- Stok obat hanya untuk tenaga kesehatan. Pasien melihat ketersediaan obatnya
-- lewat Riwayat (dicatat dokter saat meresepkan), bukan lewat daftar stok.
create policy "obat_baca" on obat for select to authenticated
  using (punya_peran('{petugas,dokter,apoteker}'));
create policy "obat_kelola_ins" on obat for insert to authenticated
  with check (staf_faskes(faskes_id, '{apoteker}'));
create policy "obat_kelola_upd" on obat for update to authenticated
  using (staf_faskes(faskes_id, '{apoteker}')) with check (staf_faskes(faskes_id, '{apoteker}'));
create policy "obat_kelola_del" on obat for delete to authenticated
  using (staf_faskes(faskes_id, '{apoteker}'));

create policy "resep_baca" on resep for select to authenticated
  using (akses_ok(pasien_id) or punya_peran('{dokter}')
         or staf_faskes(faskes_id, '{petugas,apoteker}'));

create policy "resep_item_baca" on resep_item for select to authenticated
  using (exists (select 1 from resep r where r.id = resep_id));

create policy "pengingat_baca" on pengingat_obat for select to authenticated
  using (akses_ok(pasien_id) or punya_peran('{dokter,kader,petugas}'));
create policy "pengingat_tambah" on pengingat_obat for insert to authenticated
  with check (akses_ok(pasien_id) and dibuat_oleh = auth.uid());
create policy "pengingat_ubah" on pengingat_obat for update to authenticated
  using (akses_ok(pasien_id)) with check (akses_ok(pasien_id));

create policy "log_minum_baca" on log_minum for select to authenticated
  using (akses_ok(pasien_id) or punya_peran('{dokter,kader,petugas}'));

create policy "rujukan_baca" on rujukan for select to authenticated
  using (akses_ok(pasien_id) or punya_peran('{dokter}'));

create policy "ukur_baca" on pengukuran_anak for select to authenticated
  using (akses_ok(pasien_id) or punya_peran('{kader,dokter,petugas}'));
create policy "ukur_tambah" on pengukuran_anak for insert to authenticated
  with check ((akses_ok(pasien_id) or punya_peran('{kader,dokter,petugas}'))
              and dicatat_oleh = auth.uid());

create policy "imun_baca" on imunisasi_catatan for select to authenticated
  using (akses_ok(pasien_id) or punya_peran('{kader,dokter,petugas}'));
create policy "imun_tambah" on imunisasi_catatan for insert to authenticated
  with check (punya_peran('{kader,dokter,petugas}') and dicatat_oleh = auth.uid());

create policy "sos_baca" on sos_event for select to authenticated
  using (user_id = auth.uid() or punya_peran('{petugas,dokter}'));
create policy "sos_kirim" on sos_event for insert to authenticated
  with check (user_id = auth.uid());
create policy "sos_tangani" on sos_event for update to authenticated
  using (punya_peran('{petugas}'));

create policy "aduan_baca" on pengaduan for select to authenticated
  using (user_id = auth.uid() or punya_peran('{petugas}'));
create policy "aduan_kirim" on pengaduan for insert to authenticated
  with check (user_id = auth.uid());
create policy "aduan_balas" on pengaduan for update to authenticated
  using (punya_peran('{petugas}'));

create policy "log_akses_baca" on akses_log for select to authenticated
  using (akses_ok(pasien_id));

-- Perubahan data penting TIDAK lewat INSERT/UPDATE langsung, tapi fungsi di bawah.
-- Kecuali yang diberi policy di atas (pengingat manual, SOS, pengaduan, KMS, stok obat).

-- ======================= FUNGSI ANTREAN =======================
create function ambil_antrean(
  p_poli uuid, p_pasien uuid,
  p_jawaban jsonb default '{}'::jsonb, p_sumber text default 'aplikasi'
) returns antrean
language plpgsql security definer set search_path = public as $$
declare
  v antrean; n int; hari date := tanggal_wib(); urg text; ps pasien; po poli; biaya int;
begin
  if auth.uid() is null then raise exception 'Harus login dulu'; end if;

  if p_sumber = 'kiosk' then
    if not staf_poli(p_poli, '{petugas}') then
      raise exception 'Hanya petugas loket yang boleh mendaftarkan lewat kiosk';
    end if;
  elsif not akses_ok(p_pasien) then
    raise exception 'Kamu tidak berhak mendaftarkan pasien ini';
  end if;

  select * into ps from pasien where id = p_pasien;
  if not found then raise exception 'Pasien tidak ditemukan'; end if;
  select * into po from poli where id = p_poli;
  if not found then raise exception 'Poli tidak ditemukan'; end if;

  urg := hitung_urgensi(p_jawaban);
  if urg = 'darurat' then
    raise exception 'DARURAT: ada tanda bahaya. Jangan antre di poli. Segera ke IGD atau hubungi 112/119.';
  end if;

  if exists (select 1 from antrean where pasien_id = p_pasien and tanggal = hari
             and status in ('menunggu','dipanggil')) then
    raise exception 'Pasien ini masih punya antrean aktif hari ini';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_poli::text));
  select coalesce(max(nomor), 0) + 1 into n from antrean where poli_id = p_poli and tanggal = hari;

  biaya := case when ps.penjamin <> 'umum' and ps.status_penjamin = 'aktif' then 0 else po.tarif end;

  insert into antrean (pasien_id, poli_id, nomor, urgensi, jawaban_triase, sumber, estimasi_biaya, dibuat_oleh)
  values (p_pasien, p_poli, n, urg, coalesce(p_jawaban, '{}'::jsonb), p_sumber, biaya, auth.uid())
  returning * into v;
  return v;
end $$;

create function batalkan_antrean(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a antrean;
begin
  select * into a from antrean where id = p_id;
  if not found then return; end if;
  if not (akses_ok(a.pasien_id) or staf_poli(a.poli_id, '{petugas}')) then
    raise exception 'Tidak berhak membatalkan antrean ini';
  end if;
  update antrean set status = 'batal' where id = p_id and status = 'menunggu';
end $$;

-- Posisi antrean memperhitungkan prioritas (urgensi 'segera' didahulukan)
create function info_antrean(p_id uuid)
returns table (di_depan int, rata2_menit int, sedang_dipanggil int, ada_dilayani boolean, st text, urg text)
language plpgsql security definer set search_path = public as $$
declare a antrean; po poli;
begin
  select * into a from antrean where id = p_id;
  if not found then raise exception 'Antrean tidak ditemukan'; end if;
  if not (akses_ok(a.pasien_id) or staf_poli(a.poli_id, '{petugas,dokter}')) then
    raise exception 'Tidak berhak';
  end if;
  select * into po from poli where id = a.poli_id;
  return query select
    (select count(*)::int from antrean x
      where x.poli_id = a.poli_id and x.tanggal = a.tanggal and x.status = 'menunggu' and x.id <> a.id
        and ((x.urgensi = 'segera' and (a.urgensi = 'rutin' or x.nomor < a.nomor))
          or (x.urgensi = a.urgensi and x.nomor < a.nomor))),
    po.rata2_durasi_menit,
    po.nomor_sekarang,
    exists (select 1 from antrean y where y.poli_id = a.poli_id and y.tanggal = a.tanggal and y.status = 'dipanggil' and y.id <> a.id),
    a.status,
    a.urgensi;
end $$;

create function panggil_berikutnya(p_poli uuid) returns antrean
language plpgsql security definer set search_path = public as $$
declare v antrean; hari date := tanggal_wib();
begin
  if not staf_poli(p_poli, '{petugas,dokter}') then
    raise exception 'Kamu bukan petugas/dokter poli ini';
  end if;

  update antrean set status = 'selesai', selesai_at = now()
  where poli_id = p_poli and tanggal = hari and status = 'dipanggil';

  -- Rata-rata durasi dari konsultasi NYATA hari ini
  update poli set rata2_durasi_menit = coalesce((
    select greatest(1, round(avg(extract(epoch from selesai_at - mulai_at) / 60))::int)
    from antrean
    where poli_id = p_poli and tanggal = hari and status = 'selesai' and mulai_at is not null
    having count(*) >= 3
  ), rata2_durasi_menit)
  where id = p_poli;

  -- Yang mendesak ('segera') didahulukan, lalu urutan nomor
  select * into v from antrean
  where poli_id = p_poli and tanggal = hari and status = 'menunggu'
  order by (urgensi = 'segera') desc, nomor
  limit 1 for update skip locked;

  if not found then return null; end if;

  update antrean set status = 'dipanggil', mulai_at = now() where id = v.id returning * into v;
  update poli set nomor_sekarang = v.nomor where id = p_poli;
  return v;
end $$;

-- ======================= DATA PASIEN, KELUARGA, KIOSK =======================
create function lengkapi_data_diri(
  p_nama text, p_nik text, p_tgl date, p_jk text, p_hp text, p_alamat text,
  p_penjamin text, p_no_penjamin text, p_faskes1 uuid,
  p_kd_nama text, p_kd_hp text, p_alergi text
) returns pasien
language plpgsql security definer set search_path = public as $$
declare m pasien; ex pasien;
begin
  if auth.uid() is null then raise exception 'Harus login dulu'; end if;
  if p_nik is null or p_nik !~ '^[0-9]{16}$' then raise exception 'NIK harus 16 digit angka'; end if;
  select * into m from pasien where user_id = auth.uid();
  if not found then raise exception 'Data pasien akun tidak ditemukan'; end if;

  -- NIK sudah didaftarkan petugas loket (pasien tanpa akun): tautkan ke akun ini
  select * into ex from pasien where nik = p_nik and id <> m.id;
  if found then
    if ex.user_id is not null then raise exception 'NIK sudah dipakai akun lain'; end if;
    if ex.tgl_lahir is distinct from p_tgl then
      raise exception 'Tanggal lahir tidak cocok dengan data di loket';
    end if;
    if exists (select 1 from antrean where pasien_id = m.id)
       or exists (select 1 from kunjungan where pasien_id = m.id)
       or exists (select 1 from pengingat_obat where pasien_id = m.id) then
      raise exception 'Data akun ini sudah dipakai, tidak dapat digabung. Hubungi petugas.';
    end if;
    delete from akses_pasien where pasien_id = m.id;
    delete from pasien where id = m.id;
    update pasien set user_id = auth.uid() where id = ex.id;
    insert into akses_pasien (user_id, pasien_id, hubungan)
      values (auth.uid(), ex.id, 'diri sendiri') on conflict do nothing;
    m := ex;
  end if;

  update pasien set
    nama = coalesce(nullif(p_nama, ''), nama), nik = p_nik, tgl_lahir = p_tgl, jenis_kelamin = p_jk,
    no_hp = p_hp, alamat = p_alamat, penjamin = p_penjamin, no_penjamin = p_no_penjamin,
    status_penjamin = cek_penjamin(p_penjamin, p_no_penjamin), faskes_tingkat1_id = p_faskes1,
    kontak_darurat_nama = p_kd_nama, kontak_darurat_hp = p_kd_hp, alergi = p_alergi
  where id = m.id returning * into m;
  return m;
end $$;

create function tambah_anggota(
  p_nama text, p_nik text, p_tgl date, p_jk text, p_hubungan text
) returns pasien
language plpgsql security definer set search_path = public as $$
declare v pasien;
begin
  if auth.uid() is null then raise exception 'Harus login dulu'; end if;
  if p_nik is not null and p_nik <> '' then
    if p_nik !~ '^[0-9]{16}$' then raise exception 'NIK harus 16 digit angka'; end if;
    select * into v from pasien where nik = p_nik;
    if found then
      if v.user_id is not null then
        raise exception 'NIK ini milik akun lain. Anggota dengan akun sendiri tidak bisa ditautkan tanpa persetujuan.';
      end if;
      if v.tgl_lahir is distinct from p_tgl then raise exception 'Tanggal lahir tidak cocok dengan data di sistem'; end if;
      insert into akses_pasien (user_id, pasien_id, hubungan)
        values (auth.uid(), v.id, p_hubungan) on conflict do nothing;
      return v;
    end if;
  end if;
  insert into pasien (nama, nik, tgl_lahir, jenis_kelamin)
    values (p_nama, nullif(p_nik, ''), p_tgl, p_jk) returning * into v;
  insert into akses_pasien (user_id, pasien_id, hubungan) values (auth.uid(), v.id, p_hubungan);
  return v;
end $$;

-- Petugas loket mendaftarkan pasien tanpa HP / tanpa akun (kiosk)
create function daftar_pasien_baru(
  p_nama text, p_nik text, p_tgl date, p_jk text, p_hp text, p_alamat text,
  p_penjamin text, p_no_penjamin text
) returns pasien
language plpgsql security definer set search_path = public as $$
declare v pasien;
begin
  if not punya_peran('{petugas}') then raise exception 'Hanya petugas loket'; end if;
  if p_nik is not null and p_nik <> '' then
    if p_nik !~ '^[0-9]{16}$' then raise exception 'NIK harus 16 digit angka'; end if;
    select * into v from pasien where nik = p_nik;
    if found then return v; end if;
  end if;
  insert into pasien (nama, nik, tgl_lahir, jenis_kelamin, no_hp, alamat, penjamin, no_penjamin, status_penjamin)
  values (p_nama, nullif(p_nik, ''), p_tgl, p_jk, p_hp, p_alamat, p_penjamin, p_no_penjamin,
          cek_penjamin(p_penjamin, p_no_penjamin))
  returning * into v;
  return v;
end $$;

create function cari_pasien(p_q text) returns setof pasien
language plpgsql security definer set search_path = public as $$
begin
  if not punya_peran('{petugas,dokter,kader,apoteker}') then raise exception 'Tidak berhak'; end if;
  return query select * from pasien
    where nik = trim(p_q) or nama ilike '%' || trim(p_q) || '%'
    order by nama limit 20;
end $$;

create function log_akses(p_pasien uuid, p_tindakan text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not punya_peran('{petugas,dokter,kader,apoteker}') then return; end if;
  insert into akses_log (user_id, pasien_id, tindakan) values (auth.uid(), p_pasien, p_tindakan);
end $$;

-- ======================= PEMERIKSAAN, RESEP, FARMASI =======================
create function simpan_pemeriksaan(p_antrean uuid, p_data jsonb) returns kunjungan
language plpgsql security definer set search_path = public as $$
declare
  a antrean; po poli; ps pasien; k kunjungan; r resep; it jsonb;
  hari date := tanggal_wib();
  b_obat int := 0; b_tak int := 0; sendiri int;
  v_obat_id uuid; v_luar boolean; v_jml int; v_nama text; v_stok int; v_harga int; v_tanggung boolean;
  f int; hr int; kr boolean; jam text[];
begin
  select * into a from antrean where id = p_antrean;
  if not found then raise exception 'Antrean tidak ditemukan'; end if;
  if not staf_poli(a.poli_id, '{dokter}') then
    raise exception 'Hanya dokter poli ini yang boleh menyimpan pemeriksaan';
  end if;
  select * into po from poli where id = a.poli_id;
  select * into ps from pasien where id = a.pasien_id;

  insert into kunjungan (antrean_id, pasien_id, dokter_id, faskes_id, poli_id, tanggal,
                         keluhan, diagnosa, tindakan, instruksi, pantangan, tanda_bahaya, tgl_kontrol, biaya_konsul)
  values (a.id, a.pasien_id, auth.uid(), po.faskes_id, po.id, a.tanggal,
          p_data->>'keluhan', p_data->>'diagnosa', p_data->>'tindakan', p_data->>'instruksi',
          p_data->>'pantangan', p_data->>'tanda_bahaya', nullif(p_data->>'tgl_kontrol', '')::date, po.tarif)
  on conflict (antrean_id) do update set
    keluhan = excluded.keluhan, diagnosa = excluded.diagnosa, tindakan = excluded.tindakan,
    instruksi = excluded.instruksi, pantangan = excluded.pantangan, tanda_bahaya = excluded.tanda_bahaya,
    tgl_kontrol = excluded.tgl_kontrol, biaya_konsul = excluded.biaya_konsul
  returning * into k;

  if exists (select 1 from resep where kunjungan_id = k.id and status = 'diserahkan') then
    raise exception 'Resep sudah diserahkan apoteker, tidak dapat diubah';
  end if;
  delete from resep where kunjungan_id = k.id;
  delete from lab_hasil where kunjungan_id = k.id;
  delete from pengingat_obat where kunjungan_id = k.id;
  delete from rujukan where kunjungan_id = k.id and status = 'aktif' and jumlah_perpanjangan = 0;

  if jsonb_array_length(coalesce(p_data->'resep', '[]'::jsonb)) > 0 then
    insert into resep (kunjungan_id, pasien_id, faskes_id) values (k.id, a.pasien_id, po.faskes_id)
    returning * into r;

    for it in select * from jsonb_array_elements(p_data->'resep') loop
      v_obat_id := nullif(it->>'obat_id', '')::uuid;
      v_luar := coalesce((it->>'resep_luar')::boolean, false);
      v_jml := coalesce((it->>'jumlah')::int, 0);
      v_nama := it->>'nama_obat';
      f := greatest(1, coalesce((it->>'frekuensi')::int, 1));
      hr := greatest(1, coalesce((it->>'durasi_hari')::int, 5));
      kr := coalesce((it->>'kronis')::boolean, false);
      v_harga := 0; v_tanggung := true;

      if v_jml <= 0 then raise exception 'Jumlah obat harus lebih dari 0'; end if;

      if v_obat_id is not null then
        select nama, stok, harga, ditanggung into v_nama, v_stok, v_harga, v_tanggung
        from obat where id = v_obat_id and faskes_id = po.faskes_id;
        if not found then raise exception 'Obat tidak ditemukan di faskes ini'; end if;
        if not v_luar and v_stok < v_jml then
          raise exception 'Stok % tidak cukup (tersisa %). Ganti obat sejenis atau tandai resep luar.', v_nama, v_stok;
        end if;
      elsif not v_luar then
        raise exception 'Pilih obat dari stok faskes atau tandai sebagai resep luar';
      end if;

      insert into resep_item (resep_id, obat_id, nama_obat, jumlah, aturan_pakai, frekuensi_per_hari, durasi_hari, resep_luar, kronis)
      values (r.id, v_obat_id, v_nama, v_jml, it->>'aturan_pakai', f, hr, v_luar, kr);

      if not v_luar then
        b_obat := b_obat + v_harga * v_jml;
        if not v_tanggung then b_tak := b_tak + v_harga * v_jml; end if;
      end if;

      jam := case f when 1 then array['08:00'] when 2 then array['08:00','20:00']
                    when 3 then array['07:00','13:00','19:00'] else array['06:00','12:00','18:00','22:00'] end;
      insert into pengingat_obat (pasien_id, kunjungan_id, nama_obat, aturan, jam, mulai, selesai, kronis, dibuat_oleh)
      values (a.pasien_id, k.id, v_nama, it->>'aturan_pakai', jam, hari, hari + hr - 1, kr, auth.uid());
    end loop;
  end if;

  for it in select * from jsonb_array_elements(coalesce(p_data->'lab', '[]'::jsonb)) loop
    if coalesce(it->>'nama_tes', '') <> '' then
      insert into lab_hasil (kunjungan_id, pasien_id, nama_tes, hasil, satuan)
      values (k.id, a.pasien_id, it->>'nama_tes', it->>'hasil', it->>'satuan');
    end if;
  end loop;

  if jsonb_typeof(p_data->'rujukan') = 'object' and coalesce(p_data->'rujukan'->>'tujuan', '') <> '' then
    insert into rujukan (pasien_id, kunjungan_id, faskes_asal_id, tujuan, poli_tujuan, diagnosa, berlaku_sampai, dibuat_oleh)
    values (a.pasien_id, k.id, po.faskes_id, p_data->'rujukan'->>'tujuan', p_data->'rujukan'->>'poli_tujuan',
            coalesce(nullif(p_data->'rujukan'->>'diagnosa', ''), p_data->>'diagnosa'),
            hari + coalesce((p_data->'rujukan'->>'hari_berlaku')::int, 90), auth.uid());
  end if;

  -- Biaya: jika penjaminan aktif, hanya obat non-tanggungan yang dibayar sendiri
  sendiri := case when ps.penjamin <> 'umum' and ps.status_penjamin = 'aktif' then b_tak else po.tarif + b_obat end;
  update kunjungan set biaya_obat = b_obat, selisih_bayar = sendiri where id = k.id returning * into k;

  update antrean set status = 'selesai', selesai_at = coalesce(selesai_at, now())
  where id = a.id and status = 'dipanggil';
  return k;
end $$;

create function serahkan_resep(p_resep uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r resep; it record;
begin
  select * into r from resep where id = p_resep;
  if not found then raise exception 'Resep tidak ditemukan'; end if;
  if not staf_faskes(r.faskes_id, '{apoteker}') then raise exception 'Hanya apoteker faskes ini'; end if;
  if r.status = 'diserahkan' then raise exception 'Resep sudah diserahkan'; end if;

  for it in select * from resep_item where resep_id = r.id and not resep_luar and obat_id is not null loop
    update obat set stok = stok - it.jumlah where id = it.obat_id and stok >= it.jumlah;
    if not found then raise exception 'Stok % tidak cukup untuk diserahkan', it.nama_obat; end if;
  end loop;
  update resep set status = 'diserahkan', diserahkan_at = now() where id = r.id;
end $$;

-- ======================= RUJUKAN =======================
create function ajukan_perpanjangan(p_rujukan uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r rujukan; hari date := tanggal_wib();
begin
  select * into r from rujukan where id = p_rujukan;
  if not found then raise exception 'Rujukan tidak ditemukan'; end if;
  if not akses_ok(r.pasien_id) then raise exception 'Tidak berhak'; end if;
  if r.status <> 'aktif' then raise exception 'Rujukan ini tidak bisa diajukan perpanjangan'; end if;
  if r.berlaku_sampai < hari then raise exception 'Rujukan sudah kedaluwarsa, perlu kunjungan ulang'; end if;
  if r.berlaku_sampai - hari > 30 then
    raise exception 'Pengajuan dibuka 30 hari sebelum masa berlaku habis';
  end if;
  update rujukan set status = 'diajukan', diajukan_at = now() where id = r.id;
end $$;

create function putuskan_perpanjangan(p_rujukan uuid, p_setuju boolean, p_catatan text, p_hari int default 90)
returns void
language plpgsql security definer set search_path = public as $$
declare r rujukan; hari date := tanggal_wib();
begin
  if not punya_peran('{dokter}') then raise exception 'Hanya dokter'; end if;
  select * into r from rujukan where id = p_rujukan;
  if not found or r.status <> 'diajukan' then raise exception 'Tidak ada pengajuan untuk diputuskan'; end if;
  if p_setuju then
    update rujukan set status = 'aktif', berlaku_sampai = greatest(hari, berlaku_sampai) + p_hari,
      jumlah_perpanjangan = jumlah_perpanjangan + 1, catatan_dokter = p_catatan where id = r.id;
  else
    update rujukan set status = 'ditolak', catatan_dokter = p_catatan where id = r.id;
  end if;
end $$;

-- ======================= OBAT & KEPATUHAN =======================
create function konfirmasi_minum(p_pengingat uuid, p_jam text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select pasien_id into pid from pengingat_obat where id = p_pengingat;
  if pid is null or not akses_ok(pid) then raise exception 'Tidak berhak'; end if;
  insert into log_minum (pengingat_id, pasien_id, tanggal, jam)
  values (p_pengingat, pid, tanggal_wib(), p_jam) on conflict do nothing;
end $$;

create function pasien_tidak_patuh(p_hari int default 2)
returns table (pasien_id uuid, nama text, no_hp text, alamat text, nama_obat text, kronis boolean, hari_tak_minum int, terakhir date)
language sql stable security definer set search_path = public as $$
  select ps.id, ps.nama, ps.no_hp, ps.alamat, po.nama_obat, po.kronis,
         (tanggal_wib() - coalesce(l.terakhir, po.mulai))::int, l.terakhir
  from pengingat_obat po
  join pasien ps on ps.id = po.pasien_id
  left join lateral (select max(tanggal) as terakhir from log_minum where pengingat_id = po.id) l on true
  where punya_peran('{kader,dokter,petugas}')
    and po.aktif and po.mulai <= tanggal_wib()
    and (po.selesai is null or po.selesai >= tanggal_wib())
    and tanggal_wib() - coalesce(l.terakhir, po.mulai) >= p_hari
  order by 7 desc
$$;

-- ======================= KASIR =======================
create function verifikasi_biaya(p_kunjungan uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k kunjungan;
begin
  select * into k from kunjungan where id = p_kunjungan;
  if not found then raise exception 'Kunjungan tidak ditemukan'; end if;
  if not staf_faskes(k.faskes_id, '{petugas}') then raise exception 'Hanya petugas kasir faskes ini'; end if;
  update kunjungan set status_biaya = 'terverifikasi', diverifikasi_at = now(), diverifikasi_oleh = auth.uid()
  where id = k.id;
end $$;

-- ======================= REALTIME =======================
alter publication supabase_realtime add table antrean, poli, sos_event, resep;

-- ======================= PULIHKAN AKUN YANG SUDAH ADA =======================
-- Akun yang mendaftar sebelum skema ini dijalankan belum punya profil/data pasien.
insert into profiles (id, nama)
select u.id, coalesce(u.raw_user_meta_data->>'nama', 'Pengguna')
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id);

insert into pasien (user_id, nama)
select u.id, coalesce(u.raw_user_meta_data->>'nama', 'Pengguna')
from auth.users u
where not exists (select 1 from pasien p where p.user_id = u.id);

insert into akses_pasien (user_id, pasien_id, hubungan)
select p.user_id, p.id, 'diri sendiri'
from pasien p
where p.user_id is not null
  and not exists (select 1 from akses_pasien a where a.user_id = p.user_id and a.pasien_id = p.id);