// Semua tanggal memakai zona waktu WIB
export const hariIni = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

export const jam = (d) =>
  d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

// "HH:MM" untuk perbandingan dengan jadwal minum obat
export const jamSekarang = () =>
  new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

export const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

export const tglIndo = (s) =>
  s
    ? new Date(s.length === 10 ? s + 'T00:00:00+07:00' : s).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
      })
    : '-'

export const selisihHari = (s) =>
  Math.round(
    (new Date(s + 'T00:00:00+07:00') - new Date(hariIni() + 'T00:00:00+07:00')) / 86400000
  )

export const umurBulan = (tgl, ref) => {
  const [y1, m1, d1] = tgl.split('-').map(Number)
  const [y2, m2, d2] = (ref || hariIni()).split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
}

export const umurTeks = (tgl) => {
  if (!tgl) return '-'
  const b = umurBulan(tgl)
  return b < 24 ? `${b} bln` : `${Math.floor(b / 12)} thn`
}

export const tambahHari = (s, n) => {
  const d = new Date(s + 'T00:00:00+07:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

// Perkiraan biaya yang sama dengan hitungan di database
export const estimasiBiaya = (pasien, poli) =>
  pasien && poli && pasien.penjamin !== 'umum' && pasien.status_penjamin === 'aktif'
    ? 0
    : poli?.tarif ?? 0

    // Rapikan nomor HP Indonesia ke format 08xxxxxxxxxx
export const rapikanHp = (s) => {
  const d = (s || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('62')) return '0' + d.slice(2)
  if (d.startsWith('8')) return '0' + d
  return d
}

// Kosong dianggap valid (kolom boleh tidak diisi)
export const hpValid = (s) => !s || /^08[0-9]{8,11}$/.test(s)