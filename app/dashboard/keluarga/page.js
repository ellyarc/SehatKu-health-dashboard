'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { usePasienList } from '@/lib/hooks'
import { hariIni, umurTeks, rapikanHp, hpValid } from '@/lib/format'
import { Badge, Card, Field, Notice, PageHeader } from '@/components/ui'

export default function Keluarga() {
  const { diri, muat: muatAuth } = useAuth()
  const { list, muat } = usePasienList()
  const [faskes, setFaskes] = useState([])
  const [f, setF] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [a, setA] = useState({ nama: '', nik: '', tgl: '', jk: 'L', hubungan: 'anak' })
  const [pesanA, setPesanA] = useState(null)

  useEffect(() => { supabase.from('faskes').select('id, nama').then(({ data }) => setFaskes(data ?? [])) }, [])
  useEffect(() => {
    if (diri && !f) setF({
      nama: diri.nama || '', nik: diri.nik || '', tgl: diri.tgl_lahir || '', jk: diri.jenis_kelamin || 'P',
      hp: diri.no_hp || '', alamat: diri.alamat || '', penjamin: diri.penjamin || 'umum',
      noPenjamin: diri.no_penjamin || '', faskes1: diri.faskes_tingkat1_id || '',
      kdNama: diri.kontak_darurat_nama || '', kdHp: diri.kontak_darurat_hp || '', alergi: diri.alergi || '',
    })
  }, [diri, f])

  if (!f) return <p className="muted">Memuat...</p>
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function simpan(e) {
  e.preventDefault(); setPesan(null)
  const hp = rapikanHp(f.hp)
  const kdHp = rapikanHp(f.kdHp)
  if (!hpValid(hp)) return setPesan({ tone: 'danger', teks: 'Nomor HP tidak valid. Contoh: 081234567890' })
  if (!hpValid(kdHp)) return setPesan({ tone: 'danger', teks: 'Nomor HP kontak darurat tidak valid. Contoh: 081234567890' })

  const { data, error } = await supabase.rpc('lengkapi_data_diri', {
    p_nama: f.nama, p_nik: f.nik, p_tgl: f.tgl || null, p_jk: f.jk, p_hp: hp, p_alamat: f.alamat,
    p_penjamin: f.penjamin, p_no_penjamin: f.noPenjamin || null, p_faskes1: f.faskes1 || null,
    p_kd_nama: f.kdNama, p_kd_hp: kdHp, p_alergi: f.alergi,
  })
  if (error) return setPesan({ tone: 'danger', teks: error.message })
    setF({ ...f, hp, kdHp })
    await muatAuth(); await muat()
    setPesan({
      tone: 'ok',
      teks: data.penjamin === 'umum' ? 'Data tersimpan.'
        : `Data tersimpan. Status ${data.penjamin.toUpperCase()}: ${data.status_penjamin === 'aktif' ? 'AKTIF' : 'TIDAK AKTIF'} (hasil simulasi pengecekan).`,
    })
  }

  async function tambah(e) {
    e.preventDefault(); setPesanA(null)
    const { error } = await supabase.rpc('tambah_anggota', {
      p_nama: a.nama, p_nik: a.nik || null, p_tgl: a.tgl, p_jk: a.jk, p_hubungan: a.hubungan,
    })
    if (error) return setPesanA({ tone: 'danger', teks: error.message })
    setA({ nama: '', nik: '', tgl: '', jk: 'L', hubungan: 'anak' })
    setPesanA({ tone: 'ok', teks: 'Anggota keluarga ditambahkan.' })
    muat()
  }

  return (
    <>
      <PageHeader judul="Data diri & keluarga" deskripsi="NIK mengikat riwayat berobatmu di semua fasilitas kesehatan. Anggota keluarga yang tertaut bisa kamu daftarkan antreannya dan kamu pantau riwayatnya." />

      <Card judul="Data diri">
        <form onSubmit={simpan} className="stack">
          <div className="grid2">
            <Field label="Nama lengkap"><input className="input" value={f.nama} onChange={set('nama')} required /></Field>
            <Field label="NIK (16 digit)" hint={diri?.nik ? 'Diisi saat mendaftar' : undefined}>
  <input className="input" inputMode="numeric" pattern="[0-9]{16}" maxLength={16}
    value={f.nik} onChange={set('nik')} required readOnly={!!diri?.nik} />
</Field>
            <Field label="Tanggal lahir"><input className="input" type="date" max={hariIni()} value={f.tgl} onChange={set('tgl')} required /></Field>
            <Field label="Jenis kelamin">
              <select className="input" value={f.jk} onChange={set('jk')}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
            </Field>
            <Field label="No. HP" hint="Contoh: 081234567890">
  <input className="input" type="tel" inputMode="tel" autoComplete="tel" value={f.hp} onChange={set('hp')} />
</Field>
            <Field label="Alamat"><input className="input" value={f.alamat} onChange={set('alamat')} /></Field>
            <Field label="Penjamin">
              <select className="input" value={f.penjamin} onChange={set('penjamin')}>
                <option value="umum">Umum (bayar sendiri)</option><option value="bpjs">BPJS Kesehatan</option><option value="asuransi">Asuransi swasta</option>
              </select>
            </Field>
            {f.penjamin !== 'umum' && (
              <Field label="Nomor kepesertaan" hint={f.penjamin === 'bpjs' ? '13 digit. Pengecekan masih simulasi.' : 'Nomor polis'}>
                <input className="input" value={f.noPenjamin} onChange={set('noPenjamin')} required />
              </Field>
            )}
            <Field label="Faskes tingkat 1 terdaftar">
              <select className="input" value={f.faskes1} onChange={set('faskes1')}>
                <option value="">- pilih -</option>{faskes.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
              </select>
            </Field>
            <Field label="Alergi obat/makanan" hint="Ditampilkan ke dokter saat memeriksa"><input className="input" value={f.alergi} onChange={set('alergi')} placeholder="Contoh: penisilin" /></Field>
            <Field label="Kontak darurat (nama)"><input className="input" value={f.kdNama} onChange={set('kdNama')} /></Field>
            <Field label="Kontak darurat (HP)" hint="Contoh: 081234567890">
  <input className="input" type="tel" inputMode="tel" value={f.kdHp} onChange={set('kdHp')} />
</Field>
          </div>
          {pesan && <Notice tone={pesan.tone}>{pesan.teks}</Notice>}
          <button className="btn inline">Simpan data diri</button>
        </form>
      </Card>

      <Card judul="Keluarga tertaut">
        <ul className="plain">
          {list.map((p) => (
            <li key={p.id} className="row">
              <span><b>{p.nama}</b> <span className="muted">· {umurTeks(p.tgl_lahir)} · NIK {p.nik || '-'}</span></span>
              <Badge tone={p.hubungan === 'diri sendiri' ? 'navy' : 'muted'}>{p.hubungan}</Badge>
            </li>
          ))}
        </ul>
        <h3 className="mt">Tambah anggota keluarga</h3>
        <form onSubmit={tambah} className="stack">
          <div className="grid2">
            <Field label="Nama"><input className="input" value={a.nama} onChange={(e) => setA({ ...a, nama: e.target.value })} required /></Field>
            <Field label="NIK" hint="Boleh kosong untuk bayi yang belum punya NIK"><input className="input" inputMode="numeric" maxLength={16} value={a.nik} onChange={(e) => setA({ ...a, nik: e.target.value })} /></Field>
            <Field label="Tanggal lahir"><input className="input" type="date" max={hariIni()} value={a.tgl} onChange={(e) => setA({ ...a, tgl: e.target.value })} required /></Field>
            <Field label="Jenis kelamin">
              <select className="input" value={a.jk} onChange={(e) => setA({ ...a, jk: e.target.value })}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
            </Field>
            <Field label="Hubungan">
              <select className="input" value={a.hubungan} onChange={(e) => setA({ ...a, hubungan: e.target.value })}>
                <option>anak</option><option>orang tua</option><option>pasangan</option><option>saudara</option><option>lainnya</option>
              </select>
            </Field>
          </div>
          {pesanA && <Notice tone={pesanA.tone}>{pesanA.teks}</Notice>}
          <button className="btn inline">Tambah</button>
        </form>
        <p className="muted mt">Lansia tanpa HP tidak perlu akun: petugas loket bisa mendaftarkannya lewat kiosk, atau tautkan sebagai anggota keluargamu di sini.</p>
      </Card>
    </>
  )
}