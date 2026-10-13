'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { umurTeks } from '@/lib/format'
import { Empty } from '@/components/ui'

// Pencarian pasien berdasarkan NIK (persis) atau nama (sebagian). Khusus tenaga kesehatan.
export default function CariPasien({ onPilih, label = 'Cari pasien (NIK atau nama)' }) {
  const [q, setQ] = useState('')
  const [hasil, setHasil] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function cari(e) {
    e.preventDefault()
    if (!q.trim()) return
    setError(''); setLoading(true)
    const { data, error } = await supabase.rpc('cari_pasien', { p_q: q })
    setLoading(false)
    if (error) return setError(error.message)
    setHasil(data ?? [])
  }

  return (
    <div className="stack">
      <form onSubmit={cari} className="row-form">
        <input className="input" placeholder={label} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn inline" disabled={loading}>{loading ? 'Mencari...' : 'Cari'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {hasil && hasil.length === 0 && <Empty>Tidak ada pasien yang cocok.</Empty>}
      {hasil && hasil.map((p) => (
        <button key={p.id} className="poli-btn" onClick={() => onPilih(p)}>
          <span><strong>{p.nama}</strong><br /><span className="muted">NIK {p.nik || '-'} · {umurTeks(p.tgl_lahir)}</span></span>
          <span className="muted">Pilih</span>
        </button>
      ))}
    </div>
  )
}