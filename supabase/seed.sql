-- Data dummy (bukan data pasien sungguhan). Jalankan setelah schema.sql.
insert into faskes (id, nama, alamat, jenis) values
  ('11111111-1111-1111-1111-111111111111', 'Puskesmas Contoh Sejahtera', 'Jl. Merdeka No. 1', 'puskesmas'),
  ('22222222-2222-2222-2222-222222222222', 'RSUD Contoh Harapan', 'Jl. Pahlawan No. 10', 'rumah sakit');

insert into poli (faskes_id, nama_poli, rata2_durasi_menit, tarif) values
  ('11111111-1111-1111-1111-111111111111', 'Poli Umum', 10, 50000),
  ('11111111-1111-1111-1111-111111111111', 'Poli Gigi', 20, 100000),
  ('11111111-1111-1111-1111-111111111111', 'Poli KIA', 15, 75000),
  ('22222222-2222-2222-2222-222222222222', 'Poli Penyakit Dalam', 15, 150000);

insert into obat (faskes_id, nama, kelompok, satuan, stok, harga, ditanggung) values
  ('11111111-1111-1111-1111-111111111111', 'Paracetamol 500 mg', 'Pereda nyeri & demam', 'tablet', 200, 500, true),
  ('11111111-1111-1111-1111-111111111111', 'Ibuprofen 400 mg', 'Pereda nyeri & demam', 'tablet', 100, 800, true),
  ('11111111-1111-1111-1111-111111111111', 'Amoxicillin 500 mg', 'Antibiotik', 'kapsul', 0, 1500, true),
  ('11111111-1111-1111-1111-111111111111', 'Cefadroxil 500 mg', 'Antibiotik', 'kapsul', 60, 2500, true),
  ('11111111-1111-1111-1111-111111111111', 'Amlodipin 5 mg', 'Antihipertensi', 'tablet', 100, 700, true),
  ('11111111-1111-1111-1111-111111111111', 'Captopril 25 mg', 'Antihipertensi', 'tablet', 80, 600, true),
  ('11111111-1111-1111-1111-111111111111', 'Metformin 500 mg', 'Antidiabetes', 'tablet', 150, 600, true),
  ('11111111-1111-1111-1111-111111111111', 'Glimepirid 2 mg', 'Antidiabetes', 'tablet', 40, 1200, true),
  ('11111111-1111-1111-1111-111111111111', 'OAT (obat anti-TBC) FDC', 'Anti-TBC', 'tablet', 120, 0, true),
  ('11111111-1111-1111-1111-111111111111', 'Cetirizine 10 mg', 'Antialergi', 'tablet', 90, 500, true),
  ('11111111-1111-1111-1111-111111111111', 'Oralit', 'Rehidrasi', 'sachet', 50, 1000, true),
  ('11111111-1111-1111-1111-111111111111', 'Vitamin C 500 mg', 'Suplemen', 'tablet', 300, 300, false);

insert into jadwal_dokter (poli_id, nama_dokter, hari, jam_mulai, jam_selesai)
select p.id, d.nama, d.hari, d.mulai::time, d.selesai::time
from poli p
join (values
  ('Poli Umum', 'dr. Contoh Satu', 1, '08:00', '12:00'),
  ('Poli Umum', 'dr. Contoh Satu', 3, '08:00', '12:00'),
  ('Poli Umum', 'dr. Contoh Dua', 2, '08:00', '14:00'),
  ('Poli Umum', 'dr. Contoh Dua', 4, '08:00', '14:00'),
  ('Poli Gigi', 'drg. Contoh Tiga', 2, '09:00', '13:00'),
  ('Poli Gigi', 'drg. Contoh Tiga', 5, '09:00', '13:00'),
  ('Poli KIA', 'dr. Contoh Empat, Sp.OG', 1, '09:00', '12:00'),
  ('Poli KIA', 'dr. Contoh Empat, Sp.OG', 4, '09:00', '12:00'),
  ('Poli Penyakit Dalam', 'dr. Contoh Lima, Sp.PD', 3, '10:00', '15:00'),
  ('Poli Penyakit Dalam', 'dr. Contoh Lima, Sp.PD', 5, '10:00', '15:00')
) as d(poli, nama, hari, mulai, selesai) on d.poli = p.nama_poli;

-- Jadwal imunisasi dasar (acuan umum program imunisasi nasional; sesuaikan
-- dengan anjuran tenaga kesehatan setempat)
insert into imunisasi_master (id, nama, usia_bulan, urutan) values
  (1,  'Hepatitis B (HB-0)', 0, 1),
  (2,  'BCG', 1, 2),
  (3,  'Polio tetes 1', 1, 3),
  (4,  'DPT-HB-Hib 1', 2, 4),
  (5,  'Polio tetes 2', 2, 5),
  (6,  'DPT-HB-Hib 2', 3, 6),
  (7,  'Polio tetes 3', 3, 7),
  (8,  'DPT-HB-Hib 3', 4, 8),
  (9,  'Polio tetes 4', 4, 9),
  (10, 'Polio suntik (IPV)', 4, 10),
  (11, 'Campak-Rubela', 9, 11),
  (12, 'DPT-HB-Hib lanjutan', 18, 12),
  (13, 'Campak-Rubela lanjutan', 18, 13);