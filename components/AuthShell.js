import Link from 'next/link'
import { Logo } from '@/components/PublicBar'
import { NAMA_APP } from '@/lib/brand'
import Icon from '@/components/Icons'
import { HeroIllustration } from '@/components/Illustrations'

const POIN = [
  ['clock', 'Antrean dari rumah'],
  ['history', 'Riwayat berobat di satu tempat'],
  ['users', 'Urus orang tua dan anak dari satu akun'],
]

// Kerangka dua kolom yang dipakai halaman masuk, lupa kata sandi, dan reset kata sandi.
export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Link href="/" className="brand"><Logo /> {NAMA_APP}</Link>
        <div className="auth-copy">
          <h2>Berobat tanpa antre berjam-jam.</h2>
          <div className="auth-visual"><HeroIllustration /></div>
          <ul>
            {POIN.map(([ikon, j]) => (
              <li key={j}><Icon name={ikon} size={18} /><span>{j}</span></li>
            ))}
          </ul>
        </div>
        <p className="auth-foot">Bukan pengganti layanan gawat darurat. Hubungi 112 atau 119 saat darurat.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-box">{children}</div>
      </main>
    </div>
  )
}