'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePasienList } from '@/lib/hooks'
import { hariIni, tglIndo } from '@/lib/format'
import KunjunganCard, { SELECT_KUNJUNGAN } from '@/components/KunjunganCard'
import { Card, Empty, PageHeader, PasienSelect, Stat } from '@/components/ui'

export default function Riwayat() {
  const { list } = usePasienList()
  const [sel, setSel] = useState(null)
  const [kunjungan, setKunjungan] = useState(null)
  const [akses, setAkses] = useState([])

  useEffect(() => { if (list.length && !sel) setSel(list[0].id) }, [list, sel])

  useEffect(() => {
    if (!sel) return
    setKunjungan(null)
    ;(async () => {
      const { data } = await supabase.from('kunjungan').select(SELECT_KUNJUNGAN)
        .eq('pasien_id', sel).order('tanggal', { ascending: false }).limit(30)
      setKunjungan(data ?? [])

      const { data: log } = await supabase.from('akses_log').select('created_at, tindakan, user_id')
        .eq('pasien_id', sel).order('created_at', { ascending: false }).limit(10)
      const ids = [...new Set((log ?? []).map((l) => l.user_id))]
      const { data: nama } = ids.length ? await supabase.from('profiles').select('id, nama, role').in('id', ids) : { data: [] }
      setAkses((log ?? []).map((l) => ({ ...l, pelaku: nama?.find((n) => n.id === l.user_id) })))
    })()
  }, [sel])

  const kontrol = (kunjungan ?? []).map((k) => k.tgl_kontrol).filter((t) => t && t >= hariIni()).sort()[0]

  return (
    <>
      <PageHeader judul="Riwayat" deskripsi="Catatan pemeriksaan, anjuran dokter, obat, dan hasil lab dari setiap kunjungan. Keluarga yang tertaut juga bisa membacanya." />
      <PasienSelect list={list} value={sel} onChange={setSel} />

      {kunjungan && kunjungan.length > 0 && (
        <div className="grid3">
          <Stat nilai={kunjungan.length} label="Kunjungan tercatat" />
          <Stat nilai={kontrol ? tglIndo(kontrol) : '-'} label="Kontrol berikutnya" />
        </div>
      )}

      {kunjungan === null ? <p className="muted">Memuat...</p>
        : kunjungan.length === 0 ? <Empty>Belum ada riwayat kunjungan.</Empty>
        : kunjungan.map((k) => <KunjunganCard key={k.id} k={k} />)}

      <Card judul="Siapa yang pernah membuka rekam medismu">
        {akses.length === 0 ? <p className="muted">Belum ada tenaga kesehatan yang mencari data ini lewat NIK.</p> : (
          <ul className="plain">
            {akses.map((a, i) => (
              <li key={i}>{tglIndo(a.created_at)} · {a.pelaku?.nama || 'Tenaga kesehatan'} ({a.pelaku?.role}) · {a.tindakan}</li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}