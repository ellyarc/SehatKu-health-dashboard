'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import KunjunganCard, { SELECT_KUNJUNGAN } from '@/components/KunjunganCard'
import { tglIndo, umurTeks } from '@/lib/format'
import { Card, Empty, Notice, PageHeader } from '@/components/ui'

function Riwayat({ pasienId }) {
  const [k, setK] = useState(null)
  useEffect(() => {
    supabase.from('kunjungan').select(SELECT_KUNJUNGAN).eq('pasien_id', pasienId)
      .order('tanggal', { ascending: false }).limit(3).then(({ data }) => setK(data ?? []))
  }, [pasienId])
  if (!k) return <p className="muted">Memuat riwayat...</p>
  return k.length === 0 ? <p className="muted">Belum ada riwayat kunjungan.</p> : k.map((x) => <KunjunganCard key={x.id} k={x} />)
}

export default function PersetujuanRujukan() {
  const [data, setData] = useState(null)
  const [catatan, setCatatan] = useState({})
  const [error, setError] = useState('')

  const muat = useCallback(async () => {
    const { data } = await supabase.from('rujukan').select('*, pasien(nama, nik, tgl_lahir, alergi)')
      .eq('status', 'diajukan').order('diajukan_at')
    setData(data ?? [])
  }, [])
  useEffect(() => { muat() }, [muat])

  async function putuskan(id, setuju) {
    setError('')
    const { error } = await supabase.rpc('putuskan_perpanjangan', { p_rujukan: id, p_setuju: setuju, p_catatan: catatan[id] || null, p_hari: 90 })
    if (error) setError(error.message)
    muat()
  }

  return (
    <>
      <PageHeader judul="Persetujuan perpanjangan rujukan" deskripsi="Pasien kronis yang stabil tidak perlu datang hanya untuk mengambil kertas rujukan. Periksa riwayat digitalnya, lalu setujui atau minta kunjungan ulang." />
      {error && <Notice tone="danger">{error}</Notice>}
      {data === null ? <p className="muted">Memuat...</p> : data.length === 0 ? <Empty>Tidak ada pengajuan.</Empty> : data.map((r) => (
        <Card key={r.id} judul={`${r.pasien?.nama} · ${umurTeks(r.pasien?.tgl_lahir)}`}>
          <p>Rujukan ke <b>{r.tujuan}</b> {r.poli_tujuan && `(${r.poli_tujuan})`} · diagnosa {r.diagnosa || '-'}</p>
          <p>Berlaku sampai {tglIndo(r.berlaku_sampai)} · sudah diperpanjang {r.jumlah_perpanjangan}x</p>
          {r.pasien?.alergi && <p className="muted">Alergi: {r.pasien.alergi}</p>}
          <details><summary>Lihat riwayat medis terakhir</summary><div className="stack mt"><Riwayat pasienId={r.pasien_id} /></div></details>
          <textarea className="input mt" placeholder="Catatan untuk pasien (opsional)" value={catatan[r.id] || ''} onChange={(e) => setCatatan({ ...catatan, [r.id]: e.target.value })} />
          <div className="row-gap mt">
            <button className="btn small" onClick={() => putuskan(r.id, true)}>Setujui (+90 hari)</button>
            <button className="btn small outline" onClick={() => putuskan(r.id, false)}>Tolak, minta kunjungan ulang</button>
          </div>
        </Card>
      ))}
    </>
  )
}