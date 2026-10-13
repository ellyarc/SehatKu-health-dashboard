'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const [nama, setNama] = useState(null)

  useEffect(() => {
    async function ambilNama(session) {
      if (!session) return setNama(null)
      const { data } = await supabase
        .from('profiles').select('nama').eq('id', session.user.id).single()
      setNama(data?.nama || session.user.email)
    }
    supabase.auth.getSession().then(({ data }) => ambilNama(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => ambilNama(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function keluar() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand">
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="2" width="6" height="20" rx="1.5" fill="#fff" />
            <rect x="2" y="9" width="20" height="6" rx="1.5" fill="#fff" />
          </svg>
          SiAntre
        </Link>
        {nama && (
          <div>
            <span className="who">{nama}</span>
            <button onClick={keluar}>Keluar</button>
          </div>
        )}
      </div>
    </header>
  )
}