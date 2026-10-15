import Link from 'next/link'
import PublicBar from '@/components/PublicBar'
import { NAMA_APP, TAGLINE } from '@/lib/brand'
import Icon from '@/components/Icons'
import { HeroIllustration } from '@/components/Illustrations'

const FITUR = [
  { warna: 'orange', ikon: 'clock', judul: 'Tahu kapan giliranmu',
    isi: 'Ambil nomor dari rumah. Perkiraan jam dipanggil dihitung dari kecepatan dokter hari itu, dan diperbarui otomatis saat antrean bergeser.' },
  { warna: 'sage', ikon: 'alert', judul: 'Gejala berat langsung diarahkan',
    isi: 'Pra-triase singkat sebelum antre. Tanda bahaya diarahkan ke IGD, keluhan mendesak didahulukan dari kontrol rutin.' },
  { warna: 'yellow', ikon: 'users', judul: 'Bisa daftar untuk siapa saja',
    isi: 'Daftarkan anak dan orang tua dari satu akun. Lansia tanpa HP tetap terlayani lewat kiosk di loket.' },
  { warna: 'lilac', ikon: 'history', judul: 'Riwayat ikut ke mana pun',
    isi: 'Rekam medis terikat NIK. Dokter langsung melihat riwayat, hasil lab, dan alergimu, jadi tidak perlu tes ulang atau cerita dari nol.' },
  { warna: 'orange', ikon: 'pill', judul: 'Obat tidak lagi bikin kaget',
    isi: 'Dokter mengecek stok saat menulis resep, dan ketersediaan obat tercatat di riwayatmu. Setelah itu ada alarm minum obat, dan kader memantau pasien yang berhenti di tengah jalan.' },
  { warna: 'sage', ikon: 'refer', judul: 'Rujukan tanpa bolak-balik',
    isi: 'Perpanjang rujukan dari rumah, pantau tumbuh kembang dan imunisasi anak, dan kirim SOS saat butuh bantuan.' },
]

// Perjalanan pasien dari awal sampai selesai
const FASE = [
  { warna: 'orange', label: 'Fase 1', judul: 'Sebelum berangkat', ket: 'Semua beres dari rumah.',
    langkah: [
      ['Daftar dan tautkan keluarga', 'Buat akun dengan NIK. Tambahkan anak atau orang tua supaya bisa kamu daftarkan dari HP-mu. Lansia tanpa HP cukup ke kiosk loket, petugas yang membantu.'],
      ['Jawab pertanyaan gejala', 'Beberapa pertanyaan singkat. Kalau ada tanda bahaya seperti sesak berat atau nyeri dada, antrean poli diblokir dan kamu langsung diarahkan ke IGD.'],
      ['Ambil nomor antrean', 'Status BPJS atau asuransi dicek otomatis, dan perkiraan biaya (termasuk selisih yang harus dibayar sendiri) tampil sebelum kamu berangkat.'],
      ['Berangkat sesuai jam yang disarankan', 'Kalau dokter terlambat atau ada pasien mendesak yang didahulukan, perkiraan jam di HP-mu menyesuaikan sendiri. Tidak perlu duduk berjam-jam.'],
    ] },
  { warna: 'sage', label: 'Fase 2', judul: 'Di fasilitas kesehatan', ket: 'Dokter sudah tahu riwayatmu.',
    langkah: [
      ['Dipanggil, riwayat langsung terbuka', 'Dokter cukup memasukkan NIK untuk melihat riwayat penyakit, hasil lab lama, dan alergi obat. Tidak perlu tes ulang. Setiap pembukaan data tercatat dan bisa kamu lihat.'],
      ['Resep dengan stok yang jelas', 'Saat dokter menulis resep, stok apotek langsung terlihat. Kalau obat habis, dokter bisa ganti ke obat sejenis atau membuat resep luar untuk dibeli di apotek terdekat.'],
      ['Satu simpan, semuanya terkirim', 'Begitu pemeriksaan disimpan, resep masuk ke apotek, pengingat obat dibuat, tagihan dihitung, dan anjuran dokter masuk ke riwayat di akunmu.'],
    ] },
  { warna: 'yellow', label: 'Fase 3', judul: 'Sebelum pulang', ket: 'Tidak tertahan di kasir.',
    langkah: [
      ['Obat disiapkan apotek', 'Resep sudah ada di apotek sejak dokter selesai, jadi tinggal diserahkan dan stok otomatis terpotong.'],
      ['Kasir verifikasi otomatis', 'Biaya dan penjaminan sudah dihitung dari hasil pemeriksaan. Petugas tinggal memverifikasi, tanpa menunggu lama.'],
    ] },
  { warna: 'lilac', label: 'Fase 4', judul: 'Setelah pulang', ket: 'Dibantu sampai sembuh dan terkontrol.',
    langkah: [
      ['Baca anjuran dokter', 'Ringkasan berisi perawatan di rumah, pantangan, tanggal kontrol, dan tanda bahaya yang harus diwaspadai. Tersimpan di akunmu dan bisa dibaca keluarga.'],
      ['Alarm minum obat', 'Konfirmasi setiap dosis lewat HP. Kalau beberapa hari tidak dikonfirmasi, kader kesehatan setempat diingatkan untuk menghubungi atau mengunjungi.'],
      ['Perpanjang rujukan dari rumah', 'Kamu diingatkan saat rujukan hampir habis. Klik ajukan, dokter memeriksa riwayat digitalmu, dan rujukan diperpanjang tanpa perlu datang mengambil kertas.'],
      ['Pantau tumbuh kembang anak', 'Tinggi badan anak diplot ke grafik pertumbuhan WHO untuk mendeteksi risiko stunting sejak dini, lengkap dengan checklist imunisasi.'],
    ] },
]

// Beri nomor berlanjut antar fase
let urut = 1
const ALUR = FASE.map((f) => {
  const mulai = urut
  urut += f.langkah.length
  return { ...f, mulai }
})

const PERAN = [
  ['Pasien & keluarga', 'Antrean, riwayat, alarm obat, rujukan, kesehatan anak', 'users'],
  ['Petugas loket', 'Pendaftaran kiosk, panggilan, kasir, stok obat', 'clipboard'],
  ['Dokter', 'Ruang periksa, rekam medis, persetujuan rujukan', 'pulse'],
  ['Apoteker', 'Resep masuk dan stok obat', 'pill'],
  ['Kader kesehatan', 'Pantau kepatuhan obat dan posyandu', 'heart'],
]

export default function Home() {
  return (
    <main>
      <PublicBar />

      <section className="hero">
        <div className="hero-inner hero-grid">
          <div>
            <p className="eyebrow">{TAGLINE}</p>
            <h1>Datang saat giliranmu, bukan saat subuh.</h1>
            <p className="lead">
              {NAMA_APP} menyatukan antrean, rekam medis, resep, dan rujukan dalam satu aplikasi.
              Tidak perlu menunggu berjam-jam.
            </p>
            <div className="actions">
              <Link href="/login?mode=daftar" className="btn">Daftar gratis</Link>
              <Link href="/login" className="btn outline">Sudah punya akun? Masuk</Link>
            </div>
          </div>
          <div className="hero-visual"><HeroIllustration /></div>
        </div>
      </section>

      <section id="fitur" className="section">
        <h2 className="section-title">Yang berubah saat berobat</h2>
        <p className="section-sub">Dari pendaftaran sampai obat di tangan, tiap langkahnya dibuat lebih singkat dan lebih jelas.</p>
        <div className="fitur-grid">
          {FITUR.map((f) => (
            <article key={f.judul} className={`fitur ${f.warna}`}>
              <span className="fitur-ikon"><Icon name={f.ikon} size={24} /></span>
              <h3>{f.judul}</h3>
              <p>{f.isi}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="alur" className="section alt">
        <div className="section-inner">
          <h2 className="section-title">Satu kunjungan, dari awal sampai selesai</h2>
          <p className="section-sub">Ikuti perjalanan pasien, mulai dari rumah sampai kembali ke rumah.</p>
          <div className="alur">
            {ALUR.map((f) => (
              <div key={f.label} className={`fase ${f.warna}`}>
                <div className="fase-head">
                  <small>{f.label}</small>
                  <h3>{f.judul}</h3>
                  <p>{f.ket}</p>
                </div>
                <ol className="steps">
                  {f.langkah.map(([j, i], idx) => (
                    <li key={j}>
                      <span className="no">{f.mulai + idx}</span>
                      <div><b>{j}</b><span>{i}</span></div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="peran" className="section">
        <h2 className="section-title">Satu aplikasi, semua peran</h2>
        <p className="section-sub">Menu dan halaman menyesuaikan siapa yang masuk.</p>
        <ul className="peran-grid">
          {PERAN.map(([n, d, ikon]) => (
            <li key={n}><span className="peran-ikon"><Icon name={ikon} size={22} /></span><b>{n}</b><span>{d}</span></li>
          ))}
        </ul>
      </section>

      <section className="cta">
        <h2>Siap berobat tanpa antre berjam-jam?</h2>
        <p>Buat akun dalam beberapa menit, lalu ambil nomor antrean pertamamu.</p>
        <div className="actions"><Link href="/login?mode=daftar" className="btn">Daftar sekarang</Link><Link href="/login" className="btn outline">Masuk</Link></div>
      </section>

      <footer className="foot">
        <p>{NAMA_APP} bukan pengganti layanan gawat darurat. Dalam keadaan darurat hubungi <b>112</b> atau <b>119</b>.</p>
      </footer>
    </main>
  )
}