'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useLive } from '@/lib/hooks'
import { hariIni } from '@/lib/format'
import { Badge, PageHeader, Stat } from '@/components/ui'

export default function Loket() {
  const { profil } = useAuth()
  const [poliList, setPoliList] = useState([])
  const [poliId, setPoliId] = useState('')
  const [daftar, setDaftar] = useState([])
  const [info, setInfo] = useState('')

  useEffect(() => {
    supabase.from('poli').select('*').eq('faskes_id', profil.faskes_id).order('nama_poli').then(({ data }) => {
      setPoliList(data ?? []); if (data?.length) setPoliId(data[0].id)
    })
  }, [profil.faskes_id])

  const muat = useCallback(async () => {
    if (!poliId) return
    const [a, p] = await Promise.all([
      supabase.from('antrean').select('id, nomor, status, urgensi, sumber, pasien(nama)')
        .eq('poli_id', poliId).eq('tanggal', hariIni()).order('nomor'),
      supabase.from('poli').select('*').eq('id', poliId).single(),
    ])
    setDaftar(a.data ?? [])
    if (p.data) setPoliList((l) => l.map((x) => (x.id === p.data.id ? p.data : x)))
  }, [poliId])
  useEffect(() => { muat() }, [muat])
  useLive(['antrean', 'poli'], muat)

  async function panggil() {
    setInfo('')
    const { data, error } = await supabase.rpc('panggil_berikutnya', { p_poli: poliId })
    if (error) setInfo(error.message)
    else if (!data) setInfo('Tidak ada pasien yang menunggu.')
    muat()
  }
  async function batal(id) { await supabase.rpc('batalkan_antrean', { p_id: id }); muat() }

  const poli = poliList.find((p) => p.id === poliId)
  const menunggu = daftar.filter((d) => d.status === 'menunggu')
  const segera = menunggu.filter((d) => d.urgensi === 'segera').length

  return (
    <>
      <PageHeader judul="Loket & panggilan" deskripsi="Pasien dengan prioritas segera dipanggil lebih dulu, sisanya sesuai urutan nomor." />
      <select className="input" value={poliId} onChange={(e) => setPoliId(e.target.value)}>
        {poliList.map((p) => <option key={p.id} value={p.id}>{p.nama_poli}</option>)}
      </select>
      {poli && (
        <div className="stats">
          <Stat nilai={poli.nomor_sekarang || '-'} label="Sedang dipanggil" />
          <Stat nilai={`${menunggu.length}${segera ? ` (${segera} segera)` : ''}`} label="Menunggu" />
          <Stat nilai={poli.rata2_durasi_menit} label="Menit/pasien (nyata)" />
        </div>
      )}
      <button className="btn" onClick={panggil}>Selesaikan pasien ini dan panggil berikutnya</button>
      {info && <p className="muted">{info}</p>}
      <ul className="queue">
        {daftar.map((d) => (
          <li key={d.id} className={`${d.status} ${d.urgensi === 'segera' && d.status === 'menunggu' ? 'segera' : ''}`}>
            <span>#{d.nomor} {d.pasien?.nama}</span>
            <span className="meta">
              {d.sumber === 'kiosk' && <Badge tone="muted">kiosk</Badge>}
              {d.urgensi === 'segera' && d.status === 'menunggu' && <Badge tone="warn">segera</Badge>}
              <span className="badge">{d.status}</span>
              {d.status === 'menunggu' && profil.role === 'petugas' && <button className="link danger" onClick={() => batal(d.id)}>batalkan</button>}
            </span>
          </li>
        ))}
        {daftar.length === 0 && <li className="muted">Belum ada antrean hari ini.</li>}
      </ul>
    </>
  )
}