'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthShell from '@/components/AuthShell'
import Icon from '@/components/Icons'
import { Field, Notice } from '@/components/ui'

// Halaman tujuan tautan di email "lupa kata sandi".
// Supabase membuat sesi sementara dari tautan itu, lalu kita ganti kata sandinya.
export default function ResetPassword() {
  const router = useRouter()
  const [status, setStatus] = useState('memuat') // memuat | siap | tidak-valid | selesai
  const [password, setPassword] = useState('')
  const [ulang, setUlang] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('siap')
    })
    // getSession menunggu Supabase selesai membaca tautan, jadi aman dipanggil di sini
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus((s) => (s === 'memuat' ? (session ? 'siap' : 'tidak-valid') : s))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Kata sandi minimal 6 karakter.')
    if (password !== ulang) return setError('Kata sandi dan ulangannya tidak sama.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setError(error.message)
    setStatus('selesai')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <AuthShell>
      <Link href="/login" className="back" aria-label="Kembali ke halaman masuk" title="Kembali ke halaman masuk"><Icon name="back" size={22} /></Link>
      <h1>Buat kata sandi baru</h1>

      {status === 'memuat' && <p className="muted">Memeriksa tautan...</p>}

      {status === 'tidak-valid' && (
        <>
          <Notice tone="warn">Tautan ini tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman masuk.</Notice>
          <Link href="/login" className="btn">Kembali ke halaman masuk</Link>
        </>
      )}

      {status === 'siap' && (
        <>
          <p className="muted">Pilih kata sandi baru untuk akunmu.</p>
          <form onSubmit={submit} className="stack">
            <Field label="Kata sandi baru" hint="Minimal 6 karakter">
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                minLength={6} autoComplete="new-password" required />
            </Field>
            <Field label="Ulangi kata sandi baru">
              <input className="input" type="password" value={ulang} onChange={(e) => setUlang(e.target.value)}
                minLength={6} autoComplete="new-password" required />
            </Field>
            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan kata sandi'}</button>
          </form>
        </>
      )}

      {status === 'selesai' && <Notice tone="ok">Kata sandi berhasil diubah. Mengarahkan ke dashboard...</Notice>}
    </AuthShell>
  )
}