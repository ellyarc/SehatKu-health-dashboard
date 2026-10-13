import { BULAN, acuan } from '@/lib/who'

// Grafik tinggi badan menurut umur dengan garis median, -2 SD, -3 SD
export default function GrowthChart({ jk, titik }) {
  const W = 640, H = 300, m = { l: 44, r: 16, t: 14, b: 36 }
  const a = acuan(jk)
  const x = (b) => m.l + (b / 24) * (W - m.l - m.r)
  const y = (v) => H - m.b - ((v - 42) / (96 - 42)) * (H - m.t - m.b)
  const garis = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(BULAN[i])},${y(v)}`).join(' ')
  const pts = [...titik].filter((p) => p.bulan >= 0 && p.bulan <= 24).sort((p, q) => p.bulan - q.bulan)

  return (
    <div className="table-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafik tinggi badan menurut umur" style={{ minWidth: 420, width: '100%' }}>
        {[45, 55, 65, 75, 85, 95].map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="#e3e9f5" />
            <text x={m.l - 6} y={y(v) + 4} fontSize="11" textAnchor="end" fill="#4a5a7c">{v}</text>
          </g>
        ))}
        {[0, 6, 12, 18, 24].map((b) => (
          <text key={b} x={x(b)} y={H - 14} fontSize="11" textAnchor="middle" fill="#4a5a7c">{b} bln</text>
        ))}
        <path d={garis(a.med)} fill="none" stroke="#14397a" strokeWidth="1.5" strokeDasharray="5 4" />
        <path d={garis(a.sd2)} fill="none" stroke="#c98a00" strokeWidth="1.5" />
        <path d={garis(a.sd3)} fill="none" stroke="#b3261e" strokeWidth="1.5" />
        {pts.length > 1 && (
          <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.bulan)},${y(p.tinggi)}`).join(' ')} fill="none" stroke="#0a2351" strokeWidth="2.5" />
        )}
        {pts.map((p, i) => <circle key={i} cx={x(p.bulan)} cy={y(p.tinggi)} r="5" fill="#0a2351" stroke="#fff" strokeWidth="2" />)}
        <text x={W - m.r} y={y(a.med[16]) - 6} fontSize="10" textAnchor="end" fill="#14397a">median</text>
        <text x={W - m.r} y={y(a.sd2[16]) - 6} fontSize="10" textAnchor="end" fill="#c98a00">-2 SD</text>
        <text x={W - m.r} y={y(a.sd3[16]) + 14} fontSize="10" textAnchor="end" fill="#b3261e">-3 SD</text>
      </svg>
    </div>
  )
}