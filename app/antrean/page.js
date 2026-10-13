'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hariIni, jam } from '@/lib/format'

export default function AntreanPasien() {
  const router = useRouter()
  const [uid, setUid] = useState(null)
  const [faskes, setFaskes] = useState([])
  const [aktif, setAktif] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const muat = useCallback(async (userId) => {
    const { data: f } = await supabase
      .from('faskes').select('id, nama, poli(id, nama_poli, rata2_durasi_menit)')
    setFaskes(f ?? [])

    const { data: a } = await supabase
      .from('antrean')
      .select('id, nomor, status, poli(nama_poli, rata2_durasi_menit, nomor_sekarang, faskes(nama))')
      .eq('pasien_id', userId)
      .eq('tanggal', hariIni())
      .in('status', ['menunggu', 'dipanggil'])
      .maybeSingle()
    setAktif(a)
  }, [])

  useEffect(() => {
    let channel
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/login')
      const id = session.user.id
      setUid(id)
      await muat(id)

      // Realtime: berubah saat petugas memanggil nomor atau status antrean berubah
      channel = supabase
        .channel('antrean-pasien')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'poli' }, () => muat(id))
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'antrean', filter: `pasien_id=eq.${id}` },
          () => muat(id))
        .subscribe()
    })()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [muat, router])

  async function ambil(poliId) {
    setError(''); setBusy(true)
    const { error } = await supabase.rpc('ambil_antrean', { p_poli: poliId })
    if (error) setError(error.message)
    await muat(uid)
    setBusy(false)
  }

  async function batal() {
    setBusy(true)
    await supabase.rpc('batalkan_antrean', { p_id: aktif.id })
    await muat(uid)
    setBusy(false)
  }

  // ---- Hitung estimasi ----
  let diDepan = 0, estimasiDipanggil, saranDatang
  if (aktif) {
    diDepan = Math.max(0, aktif.nomor - aktif.poli.nomor_sekarang - 1)
    const menit = diDepan * aktif.poli.rata2_durasi_menit
    estimasiDipanggil = new Date(Date.now() + menit * 60000)
    saranDatang = new Date(estimasiDipanggil.getTime() - 15 * 60000)
  }

  return (
    <main className="container">
      <div className="stack">
        <h1>Antrean saya</h1>

        {aktif ? (
          <section className="ticket">
            <p className="place">{aktif.poli.faskes.nama} · {aktif.poli.nama_poli}</p>
            <p className="nomor">{aktif.nomor}</p>

            {aktif.status === 'dipanggil' ? (
              <p className="called">Giliran kamu. Silakan masuk ke {aktif.poli.nama_poli}.</p>
            ) : (
              <dl>
                <dt>Sedang dipanggil</dt><dd>{aktif.poli.nomor_sekarang || '-'}</dd>
                <dt>Antrean di depanmu</dt><dd>{diDepan}</dd>
                <dt>Perkiraan dipanggil</dt><dd>{jam(estimasiDipanggil)}</dd>
              </dl>
            )}
          </section>
        ) : (
          <section className="stack">
            <p className="muted">Pilih poli untuk mengambil nomor antrean hari ini.</p>
            {error && <p className="error">{error}</p>}
            {faskes.map((f) => (
              <div key={f.id} className="stack">
                <h2>{f.nama}</h2>
                {f.poli.map((p) => (
                  <button key={p.id} className="poli-btn" disabled={busy} onClick={() => ambil(p.id)}>
                    <strong>{p.nama_poli}</strong>
                    <span className="muted">±{p.rata2_durasi_menit} menit/pasien</span>
                  </button>
                ))}
              </div>
            ))}
          </section>
        )}

        {aktif && aktif.status === 'menunggu' && (
          <>
            <p className="note">
              Disarankan tiba sekitar pukul <b>{jam(saranDatang)}</b>. Estimasi
              diperbarui otomatis jika dokter lebih cepat atau lebih lambat.
            </p>
            <button className="link danger" onClick={batal} disabled={busy}>
              Batalkan antrean
            </button>
          </>
        )}
      </div>
    </main>
  )
}