import Link from 'next/link'
import PublicBar from '@/components/PublicBar'

const FITUR = [
  ['Antrean yang ikut berubah', 'Estimasi jam dipanggil dihitung dari kecepatan dokter yang sebenarnya.'],
  ['Pra-triase gejala', 'Tanda bahaya diarahkan ke IGD, keluhan mendesak didahulukan.'],
  ['Pendaftaran untuk semua', 'Kiosk loket untuk lansia tanpa HP dan akun keluarga yang tertaut.'],
  ['Riwayat terpadu berbasis NIK', 'Dokter melihat riwayat, hasil lab, dan alergi tanpa mengulang tes.'],
  ['Obat tanpa kejutan', 'Stok dicek saat resep ditulis, alarm minum obat, dan kader memantau yang berhenti.'],
  ['Rujukan, KMS anak, dan SOS', 'Perpanjang rujukan dari rumah, pantau tumbuh kembang, dan minta bantuan darurat.'],
]

export default function Home() {
  return (
    <main>
      <PublicBar />
      <section className="hero">
        <div className="hero-inner">
          <h1>Datang saat giliranmu, bukan saat subuh.</h1>
          <p>
            Satu dashboard untuk antrean, rekam medis, obat, rujukan, dan layanan kesehatan
            keluarga. Dibuat untuk mengurangi antre lama dan layanan yang terhambat.
          </p>
          <div className="actions">
            <Link href="/login" className="btn">Masuk atau daftar</Link>
          </div>
        </div>
      </section>
      <section className="points">
        {FITUR.map(([judul, isi]) => (
          <div key={judul}><h3>{judul}</h3><p>{isi}</p></div>
        ))}
      </section>
    </main>
  )
}