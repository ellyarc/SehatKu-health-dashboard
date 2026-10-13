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
      <PageHeader judul="KMS & imunisasi anak" deskripsi="Pantau tumbuh kembang dan jadwal imunisasi anak, lengkap dengan peringatan risiko stunting sejak dini." />
      {anak.length === 0 ? (
        <Empty>Belum ada anak yang tertaut. <Link href="/dashboard/keluarga">Tambahkan anggota keluarga</Link> dengan tanggal lahir.</Empty>
      ) : (
        <>
          <PasienSelect list={anak} value={sel} onChange={setSel} />
          {pilih && <KmsPanel key={pilih.id} pasien={pilih} staf={false} />}
        </>
      )}
    </>
  )
}