// peran: siapa yang boleh melihat menu & halaman ini
// ikon: nama ikon di components/Icons.js
export const MENU = [
  { href: '/dashboard', label: 'Beranda', ikon: 'home', grup: 'Utama', peran: ['pasien', 'petugas', 'dokter', 'apoteker', 'kader'] },

  // ----- Pasien -----
  { href: '/dashboard/antrean', label: 'Antrean & Pra-triase', ikon: 'ticket', ket: 'Ambil nomor dari rumah', grup: 'Layanan', peran: ['pasien'] },
  { href: '/dashboard/jadwal', label: 'Jadwal Dokter', ikon: 'calendar', ket: 'Cek dokter yang praktik', grup: 'Layanan', peran: ['pasien'] },
  { href: '/dashboard/kartu', label: 'Kartu & Biaya', ikon: 'card', ket: 'Penjamin dan rincian biaya', grup: 'Layanan', peran: ['pasien'] },
  { href: '/dashboard/riwayat', label: 'Riwayat', ikon: 'history', ket: 'Pemeriksaan, obat, hasil lab', grup: 'Kesehatan', peran: ['pasien'] },
  { href: '/dashboard/obat', label: 'Alarm Minum Obat', ikon: 'pill', ket: 'Pengingat dan konfirmasi dosis', grup: 'Kesehatan', peran: ['pasien'] },
  { href: '/dashboard/rujukan', label: 'Rujukan', ikon: 'refer', ket: 'Perpanjang dari rumah', grup: 'Kesehatan', peran: ['pasien'] },
  { href: '/dashboard/anak', label: 'Kesehatan Anak', ikon: 'sprout', ket: 'Tumbuh kembang & imunisasi', grup: 'Kesehatan', peran: ['pasien'] },
  { href: '/dashboard/keluarga', label: 'Data Diri & Keluarga', ikon: 'users', ket: 'Profil dan anggota keluarga', grup: 'Akun', peran: ['pasien'] },
  { href: '/dashboard/sos', label: 'SOS Darurat', ikon: 'alert', ket: 'Kirim lokasi ke petugas', grup: 'Bantuan', peran: ['pasien'] },
  { href: '/dashboard/pengaduan', label: 'Pengaduan', ikon: 'message', ket: 'Sampaikan keluhan layanan', grup: 'Bantuan', peran: ['pasien'] },

  // ----- Petugas, dokter, apoteker, kader -----
  { href: '/dashboard/loket', label: 'Loket & Panggilan', ikon: 'bell', grup: 'Loket', peran: ['petugas', 'dokter'] },
  { href: '/dashboard/pendaftaran', label: 'Pendaftaran Kiosk', ikon: 'clipboard', grup: 'Loket', peran: ['petugas'] },
  { href: '/dashboard/kasir', label: 'Kasir & Penjaminan', ikon: 'cash', grup: 'Loket', peran: ['petugas'] },
  { href: '/dashboard/laporan', label: 'SOS & Pengaduan Masuk', ikon: 'inbox', grup: 'Loket', peran: ['petugas'] },
  { href: '/dashboard/stok', label: 'Stok Obat', ikon: 'boxes', grup: 'Loket', peran: ['petugas', 'dokter'] },
  { href: '/dashboard/periksa', label: 'Ruang Periksa', ikon: 'pulse', grup: 'Klinis', peran: ['dokter'] },
  { href: '/dashboard/rekam-medis', label: 'Rekam Medis (NIK)', ikon: 'history', grup: 'Klinis', peran: ['dokter'] },
  { href: '/dashboard/persetujuan-rujukan', label: 'Persetujuan Rujukan', ikon: 'check', grup: 'Klinis', peran: ['dokter'] },
  { href: '/dashboard/farmasi', label: 'Farmasi & Stok Obat', ikon: 'pill', grup: 'Farmasi', peran: ['apoteker'] },
  { href: '/dashboard/pantau', label: 'Pantau Kepatuhan Obat', ikon: 'eye', grup: 'Komunitas', peran: ['kader', 'dokter', 'petugas'] },
  { href: '/dashboard/posyandu', label: 'Posyandu Anak', ikon: 'heart', grup: 'Komunitas', peran: ['kader', 'dokter', 'petugas'] },
]

export const NAMA_PERAN = {
  pasien: 'Pasien', petugas: 'Petugas loket', dokter: 'Dokter', apoteker: 'Apoteker', kader: 'Kader kesehatan',
}