'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { usePasienList } from '@/lib/hooks'
import { hariIni, selisihHari, tglIndo } from '@/lib/format'
import { Card, Empty, Notice, PageHeader, Stat } from '@/components/ui'

export default function Beranda() {
  const { profil } = useAuth()
  return profil.role === 'pasien' ? <BerandaPasien /> : <BerandaStaf role={profil.role} />
}

function BerandaPasien() {
  const { diri } = useAuth()
  const { list } = usePasienList()
  const [d, setD] = useState({ antrean: [], belumMinum: 0, rujukan: [] })

  useEffect(() => {
    if (!list.length) return
    const ids = list.map((p) => p.id)
    const hari = hariIni()
    ;(async () => {
      const [a, p, l, r] = await Promise.all([
        supabase.from('antrean').select('id, nomor, status, pasien(nama), poli(nama_poli)')
          .in('pasien_id', ids).eq('tanggal', hari).in('status', ['menunggu', 'dipanggil']),
        supabase.from('pengingat_obat').select('id, jam').in('pasien_id', ids).eq('aktif', true)
          .lte('mulai', hari).or(`selesai.is.null,selesai.gte.${hari}`),
        supabase.from('log_minum').select('id').in('pasien_id', ids).eq('tanggal', hari),
        supabase.from('rujukan').select('id, tujuan, berlaku_sampai, status, pasien(nama)')
          .in('pasien_id', ids).in('status', ['aktif', 'diajukan']),
      ])
      const total = (p.data ?? []).reduce((s, x) => s + x.jam.length, 0)
      setD({
        antrean: a.data ?? [],
        belumMinum: Math.max(0, total - (l.data?.length ?? 0)),
        rujukan: (r.data ?? []).filter((x) => selisihHari(x.berlaku_sampai) <= 30),
      })
    })()
  }, [list])

  const kurang = []
if (!diri?.nik) kurang.push('NIK')
if (!diri?.tgl_lahir) kurang.push('tanggal lahir')
if (!diri?.jenis_kelamin) kurang.push('jenis kelamin')
if (!diri?.no_hp) kurang.push('nomor HP')
if (!diri?.alamat) kurang.push('alamat')

  return (
    <>
      <PageHeader judul={`Halo, ${diri?.nama?.split(' ')[0] || 'selamat datang'}`} deskripsi="Ringkasan layanan kesehatanmu dan keluarga hari ini." />

      {kurang.length > 0 && (
  <Notice tone="warn">
    Lengkapi data dirimu: <b>{kurang.join(', ')}</b>. Data ini dipakai dokter saat memeriksa,
    dan membantu petugas menghubungimu kalau obatmu terlewat.{' '}
    <Link href="/dashboard/keluarga">Lengkapi sekarang</Link>
  </Notice>
)}

      <div className="grid3">
        <Stat nilai={d.antrean.length} label="Antrean aktif hari ini" />
        <Stat nilai={d.belumMinum} label="Dosis obat belum dikonfirmasi" />
        <Stat nilai={d.rujukan.length} label="Rujukan hampir habis" />
      </div>

      <Card judul="Antrean hari ini" aksi={<Link className="link" href="/dashboard/antrean">Kelola</Link>}>
        {d.antrean.length === 0 ? <Empty>Belum ada antrean aktif.</Empty> : (
          <ul className="plain">
            {d.antrean.map((a) => (
              <li key={a.id}><b>#{a.nomor}</b> {a.pasien?.nama} · {a.poli?.nama_poli} ({a.status})</li>
            ))}
          </ul>
        )}
      </Card>

      {d.belumMinum > 0 && (
        <Notice tone="warn">Ada {d.belumMinum} dosis obat hari ini yang belum dikonfirmasi. <Link href="/dashboard/obat">Buka alarm minum obat</Link></Notice>
      )}
      {d.rujukan.map((r) => (
        <Notice key={r.id} tone="warn">
          Rujukan {r.pasien?.nama} ke {r.tujuan} berlaku sampai {tglIndo(r.berlaku_sampai)}. <Link href="/dashboard/rujukan">Perpanjang</Link>
        </Notice>
      ))}

      <Notice tone="danger">
        Kondisi darurat? Hubungi <b>112</b> atau <b>119</b>, atau gunakan <Link href="/dashboard/sos">tombol SOS</Link>.
      </Notice>
    </>
  )
}

const count = async (tabel, saring) => {
  let q = supabase.from(tabel).select('id', { count: 'exact', head: true })
  q = saring(q)
  const { count } = await q
  return count ?? 0
}

function BerandaStaf({ role }) {
  const [stat, setStat] = useState([])

  useEffect(() => {
    const hari = hariIni()
    const tugas = {
      petugas: [
        ['Antrean menunggu hari ini', '/dashboard/loket', () => count('antrean', (q) => q.eq('tanggal', hari).eq('status', 'menunggu'))],
        ['Kunjungan belum diverifikasi kasir', '/dashboard/kasir', () => count('kunjungan', (q) => q.eq('tanggal', hari).eq('status_biaya', 'belum'))],
        ['SOS baru', '/dashboard/laporan', () => count('sos_event', (q) => q.eq('status', 'baru'))],
        ['Pengaduan baru', '/dashboard/laporan', () => count('pengaduan', (q) => q.eq('status', 'baru'))],
      ],
      dokter: [
        ['Antrean menunggu hari ini', '/dashboard/loket', () => count('antrean', (q) => q.eq('tanggal', hari).eq('status', 'menunggu'))],
        ['Pengajuan perpanjangan rujukan', '/dashboard/persetujuan-rujukan', () => count('rujukan', (q) => q.eq('status', 'diajukan'))],
        ['Kunjungan Anda hari ini', '/dashboard/rekam-medis', () => count('kunjungan', (q) => q.eq('tanggal', hari))],
      ],
      apoteker: [
        ['Resep menunggu diserahkan', '/dashboard/farmasi', () => count('resep', (q) => q.eq('status', 'menunggu'))],
        ['Obat stok habis', '/dashboard/farmasi', () => count('obat', (q) => q.eq('stok', 0))],
        ['Obat stok menipis (1-20)', '/dashboard/farmasi', () => count('obat', (q) => q.gt('stok', 0).lte('stok', 20))],
      ],
      kader: [
        ['Pasien tidak patuh (2 hari+)', '/dashboard/pantau', async () => (await supabase.rpc('pasien_tidak_patuh', { p_hari: 2 })).data?.length ?? 0],
      ],
    }[role]
    ;(async () => {
      setStat(await Promise.all(tugas.map(async ([label, href, fn]) => ({ label, href, nilai: await fn() }))))
    })()
  }, [role])

  return (
    <>
      <PageHeader judul="Ringkasan tugas" deskripsi="Hal yang perlu ditindaklanjuti sekarang." />
      <div className="grid3">
        {stat.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Stat nilai={s.nilai} label={s.label} />
          </Link>
        ))}
      </div>
      {role === 'kader' && (
        <Card judul="Alur kerja kader">
          <p>Buka <Link href="/dashboard/pantau">Pantau Kepatuhan</Link> untuk pasien yang berhenti minum obat, dan <Link href="/dashboard/posyandu">Posyandu</Link> untuk mencatat pengukuran dan imunisasi anak.</p>
        </Card>
      )}
    </>
  )
}