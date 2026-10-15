import './globals.css'
import { NAMA_APP, TAGLINE } from '@/lib/brand'

export const metadata = {
  title: `${NAMA_APP} – ${TAGLINE}`,
  description: 'Antrean dinamis, rekam medis, obat, rujukan, dan layanan kesehatan dalam satu dashboard.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
  href="https://fonts.googleapis.com/css2?family=Reddit+Sans:wght@400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
      </head>
      <body>{children}</body>
    </html>
  )
}