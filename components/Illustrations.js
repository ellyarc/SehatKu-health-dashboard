// Ilustrasi SVG buatan sendiri untuk landing dan halaman masuk (tanpa gambar eksternal).
const INK = '#2b1a0e'
const BROWN = '#50331f'

export function HeroIllustration({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 500 400" role="img"
      aria-label="Ilustrasi aplikasi: nomor antrean di ponsel, alarm minum obat, dan riwayat kesehatan"
      style={{ width: '100%', height: 'auto', display: 'block' }}>
      <circle cx="285" cy="200" r="170" fill="#ffcf5e" opacity="0.22" />
      <circle cx="452" cy="230" r="20" fill="#a99bf5" opacity="0.55" />
      <circle cx="70" cy="330" r="16" fill="#9caf6b" opacity="0.6" />
      <g stroke="#ffcf5e" strokeWidth="5" strokeLinecap="round" opacity="0.9">
        <path d="M60 70v18M51 79h18" /><path d="M440 340v14M433 347h14" />
      </g>

      {/* ponsel */}
      <g transform="translate(60 0)">
        <rect x="140" y="24" width="170" height="344" rx="28" fill="#fff" stroke={BROWN} strokeWidth="5" />
        <rect x="205" y="34" width="40" height="7" rx="3.5" fill={BROWN} opacity="0.25" />
        <rect x="154" y="52" width="142" height="40" rx="12" fill={BROWN} />
        <text x="168" y="77" fontSize="14" fontWeight="700" fill="#fff" fontFamily="inherit">Antrean saya</text>
        <rect x="154" y="104" width="142" height="132" rx="16" fill="#ee7f1e" />
        <text x="168" y="128" fontSize="11" fill="#fff" opacity="0.9" fontFamily="inherit">Poli Umum</text>
        <text x="168" y="190" fontSize="60" fontWeight="800" fill="#fff" fontFamily="inherit">12</text>
        <text x="168" y="216" fontSize="11" fill="#fff" opacity="0.9" fontFamily="inherit">Dipanggil sekitar 09.40</text>
        <g fontFamily="inherit" fontSize="11" fill={INK}>
          <rect x="154" y="248" width="142" height="30" rx="10" fill="#f6f1e3" />
          <text x="164" y="267">Sedang dipanggil</text><text x="286" y="267" fontWeight="700" textAnchor="end">9</text>
          <rect x="154" y="284" width="142" height="30" rx="10" fill="#f6f1e3" />
          <text x="164" y="303">Antrean di depan</text><text x="286" y="303" fontWeight="700" textAnchor="end">2</text>
        </g>
        <rect x="154" y="326" width="142" height="30" rx="10" fill="#ffcf5e" />
        <text x="225" y="346" fontSize="12" fontWeight="700" fill={BROWN} textAnchor="middle" fontFamily="inherit">Batalkan antrean</text>
      </g>

      {/* kartu alarm obat (kiri, di luar ponsel) */}
      <g transform="translate(6 196)">
        <rect width="208" height="68" rx="16" fill="#fff" stroke="#e4dcc7" strokeWidth="2" />
        <rect x="12" y="16" width="36" height="36" rx="12" fill="#ebe6fb" />
        <g transform="translate(19 23)" fill="none" stroke="#6b5bd2" strokeWidth="2" strokeLinecap="round">
          <path d="M8.2 19.4a3.8 3.8 0 0 1-5.4-5.4l7.7-7.7a3.8 3.8 0 0 1 5.4 5.4z" /><path d="M7.5 7.5l5.4 5.4" />
        </g>
        <text x="58" y="32" fontSize="11" fontWeight="700" fill={INK} fontFamily="inherit">Waktunya minum obat</text>
        <text x="58" y="49" fontSize="11" fill="#6b5a4a" fontFamily="inherit">Amlodipin · 08.00</text>
      </g>

      {/* kartu riwayat (kanan, tidak menutupi judul ponsel) */}
      <g transform="translate(316 104)">
        <rect width="180" height="68" rx="16" fill="#fff" stroke="#e4dcc7" strokeWidth="2" />
        <rect x="12" y="16" width="36" height="36" rx="12" fill="#e9f0d6" />
        <path d="M21 34l6 6 11-12" fill="none" stroke="#4a6527" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="58" y="32" fontSize="11" fontWeight="700" fill={INK} fontFamily="inherit">Riwayat terhubung</text>
        <text x="58" y="49" fontSize="11" fill="#6b5a4a" fontFamily="inherit">Dokter langsung tahu</text>
      </g>
    </svg>
  )
}