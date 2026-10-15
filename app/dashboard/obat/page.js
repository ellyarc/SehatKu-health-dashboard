'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { usePasienList, useInterval } from '@/lib/hooks'
import { hariIni, jamSekarang, tambahHari, tglIndo } from '@/lib/format'
import { Badge, Card, Empty, Field, Notice, PageHeader, PasienSelect } from '@/components/ui'

const menit = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }

export default function Obat() {
  const { user } = useAuth()
  const { list } = usePasienList()
  const [sel, setSel] = useState(null)
  const [pengingat, setPengingat] = useState([])
  const [log, setLog] = useState([])
  const [sekarang, setSekarang] = useState(jamSekarang())
  const [izin, setIzin] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
  const sudahNotif = useRef(new Set())
  const [f, setF] = useState({ nama: '', aturan: '', jam: '08:00', durasi: '', kronis: false })
  const [error, setError] = useState('')

  useEffect(() => { if (list.length && !sel) setSel(list[0].id) }, [list, sel])

  const muat = useCallback(async () => {
    if (!sel) return
    const hari = hariIni()
    const [a, b] = await Promise.all([
      supabase.from('pengingat_obat').select('*').eq('pasien_id', sel).eq('aktif', true).order('created_at', { ascending: false }),
      supabase.from('log_minum').select('pengingat_id, jam').eq('pasien_id', sel).eq('tanggal', hari),
    ])
    setPengingat(a.data ?? []); setLog(b.data ?? [])
  }, [sel])
  useEffect(() => { muat() }, [muat])
  useInterval(() => setSekarang(jamSekarang()), 30000)

  const hari = hariIni()
  const jadwal = pengingat
    .filter((p) => p.mulai <= hari && (!p.selesai || p.selesai >= hari))
    .flatMap((p) => p.jam.map((j) => ({
      key: p.id + j, id: p.id, nama: p.nama_obat, aturan: p.aturan, jam: j,
      sudah: log.some((l) => l.pengingat_id === p.id && l.jam === j),
    })))
    .sort((a, b) => a.jam.localeCompare(b.jam))
  const waktunya = jadwal.filter((j) => !j.sudah && menit(j.jam) <= menit(sekarang))

  // Notifikasi browser (hanya saat halaman ini terbuka)
  useEffect(() => {
    if (izin !== 'granted') return
    waktunya.forEach((j) => {
      if (!sudahNotif.current.has(j.key + hari)) {
        sudahNotif.current.add(j.key + hari)
        new Notification('Waktunya minum obat', { body: `${j.nama} (${j.jam})` })
      }
    })
  }, [waktunya, izin, hari])

  async function aktifkanNotif() { setIzin(await Notification.requestPermission()) }

  async function konfirmasi(j) {
    await supabase.rpc('konfirmasi_minum', { p_pengingat: j.id, p_jam: j.jam })
    muat()
  }
  async function hentikan(id) {
    await supabase.from('pengingat_obat').update({ aktif: false }).eq('id', id)
    muat()
  }

  async function tambah(e) {
    e.preventDefault()
    setError('')
    const jamList = f.jam.split(/[,\s]+/).filter(Boolean)
    if (!jamList.length || jamList.some((j) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(j))) {
      return setError('Format jam harus HH:MM, pisahkan dengan koma. Contoh: 08:00, 20:00')
    }
    const { error } = await supabase.from('pengingat_obat').insert({
      pasien_id: sel, nama_obat: f.nama, aturan: f.aturan, jam: jamList, mulai: hari,
      selesai: f.kronis || !f.durasi ? null : tambahHari(hari, Number(f.durasi) - 1),
      kronis: f.kronis, dibuat_oleh: user.id,
    })
    if (error) return setError(error.message)
    setF({ nama: '', aturan: '', jam: '08:00', durasi: '', kronis: false })
    muat()
  }

  return (
    <>
      <PageHeader judul="Alarm minum obat" deskripsi="Konfirmasi setiap dosis. Jika berhenti beberapa hari, kader kesehatan setempat mendapat peringatan untuk menghubungimu." />
      <PasienSelect list={list} value={sel} onChange={setSel} />

      {izin === 'default' && (
        <Notice>Aktifkan notifikasi browser agar muncul pengingat saat halaman ini terbuka. <button className="link" onClick={aktifkanNotif}>Aktifkan</button></Notice>
      )}
      {waktunya.length > 0 && <Notice tone="warn"><b>Waktunya minum:</b> {waktunya.map((j) => `${j.nama} (${j.jam})`).join(', ')}</Notice>}

      <Card judul="Jadwal hari ini">
        {jadwal.length === 0 ? <Empty>Tidak ada jadwal obat hari ini.</Empty> : (
          <ul className="plain">
            {jadwal.map((j) => (
              <li key={j.key} className="row">
                <span><b>{j.jam}</b> · {j.nama}{j.aturan ? <span className="muted"> · {j.aturan}</span> : null}</span>
                {j.sudah ? <Badge tone="ok">Sudah minum</Badge>
                  : <button className="btn small" onClick={() => konfirmasi(j)}>Sudah minum</button>}
              </li>
            ))}
          </ul>
        )}
        <p className="muted">Pengingat dari resep dokter dibuat otomatis saat pemeriksaan disimpan.</p>
      </Card>

      <Card judul="Semua pengingat aktif">
        {pengingat.length === 0 ? <Empty>Belum ada pengingat.</Empty> : (
          <ul className="plain">
            {pengingat.map((p) => (
              <li key={p.id} className="row">
                <span><b>{p.nama_obat}</b> · {p.jam.join(', ')}<br />
                  <span className="muted">{tglIndo(p.mulai)} - {p.selesai ? tglIndo(p.selesai) : 'terus-menerus'} {p.kronis && '· jangka panjang'}</span></span>
                <button className="link danger" onClick={() => hentikan(p.id)}>Hentikan</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card judul="Tambah pengingat sendiri">
        <form onSubmit={tambah} className="stack">
          <div className="grid2">
            <Field label="Nama obat"><input className="input" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} required /></Field>
            <Field label="Aturan (opsional)"><input className="input" placeholder="1x sehari sesudah makan" value={f.aturan} onChange={(e) => setF({ ...f, aturan: e.target.value })} /></Field>
            <Field label="Jam minum" hint="Format: 08:00, 12:00, 18:00. Pisahkan dengan koma"><input className="input" value={f.jam} onChange={(e) => setF({ ...f, jam: e.target.value })} required /></Field>
            <Field label="Durasi" hint="Jumlah hari. Kosongkan jika terus-menerus"><input className="input" type="number" min="1" value={f.durasi} onChange={(e) => setF({ ...f, durasi: e.target.value })} /></Field>
          </div>
          <label className="check"><input type="checkbox" checked={f.kronis} onChange={(e) => setF({ ...f, kronis: e.target.checked })} /><span>Obat jangka panjang (TBC, darah tinggi, diabetes)</span></label>
          {error && <p className="error">{error}</p>}
          <button className="btn inline">Tambah pengingat</button>
        </form>
      </Card>
    </>
  )
}