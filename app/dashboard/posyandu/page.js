'use client'
import { useState } from 'react'
import CariPasien from '@/components/CariPasien'
import KmsPanel from '@/components/KmsPanel'
import { Card, PageHeader } from '@/components/ui'

export default function Posyandu() {
  const [p, setP] = useState(null)
  return (
    <>
      <PageHeader judul="Posyandu anak" deskripsi="Catat berat dan tinggi anak, lihat grafik pertumbuhan, dan tandai imunisasi yang sudah diberikan. Orang tua langsung bisa melihatnya di akun mereka." />
      {!p ? (
        <Card judul="Cari anak"><CariPasien onPilih={setP} label="Nama anak atau NIK" /></Card>
      ) : (
        <>
          <button className="link" onClick={() => setP(null)}>Cari anak lain</button>
          <KmsPanel key={p.id} pasien={p} staf />
        </>
      )}
    </>
  )
}