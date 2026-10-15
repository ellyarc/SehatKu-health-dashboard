import Link from 'next/link'
import { NAMA_APP } from '@/lib/brand'

// Logo aplikasi: kotak oranye, tanda tambah putih, titik kuning sebagai penanda antrean.
// Berkas yang sama ada di public/logo.svg dan app/icon.svg (favicon).
export const Logo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect width="48" height="48" rx="12" fill="#ee7f1e" />
    <rect x="20" y="10" width="8" height="28" rx="2.5" fill="#fff" />
    <rect x="10" y="20" width="28" height="8" rx="2.5" fill="#fff" />
    <circle cx="37" cy="11" r="4.5" fill="#ffcf5e" stroke="#ee7f1e" strokeWidth="2" />
  </svg>
)

// Menu di landing page. href memakai "/#..." supaya juga jalan dari halaman lain.
const LINKS = [
  ['Fitur', '/#fitur'],
  ['Alur', '/#alur'],
  ['Peran', '/#peran'],
]

export default function PublicBar() {
  return (
    <header className="topbar sticky">
      <div className="topbar-inner">
        <Link href="/" className="brand"><Logo /> {NAMA_APP}</Link>
        <nav className="topnav" aria-label="Menu utama">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="topnav-link">{label}</Link>
          ))}
          <Link href="/login" className="topnav-link">Masuk</Link>
          <Link href="/login?mode=daftar" className="topnav-masuk">Daftar</Link>
        </nav>
      </div>
    </header>
  )
}