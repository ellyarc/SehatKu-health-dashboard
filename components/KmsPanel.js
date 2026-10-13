'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { hariIni, tglIndo, umurBulan, umurTeks } from '@/lib/format'
import { statusTinggi } from '@/lib/who'
import GrowthChart from '@/components/GrowthChart'
import { Badge, Card, Field, Notice } from '@/components/ui'

// KMS digital: pengukuran, grafik pertumbuhan, dan checklist imunisasi satu anak.
// staf = true -> boleh mencatat imunisasi (kader/petugas/dokter)
export default function KmsPanel({ pasien, staf = false }) {
  const { user } = useAuth()
  const [ukur, setUkur] = useState([])
  const [master, setMaster] = useState([])
  const [catatan, setCatatan] = useState([])
  const [f, setF] = useState({ tanggal: hariIni(), berat: '', tinggi: '', lk: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const muat = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('pengukuran_anak').select('*').eq('pasien_id', pasien.id).order('tanggal'),
      supabase.from('imunisasi_master').select('*').order('urutan'),
      supabase.from('imunisasi_catatan').select('*').eq('pasien_id', pasien.id),
    ])
    setUkur(a.data ?? []); setMaster(b.data ?? []); setCatatan(c.data ?? [])
  }, [pasien.id])

  useEffect(() => { muat() }, [muat])

  const lahir = pasien.tgl_lahir
  const titik = lahir
    ? ukur.filter((u) => u.tinggi_cm).map((u) => ({ bulan: umurBulan(lahir, u.tanggal), tinggi: Number(u.tinggi_cm) }))
    : []
  const terakhir = ukur.filter((u) => u.tinggi_cm).at(-1)
  const status = terakhir && lahir
    ? statusTinggi(pasien.jenis_kelamin, umurBulan(lahir, terakhir.tanggal), Number(terakhir.tinggi_cm))
    : null
  const umur = lahir ? umurBulan(lahir) : null

  async function tambahUkur(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    const { error } = await supabase.from('pengukuran_anak').insert({
      pasien_id: pasien.id, tanggal: f.tanggal,
      berat_kg: f.berat || null, tinggi_cm: f.tinggi || null, lingkar_kepala_cm: f.lk || null,
      dicatat_oleh: user.id,
    })
    setBusy(false)
    if (error) return setError(error.message)
    setF({ ...f, berat: '', tinggi: '', lk: '' })
    muat()
  }

  async function catatImunisasi(id) {
    const { error } = await supabase.from('imunisasi_catatan').insert({
      pasien_id: pasien.id, master_id: id, dicatat_oleh: user.id,
    })
    if (error) setError(error.message)
    muat()
  }

  if (!lahir) return <Notice tone="warn">Tanggal lahir anak belum diisi, KMS tidak bisa dihitung.</Notice>

  return (
    <div className="stack">
      <Card judul={`${pasien.nama} · ${umurTeks(lahir)}`}>
        {status ? (
          <p>Status tinggi menurut umur (pengukuran {tglIndo(terakhir.tanggal)}, {terakhir.tinggi_cm} cm):{' '}
            <Badge tone={status.tone}>{status.label}</Badge></p>
        ) : <p className="muted">Belum ada data tinggi badan.</p>}
        {status?.kode === 'pendek' || status?.kode === 'sangat_pendek' ? (
          <Notice tone="warn">Hasil ini hanya penapisan awal. Sarankan orang tua memeriksakan anak ke puskesmas untuk pemeriksaan dan konseling gizi.</Notice>
        ) : null}
        <GrowthChart jk={pasien.jenis_kelamin} titik={titik} />
        <p className="muted">Data acuan disederhanakan dari standar WHO 2006 untuk usia 0-24 bulan.</p>
      </Card>

      <Card judul="Catat pengukuran">
        <form onSubmit={tambahUkur} className="stack">
          <div className="grid2">
            <Field label="Tanggal"><input className="input" type="date" max={hariIni()} value={f.tanggal} onChange={(e) => setF({ ...f, tanggal: e.target.value })} required /></Field>
            <Field label="Berat (kg)"><input className="input" type="number" step="0.01" min="0" value={f.berat} onChange={(e) => setF({ ...f, berat: e.target.value })} /></Field>
            <Field label="Tinggi/panjang (cm)"><input className="input" type="number" step="0.1" min="0" value={f.tinggi} onChange={(e) => setF({ ...f, tinggi: e.target.value })} /></Field>
            <Field label="Lingkar kepala (cm)"><input className="input" type="number" step="0.1" min="0" value={f.lk} onChange={(e) => setF({ ...f, lk: e.target.value })} /></Field>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn inline" disabled={busy || (!f.berat && !f.tinggi && !f.lk)}>Simpan</button>
        </form>
        {ukur.length > 0 && (
          <div className="table-wrap mt">
            <table className="table">
              <thead><tr><th>Tanggal</th><th>Umur</th><th>Berat</th><th>Tinggi</th><th>L. kepala</th></tr></thead>
              <tbody>
                {[...ukur].reverse().map((u) => (
                  <tr key={u.id}>
                    <td>{tglIndo(u.tanggal)}</td><td>{umurBulan(lahir, u.tanggal)} bln</td>
                    <td>{u.berat_kg ?? '-'}</td><td>{u.tinggi_cm ?? '-'}</td><td>{u.lingkar_kepala_cm ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card judul="Checklist imunisasi">
        {!staf && <p className="muted">Pencatatan imunisasi dilakukan oleh petugas atau kader saat anak diimunisasi.</p>}
        <ul className="plain imun">
          {master.map((m) => {
            const sudah = catatan.find((c) => c.master_id === m.id)
            const jatuhTempo = umur >= m.usia_bulan
            return (
              <li key={m.id}>
                <span>
                  <b>{m.nama}</b>
                  <span className="muted"> · usia {m.usia_bulan === 0 ? 'lahir' : `${m.usia_bulan} bln`}</span>
                </span>
                {sudah ? <Badge tone="ok">Selesai {tglIndo(sudah.tanggal)}</Badge>
                  : jatuhTempo ? (
                    <span className="row-gap">
                      <Badge tone="warn">Belum, sudah waktunya</Badge>
                      {staf && <button className="btn small" onClick={() => catatImunisasi(m.id)}>Catat hari ini</button>}
                    </span>
                  ) : <Badge tone="muted">Belum waktunya</Badge>}
              </li>
            )
          })}
        </ul>
        <p className="muted">Jadwal acuan umum imunisasi dasar; sesuaikan dengan anjuran tenaga kesehatan.</p>
      </Card>
    </div>
  )
}