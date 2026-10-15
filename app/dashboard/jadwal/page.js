'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { JENIS_URUT, NAMA_JENIS, kelompokPoli, kunciPoli } from '@/lib/poli'
import { Card, Empty, Notice, PageHeader } from '@/components/ui'

const HARI = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const jamPendek = (t) => t.slice(0, 5)
const BATAS = 20 // jumlah kartu per tampilan

// Ambil semua jadwal (per 1000 baris, batas bawaan Supabase)
async function ambilSemua() {
  const hasil = []
  for (let dari = 0; ; dari += 1000) {
    const { data } = await supabase.from('jadwal_dokter')
      .select('id, nama_dokter, hari, jam_mulai, jam_selesai, poli(nama_poli, faskes(id, nama, jenis))')
      .order('hari').range(dari, dari + 999)
    hasil.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return hasil
}

export default function Jadwal() {
  const [jadwal, setJadwal] = useState(null)
  const [q, setQ] = useState('')
  const [kunci, setKunci] = useState('')
  const [jenis, setJenis] = useState('semua')
  const [banyak, setBanyak] = useState(BATAS)

  useEffect(() => { ambilSemua().then(setJadwal) }, [])

  const semua = (jadwal ?? []).filter((j) => j.poli?.faskes)
  const grup = kelompokPoli(semua.map((j) => ({ nama_poli: j.poli.nama_poli, faskesId: j.poli.faskes.id })))

  const kata = q.trim().toLowerCase()
  const adaFilter = !!kata || !!kunci || jenis !== 'semua'

  // Kelompokkan: faskes > poli > dokter (satu baris: dokter, hari-hari praktik, jam)
  const kartu = {}
  semua.forEach((j) => {
    const f = j.poli.faskes, poli = j.poli.nama_poli
    if (jenis !== 'semua' && f.jenis !== jenis) return
    if (kunci && kunciPoli(poli) !== kunci) return
    if (kata && !`${poli} ${j.nama_dokter} ${f.nama}`.toLowerCase().includes(kata)) return
    const k = (kartu[`${f.id}|${poli}`] ||= { faskes: f, poli, sesi: {} })
    const sesi = `${j.nama_dokter}|${jamPendek(j.jam_mulai)}|${jamPendek(j.jam_selesai)}`
    ;(k.sesi[sesi] ||= []).push(j.hari)
  })
  const daftar = Object.values(kartu).sort((a, b) =>
    JENIS_URUT.indexOf(a.faskes.jenis) - JENIS_URUT.indexOf(b.faskes.jenis)
    || a.faskes.nama.localeCompare(b.faskes.nama) || a.poli.localeCompare(b.poli))

  const ubah = (fn) => (...a) => { fn(...a); setBanyak(BATAS) }

  return (
    <>
      <PageHeader judul="Jadwal dokter" deskripsi="Cari poli atau dokter, lalu lihat faskes mana yang buka dan jam praktiknya, supaya tidak datang saat dokter tidak praktik." />
      <Notice>Ketersediaan obat dicek dokter saat memeriksa dan dicatat di <b>Riwayat</b> setelah kamu berobat.</Notice>

      <input className="input" type="search" aria-label="Cari" placeholder="Cari poli, nama dokter, atau nama faskes"
        value={q} onChange={ubah((e) => setQ(e.target.value))} />

      <div className="chips">
        {grup.map((g) => (
          <button key={g.kunci} type="button" className={`chip ${kunci === g.kunci ? 'on' : ''}`}
            onClick={ubah(() => setKunci(kunci === g.kunci ? '' : g.kunci))}>
            {g.label} <small>{g.jumlah} faskes</small>
          </button>
        ))}
      </div>
      <div className="chips">
        {['semua', ...JENIS_URUT].map((j) => (
          <button key={j} type="button" className={`chip ${jenis === j ? 'on' : ''}`} onClick={ubah(() => setJenis(j))}>
            {j === 'semua' ? 'Semua jenis faskes' : NAMA_JENIS[j]}
          </button>
        ))}
      </div>

      {jadwal === null ? <p className="muted">Memuat...</p>
        : !adaFilter ? <Empty>Ketik nama poli atau dokter, atau pilih poli di atas untuk melihat jadwalnya.</Empty>
        : daftar.length === 0 ? <Empty>Tidak ada jadwal yang cocok.</Empty>
        : (
          <>
            <p className="muted">{daftar.length} jadwal poli ditemukan.</p>
            {daftar.slice(0, banyak).map((k) => (
              <Card key={`${k.faskes.id}|${k.poli}`} judul={`${k.poli} · ${k.faskes.nama}`}>
                <p className="muted">{NAMA_JENIS[k.faskes.jenis]}</p>
                <ul className="plain">
                  {Object.entries(k.sesi).map(([sesi, hari]) => {
                    const [dokter, mulai, selesai] = sesi.split('|')
                    return (
                      <li key={sesi} className="row">
                        <span><b>{dokter}</b><br /><span className="muted">{[...hari].sort().map((h) => HARI[h]).join(', ')}</span></span>
                        <span>{mulai} - {selesai}</span>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            ))}
            {daftar.length > banyak && <button className="btn outline" onClick={() => setBanyak(banyak + BATAS)}>Tampilkan lebih banyak</button>}
          </>
        )}
    </>
  )
}