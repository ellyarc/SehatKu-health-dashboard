// Acuan tinggi/panjang badan menurut umur (TB/U), anak 0-24 bulan.
// DATA DISEDERHANAKAN dari standar pertumbuhan WHO 2006 (median, -2 SD, -3 SD).
// Untuk penggunaan resmi, cocokkan dengan tabel standar antropometri anak
// (Permenkes No. 2 Tahun 2020) atau gunakan tabel LMS lengkap.
export const BULAN = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 21, 24]

const DATA = {
  L: {
    med: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 79.1, 82.3, 85.1, 87.1],
    sd2: [46.1, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3, 64.8, 66.2, 67.5, 68.7, 69.9, 71.0, 74.1, 76.9, 79.4, 81.7],
    sd3: [44.2, 48.9, 52.4, 55.3, 57.6, 59.6, 61.2, 62.7, 64.0, 65.2, 66.4, 67.6, 68.6, 71.6, 74.2, 76.5, 78.7],
  },
  P: {
    med: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 77.5, 80.7, 83.7, 86.4],
    sd2: [45.4, 49.8, 53.0, 55.6, 57.8, 59.6, 61.2, 62.7, 64.0, 65.3, 66.5, 67.7, 68.9, 72.0, 74.9, 77.5, 80.0],
    sd3: [43.6, 47.8, 51.0, 53.5, 55.6, 57.4, 58.9, 60.3, 61.7, 62.9, 64.1, 65.2, 66.3, 69.3, 72.0, 74.5, 76.9],
  },
}

export const acuan = (jk) => DATA[jk === 'P' ? 'P' : 'L']

// Interpolasi linear antar titik umur
export function nilaiPada(arr, bulan) {
  if (bulan <= 0) return arr[0]
  if (bulan >= 24) return arr[arr.length - 1]
  for (let i = 0; i < BULAN.length - 1; i++) {
    if (bulan >= BULAN[i] && bulan <= BULAN[i + 1]) {
      const t = (bulan - BULAN[i]) / (BULAN[i + 1] - BULAN[i])
      return arr[i] + t * (arr[i + 1] - arr[i])
    }
  }
  return arr[arr.length - 1]
}

export function statusTinggi(jk, bulan, tinggi) {
  if (bulan == null || bulan < 0 || bulan > 24 || !tinggi) {
    return { kode: 'luar', label: 'Acuan tersedia untuk usia 0-24 bulan', tone: 'muted' }
  }
  const a = acuan(jk)
  if (tinggi < nilaiPada(a.sd3, bulan))
    return { kode: 'sangat_pendek', label: 'Sangat pendek (di bawah -3 SD)', tone: 'danger' }
  if (tinggi < nilaiPada(a.sd2, bulan))
    return { kode: 'pendek', label: 'Pendek / berisiko stunting (di bawah -2 SD)', tone: 'warn' }
  return { kode: 'normal', label: 'Normal (tidak di bawah -2 SD)', tone: 'ok' }
}