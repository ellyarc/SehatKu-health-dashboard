'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/PublicBar'
import { Field } from '@/components/ui'

const POIN = [
  ['Antrean dari rumah', 'Ambil nomor dan pantau perkiraan jam dipanggil.'],
  ['Riwayat berobat di satu tempat', 'Terikat NIK, bisa dibaca dokter di fasilitas kesehatan mana pun.'],
  ['Daftarkan orang tua dan anak dari HP-mu', 'Tautkan keluarga ke akunmu, lalu ambilkan antrean dan pantau obat mereka.'],
]

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState('masuk')
  const [nama, setNama] = useState('')
  const [nik, setNik] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
  e.preventDefault()
  setError('')

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

  return (
    <div className="auth">
      <aside className="auth-side">
        <Link href="/" className="brand"><Logo /> SiAntre</Link>
        <div className="auth-copy">
          <h2>Berobat tanpa antre berjam-jam.</h2>
          <ul>
            {POIN.map(([j, i]) => (
              <li key={j}><b>{j}</b><span>{i}</span></li>
            ))}
          </ul>
        </div>
        <p className="auth-foot">Bukan pengganti layanan gawat darurat. Hubungi 112 atau 119 saat darurat.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-box">
          <Link href="/" className="link">← Kembali ke beranda</Link>
          <h1>{daftar ? 'Buat akun' : 'Selamat datang kembali'}</h1>
          <p className="muted">
            {daftar
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
            <Field label="Kata sandi" hint={daftar ? 'Minimal 6 karakter' : undefined}>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                minLength={6} autoComplete={daftar ? 'new-password' : 'current-password'} required />
            </Field>
            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={loading}>
              {loading ? 'Memproses...' : daftar ? 'Daftar' : 'Masuk'}
            </button>
          </form>

          <p className="auth-switch">
            {daftar ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button className="link" onClick={() => { setError(''); setMode(daftar ? 'masuk' : 'daftar') }}>
              {daftar ? 'Masuk' : 'Daftar sekarang'}
            </button>
          </p>
          <p className="muted auth-note">Peran tenaga kesehatan (petugas, dokter, apoteker, kader) diatur oleh admin.</p>
        </div>
      </main>
    </div>
  )
}