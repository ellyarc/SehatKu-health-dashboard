'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import CariPasien from '@/components/CariPasien'
import { hariIni, jam, rupiah, umurTeks } from '@/lib/format'
import { PERTANYAAN, nilaiTriase, jawabanBersih } from '@/lib/triase'
import { Card, Field, Notice, PageHeader } from '@/components/ui'

const KOSONG = { nama: '', nik: '', tgl: '', jk: 'P', hp: '', alamat: '', penjamin: 'bpjs', noPenjamin: '' }

export default function Pendaftaran() {
  const { profil } = useAuth()
  const [poliList, setPoliList] = useState([])
  const [pasien, setPasien] = useState(null)
  const [baru, setBaru] = useState(false)
  const [f, setF] = useState(KOSONG)
  const [poliId, setPoliId] = useState('')
  const [jawab, setJawab] = useState({})
  const [error, setError] = useState('')
  const [tiket, setTiket] = useState(null)

  useEffect(() => {
    supabase.from('poli').select('*').eq('faskes_id', profil.faskes_id).order('nama_poli')
      .then(({ data }) => { setPoliList(data ?? []); if (data?.length) setPoliId(data[0].id) })
  }, [profil.faskes_id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const tingkat = nilaiTriase(jawab)

  async function daftarBaru(e) {
    e.preventDefault(); setError('')
    const { data, error } = await supabase.rpc('daftar_pasien_baru', {
      p_nama: f.nama, p_nik: f.nik || null, p_tgl: f.tgl || null, p_jk: f.jk, p_hp: f.hp || null,
      p_alamat: f.alamat || null, p_penjamin: f.penjamin, p_no_penjamin: f.noPenjamin || null,
    })
    if (error) return setError(error.message)
    setPasien(data); setBaru(false); setF(KOSONG)
  }

  async function cetak() {
    setError('')
    const { data, error } = await supabase.rpc('ambil_antrean', {
      p_poli: poliId, p_pasien: pasien.id, p_jawaban: jawabanBersih(jawab), p_sumber: 'kiosk',
    })
    if (error) return setError(error.message)
    const { data: inf } = await supabase.rpc('info_antrean', { p_id: data.id })
    const i = inf?.[0]
    const menit = i ? (i.di_depan + (i.ada_dilayani ? 1 : 0)) * i.rata2_menit : 0
    setTiket({ ...data, poli: poliList.find((p) => p.id === poliId), pasien, i, estimasi: new Date(Date.now() + menit * 60000) })
  }

  function ulang() { setTiket(null); setPasien(null); setJawab({}); setError('') }

  if (tiket) {
    return (
      <>
        <PageHeader judul="Tiket antrean" deskripsi="Cetak atau tunjukkan layar ini kepada pasien." />
        <div className="ticket-print print-area">
          <p><b>SiAntre</b> · {tiket.poli.nama_poli}</p>
          <p className="nomor">{tiket.nomor}</p>
          <p><b>{tiket.pasien.nama}</b></p>
          <p>Prioritas: {tiket.urgensi === 'segera' ? 'SEGERA' : 'Rutin'}</p>
          <p>Perkiraan dipanggil: <b>{jam(tiket.estimasi)}</b></p>
          <p>Perkiraan biaya: <b>{tiket.estimasi_biaya === 0 ? 'Dijamin' : rupiah(tiket.estimasi_biaya)}</b></p>
          <p className="muted">{hariIni()}</p>
        </div>
        <div className="row-gap no-print">
          <button className="btn inline" onClick={() => window.print()}>Cetak tiket</button>
          <button className="btn outline inline" onClick={ulang}>Pasien berikutnya</button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader judul="Pendaftaran kiosk" deskripsi="Untuk pasien lansia atau tanpa HP. Petugas mendampingi, pasien tidak perlu punya akun." />

      {!pasien ? (
        <Card judul="1. Cari atau daftarkan pasien">
          {!baru ? (
            <div className="stack">
              <CariPasien onPilih={setPasien} />
              <button className="btn outline" onClick={() => setBaru(true)}>Pasien belum terdaftar: daftarkan baru</button>
            </div>
          ) : (
            <form onSubmit={daftarBaru} className="stack">
              <div className="grid2">
                <Field label="Nama lengkap"><input className="input" value={f.nama} onChange={set('nama')} required /></Field>
                <Field label="NIK (16 digit)"><input className="input" inputMode="numeric" maxLength={16} value={f.nik} onChange={set('nik')} /></Field>
                <Field label="Tanggal lahir"><input className="input" type="date" max={hariIni()} value={f.tgl} onChange={set('tgl')} required /></Field>
                <Field label="Jenis kelamin"><select className="input" value={f.jk} onChange={set('jk')}><option value="P">Perempuan</option><option value="L">Laki-laki</option></select></Field>
                <Field label="No. HP keluarga (opsional)"><input className="input" value={f.hp} onChange={set('hp')} /></Field>
                <Field label="Alamat"><input className="input" value={f.alamat} onChange={set('alamat')} /></Field>
                <Field label="Penjamin"><select className="input" value={f.penjamin} onChange={set('penjamin')}><option value="bpjs">BPJS</option><option value="asuransi">Asuransi</option><option value="umum">Umum</option></select></Field>
                {f.penjamin !== 'umum' && <Field label="Nomor kepesertaan"><input className="input" value={f.noPenjamin} onChange={set('noPenjamin')} required /></Field>}
              </div>
              {error && <p className="error">{error}</p>}
              <div className="row-gap">
                <button className="btn inline">Simpan pasien</button>
                <button type="button" className="btn outline inline" onClick={() => setBaru(false)}>Kembali</button>
              </div>
            </form>
          )}
        </Card>
      ) : (
        <>
          <Card judul="Pasien terpilih" aksi={<button className="link" onClick={ulang}>Ganti</button>}>
            <p><b>{pasien.nama}</b> · {umurTeks(pasien.tgl_lahir)} · NIK {pasien.nik || '-'}</p>
            <p className="muted">Penjamin: {pasien.penjamin.toUpperCase()} {pasien.penjamin !== 'umum' && `(${pasien.status_penjamin === 'aktif' ? 'aktif' : 'TIDAK AKTIF'})`}</p>
          </Card>
          <Card judul="2. Poli dan pra-triase">
            <div className="stack">
              <Field label="Poli tujuan"><select className="input" value={poliId} onChange={(e) => setPoliId(e.target.value)}>{poliList.map((p) => <option key={p.id} value={p.id}>{p.nama_poli}</option>)}</select></Field>
              <p className="muted">Tanyakan keluhan pasien dan centang yang sesuai.</p>
              {PERTANYAAN.map((q) => (
                <label key={q.key} className={`check ${jawab[q.key] ? 'on ' + q.tingkat : ''}`}>
                  <input type="checkbox" checked={!!jawab[q.key]} onChange={(e) => setJawab({ ...jawab, [q.key]: e.target.checked })} />
                  <span>{q.teks}</span>
                </label>
              ))}
              {tingkat === 'darurat' && <Notice tone="danger"><b>Tanda bahaya.</b> Arahkan pasien langsung ke IGD, jangan dimasukkan ke antrean poli.</Notice>}
              {tingkat === 'segera' && <Notice tone="warn">Pasien diberi prioritas <b>segera</b>.</Notice>}
              {error && <p className="error">{error}</p>}
              <button className="btn" disabled={!poliId || tingkat === 'darurat'} onClick={cetak}>Buat nomor antrean</button>
            </div>
          </Card>
        </>
      )}
    </>
  )
}