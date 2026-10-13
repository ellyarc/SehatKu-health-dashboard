// Pra-triase berbasis aturan baku. BUKAN diagnosis: hanya membantu menentukan prioritas.
// Daftar kunci di sini harus sama dengan fungsi hitung_urgensi() di supabase/schema.sql.
export const PERTANYAAN = [
  { key: 'sesak_berat', tingkat: 'darurat', teks: 'Sesak napas berat atau sulit berbicara' },
  { key: 'nyeri_dada', tingkat: 'darurat', teks: 'Nyeri dada hebat, atau menjalar ke lengan/rahang' },
  { key: 'tidak_sadar', tingkat: 'darurat', teks: 'Pingsan atau tidak sadar' },
  { key: 'kejang', tingkat: 'darurat', teks: 'Kejang' },
  { key: 'perdarahan_hebat', tingkat: 'darurat', teks: 'Perdarahan hebat yang tidak berhenti' },
  { key: 'lumpuh_mendadak', tingkat: 'darurat', teks: 'Lemah atau lumpuh sebelah badan, wajah mencong, atau bicara pelo mendadak' },
  { key: 'demam_3hari', tingkat: 'segera', teks: 'Demam lebih dari 3 hari' },
  { key: 'nyeri_berat', tingkat: 'segera', teks: 'Nyeri berat yang mengganggu aktivitas' },
  { key: 'muntah_terus', tingkat: 'segera', teks: 'Muntah atau diare terus-menerus (risiko dehidrasi)' },
  { key: 'sesak_ringan', tingkat: 'segera', teks: 'Sesak napas ringan' },
  { key: 'hamil_keluhan', tingkat: 'segera', teks: 'Sedang hamil dan ada keluhan' },
  { key: 'luka_infeksi', tingkat: 'segera', teks: 'Luka bengkak, bernanah, atau memerah' },
]

export function nilaiTriase(jawaban) {
  let hasil = 'rutin'
  for (const q of PERTANYAAN) {
    if (jawaban?.[q.key]) {
      if (q.tingkat === 'darurat') return 'darurat'
      hasil = 'segera'
    }
  }
  return hasil
}

// Hanya kirim jawaban yang dicentang
export const jawabanBersih = (j) =>
  Object.fromEntries(Object.entries(j || {}).filter(([, v]) => v === true))