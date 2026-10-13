'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { hariIni, rupiah } from '@/lib/format'
import { Badge, Card, Empty, Notice, PageHeader } from '@/components/ui'

export default function Kasir() {
  const { profil } = useAuth()
  const [data, setData] = useState([])
  const [error, setError] = useState('')

  const muat = useCallback(async () => {
    const { data } = await supabase.from('kunjungan')
      .select('*, pasien(nama, penjamin, no_penjamin, status_penjamin), poli(nama_poli)')
      .eq('faskes_id', profil.faskes_id).eq('tanggal', hariIni()).order('created_at')
    setData(data ?? [])
  }, [profil.faskes_id])
  useEffect(() => { muat() }, [muat])

  async function verifikasi(id) {
    setError('')
    const { error } = await supabase.rpc('verifikasi_biaya', { p_kunjungan: id })
    if (error) setError(error.message)
    muat()
  }

  const belum = data.filter((k) => k.status_biaya === 'belum')
  const selesai = data.filter((k) => k.status_biaya !== 'belum')
  return (
    <>
      <PageHeader judul="Kasir & penjaminan" deskripsi="Penjaminan dicek saat pendaftaran dan biaya dihitung otomatis dari pemeriksaan dokter, jadi pasien tidak tertahan lama saat pulang." />
      {error && <Notice tone="danger">{error}</Notice>}
      <Card judul={`Menunggu verifikasi (${belum.length})`}>
        {belum.length === 0 ? <Empty>Tidak ada yang menunggu.</Empty> : belum.map((k) => (
          <div key={k.id} className="resep-row">
            <div className="row"><b>{k.pasien?.nama}</b><span className="muted">{k.poli?.nama_poli}</span></div>
            <p>Penjamin: {k.pasien?.penjamin.toUpperCase()} {k.pasien?.penjamin !== 'umum' && (k.pasien?.status_penjamin === 'aktif' ? <Badge tone="ok">aktif</Badge> : <Badge tone="danger">tidak aktif</Badge>)}</p>
            <p>Konsultasi {rupiah(k.biaya_konsul)} · Obat {rupiah(k.biaya_obat)}</p>
            <p><b>Dibayar pasien: {rupiah(k.selisih_bayar)}</b></p>
            <button className="btn small" onClick={() => verifikasi(k.id)}>{k.selisih_bayar > 0 ? 'Sudah dibayar, izinkan pulang' : 'Verifikasi, izinkan pulang'}</button>
          </div>
        ))}
      </Card>
      <Card judul={`Sudah diverifikasi (${selesai.length})`}>
        {selesai.length === 0 ? <Empty>Belum ada.</Empty> : (
          <ul className="plain">{selesai.map((k) => <li key={k.id} className="row"><span>{k.pasien?.nama} · {k.poli?.nama_poli}</span><span>{rupiah(k.selisih_bayar)}</span></li>)}</ul>
        )}
      </Card>
    </>
  )
}