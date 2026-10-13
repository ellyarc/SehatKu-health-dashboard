'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hariIni } from '@/lib/format'

export default function DashboardPetugas() {
  const router = useRouter()
  const [poliList, setPoliList] = useState([])
  const [poliId, setPoliId] = useState('')
  const [daftar, setDaftar] = useState([])
  const [info, setInfo] = useState('')

  const muatDaftar = useCallback(async (pid) => {
    if (!pid) return
    const { data } = await supabase
      .from('antrean')
      .select('id, nomor, status, profiles(nama)')
      .eq('poli_id', pid)
      .eq('tanggal', hariIni())
      .order('nomor')
    setDaftar(data ?? [])

    const { data: p } = await supabase.from('poli').select('*').eq('id', pid).single()
    if (p) setPoliList((l) => l.map((x) => (x.id === p.id ? p : x)))
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')
      const { data: profil } = await supabase
        .from('profiles').select('role, faskes_id').eq('id', session.user.id).single()
      if (profil?.role !== 'petugas') return router.push('/antrean')
      const { data: poli } = await supabase
        .from('poli').select('*').eq('faskes_id', profil.faskes_id).order('nama_poli')
      setPoliList(poli ?? [])
      if (poli?.length) setPoliId(poli[0].id)
    })()
  }, [router])

  useEffect(() => {
    if (!poliId) return
    muatDaftar(poliId)
    const ch = supabase
      .channel('antrean-petugas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'antrean' },
        () => muatDaftar(poliId))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [poliId, muatDaftar])

  async function panggil() {
    setInfo('')
    const { data, error } = await supabase.rpc('panggil_berikutnya', { p_poli: poliId })
    if (error) setInfo(error.message)
    else if (!data) setInfo('Tidak ada pasien yang menunggu.')
    muatDaftar(poliId)
  }

  const poli = poliList.find((p) => p.id === poliId)
  const menunggu = daftar.filter((d) => d.status === 'menunggu').length

  return (
    <main className="container wide">
      <div className="stack">
        <h1>Dashboard petugas</h1>

        <select className="input" value={poliId} onChange={(e) => setPoliId(e.target.value)}>
          {poliList.map((p) => (
            <option key={p.id} value={p.id}>{p.nama_poli}</option>
          ))}
        </select>

        {poli && (
          <div className="stats">
            <div className="stat"><b>{poli.nomor_sekarang || '-'}</b><span>Sedang dipanggil</span></div>
            <div className="stat"><b>{menunggu}</b><span>Menunggu</span></div>
            <div className="stat"><b>{poli.rata2_durasi_menit}</b><span>Menit/pasien (nyata)</span></div>
          </div>
        )}

        <button className="btn" onClick={panggil}>
          Selesaikan pasien ini dan panggil berikutnya
        </button>
        {info && <p className="muted">{info}</p>}

        <ul className="queue">
          {daftar.map((d) => (
            <li key={d.id} className={d.status}>
              <span>#{d.nomor} {d.profiles?.nama ?? 'Pasien'}</span>
              <span className="badge">{d.status}</span>
            </li>
          ))}
          {daftar.length === 0 && <li className="muted">Belum ada antrean hari ini.</li>}
        </ul>
      </div>
    </main>
  )
}