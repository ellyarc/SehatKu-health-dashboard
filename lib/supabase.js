import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Tanggal hari ini zona WIB, format YYYY-MM-DD
export const hariIni = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })