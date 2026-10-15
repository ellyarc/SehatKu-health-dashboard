// Set ikon garis sederhana (tanpa library tambahan). Pakai: <Icon name="pill" />
const PATH = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  ticket: 'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM14 6v12',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  history: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
  pill: 'M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 0 1 7 7zM8.5 8.5l7 7',
  refer: 'M5 12h14M13 6l6 6-6 6',
  sprout: 'M12 21v-9M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 15c0-3 2.5-5 6-5 0 3-2.5 5-6 5z',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M17 14c2.5 0 4 2 4 5',
  alert: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  message: 'M4 5h16v11H9l-5 4z',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  clipboard: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h6',
  cash: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  check: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6',
  boxes: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
  back: 'M19 12H5M11 6l-6 6 6 6',
}

export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg className={`ikon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATH[name] || PATH.check} />
    </svg>
  )
}