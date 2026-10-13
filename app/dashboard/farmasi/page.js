'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useLive } from '@/lib/hooks'
import { tglIndo } from '@/lib/format'
import { Badge, Card, Empty, Field, Notice, PageHeader, Tabs } from '@/components/ui'

const satu = (x) => (Array.isArray(x) ? x[0] : x)

export default function Farmasi() {
  const { profil } = useAuth()
  const [tab, setTab] = useState('resep')
  const [resep, setResep] = useState([])
  const [obat, setObat] = useState([])
  const [edit, setEdit] = useState({})
  const [baru, setBaru] = useState({ nama: '', kelompok: '', satuan: 'tablet', stok: 0, harga: 0, ditanggung: true })
  const [error, setError] = useState('')

  const muat = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from('resep').select('*, pasien(nama, alergi), kunjungan(tanggal, diagnosa), resep_item(*)')
        .eq('faskes_id', profil.faskes_id).order('created_at', { ascending: false }).limit(40),
      supabase.from('obat').select('*').eq('faskes_id', profil.faskes_id).order('nama'),
    ])
    setResep(a.data ?? []); setObat(b.data ?? [])
  }, [profil.faskes_id])
  useEffect(() => { muat() }, [muat])
  useLive(['resep'], muat)

  async function serahkan(id) {
    setError('')
    const { error } = await supabase.rpc('serahkan_resep', { p_resep: id })
    if (error) setError(error.message)
    muat()
  }
  async function simpanStok(o) {
    const stok = Number(edit[o.id])
    const { error } = await supabase.from('obat').update({ stok }).eq('id', o.id)
    if (error) setError(error.message)
    setEdit({ ...edit, [o.id]: undefined }); muat()
  }
  async function tambah(e) {
    e.preventDefault(); setError('')
    const { error } = await supabase.from('obat').insert({ ...baru, faskes_id: profil.faskes_id, stok: Number(baru.stok), harga: Number(baru.harga) })
    if (error) return setError(error.message)
    setBaru({ nama: '', kelompok: '', satuan: 'tablet', stok: 0, harga: 0, ditanggung: true }); muat()
  }

  const menunggu = resep.filter((r) => r.status === 'menunggu')
  const selesai = resep.filter((r) => r.status === 'diserahkan')

  return (
    <>
      <PageHeader judul="Farmasi & stok obat" deskripsi="Resep dari dokter masuk langsung. Penyerahan memotong stok, dan stok terbaru langsung terlihat di layar dokter." />
      {error && <Notice tone="danger">{error}</Notice>}
      <Tabs aktif={tab} onChange={setTab} tabs={[['resep', `Resep masuk (${menunggu.length})`], ['stok', 'Stok obat']]} />

      {tab === 'resep' && (
        <>
          {menunggu.length === 0 ? <Empty>Tidak ada resep yang menunggu.</Empty> : menunggu.map((r) => {
            const items = r.resep_item ?? []
            const kurang = items.some((i) => !i.resep_luar && i.obat_id && (obat.find((o) => o.id === i.obat_id)?.stok ?? 0) < i.jumlah)
            return (
              <Card key={r.id} judul={r.pasien?.nama} aksi={<span className="muted">{tglIndo(satu(r.kunjungan)?.tanggal)} · {satu(r.kunjungan)?.diagnosa}</span>}>
                {r.pasien?.alergi && <Notice tone="danger">Alergi pasien: {r.pasien.alergi}</Notice>}
                <ul className="plain">
                  {items.map((i) => {
                    const stok = obat.find((o) => o.id === i.obat_id)?.stok
                    return (
                      <li key={i.id} className="row">
                        <span><b>{i.nama_obat}</b> ({i.jumlah}) <span className="muted">· {i.aturan_pakai || `${i.frekuensi_per_hari}x/hari`}</span></span>
                        {i.resep_luar ? <Badge tone="muted">resep luar</Badge> : stok < i.jumlah ? <Badge tone="danger">stok {stok}</Badge> : <Badge tone="ok">stok {stok}</Badge>}
                      </li>
                    )
                  })}
                </ul>
                <button className="btn small mt" disabled={kurang} onClick={() => serahkan(r.id)}>Serahkan & potong stok</button>
                {kurang && <p className="error">Stok tidak cukup. Hubungi dokter untuk mengganti obat.</p>}
              </Card>
            )
          })}
          {selesai.length > 0 && <Card judul="Sudah diserahkan"><ul className="plain">{selesai.map((r) => <li key={r.id}>{r.pasien?.nama} · {tglIndo(r.diserahkan_at)}</li>)}</ul></Card>}
        </>
      )}

      {tab === 'stok' && (
        <>
          <Card judul="Daftar stok">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Obat</th><th>Golongan</th><th>Stok</th><th></th></tr></thead>
                <tbody>
                  {obat.map((o) => (
                    <tr key={o.id}>
                      <td>{o.nama}</td><td>{o.kelompok}</td>
                      <td><input className="input" style={{ width: 90 }} type="number" min="0" value={edit[o.id] ?? o.stok} onChange={(e) => setEdit({ ...edit, [o.id]: e.target.value })} /></td>
                      <td>{edit[o.id] !== undefined && Number(edit[o.id]) !== o.stok ? <button className="btn small" onClick={() => simpanStok(o)}>Simpan</button> : o.stok === 0 ? <Badge tone="danger">habis</Badge> : o.stok <= 20 ? <Badge tone="warn">menipis</Badge> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card judul="Tambah obat">
            <form onSubmit={tambah} className="stack">
              <div className="grid2">
                <Field label="Nama obat"><input className="input" value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} required /></Field>
                <Field label="Golongan" hint="Dipakai untuk saran obat pengganti"><input className="input" value={baru.kelompok} onChange={(e) => setBaru({ ...baru, kelompok: e.target.value })} required /></Field>
                <Field label="Satuan"><input className="input" value={baru.satuan} onChange={(e) => setBaru({ ...baru, satuan: e.target.value })} /></Field>
                <Field label="Stok"><input className="input" type="number" min="0" value={baru.stok} onChange={(e) => setBaru({ ...baru, stok: e.target.value })} /></Field>
                <Field label="Harga satuan (Rp)"><input className="input" type="number" min="0" value={baru.harga} onChange={(e) => setBaru({ ...baru, harga: e.target.value })} /></Field>
              </div>
              <label className="check"><input type="checkbox" checked={baru.ditanggung} onChange={(e) => setBaru({ ...baru, ditanggung: e.target.checked })} /><span>Ditanggung penjamin (BPJS/asuransi)</span></label>
              <button className="btn inline">Tambah</button>
            </form>
          </Card>
        </>
      )}
    </>
  )
}