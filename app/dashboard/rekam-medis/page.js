'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import CariPasien from '@/components/CariPasien'
import KunjunganCard, { SELECT_KUNJUNGAN } from '@/components/KunjunganCard'
import { tglIndo, umurTeks } from '@/lib/format'
import { Badge, Card, Empty, Notice, PageHeader } from '@/components/ui'

export default function RekamMedis() {
  const [p, setP] = useState(null)
  const [kunjungan, setKunjungan] = useState([])
  const [rujukan, setRujukan] = useState([])

  async function pilih(pasien) {
    setP(pasien)
    // Setiap pembukaan rekam medis dicatat dan bisa dilihat pasien (transparansi)
    await supabase.rpc('log_akses', { p_pasien: pasien.id, p_tindakan: 'Membuka rekam medis' })
    const [a, b] = await Promise.all([
      supabase.from('kunjungan').select(SELECT_KUNJUNGAN).eq('pasien_id', pasien.id).order('tanggal', { ascending: false }),
      supabase.from('rujukan').select('*').eq('pasien_id', pasien.id).order('berlaku_sampai', { ascending: false }),
    ])
    setKunjungan(a.data ?? []); setRujukan(b.data ?? [])
  }

  return (
    <>
      <PageHeader judul="Rekam medis terpadu (NIK)" deskripsi="Riwayat penyakit, hasil lab, dan alergi dari semua faskes dalam satu tampilan, supaya pasien tidak diperiksa ulang." />
      {!p ? (
        <Card judul="Cari pasien"><CariPasien onPilih={pilih} label="Masukkan NIK 16 digit atau nama" />
          <p className="muted mt">Pembukaan rekam medis dicatat dan dapat dilihat oleh pasien.</p></Card>
      ) : (
        <>
          <Card judul={p.nama} aksi={<button className="link" onClick={() => setP(null)}>Cari pasien lain</button>}>
            <p>{umurTeks(p.tgl_lahir)} · {p.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'} · NIK {p.nik || '-'}</p>
            <p>Penjamin: {p.penjamin.toUpperCase()} · Kontak darurat: {p.kontak_darurat_nama || '-'} {p.kontak_darurat_hp || ''}</p>
            {p.alergi ? <Notice tone="danger"><b>Alergi:</b> {p.alergi}</Notice> : <p className="muted">Tidak ada catatan alergi.</p>}
          </Card>
          {rujukan.length > 0 && (
            <Card judul="Rujukan">
              <ul className="plain">{rujukan.map((r) => <li key={r.id} className="row"><span>{r.tujuan} {r.poli_tujuan && `· ${r.poli_tujuan}`}</span><span>sampai {tglIndo(r.berlaku_sampai)} <Badge tone={r.status === 'aktif' ? 'ok' : 'warn'}>{r.status}</Badge></span></li>)}</ul>
            </Card>
          )}
          <h2>Riwayat kunjungan</h2>
          {kunjungan.length === 0 ? <Empty>Belum ada riwayat.</Empty> : kunjungan.map((k) => <KunjunganCard key={k.id} k={k} />)}
        </>
      )}
    </>
  )
}