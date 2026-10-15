'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePasienList } from '@/lib/hooks'
import { rupiah, tglIndo } from '@/lib/format'
import { Logo } from '@/components/PublicBar'
import { Badge, Empty, Notice, PageHeader, PasienSelect, Stat } from '@/components/ui'

const NAMA_JENIS = { bpjs: 'Kartu peserta JKN', asuransi: 'Kartu asuransi', umum: 'Pasien umum' }

// 4 digit sekali supaya nomor panjang mudah dibaca
const rapi = (s) => (s || '').replace(/(.{4})/g, '$1 ').trim()

export default function Kartu() {
  const { list } = usePasienList()
  const [sel, setSel] = useState(null)
  const [riwayat, setRiwayat] = useState(null)
  const [faskes, setFaskes] = useState([])

  useEffect(() => { if (list.length && !sel) setSel(list[0].id) }, [list, sel])
  useEffect(() => { supabase.from('faskes').select('id, nama').then(({ data }) => setFaskes(data ?? [])) }, [])
  useEffect(() => {
    if (!sel) return
    setRiwayat(null)
    supabase.from('kunjungan').select('id, tanggal, biaya_konsul, biaya_obat, selisih_bayar, status_biaya, poli(nama_poli)')
      .eq('pasien_id', sel).order('tanggal', { ascending: false }).limit(20)
      .then(({ data }) => setRiwayat(data ?? []))
  }, [sel])

  const p = list.find((x) => x.id === sel)
  if (!p) return <p className="muted">Memuat...</p>

  const umum = p.penjamin === 'umum'
  const aktif = p.status_penjamin === 'aktif'
  const totalBayar = (riwayat ?? []).reduce((s, k) => s + (k.selisih_bayar || 0), 0)

  return (
    <>
      <PageHeader judul="Kartu & biaya" deskripsi="Status penjamin dicek otomatis saat mengambil antrean, dan perkiraan biaya tampil sebelum kamu datang." />
      <PasienSelect list={list} value={sel} onChange={setSel} />

      <div className="kartu-peserta">
        <div className="atas">
          <span className="jenis">{NAMA_JENIS[p.penjamin] || 'Pasien umum'} · digital</span>
          <Logo size={28} />
        </div>
        <div className="no">{rapi(p.no_penjamin || p.nik) || '-'}</div>
        <div className="nama">{p.nama}</div>
        <dl>
          <div><dt>NIK</dt><dd>{p.nik || '-'}</dd></div>
          <div><dt>Status</dt><dd>
            {umum ? <span className="chip-status umum">Bayar sendiri</span>
              : aktif ? <span className="chip-status">Aktif</span>
              : <span className="chip-status off">Tidak aktif</span>}
          </dd></div>
          <div style={{ gridColumn: '1 / -1' }}><dt>Faskes tingkat 1</dt><dd>{faskes.find((f) => f.id === p.faskes_tingkat1_id)?.nama || '-'}</dd></div>
        </dl>
      </div>

      {!umum && !aktif && (
        <Notice tone="warn">Penjaminan tidak aktif, biaya dihitung tarif umum. Hubungi petugas kasir atau perbarui data kepesertaan di Data Diri.</Notice>
      )}
      <p className="muted">Pengecekan keaktifan penjamin pada versi ini adalah simulasi. Integrasi resmi BPJS memerlukan kerja sama dan akses API dari BPJS Kesehatan.</p>

      <div className="grid3">
        <Stat nilai={riwayat?.length ?? '-'} label="Kunjungan tercatat" />
        <Stat nilai={rupiah(totalBayar)} label="Total dibayar sendiri" />
      </div>

      <h2>Rincian biaya per kunjungan</h2>
      {riwayat === null ? <p className="muted">Memuat...</p> : riwayat.length === 0 ? <Empty>Belum ada kunjungan.</Empty> : (
        <div className="biaya-list">
          {riwayat.map((k) => (
            <div key={k.id} className="biaya-item">
              <div className="judul">
                <b>{tglIndo(k.tanggal)} · {k.poli?.nama_poli}</b>
                {k.status_biaya === 'terverifikasi' ? <Badge tone="ok">Siap pulang</Badge> : <Badge tone="warn">Diproses kasir</Badge>}
              </div>
              <div className="biaya-rinci">
                <div><small>Konsultasi</small><b>{rupiah(k.biaya_konsul)}</b></div>
                <div><small>Obat</small><b>{rupiah(k.biaya_obat)}</b></div>
                <div className="bayar"><small>Dibayar sendiri</small><b>{rupiah(k.selisih_bayar)}</b></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}