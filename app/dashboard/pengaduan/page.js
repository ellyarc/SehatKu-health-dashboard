'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { tglIndo } from '@/lib/format'
import { Badge, Card, Empty, Field, Notice, PageHeader } from '@/components/ui'

const KATEGORI = ['Antrean lama', 'Pelayanan petugas/dokter', 'Obat tidak tersedia', 'Biaya/penjaminan', 'Aplikasi', 'Lainnya']
const STATUS = {
  baru: ['Diterima', 'muted'],
  diproses: ['Sedang ditindaklanjuti', 'warn'],
  selesai: ['Selesai ditangani', 'ok'],
}
export default function Pengaduan() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [f, setF] = useState({ kategori: KATEGORI[0], isi: '' })
  const [pesan, setPesan] = useState(null)

  const muat = useCallback(async () => {
    const { data } = await supabase.from('pengaduan').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setData(data ?? [])
  }, [user])
  useEffect(() => { muat() }, [muat])

  async function kirim(e) {
    e.preventDefault(); setPesan(null)
    const { error } = await supabase.from('pengaduan').insert({ user_id: user.id, kategori: f.kategori, isi: f.isi })
    if (error) return setPesan({ tone: 'danger', teks: error.message })
    setF({ ...f, isi: '' }); setPesan({ tone: 'ok', teks: 'Pengaduan terkirim.' }); muat()
  }

  return (
    <>
      <PageHeader judul="Pengaduan" deskripsi="Sampaikan keluhan layanan dan pantau perkembangannya di sini. Untuk keadaan darurat, gunakan tombol SOS." />      <Card judul="Buat pengaduan">
        <form onSubmit={kirim} className="stack">
          <Field label="Kategori"><select className="input" value={f.kategori} onChange={(e) => setF({ ...f, kategori: e.target.value })}>{KATEGORI.map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Isi pengaduan"><textarea className="input" value={f.isi} onChange={(e) => setF({ ...f, isi: e.target.value })} required /></Field>
          {pesan && <Notice tone={pesan.tone}>{pesan.teks}</Notice>}
          <button className="btn inline">Kirim</button>
        </form>
      </Card>
      <Card judul="Pengaduan saya">
        {data.length === 0 ? <Empty>Belum ada pengaduan.</Empty> : data.map((p) => (
          <div key={p.id} className="resep-row">
  <div className="row">
    <b>{p.kategori}</b>
    <Badge tone={STATUS[p.status][1]}>{STATUS[p.status][0]}</Badge>
  </div>
  <p>{p.isi}</p>
  <p className="muted">Dikirim {tglIndo(p.created_at)}</p>
  {p.status === 'baru' && <p className="muted">Menunggu ditinjau petugas.</p>}
  {p.balasan && <Notice><b>Catatan penanganan:</b> {p.balasan}</Notice>}
</div>
        ))}
      </Card>
    </>
  )
}