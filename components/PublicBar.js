import Link from 'next/link'

export const Logo = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="2" width="6" height="20" rx="1.5" fill="#fff" />
    <rect x="2" y="9" width="20" height="6" rx="1.5" fill="#fff" />
  </svg>
)

export default function PublicBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand"><Logo /> SiAntre</Link>
        <Link href="/login" className="who">Masuk</Link>
      </div>
    </header>
  )
}