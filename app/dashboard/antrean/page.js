'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { usePasienList, useLive, useInterval } from '@/lib/hooks'
import { hariIni, jam, rupiah, estimasiBiaya } from '@/lib/format'
import { PERTANYAAN, nilaiTriase, jawabanBersih } from '@/lib/triase'
import { Badge, Card, Notice, PageHeader, PasienSelect } from '@/components/ui'

export default function AntreanPasien() {
  const { list } = usePasienList()
  const [sel, setSel] = useState(null)
  const [faskes, setFaskes] = useState([])
  const [aktif, setAktif] = useState(null)
  const [info, setInfo] = useState(null)
  const [poliId, setPoliId] = useState('')
  const [jawab, setJawab] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (list.length && !sel) setSel(list[0].id) }, [list, sel])
  useEffect(() => {
    supabase.from('faskes').select('id, nama, poli(id, nama_poli, rata2_durasi_menit, tarif)')
      .then(({ data }) => setFaskes(data ?? []))
  }, [])

  const muat = useCallback(async () => {
    if (!sel) return
    const { data: a } = await supabase.from('antrean')
      .select('id, nomor, status, urgensi, estimasi_biaya, poli(nama_poli, faskes(nama))')
      .eq('pasien_id', sel).eq('tanggal', hariIni()).in('status', ['menunggu', 'dipanggil']).maybeSingle()
    setAktif(a)
    if (a) {
      const { data } = await supabase.rpc('info_antrean', { p_id: a.id })
      setInfo(data?.[0] ?? null)
    } else setInfo(null)
  }, [sel])

  useEffect(() => { muat() }, [muat])
  useLive(['antrean', 'poli'], muat)
  useInterval(muat, 20000) // cadangan: posisi bisa berubah saat pasien lain didahulukan

  const pasien = list.find((p) => p.id === sel)
  const semuaPoli = faskes.flatMap((f) => f.poli.map((p) => ({ ...p, faskes: f.nama })))
  const poli = semuaPoli.find((p) => p.id === poliId)
  const tingkat = nilaiTriase(jawab)

  async function ambil() {
    setError(''); setBusy(true)
    const { error } = await supabase.rpc('ambil_antrean', {
      p_poli: poliId, p_pasien: sel, p_jawaban: jawabanBersih(jawab), p_sumber: 'aplikasi',
    })
    setBusy(false)
    if (error) return setError(error.message)
    setJawab({}); setPoliId('')
    muat()
  }

  async function batal() {
    await supabase.rpc('batalkan_antrean', { p_id: aktif.id })
    muat()
  }

  let estimasi, saran
  if (aktif && info && aktif.status === 'menunggu') {
    const menit = (info.di_depan + (info.ada_dilayani ? 1 : 0)) * info.rata2_menit
    estimasi = new Date(Date.now() + menit * 60000)
    saran = new Date(estimasi.getTime() - 15 * 60000)
  }

  return (
    <>
      <PageHeader judul="Antrean & pra-triase" deskripsi="Ambil nomor dari rumah. Estimasi jam dipanggil diperbarui otomatis." />
      <PasienSelect list={list} value={sel} onChange={setSel} />

      {aktif ? (
        <>
          <section className="ticket">
            <p className="place">{aktif.poli.faskes.nama} · {aktif.poli.nama_poli}</p>
            <p className="nomor">{aktif.nomor}</p>
            {aktif.status === 'dipanggil' ? (
              <p className="called">Giliran {pasien?.nama}. Silakan masuk ke {aktif.poli.nama_poli}.</p>
            ) : info && (
              <dl>
                <dt>Sedang dipanggil</dt><dd>{info.sedang_dipanggil || '-'}</dd>
                <dt>Antrean di depan</dt><dd>{info.di_depan}</dd>
                <dt>Perkiraan dipanggil</dt><dd>{jam(estimasi)}</dd>
                <dt>Prioritas</dt><dd>{aktif.urgensi === 'segera' ? 'Segera' : 'Rutin'}</dd>
                <dt>Perkiraan biaya</dt><dd>{aktif.estimasi_biaya === 0 ? 'Dijamin' : rupiah(aktif.estimasi_biaya)}</dd>
              </dl>
            )}
          </section>
          {saran && (
            <p className="note">
              Disarankan tiba sekitar pukul <b>{jam(saran)}</b>. Jika dokter terlambat atau ada pasien mendesak yang didahulukan,
              estimasi berubah otomatis di halaman ini.
            </p>
          )}
          {aktif.status === 'menunggu' && <button className="link danger" onClick={batal}>Batalkan antrean</button>}
        </>
      ) : (
        <Card judul="Ambil nomor antrean">
          <div className="stack">
            {pasien?.penjamin !== 'umum' && pasien?.status_penjamin === 'nonaktif' && (
              <Notice tone="warn">Penjaminan {pasien.penjamin.toUpperCase()} tidak aktif. Biaya dihitung tarif umum. Perbarui di <Link href="/dashboard/keluarga">Data Diri</Link>.</Notice>
            )}

            <h3>1. Pilih poli</h3>
            {faskes.map((f) => (
              <div key={f.id} className="stack">
                <b>{f.nama}</b>
                {f.poli.map((p) => (
                  <button key={p.id} className="poli-btn" onClick={() => setPoliId(p.id)}
                    style={poliId === p.id ? { borderColor: 'var(--navy)', background: 'var(--tint)' } : {}}>
                    <strong>{p.nama_poli}</strong>
                    <span className="muted">±{p.rata2_menit ?? p.rata2_durasi_menit} menit/pasien</span>
                  </button>
                ))}
              </div>
            ))}

            <h3>2. Pra-triase gejala</h3>
            <p className="muted">Centang yang sedang dialami. Ini membantu menentukan prioritas, bukan diagnosis.</p>
            {PERTANYAAN.map((q) => (
              <label key={q.key} className={`check ${jawab[q.key] ? 'on ' + q.tingkat : ''}`}>
                <input type="checkbox" checked={!!jawab[q.key]}
                  onChange={(e) => setJawab({ ...jawab, [q.key]: e.target.checked })} />
                <span>{q.teks}</span>
              </label>
            ))}

            {tingkat === 'darurat' && (
              <Notice tone="danger">
                <b>Ada tanda bahaya.</b> Jangan antre di poli. Segera ke IGD terdekat atau hubungi <b>112</b> / <b>119</b>.{' '}
                <Link href="/dashboard/sos">Buka SOS</Link>
              </Notice>
            )}
            {tingkat === 'segera' && <Notice tone="warn">Keluhanmu akan diberi label <b>prioritas segera</b> dan didahulukan dari kontrol rutin.</Notice>}

            {poli && tingkat !== 'darurat' && (
              <p>Perkiraan biaya: <b>{estimasiBiaya(pasien, poli) === 0 ? 'Dijamin (Rp 0)' : rupiah(estimasiBiaya(pasien, poli))}</b>
                {' '}<Badge tone={tingkat === 'segera' ? 'warn' : 'navy'}>{tingkat === 'segera' ? 'Prioritas segera' : 'Rutin'}</Badge></p>
            )}
            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={busy || !poliId || tingkat === 'darurat'} onClick={ambil}>
              {tingkat === 'darurat' ? 'Antrean poli diblokir' : busy ? 'Memproses...' : 'Ambil nomor antrean'}
            </button>
          </div>
        </Card>
      )}
    </>
  )
}