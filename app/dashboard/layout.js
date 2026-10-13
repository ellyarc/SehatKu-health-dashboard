'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Logo } from '@/components/PublicBar'
import { MENU, NAMA_PERAN } from '@/lib/menu'
import { supabase } from '@/lib/supabase'

function Shell({ children }) {
  const { loading, user, profil } = useAuth()
  const path = usePathname()
  const router = useRouter()
  const [buka, setBuka] = useState(false)

  const halaman = MENU.find((m) => m.href === path)
  const dilarang = profil && halaman && !halaman.peran.includes(profil.role)

  useEffect(() => { if (!loading && !user) router.replace('/login') }, [loading, user, router])
  useEffect(() => { if (dilarang) router.replace('/dashboard') }, [dilarang, router])
  useEffect(() => { setBuka(false) }, [path])

  if (loading || !user || !profil || dilarang) {
    return <div className="container"><p className="muted">Memuat...</p></div>
  }

  const menu = MENU.filter((m) => m.peran.includes(profil.role))
  const grup = []
  menu.forEach((m) => { if (!grup.includes(m.grup)) grup.push(m.grup) })

  async function keluar() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="app">
      <div className={`scrim ${buka ? 'buka' : ''}`} onClick={() => setBuka(false)} />
      <aside className={`sidebar ${buka ? 'buka' : ''}`}>
        <Link href="/dashboard" className="brand"><Logo /> SiAntre</Link>
        <p className="peran">{profil.nama} · {NAMA_PERAN[profil.role]}</p>
        <nav className="nav" aria-label="Menu utama">
          {grup.map((g) => (
            <div key={g}>
              {g !== 'Utama' && <div className="grup">{g}</div>}
              {menu.filter((m) => m.grup === g).map((m) => (
                <Link key={m.href} href={m.href} className={path === m.href ? 'aktif' : ''}>{m.label}</Link>
              ))}
            </div>
          ))}
        </nav>
        <button className="keluar" onClick={keluar}>Keluar</button>
      </aside>

      <div className="main">
        <div className="mobilebar">
          <span className="brand"><Logo /> SiAntre</span>
          <button onClick={() => setBuka(true)} aria-label="Buka menu">Menu</button>
        </div>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  return <AuthProvider><Shell>{children}</Shell></AuthProvider>
}