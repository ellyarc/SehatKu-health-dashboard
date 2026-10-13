// peran: siapa yang boleh melihat menu & halaman ini
export const MENU = [
  { href: '/dashboard', label: 'Beranda', grup: 'Utama', peran: ['pasien', 'petugas', 'dokter', 'apoteker', 'kader'] },

  // ----- Pasien -----
  { href: '/dashboard/antrean', label: 'Antrean & Pra-triase', grup: 'Layanan', peran: ['pasien'] },
  { href: '/dashboard/jadwal', label: 'Info Faskes (Jadwal & Stok)', grup: 'Layanan', peran: ['pasien'] },
  { href: '/dashboard/kartu', label: 'Kartu & Biaya', grup: 'Layanan', peran: ['pasien'] },
  { href: '/dashboard/riwayat', label: 'Riwayat & Tugas Saya', grup: 'Kesehatan', peran: ['pasien'] },
  { href: '/dashboard/obat', label: 'Alarm Minum Obat', grup: 'Kesehatan', peran: ['pasien'] },
  { href: '/dashboard/rujukan', label: 'Rujukan', grup: 'Kesehatan', peran: ['pasien'] },
  { href: '/dashboard/anak', label: 'KMS & Imunisasi Anak', grup: 'Kesehatan', peran: ['pasien'] },
  { href: '/dashboard/keluarga', label: 'Data Diri & Keluarga', grup: 'Akun', peran: ['pasien'] },
  { href: '/dashboard/sos', label: 'SOS Darurat', grup: 'Bantuan', peran: ['pasien'] },
  { href: '/dashboard/pengaduan', label: 'Pengaduan', grup: 'Bantuan', peran: ['pasien'] },

  // ----- Petugas, dokter, apoteker, kader -----
  { href: '/dashboard/loket', label: 'Loket & Panggilan', grup: 'Loket', peran: ['petugas', 'dokter'] },
  { href: '/dashboard/pendaftaran', label: 'Pendaftaran Kiosk', grup: 'Loket', peran: ['petugas'] },
  { href: '/dashboard/kasir', label: 'Kasir & Penjaminan', grup: 'Loket', peran: ['petugas'] },
  { href: '/dashboard/laporan', label: 'SOS & Pengaduan Masuk', grup: 'Loket', peran: ['petugas'] },
  { href: '/dashboard/periksa', label: 'Ruang Periksa', grup: 'Klinis', peran: ['dokter'] },
  { href: '/dashboard/rekam-medis', label: 'Rekam Medis (NIK)', grup: 'Klinis', peran: ['dokter'] },
  { href: '/dashboard/persetujuan-rujukan', label: 'Persetujuan Rujukan', grup: 'Klinis', peran: ['dokter'] },
  { href: '/dashboard/farmasi', label: 'Farmasi & Stok Obat', grup: 'Farmasi', peran: ['apoteker'] },
  { href: '/dashboard/pantau', label: 'Pantau Kepatuhan Obat', grup: 'Komunitas', peran: ['kader', 'dokter', 'petugas'] },
  { href: '/dashboard/posyandu', label: 'Posyandu (KMS)', grup: 'Komunitas', peran: ['kader', 'dokter', 'petugas'] },
]

export const NAMA_PERAN = {
  pasien: 'Pasien', petugas: 'Petugas loket', dokter: 'Dokter', apoteker: 'Apoteker', kader: 'Kader kesehatan',
}