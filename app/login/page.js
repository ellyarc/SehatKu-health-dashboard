'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthShell from '@/components/AuthShell'
import Icon from '@/components/Icons'
import { Field, Notice } from '@/components/ui'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState('masuk') // masuk | daftar | lupa
  const [nama, setNama] = useState('')
  const [nik, setNik] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'daftar') setMode('daftar')
  }, [])

  function ganti(m) { setError(''); setInfo(''); setMode(m) }

  async function submit(e) {
    e.preventDefault()
    setError(''); setInfo('')

    // Lupa kata sandi: kirim tautan reset ke email
    if (mode === 'lupa') {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setLoading(false)
      if (error) return setError(error.message)
      // Pesan sengaja sama untuk email terdaftar maupun tidak (tidak membocorkan siapa yang punya akun)
      return setInfo('Jika email itu terdaftar, tautan untuk membuat kata sandi baru sudah dikirim. Periksa kotak masuk dan folder spam.')
    }

    if (mode === 'daftar' && !/^[0-9]{16}$/.test(nik)) {
      setError('NIK harus 16 digit angka.')
      return
    }

    setLoading(true)

    const { error } =
      mode === 'daftar'
        ? await supabase.auth.signUp({ email, password, options: { data: { nama: nama.trim(), nik } } })
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

  const daftar = mode === 'daftar'
  const lupa = mode === 'lupa'

  return (
    <AuthShell>
      <Link href="/" className="back" aria-label="Kembali ke beranda" title="Kembali ke beranda"><Icon name="back" size={22} /></Link>
      <h1>{lupa ? 'Lupa kata sandi?' : daftar ? 'Buat akun' : 'Selamat datang kembali'}</h1>
      {!lupa && (
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={!daftar} className={!daftar ? 'on' : ''} onClick={() => ganti('masuk')}>Masuk</button>
          <button type="button" role="tab" aria-selected={daftar} className={daftar ? 'on' : ''} onClick={() => ganti('daftar')}>Daftar akun baru</button>
        </div>
      )}
      <p className="muted">
        {lupa
          ? 'Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi baru.'
          : daftar
            ? 'Satu akun untuk berobat sendiri dan mengurus keluarga.'
            : 'Masuk untuk mengelola antrean, riwayat, dan obatmu.'}
      </p>

      <form onSubmit={submit} className="stack">
        {daftar && (
          <>
            <Field label="Nama lengkap" hint="Tulis sesuai KTP">
              <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" required />
            </Field>
            <Field label="NIK" hint="16 digit, sesuai KTP">
              <input className="input" inputMode="numeric" maxLength={16} pattern="[0-9]{16}"
                value={nik} onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))} required />
            </Field>
          </>
        )}
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </Field>
        {!lupa && (
          <Field label="Kata sandi" hint={daftar ? 'Minimal 6 karakter' : undefined}>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              minLength={6} autoComplete={daftar ? 'new-password' : 'current-password'} required />
          </Field>
        )}
        {mode === 'masuk' && (
          <div className="auth-forgot">
            <button type="button" className="link" onClick={() => ganti('lupa')}>Lupa kata sandi?</button>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        {info && <Notice tone="ok">{info}</Notice>}
        <button className="btn" disabled={loading}>
          {loading ? 'Memproses...' : lupa ? 'Kirim tautan reset' : daftar ? 'Daftar' : 'Masuk'}
        </button>
      </form>

      <p className="auth-switch">
        {lupa ? (
          <button className="link" onClick={() => ganti('masuk')}>← Kembali ke halaman masuk</button>
        ) : (
          <>
            {daftar ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button className="link" onClick={() => ganti(daftar ? 'masuk' : 'daftar')}>
              {daftar ? 'Masuk' : 'Daftar sekarang'}
            </button>
          </>
        )}
      </p>
    </AuthShell>
  )
}