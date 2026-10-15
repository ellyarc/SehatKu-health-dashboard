'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { hariIni, tglIndo, tambahBulan, umurBulan, umurTeks } from '@/lib/format'
import { statusTinggi } from '@/lib/who'
import GrowthChart from '@/components/GrowthChart'
import Icon from '@/components/Icons'
import { Badge, Card, Field, Notice, Stat, Tabs } from '@/components/ui'

// Penjelasan status tinggi dalam bahasa orang tua (bukan istilah teknis)
const PENJELASAN = {
  normal: { tone: 'ok', judul: 'Tinggi badan sesuai usianya', isi: 'Pertumbuhan anak berjalan baik. Lanjutkan pemberian makan bergizi dan timbang rutin tiap bulan.' },
  pendek: { tone: 'warn', judul: 'Tinggi badan di bawah batas waspada', isi: 'Anak berisiko stunting. Ajak ke puskesmas atau posyandu untuk pemeriksaan dan konseling gizi.' },
  sangat_pendek: { tone: 'danger', judul: 'Tinggi badan jauh di bawah rata-rata', isi: 'Segera periksakan anak ke puskesmas untuk pemeriksaan dan penanganan gizi.' },
  luar: { tone: 'info', judul: 'Grafik tersedia untuk usia 0-24 bulan', isi: 'Anak sudah di atas 24 bulan, jadi grafik acuan tidak ditampilkan. Pengukuran tetap bisa dicatat.' },
}

// Kesehatan anak: tumbuh kembang (grafik) dan imunisasi satu anak.
// staf = true -> boleh mencatat imunisasi (kader/petugas/dokter)
export default function KmsPanel({ pasien, staf = false }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('tumbuh')
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
  if (!lahir) return <Notice tone="warn">Tanggal lahir anak belum diisi, jadi tumbuh kembang dan jadwal imunisasi belum bisa dihitung. Isi di menu Data Diri & Keluarga.</Notice>

  const titik = ukur.filter((u) => u.tinggi_cm).map((u) => ({ bulan: umurBulan(lahir, u.tanggal), tinggi: Number(u.tinggi_cm) }))
  const terakhirTinggi = ukur.filter((u) => u.tinggi_cm).at(-1)
  const terakhirBerat = ukur.filter((u) => u.berat_kg).at(-1)
  const status = terakhirTinggi ? statusTinggi(pasien.jenis_kelamin, umurBulan(lahir, terakhirTinggi.tanggal), Number(terakhirTinggi.tinggi_cm)) : null
  const info = status ? PENJELASAN[status.kode] : null
  const umur = umurBulan(lahir)

  const selesai = master.filter((m) => catatan.some((c) => c.master_id === m.id))
  const perluSegera = master.filter((m) => !catatan.some((c) => c.master_id === m.id) && umur >= m.usia_bulan)
  const akanDatang = master.filter((m) => !catatan.some((c) => c.master_id === m.id) && umur < m.usia_bulan)
  const persen = master.length ? Math.round((selesai.length / master.length) * 100) : 0

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
    setTab('tumbuh')
    muat()
  }

  async function catatImunisasi(id) {
    const { error } = await supabase.from('imunisasi_catatan').insert({
      pasien_id: pasien.id, master_id: id, dicatat_oleh: user.id,
    })
    if (error) setError(error.message)
    muat()
  }

  return (
    <div className="stack">
      <Card>
        <div className="anak-kepala">
          <span className="avatar"><Icon name="sprout" size={26} /></span>
          <div>
            <h2>{pasien.nama}</h2>
            <p className="muted">{umurTeks(lahir)} · lahir {tglIndo(lahir)}</p>
          </div>
        </div>
      </Card>

      <div className="grid3">
        <Stat nilai={terakhirBerat ? `${terakhirBerat.berat_kg} kg` : '-'} label="Berat terakhir" />
        <Stat nilai={terakhirTinggi ? `${terakhirTinggi.tinggi_cm} cm` : '-'} label="Tinggi terakhir" />
        <Stat nilai={`${selesai.length}/${master.length}`} label="Imunisasi selesai" />
      </div>

      {perluSegera.length > 0 && (
        <Notice tone="warn">
          <b>{perluSegera.length} imunisasi sudah waktunya dan belum tercatat.</b> Bawa anak ke posyandu atau puskesmas.{' '}
          <button className="link" onClick={() => setTab('imunisasi')}>Lihat daftar</button>
        </Notice>
      )}

      <Tabs aktif={tab} onChange={setTab} tabs={[['tumbuh', 'Tumbuh kembang'], ['imunisasi', 'Imunisasi'], ['catat', 'Catat ukuran']]} />

      {tab === 'tumbuh' && (
        <>
          <Card judul="Tinggi badan menurut usia">
            {info ? (
              <div className={`status-box ${info.tone}`}>
                <b>{info.judul}</b>
                <p>{info.isi} <span className="muted">(diukur {tglIndo(terakhirTinggi.tanggal)}, {terakhirTinggi.tinggi_cm} cm)</span></p>
              </div>
            ) : <p className="muted">Belum ada data tinggi badan. Buka tab <b>Catat ukuran</b> untuk menambahkan.</p>}
            <GrowthChart jk={pasien.jenis_kelamin} titik={titik} />
            <div className="legenda">
              <span className="med">Rata-rata anak seusia</span>
              <span className="sd2">Batas waspada</span>
              <span className="sd3">Batas bahaya</span>
            </div>
            <p className="muted">Titik gelap adalah tinggi anakmu. Idealnya berada di sekitar garis putus-putus atau di atasnya. Acuan disederhanakan dari standar WHO 2006 untuk usia 0-24 bulan, dan hanya penapisan awal.</p>
          </Card>

          {ukur.length > 0 && (
            <Card judul="Riwayat ukuran">
              <div className="table-wrap">
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
            </Card>
          )}
        </>
      )}

      {tab === 'imunisasi' && (
        <Card judul="Jadwal imunisasi dasar">
          <p>{selesai.length} dari {master.length} imunisasi sudah selesai ({persen}%).</p>
          <div className="progress" role="progressbar" aria-valuenow={persen} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${persen}%` }} /></div>
          {!staf && <p className="muted">Pencatatan imunisasi dilakukan oleh petugas atau kader saat anak diimunisasi.</p>}
          {error && <p className="error">{error}</p>}

          {perluSegera.length > 0 && (
            <div className="imun-grup">
              <h4>Perlu segera dilengkapi</h4>
              <ul className="plain imun">
                {perluSegera.map((m) => (
                  <li key={m.id}>
                    <span><b>{m.nama}</b><br /><span className="muted">Seharusnya sejak usia {m.usia_bulan === 0 ? 'lahir' : `${m.usia_bulan} bulan`}</span></span>
                    <span className="row-gap">
                      <Badge tone="warn">Belum</Badge>
                      {staf && <button className="btn small" onClick={() => catatImunisasi(m.id)}>Catat hari ini</button>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {akanDatang.length > 0 && (
            <div className="imun-grup">
              <h4>Jadwal berikutnya</h4>
              <ul className="plain imun">
                {akanDatang.map((m) => (
                  <li key={m.id}>
                    <span><b>{m.nama}</b><br /><span className="muted">Usia {m.usia_bulan} bulan, sekitar {tglIndo(tambahBulan(lahir, m.usia_bulan))}</span></span>
                    <Badge tone="muted">Belum waktunya</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selesai.length > 0 && (
            <div className="imun-grup">
              <h4>Sudah selesai</h4>
              <ul className="plain imun">
                {selesai.map((m) => (
                  <li key={m.id}>
                    <b>{m.nama}</b>
                    <Badge tone="ok">{tglIndo(catatan.find((c) => c.master_id === m.id)?.tanggal)}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="muted mt">Jadwal acuan umum imunisasi dasar; sesuaikan dengan anjuran tenaga kesehatan.</p>
        </Card>
      )}

      {tab === 'catat' && (
        <Card judul="Catat ukuran terbaru">
          <form onSubmit={tambahUkur} className="stack">
            <div className="grid2">
              <Field label="Tanggal ukur"><input className="input" type="date" max={hariIni()} value={f.tanggal} onChange={(e) => setF({ ...f, tanggal: e.target.value })} required /></Field>
              <Field label="Berat badan (kg)"><input className="input" type="number" step="0.01" min="0" value={f.berat} onChange={(e) => setF({ ...f, berat: e.target.value })} /></Field>
              <Field label="Tinggi/panjang badan (cm)" hint="Di bawah 2 tahun diukur berbaring"><input className="input" type="number" step="0.1" min="0" value={f.tinggi} onChange={(e) => setF({ ...f, tinggi: e.target.value })} /></Field>
              <Field label="Lingkar kepala (cm)" hint="Boleh dikosongkan"><input className="input" type="number" step="0.1" min="0" value={f.lk} onChange={(e) => setF({ ...f, lk: e.target.value })} /></Field>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn inline" disabled={busy || (!f.berat && !f.tinggi && !f.lk)}>Simpan</button>
          </form>
        </Card>
      )}
    </div>
  )
}