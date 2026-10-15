'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useLive } from '@/lib/hooks'
import { Badge, Card, Empty, PageHeader, Stat } from '@/components/ui'

// Stok obat hanya untuk tenaga kesehatan (dibatasi juga di database lewat RLS).
// Pasien tidak melihat stok; ketersediaan obat mereka tercatat di Riwayat setelah diperiksa.
export default function Stok() {
  const { profil } = useAuth()
  const [obat, setObat] = useState(null)
  const [q, setQ] = useState('')

  const muat = () =>
    supabase.from('obat').select('*').eq('faskes_id', profil.faskes_id).order('nama').then(({ data }) => setObat(data ?? []))
  useEffect(() => { muat() }, [profil.faskes_id]) // eslint-disable-line react-hooks/exhaustive-deps
  useLive(['resep'], muat)

  const semua = obat ?? []
  const tampil = semua.filter((o) => `${o.nama} ${o.kelompok}`.toLowerCase().includes(q.toLowerCase()))
  const habis = semua.filter((o) => o.stok === 0).length
  const tipis = semua.filter((o) => o.stok > 0 && o.stok <= 20).length

  return (
    <>
      <PageHeader judul="Stok obat" deskripsi="Pantau ketersediaan obat di faskes ini. Perubahan stok dilakukan apoteker lewat menu Farmasi." />
      <div className="grid3">
        <Stat nilai={semua.length} label="Jenis obat" />
        <Stat nilai={tipis} label="Stok menipis" />
        <Stat nilai={habis} label="Stok habis" />
      </div>
      <Card>
        <input className="input" placeholder="Cari obat atau golongan" value={q} onChange={(e) => setQ(e.target.value)} />
        {obat === null ? <p className="muted mt">Memuat...</p> : tampil.length === 0 ? <div className="mt"><Empty>Tidak ada obat yang cocok.</Empty></div> : (
          <div className="table-wrap mt">
            <table className="table">
              <thead><tr><th>Obat</th><th>Golongan</th><th>Stok</th><th>Status</th></tr></thead>
              <tbody>
                {tampil.map((o) => (
                  <tr key={o.id}>
                    <td>{o.nama}</td><td>{o.kelompok}</td><td>{o.stok} {o.satuan}</td>
                    <td>{o.stok === 0 ? <Badge tone="danger">Habis</Badge> : o.stok <= 20 ? <Badge tone="warn">Menipis</Badge> : <Badge tone="ok">Tersedia</Badge>}</td>
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