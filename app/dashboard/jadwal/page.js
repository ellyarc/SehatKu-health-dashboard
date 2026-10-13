'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge, Card, Empty, PageHeader, Tabs } from '@/components/ui'

const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const jamPendek = (t) => t.slice(0, 5)

export default function Jadwal() {
  const [tab, setTab] = useState('jadwal')
  const [jadwal, setJadwal] = useState([])
  const [obat, setObat] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => {
    supabase.from('jadwal_dokter').select('*, poli(nama_poli, faskes(nama))').order('hari').then(({ data }) => setJadwal(data ?? []))
    supabase.from('obat').select('*, faskes(nama)').order('nama').then(({ data }) => setObat(data ?? []))
  }, [])

  const grup = {}
  jadwal.forEach((j) => {
    const kunci = `${j.poli?.faskes?.nama} · ${j.poli?.nama_poli}`
    ;(grup[kunci] ||= []).push(j)
  })
  const obatTampil = obat.filter((o) => o.nama.toLowerCase().includes(q.toLowerCase()) || o.kelompok.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHeader judul="Info faskes" deskripsi="Cek jadwal dokter dan ketersediaan obat sebelum berangkat, supaya tidak antre lama lalu obat kosong." />
      <Tabs aktif={tab} onChange={setTab} tabs={[['jadwal', 'Jadwal dokter'], ['stok', 'Stok obat']]} />

      {tab === 'jadwal' && (Object.keys(grup).length === 0 ? <Empty>Belum ada jadwal.</Empty> : Object.entries(grup).map(([k, rows]) => (
        <Card key={k} judul={k}>
          <ul className="plain">
            {rows.map((j) => (
              <li key={j.id} className="row"><span><b>{HARI[j.hari]}</b> · {j.nama_dokter}</span><span>{jamPendek(j.jam_mulai)} - {jamPendek(j.jam_selesai)}</span></li>
            ))}
          </ul>
        </Card>
      )))}

      {tab === 'stok' && (
        <Card judul="Ketersediaan obat">
          <input className="input" placeholder="Cari obat atau golongan" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="table-wrap mt">
            <table className="table">
              <thead><tr><th>Obat</th><th>Golongan</th><th>Faskes</th><th>Status</th></tr></thead>
              <tbody>
                {obatTampil.map((o) => (
                  <tr key={o.id}>
                    <td>{o.nama}</td><td>{o.kelompok}</td><td>{o.faskes?.nama}</td>
                    <td>{o.stok === 0 ? <Badge tone="danger">Habis</Badge> : o.stok <= 20 ? <Badge tone="warn">Menipis</Badge> : <Badge tone="ok">Tersedia</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}