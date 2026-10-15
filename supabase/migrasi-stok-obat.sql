-- Jalankan SEKALI di SQL Editor Supabase kalau database sudah terlanjur dibuat
-- dari schema.sql versi lama (tanpa menghapus data).
-- Efek: pasien tidak lagi bisa membaca tabel stok obat. Hanya petugas, dokter,
-- dan apoteker. (schema.sql terbaru sudah memuat aturan yang sama.)
drop policy if exists "obat_baca" on obat;
create policy "obat_baca" on obat for select to authenticated
  using (punya_peran('{petugas,dokter,apoteker}'));