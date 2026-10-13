'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useLive } from '@/lib/hooks'
import { hariIni, umurTeks } from '@/lib/format'
import { PERTANYAAN } from '@/lib/triase'
import KunjunganCard, { SELECT_KUNJUNGAN } from '@/components/KunjunganCard'
import { Badge, Card, Empty, Field, Notice, PageHeader } from '@/components/ui'

const FORM0 = { keluhan: '', diagnosa: '', tindakan: '', instruksi: '', pantangan: '', tanda_bahaya: '', tgl_kontrol: '' }
const RESEP0 = { obat_id: '', nama_obat: '', jumlah: 10, aturan_pakai: '', frekuensi: 3, durasi_hari: 5, kronis: false, resep_luar: false }
const RUJUK0 = { tujuan: '', poli_tujuan: '', diagnosa: '', hari_berlaku: 90 }

// Pengecekan alergi sederhana berdasarkan kecocokan teks. Dokter tetap harus memeriksa sendiri.
const bentrokAlergi = (alergi, nama) =>
  (alergi || '').toLowerCase().split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
    .some((a) => nama.toLowerCase().includes(a))

export default function Periksa() {
  const { profil } = useAuth()
  const [poliList, setPoliList] = useState([])
  const [poliId, setPoliId] = useState('')
  const [cur, setCur] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [obatList, setObatList] = useState([])
  const [form, setForm] = useState(FORM0)
  const [resep, setResep] = useState([])
  const [lab, setLab] = useState([])
  const [rujukOn, setRujukOn] = useState(false)
  const [rujuk, setRujuk] = useState(RUJUK0)
  const [pesan, setPesan] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('poli').select('*').eq('faskes_id', profil.faskes_id).order('nama_poli')
      .then(({ data }) => { setPoliList(data ?? []); if (data?.length) setPoliId(data[0].id) })
    supabase.from('obat').select('*').eq('faskes_id', profil.faskes_id).order('nama').then(({ data }) => setObatList(data ?? []))
  }, [profil.faskes_id])

  const muat = useCallback(async () => {
    if (!poliId) return
    const { data } = await supabase.from('antrean').select('*, pasien(*)')
      .eq('poli_id', poliId).eq('tanggal', hariIni()).eq('status', 'dipanggil').maybeSingle()
    setCur(data)
  }, [poliId])
  useEffect(() => { muat() }, [muat])
  useLive(['antrean'], muat)

  // Saat pasien berganti: kosongkan formulir dan muat riwayat
  useEffect(() => {
    setForm(FORM0); setResep([]); setLab([]); setRujukOn(false); setRujuk(RUJUK0)
    if (!cur) return setRiwayat([])
    supabase.from('kunjungan').select(SELECT_KUNJUNGAN).eq('pasien_id', cur.pasien_id)
      .order('tanggal', { ascending: false }).limit(5).then(({ data }) => setRiwayat(data ?? []))
  }, [cur?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  async function panggil() {
    setPesan(null)
    const { data, error } = await supabase.rpc('panggil_berikutnya', { p_poli: poliId })
    if (error) setPesan({ tone: 'danger', teks: error.message })
    else if (!data) setPesan({ tone: 'warn', teks: 'Tidak ada pasien yang menunggu.' })
    muat()
  }

  const ubahResep = (i, patch) => setResep(resep.map((r, x) => (x === i ? { ...r, ...patch } : r)))
  const ubahLab = (i, patch) => setLab(lab.map((r, x) => (x === i ? { ...r, ...patch } : r)))
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function simpan(e) {
    e.preventDefault(); setPesan(null)
    for (const r of resep) {
      if (!r.obat_id && !(r.resep_luar && r.nama_obat)) return setPesan({ tone: 'danger', teks: 'Setiap baris resep harus memilih obat dari stok, atau resep luar dengan nama obat.' })
      const o = obatList.find((x) => x.id === r.obat_id)
      if (o && !r.resep_luar && o.stok < Number(r.jumlah)) return setPesan({ tone: 'danger', teks: `Stok ${o.nama} tidak cukup. Ganti obat sejenis atau jadikan resep luar.` })
    }
    setBusy(true)
    const { error } = await supabase.rpc('simpan_pemeriksaan', {
      p_antrean: cur.id,
      p_data: {
        ...form,
        resep: resep.map((r) => ({ ...r, obat_id: r.obat_id || null, jumlah: Number(r.jumlah), frekuensi: Number(r.frekuensi), durasi_hari: Number(r.durasi_hari) })),
        lab: lab.filter((l) => l.nama_tes),
        rujukan: rujukOn ? { ...rujuk, hari_berlaku: Number(rujuk.hari_berlaku) } : null,
      },
    })
    setBusy(false)
    if (error) return setPesan({ tone: 'danger', teks: error.message })
    setPesan({ tone: 'ok', teks: 'Pemeriksaan tersimpan. Ringkasan tugas, pengingat obat, dan resep sudah terkirim ke pasien dan apotek.' })
    muat()
    supabase.from('obat').select('*').eq('faskes_id', profil.faskes_id).order('nama').then(({ data }) => setObatList(data ?? []))
  }

  const p = cur?.pasien
  const jawaban = cur ? Object.keys(cur.jawaban_triase || {}).filter((k) => cur.jawaban_triase[k]) : []

  return (
    <>
      <PageHeader judul="Ruang periksa" deskripsi="Pilih poli, panggil pasien, lalu isi pemeriksaan. Hasilnya otomatis menjadi tugas pasien, resep, pengingat obat, dan tagihan." />
      <div className="row-form">
        <select className="input" value={poliId} onChange={(e) => setPoliId(e.target.value)}>
          {poliList.map((x) => <option key={x.id} value={x.id}>{x.nama_poli}</option>)}
        </select>
        <button className="btn inline" onClick={panggil}>Panggil berikutnya</button>
      </div>
      {pesan && <Notice tone={pesan.tone}>{pesan.teks}</Notice>}

      {!cur ? <Empty>Belum ada pasien yang sedang dipanggil di poli ini.</Empty> : (
        <>
          <Card judul={`#${cur.nomor} ${p.nama}`} aksi={cur.urgensi === 'segera' ? <Badge tone="warn">Prioritas segera</Badge> : <Badge>Rutin</Badge>}>
            <p>{umurTeks(p.tgl_lahir)} · {p.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'} · NIK {p.nik || '-'}</p>
            <p>Penjamin: {p.penjamin.toUpperCase()} {p.penjamin !== 'umum' && (p.status_penjamin === 'aktif' ? <Badge tone="ok">aktif</Badge> : <Badge tone="danger">tidak aktif</Badge>)}</p>
            {p.alergi ? <Notice tone="danger"><b>Alergi tercatat:</b> {p.alergi}</Notice> : <p className="muted">Tidak ada catatan alergi.</p>}
            {jawaban.length > 0 && (
              <p><b>Gejala pra-triase:</b> {jawaban.map((k) => PERTANYAAN.find((q) => q.key === k)?.teks || k).join('; ')}</p>
            )}
          </Card>

          <form onSubmit={simpan} className="stack">
            <Card judul="Pemeriksaan">
              <div className="stack">
                <Field label="Keluhan"><textarea className="input" value={form.keluhan} onChange={set('keluhan')} /></Field>
                <Field label="Diagnosa"><input className="input" value={form.diagnosa} onChange={set('diagnosa')} required /></Field>
                <Field label="Tindakan"><input className="input" value={form.tindakan} onChange={set('tindakan')} /></Field>
              </div>
            </Card>

            <Card judul="Resep" aksi={<button type="button" className="btn small" onClick={() => setResep([...resep, { ...RESEP0 }])}>+ Tambah obat</button>}>
              {resep.length === 0 && <p className="muted">Belum ada obat. Stok apotek tampil langsung saat memilih obat.</p>}
              {resep.map((r, i) => {
                const o = obatList.find((x) => x.id === r.obat_id)
                const kurang = o && !r.resep_luar && o.stok < Number(r.jumlah)
                const pengganti = o ? obatList.filter((x) => x.kelompok === o.kelompok && x.id !== o.id && x.stok >= Number(r.jumlah)) : []
                return (
                  <div key={i} className="resep-row">
                    <div className="grid2">
                      <Field label="Obat">
                        <select className="input" value={r.obat_id} onChange={(e) => {
                          const ob = obatList.find((x) => x.id === e.target.value)
                          ubahResep(i, { obat_id: e.target.value, nama_obat: ob?.nama || r.nama_obat })
                        }}>
                          <option value="">- pilih obat -</option>
                          {obatList.map((x) => <option key={x.id} value={x.id}>{x.nama} · stok {x.stok}</option>)}
                        </select>
                      </Field>
                      <Field label="Jumlah"><input className="input" type="number" min="1" value={r.jumlah} onChange={(e) => ubahResep(i, { jumlah: e.target.value })} /></Field>
                      <Field label="Frekuensi/hari"><select className="input" value={r.frekuensi} onChange={(e) => ubahResep(i, { frekuensi: e.target.value })}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}x</option>)}</select></Field>
                      <Field label="Lama (hari)"><input className="input" type="number" min="1" value={r.durasi_hari} onChange={(e) => ubahResep(i, { durasi_hari: e.target.value })} /></Field>
                      <Field label="Aturan pakai"><input className="input" placeholder="3x1 sesudah makan" value={r.aturan_pakai} onChange={(e) => ubahResep(i, { aturan_pakai: e.target.value })} /></Field>
                      {r.resep_luar && <Field label="Nama obat (resep luar)"><input className="input" value={r.nama_obat} onChange={(e) => ubahResep(i, { nama_obat: e.target.value })} /></Field>}
                    </div>
                    <div className="row-gap mt">
                      <label className="row-gap"><input type="checkbox" checked={r.kronis} onChange={(e) => ubahResep(i, { kronis: e.target.checked })} /> Jangka panjang</label>
                      <label className="row-gap"><input type="checkbox" checked={r.resep_luar} onChange={(e) => ubahResep(i, { resep_luar: e.target.checked })} /> Resep luar (beli di apotek lain, mis. Kimia Farma)</label>
                      <button type="button" className="link danger" onClick={() => setResep(resep.filter((_, x) => x !== i))}>Hapus</button>
                    </div>
                    {kurang && (
                      <Notice tone="danger">
                        <b>Stok {o.nama} tidak cukup</b> (tersisa {o.stok}).
                        <div className="row-gap mt">
                          {pengganti.map((x) => (
                            <button type="button" key={x.id} className="btn small outline" onClick={() => ubahResep(i, { obat_id: x.id, nama_obat: x.nama })}>Ganti ke {x.nama} (stok {x.stok})</button>
                          ))}
                          <button type="button" className="btn small" onClick={() => ubahResep(i, { resep_luar: true, nama_obat: o.nama })}>Jadikan resep luar</button>
                        </div>
                        {pengganti.length === 0 && <p>Tidak ada obat sejenis yang cukup stoknya.</p>}
                      </Notice>
                    )}
                    {o && bentrokAlergi(p.alergi, o.nama) && <Notice tone="danger">Pasien tercatat alergi: {p.alergi}. Periksa kembali pilihan obat ini.</Notice>}
                  </div>
                )
              })}
              {resep.length > 0 && p.alergi && <p className="muted mt">Pengecekan alergi hanya mencocokkan teks nama obat. Golongan obat (mis. antibiotik sejenis) tetap perlu diperiksa dokter.</p>}
            </Card>

            <Card judul="Hasil laboratorium (opsional)" aksi={<button type="button" className="btn small" onClick={() => setLab([...lab, { nama_tes: '', hasil: '', satuan: '' }])}>+ Tambah</button>}>
              {lab.map((l, i) => (
                <div key={i} className="row-form mt">
                  <input className="input" placeholder="Pemeriksaan (mis. Gula darah)" value={l.nama_tes} onChange={(e) => ubahLab(i, { nama_tes: e.target.value })} />
                  <input className="input" placeholder="Hasil" value={l.hasil} onChange={(e) => ubahLab(i, { hasil: e.target.value })} />
                  <input className="input" placeholder="Satuan" value={l.satuan} onChange={(e) => ubahLab(i, { satuan: e.target.value })} />
                  <button type="button" className="link danger" onClick={() => setLab(lab.filter((_, x) => x !== i))}>Hapus</button>
                </div>
              ))}
              {lab.length === 0 && <p className="muted">Hasil lab tersimpan di rekam medis dan bisa dilihat dokter lain tanpa tes ulang.</p>}
            </Card>

            <Card judul="Tugas untuk pasien (ringkasan pasca-berobat)">
              <div className="stack">
                <Field label="Perawatan di rumah"><textarea className="input" value={form.instruksi} onChange={set('instruksi')} /></Field>
                <Field label="Pantangan"><input className="input" value={form.pantangan} onChange={set('pantangan')} /></Field>
                <Field label="Tanda bahaya yang harus diwaspadai"><input className="input" value={form.tanda_bahaya} onChange={set('tanda_bahaya')} /></Field>
                <Field label="Tanggal kontrol berikutnya"><input className="input" type="date" min={hariIni()} value={form.tgl_kontrol} onChange={set('tgl_kontrol')} /></Field>
              </div>
            </Card>

            <Card judul="Rujukan (opsional)">
              <label className="check"><input type="checkbox" checked={rujukOn} onChange={(e) => setRujukOn(e.target.checked)} /><span>Buat rujukan ke fasilitas lain</span></label>
              {rujukOn && (
                <div className="grid2 mt">
                  <Field label="Tujuan"><input className="input" value={rujuk.tujuan} onChange={(e) => setRujuk({ ...rujuk, tujuan: e.target.value })} required /></Field>
                  <Field label="Poli/spesialis"><input className="input" value={rujuk.poli_tujuan} onChange={(e) => setRujuk({ ...rujuk, poli_tujuan: e.target.value })} /></Field>
                  <Field label="Diagnosa rujukan" hint="Kosong = pakai diagnosa kunjungan"><input className="input" value={rujuk.diagnosa} onChange={(e) => setRujuk({ ...rujuk, diagnosa: e.target.value })} /></Field>
                  <Field label="Masa berlaku (hari)" hint="Sesuaikan dengan aturan faskes"><input className="input" type="number" min="1" value={rujuk.hari_berlaku} onChange={(e) => setRujuk({ ...rujuk, hari_berlaku: e.target.value })} /></Field>
                </div>
              )}
            </Card>

            <button className="btn" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan pemeriksaan & selesaikan pasien'}</button>
          </form>

          <Card judul="Riwayat pasien (5 kunjungan terakhir)">
            {riwayat.length === 0 ? <p className="muted">Belum ada riwayat sebelumnya.</p> : riwayat.map((k) => <KunjunganCard key={k.id} k={k} />)}
          </Card>
        </>
      )}
    </>
  )
}