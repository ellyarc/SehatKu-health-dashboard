'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePasienList } from '@/lib/hooks'
import { umurBulan } from '@/lib/format'
import KmsPanel from '@/components/KmsPanel'
import { Empty, PageHeader, PasienSelect } from '@/components/ui'

export default function Anak() {
  const { list } = usePasienList()
  const anak = list.filter((p) => p.tgl_lahir && umurBulan(p.tgl_lahir) < 72)
  const [sel, setSel] = useState(null)
  useEffect(() => { if (anak.length && !anak.find((a) => a.id === sel)) setSel(anak[0].id) }, [anak, sel])
  const pilih = anak.find((a) => a.id === sel)

  return (
    <>
      <PageHeader judul="Kesehatan anak" deskripsi="Pantau tinggi dan berat badan anak, jadwal imunisasi, dan dapatkan peringatan dini kalau ada risiko stunting." />
      {anak.length === 0 ? (
        <Empty>Belum ada anak di bawah 6 tahun yang tertaut. <Link href="/dashboard/keluarga">Tambahkan anggota keluarga</Link> beserta tanggal lahirnya.</Empty>
      ) : (
        <>
          <PasienSelect list={anak} value={sel} onChange={setSel} />
          {pilih && <KmsPanel key={pilih.id} pasien={pilih} staf={false} />}
        </>
      )}
    </>
  )
}