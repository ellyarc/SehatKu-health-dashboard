'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePasienList } from '@/lib/hooks'
import { selisihHari, tglIndo } from '@/lib/format'
import { Badge, Card, Empty, Notice, PageHeader, PasienSelect } from '@/components/ui'

export default function RujukanPasien() {
  const { list } = usePasienList()
  const [sel, setSel] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { if (list.length && !sel) setSel(list[0].id) }, [list, sel])

  const muat = useCallback(async () => {
    if (!sel) return
    const { data } = await supabase.from('rujukan').select('*, faskes:faskes!faskes_asal_id(nama)')
      .eq('pasien_id', sel).order('berlaku_sampai', { ascending: false })
    setData(data ?? [])
  }, [sel])
  useEffect(() => { muat() }, [muat])

  async function ajukan(id) {
    setError('')
    const { error } = await supabase.rpc('ajukan_perpanjangan', { p_rujukan: id })
    if (error) setError(error.message)
    muat()
  }

  return (
    <>
      <PageHeader judul="Rujukan" deskripsi="Perpanjang rujukan dari rumah tanpa antre mengambil kertas. Dokter memeriksa riwayat medis digitalmu sebelum menyetujui." />
      <PasienSelect list={list} value={sel} onChange={setSel} />
      {error && <Notice tone="danger">{error}</Notice>}

      {data === null ? <p className="muted">Memuat...</p> : data.length === 0 ? <Empty>Belum ada rujukan.</Empty> : data.map((r) => {
        const sisa = selisihHari(r.berlaku_sampai)
        const kedaluwarsa = sisa < 0
        const boleh = r.status === 'aktif' && !kedaluwarsa && sisa <= 30
        return (
          <Card key={r.id} judul={`${r.tujuan}${r.poli_tujuan ? ' · ' + r.poli_tujuan : ''}`}
            aksi={
              r.status === 'diajukan' ? <Badge tone="warn">Menunggu dokter</Badge>
                : r.status === 'ditolak' ? <Badge tone="danger">Ditolak</Badge>
                : kedaluwarsa ? <Badge tone="danger">Kedaluwarsa</Badge>
                : <Badge tone="ok">Aktif</Badge>
            }>
            <p>Diagnosa: {r.diagnosa || '-'}</p>
            <p>Berlaku sampai <b>{tglIndo(r.berlaku_sampai)}</b> {!kedaluwarsa && <span className="muted">({sisa} hari lagi)</span>}</p>
            <p className="muted">Diperpanjang {r.jumlah_perpanjangan}x · dari {r.faskes?.nama || '-'}</p>
            {r.catatan_dokter && <p><b>Catatan dokter:</b> {r.catatan_dokter}</p>}
            {boleh && <button className="btn inline" onClick={() => ajukan(r.id)}>Ajukan perpanjangan</button>}
            {r.status === 'aktif' && !kedaluwarsa && sisa > 30 && <p className="muted">Pengajuan dibuka 30 hari sebelum masa berlaku habis.</p>}
            {(kedaluwarsa || r.status === 'ditolak') && <Notice tone="warn">Perlu kunjungan ulang ke fasilitas kesehatan untuk rujukan baru.</Notice>}
          </Card>
        )
      })}
    </>
  )
}