'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePasienList } from '@/lib/hooks'
import { tglIndo } from '@/lib/format'
import KunjunganCard, { SELECT_KUNJUNGAN } from '@/components/KunjunganCard'
import { Card, Empty, PageHeader, PasienSelect } from '@/components/ui'

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

  return (
    <>
      <PageHeader judul="Riwayat & tugas saya" deskripsi="Catatan pemeriksaan, tugas perawatan di rumah, obat, dan hasil lab. Keluarga yang tertaut juga bisa membacanya." />
      <PasienSelect list={list} value={sel} onChange={setSel} />

      {kunjungan === null ? <p className="muted">Memuat...</p>
        : kunjungan.length === 0 ? <Empty>Belum ada riwayat kunjungan.</Empty>
        : kunjungan.map((k) => <KunjunganCard key={k.id} k={k} />)}

      <Card judul="Siapa yang membuka data ini">
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