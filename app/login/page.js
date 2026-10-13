'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PublicBar from '@/components/PublicBar'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState('masuk')
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } =
      mode === 'daftar'
        ? await supabase.auth.signUp({ email, password, options: { data: { nama } } })
        : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <>
      <PublicBar />
      <main className="container">
        <div className="stack">
          <h1>{mode === 'daftar' ? 'Buat akun' : 'Masuk'}</h1>
          <p className="muted">Satu akun untuk pasien, tenaga kesehatan, dan kader. Peran tenaga kesehatan diatur oleh admin.</p>

          <form onSubmit={submit} className="stack">
            {mode === 'daftar' && (
              <input className="input" placeholder="Nama lengkap" value={nama}
                onChange={(e) => setNama(e.target.value)} required />
            )}
            <input className="input" type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            <input className="input" type="password" placeholder="Kata sandi (min. 6 karakter)"
              value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={loading}>
              {loading ? 'Memproses...' : mode === 'daftar' ? 'Daftar' : 'Masuk'}
            </button>
          </form>

          <button className="link" onClick={() => { setError(''); setMode(mode === 'daftar' ? 'masuk' : 'daftar') }}>
            {mode === 'daftar' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
          </button>
        </div>
      </main>
    </>
  )
}