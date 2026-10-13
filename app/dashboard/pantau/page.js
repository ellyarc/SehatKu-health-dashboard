'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { tglIndo } from '@/lib/format'
import { Badge, Card, Empty, Notice, PageHeader } from '@/components/ui'

const wa = (hp) => {
  const d = (hp || '').replace(/\D/g, '')
  return d.startsWith('0') ? '62' + d.slice(1) : d
}

export default function Pantau() {
  const [hari, setHari] = useState(2)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const muat = useCallback(async () => {
    const { data, error } = await supabase.rpc('pasien_tidak_patuh', { p_hari: hari })
    if (error) setError(error.message)
    setData(data ?? [])
  }, [hari])
  useEffect(() => { muat() }, [muat])

  return (
    <>
      <PageHeader judul="Pantau kepatuhan minum obat" deskripsi="Pasien yang tidak mengonfirmasi minum obat selama beberapa hari. Hubungi atau kunjungi sebelum pengobatan terputus (penting untuk TBC, darah tinggi, diabetes)." />
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="row-gap">
        <span>Tidak minum obat sudah</span>
        <select className="input" style={{ width: 150 }} value={hari} onChange={(e) => setHari(Number(e.target.value))}>
          {[1, 2, 3, 5, 7].map((n) => <option key={n} value={n}>{n} hari atau lebih</option>)}
        </select>
        <button className="btn small outline" onClick={muat}>Muat ulang</button>
      </div>
      <Card>
        {data === null ? <p className="muted">Memuat...</p> : data.length === 0 ? <Empty>Tidak ada pasien yang melewati batas ini.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Pasien</th><th>Obat</th><th>Tidak minum</th><th>Terakhir</th><th>Hubungi</th></tr></thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i}>
                    <td><b>{r.nama}</b><br /><span className="muted">{r.alamat || 'alamat belum diisi'}</span></td>
                    <td>{r.nama_obat} {r.kronis && <Badge tone="muted">jangka panjang</Badge>}</td>
                    <td><Badge tone={r.hari_tak_minum >= 3 ? 'danger' : 'warn'}>{r.hari_tak_minum} hari</Badge></td>
                    <td>{r.terakhir ? tglIndo(r.terakhir) : 'belum pernah'}</td>
                    <td>{r.no_hp ? <span className="row-gap"><a className="btn small" href={`tel:${r.no_hp}`}>Telepon</a><a className="btn small outline" target="_blank" rel="noreferrer" href={`https://wa.me/${wa(r.no_hp)}`}>WhatsApp</a></span> : <span className="muted">tidak ada nomor, kunjungi rumah</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}