'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useLive } from '@/lib/hooks'
import { tglIndo } from '@/lib/format'
import { Badge, Card, Notice, PageHeader } from '@/components/ui'

const posisi = () => new Promise((ok, gagal) => {
  if (!navigator.geolocation) return gagal(new Error('Peramban tidak mendukung lokasi'))
  navigator.geolocation.getCurrentPosition(ok, gagal, { enableHighAccuracy: true, timeout: 10000 })
})

export default function Sos() {
  const { user, diri } = useAuth()
  const [riwayat, setRiwayat] = useState([])
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [pesan, setPesan] = useState('')
  const [hasil, setHasil] = useState(null)
  const [busy, setBusy] = useState(false)

  const muat = useCallback(async () => {
    const { data } = await supabase.from('sos_event').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    setRiwayat(data ?? [])
  }, [user])
  useEffect(() => { muat() }, [muat])
  useLive(['sos_event'], muat)

  async function kirim() {
    setBusy(true); setHasil(null)
    let lat = null, lng = null, catatan = ''
    try {
      const p = await posisi()
      lat = p.coords.latitude; lng = p.coords.longitude
    } catch { catatan = 'Lokasi tidak tersedia. ' }
    const { error } = await supabase.from('sos_event').insert({
      user_id: user.id, pasien_id: diri?.id ?? null, lat, lng, pesan: catatan + pesan,
    })
    setBusy(false); setKonfirmasi(false); setPesan('')
    setHasil(error
      ? { tone: 'danger', teks: error.message }
      : { tone: 'ok', teks: lat ? 'SOS terkirim beserta lokasimu. Tetap hubungi 112/119 untuk bantuan segera.' : 'SOS terkirim tanpa lokasi. Hubungi 112/119 dan sebutkan alamatmu.' })
    muat()
  }

  return (
    <>
      <PageHeader judul="SOS darurat" deskripsi="Mengirim lokasi dan kondisimu ke petugas fasilitas kesehatan." />
      <Notice tone="danger">
        Aplikasi ini <b>bukan pengganti layanan gawat darurat</b>. Untuk keadaan yang mengancam nyawa, <b>hubungi langsung</b>:
        <div className="telp mt">
          <a className="btn small danger" href="tel:112">Telepon 112</a>
          <a className="btn small danger" href="tel:119">Telepon 119 (ambulans)</a>
          {diri?.kontak_darurat_hp && <a className="btn small ghost" href={`tel:${diri.kontak_darurat_hp}`}>Hubungi {diri.kontak_darurat_nama || 'kontak darurat'}</a>}
        </div>
      </Notice>

      <Card>
        {!konfirmasi ? (
          <button className="sos-btn" onClick={() => setKonfirmasi(true)}>SOS</button>
        ) : (
          <div className="stack">
            <h3>Kirim SOS sekarang?</h3>
            <textarea className="input" placeholder="Kondisi singkat (opsional)" value={pesan} onChange={(e) => setPesan(e.target.value)} />
            <p className="muted">Browser akan meminta izin lokasi. Setelah dikirim, petugas melihat peringatan secara langsung.</p>
            <div className="row-gap">
              <button className="btn danger inline" onClick={kirim} disabled={busy}>{busy ? 'Mengirim...' : 'Ya, kirim SOS'}</button>
              <button className="btn outline inline" onClick={() => setKonfirmasi(false)}>Batal</button>
            </div>
          </div>
        )}
        {hasil && <Notice tone={hasil.tone}>{hasil.teks}</Notice>}
        {!diri?.kontak_darurat_hp && <p className="muted mt">Tambahkan kontak darurat di Data Diri agar tombol panggil cepat muncul di sini.</p>}
      </Card>

      <Card judul="SOS terakhir">
        {riwayat.length === 0 ? <p className="muted">Belum ada.</p> : (
          <ul className="plain">
            {riwayat.map((r) => (
              <li key={r.id} className="row">
                <span>{tglIndo(r.created_at)} · {r.pesan || 'tanpa pesan'}</span>
                <Badge tone={r.status === 'baru' ? 'warn' : 'ok'}>{r.status === 'baru' ? 'Menunggu petugas' : r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}