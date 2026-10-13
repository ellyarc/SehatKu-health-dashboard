'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePasienList } from '@/lib/hooks'
import { rupiah, tglIndo } from '@/lib/format'
import { Badge, Card, Empty, Notice, PageHeader, PasienSelect } from '@/components/ui'

export default function Kartu() {
  const { list } = usePasienList()
  const [sel, setSel] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [faskes, setFaskes] = useState([])

  useEffect(() => { if (list.length && !sel) setSel(list[0].id) }, [list, sel])
  useEffect(() => { supabase.from('faskes').select('id, nama').then(({ data }) => setFaskes(data ?? [])) }, [])
  useEffect(() => {
    if (!sel) return
    supabase.from('kunjungan').select('id, tanggal, biaya_konsul, biaya_obat, selisih_bayar, status_biaya, poli(nama_poli)')
      .eq('pasien_id', sel).order('tanggal', { ascending: false }).limit(20)
      .then(({ data }) => setRiwayat(data ?? []))
  }, [sel])

  const p = list.find((x) => x.id === sel)
  if (!p) return <p className="muted">Memuat...</p>

  return (
    <>
      <PageHeader judul="Kartu & biaya" deskripsi="Status penjamin dicek otomatis saat mengambil antrean, dan perkiraan biaya tampil sebelum kamu datang." />
      <PasienSelect list={list} value={sel} onChange={setSel} />

      <div className="kartu-peserta">
        <div className="jenis">{p.penjamin === 'bpjs' ? 'Kartu peserta JKN (digital)' : p.penjamin === 'asuransi' ? 'Kartu asuransi (digital)' : 'Pasien umum'}</div>
        <div className="no">{p.no_penjamin || p.nik || '-'}</div>
        <b>{p.nama}</b>
        <dl>
          <dt>NIK</dt><dd>{p.nik || '-'}</dd>
          <dt>Status</dt><dd>{p.penjamin === 'umum' ? '-' : p.status_penjamin === 'aktif' ? 'AKTIF' : 'TIDAK AKTIF'}</dd>
          <dt>Faskes tingkat 1</dt><dd>{faskes.find((f) => f.id === p.faskes_tingkat1_id)?.nama || '-'}</dd>
        </dl>
      </div>
      {p.penjamin !== 'umum' && p.status_penjamin === 'nonaktif' && (
        <Notice tone="warn">Penjaminan tidak aktif, biaya dihitung tarif umum. Hubungi petugas kasir atau perbarui data kepesertaan di Data Diri.</Notice>
      )}
      <p className="muted">Pengecekan keaktifan penjamin pada versi ini adalah simulasi. Integrasi resmi BPJS memerlukan kerja sama dan akses API dari BPJS Kesehatan.</p>

      <Card judul="Riwayat biaya kunjungan">
        {riwayat.length === 0 ? <Empty>Belum ada kunjungan.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Tanggal</th><th>Poli</th><th>Konsultasi</th><th>Obat</th><th>Dibayar sendiri</th><th>Status</th></tr></thead>
              <tbody>
                {riwayat.map((k) => (
                  <tr key={k.id}>
                    <td>{tglIndo(k.tanggal)}</td><td>{k.poli?.nama_poli}</td>
                    <td>{rupiah(k.biaya_konsul)}</td><td>{rupiah(k.biaya_obat)}</td>
                    <td><b>{rupiah(k.selisih_bayar)}</b></td>
                    <td>{k.status_biaya === 'terverifikasi' ? <Badge tone="ok">Siap pulang</Badge> : <Badge tone="warn">Diproses kasir</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}