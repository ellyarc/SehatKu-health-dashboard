// Pencarian poli lintas faskes. Poli yang sejenis dikelompokkan walau namanya sedikit beda
// (mis. "Poli Gigi" di puskesmas dan "Poli Gigi & Mulut" di rumah sakit).
export const JENIS_URUT = ['puskesmas', 'klinik', 'rumah sakit']
export const NAMA_JENIS = { puskesmas: 'Puskesmas', klinik: 'Klinik', 'rumah sakit': 'Rumah sakit' }

export function kunciPoli(nama) {
  const k = nama.replace(/^Poli\s+/i, '').replace(/\(.*?\)/g, '').trim().toLowerCase()
  if (k.startsWith('gigi')) return 'gigi'
  if (k.startsWith('gizi')) return 'gizi'
  return k
}

// daftar: [{ nama_poli, faskesId }]  ->  [{ kunci, label, jumlah }] urut abjad
export function kelompokPoli(daftar) {
  const peta = new Map()
  daftar.forEach((p) => {
    const kunci = kunciPoli(p.nama_poli)
    const g = peta.get(kunci) ?? { kunci, label: p.nama_poli, faskes: new Set() }
    if (p.nama_poli.length < g.label.length) g.label = p.nama_poli
    g.faskes.add(p.faskesId)
    peta.set(kunci, g)
  })
  return [...peta.values()]
    .map((g) => ({ kunci: g.kunci, label: g.label, jumlah: g.faskes.size }))
    .sort((a, b) => a.label.localeCompare(b.label))
}