// Komponen tampilan kecil yang dipakai di semua halaman dashboard
export function PageHeader({ judul, deskripsi, children }) {
  return (
    <div className="page-head">
      <h1>{judul}</h1>
      {deskripsi && <p className="muted">{deskripsi}</p>}
      {children}
    </div>
  )
}

export function Card({ judul, aksi, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(judul || aksi) && (
        <div className="row card-head">
          <h2>{judul}</h2>
          {aksi}
        </div>
      )}
      {children}
    </section>
  )
}

export const Badge = ({ tone = 'navy', children }) => <span className={`badge ${tone}`}>{children}</span>
export const Empty = ({ children }) => <p className="empty">{children}</p>
export const Notice = ({ tone = 'info', children }) => <div className={`notice ${tone}`}>{children}</div>

export const Stat = ({ nilai, label }) => (
  <div className="stat"><b>{nilai}</b><span>{label}</span></div>
)

export const Field = ({ label, hint, children }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
)

export function PasienSelect({ list, value, onChange }) {
  if (!list || list.length <= 1) return null
  return (
    <div className="pasien-select">
      <span className="muted">Untuk:</span>
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {list.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nama}{p.hubungan && p.hubungan !== 'diri sendiri' ? ` (${p.hubungan})` : ' (saya)'}
          </option>
        ))}
      </select>
    </div>
  )
}

export function Tabs({ tabs, aktif, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={aktif === k}
          className={`tab ${aktif === k ? 'aktif' : ''}`} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  )
}