'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useLive } from '@/lib/hooks'
import { tglIndo } from '@/lib/format'
import { Badge, Card, Empty, Notice, PageHeader, Tabs } from '@/components/ui'

export default function Laporan() {
  const { user } = useAuth()
  const [tab, setTab] = useState('sos')
  const [sos, setSos] = useState([])
  const [aduan, setAduan] = useState([])
  const [nama, setNama] = useState({})
  const [balas, setBalas] = useState({})

  const muat = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from('sos_event').select('*, pasien(nama, no_hp, alamat, kontak_darurat_nama, kontak_darurat_hp)').order('created_at', { ascending: false }).limit(50),
      supabase.from('pengaduan').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    setSos(a.data ?? []); setAduan(b.data ?? [])
    const ids = [...new Set((b.data ?? []).map((x) => x.user_id))]
    if (ids.length) {
      const { data } = await supabase.from('pasien').select('user_id, nama').in('user_id', ids)
      setNama(Object.fromEntries((data ?? []).map((p) => [p.user_id, p.nama])))
    }
  }, [])
  useEffect(() => { muat() }, [muat])
  useLive(['sos_event'], muat)

  async function ubahSos(id, status) {
    await supabase.from('sos_event').update({ status, ditangani_oleh: user.id }).eq('id', id)
    muat()
  }
  async function jawab(id, status) {
    await supabase.from('pengaduan').update({ balasan: balas[id] || null, status }).eq('id', id)
    muat()
  }

  const sosBaru = sos.filter((s) => s.status === 'baru').length
  return (
    <>
      <PageHeader judul="SOS & pengaduan masuk" deskripsi="Tindak lanjuti permintaan bantuan darurat dan keluhan layanan." />
      <Tabs aktif={tab} onChange={setTab} tabs={[['sos', `SOS${sosBaru ? ` (${sosBaru} baru)` : ''}`], ['aduan', 'Pengaduan']]} />

      {tab === 'sos' && (sos.length === 0 ? <Empty>Tidak ada SOS.</Empty> : sos.map((s) => (
        <Card key={s.id} judul={s.pasien?.nama || 'Pengguna'} aksi={<Badge tone={s.status === 'baru' ? 'danger' : s.status === 'ditangani' ? 'warn' : 'ok'}>{s.status}</Badge>}>
          <p className="muted">{tglIndo(s.created_at)} · {new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}</p>
          {s.pesan && <p>{s.pesan}</p>}
          <div className="telp">
            {s.lat && <a className="btn small" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}>Lihat lokasi di peta</a>}
            {s.pasien?.no_hp && <a className="btn small outline" href={`tel:${s.pasien.no_hp}`}>Telepon pasien</a>}
            {s.pasien?.kontak_darurat_hp && <a className="btn small outline" href={`tel:${s.pasien.kontak_darurat_hp}`}>Telepon {s.pasien.kontak_darurat_nama || 'kontak darurat'}</a>}
          </div>
          {!s.lat && <Notice tone="warn">Lokasi tidak terkirim. Hubungi pasien untuk menanyakan alamat.</Notice>}
          <div className="row-gap mt">
            {s.status === 'baru' && <button className="btn small" onClick={() => ubahSos(s.id, 'ditangani')}>Tandai ditangani</button>}
            {s.status !== 'selesai' && <button className="btn small outline" onClick={() => ubahSos(s.id, 'selesai')}>Selesai</button>}
          </div>
        </Card>
      )))}

      {tab === 'aduan' && (aduan.length === 0 ? <Empty>Tidak ada pengaduan.</Empty> : aduan.map((p) => (
        <Card key={p.id} judul={`${p.kategori} · ${nama[p.user_id] || 'Pengguna'}`} aksi={<Badge tone={p.status === 'selesai' ? 'ok' : p.status === 'diproses' ? 'warn' : 'muted'}>{p.status}</Badge>}>
          <p>{p.isi}</p>
          <p className="muted">{tglIndo(p.created_at)}</p>
          {p.status !== 'selesai' && (
            <div className="stack">
              <textarea className="input" placeholder="Tulis balasan" value={balas[p.id] ?? p.balasan ?? ''} onChange={(e) => setBalas({ ...balas, [p.id]: e.target.value })} />
              <div className="row-gap">
                <button className="btn small outline" onClick={() => jawab(p.id, 'diproses')}>Tandai diproses</button>
                <button className="btn small" onClick={() => jawab(p.id, 'selesai')}>Kirim balasan & selesai</button>
              </div>
            </div>
          )}
          {p.status === 'selesai' && p.balasan && <Notice><b>Balasan:</b> {p.balasan}</Notice>}
        </Card>
      )))}
    </>
  )
}