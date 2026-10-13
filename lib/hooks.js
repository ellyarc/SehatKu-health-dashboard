'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

// Daftar orang yang boleh dikelola akun ini: diri sendiri, anak, orang tua, dst.
export function usePasienList() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const muat = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('akses_pasien').select('hubungan, pasien(*)').eq('user_id', user.id)
    const arr = (data ?? []).filter((x) => x.pasien).map((x) => ({ ...x.pasien, hubungan: x.hubungan }))
    arr.sort((a, b) => (b.hubungan === 'diri sendiri') - (a.hubungan === 'diri sendiri'))
    setList(arr)
    setLoading(false)
  }, [user])

  useEffect(() => { muat() }, [muat])
  return { list, loading, muat }
}

// Berlangganan perubahan realtime pada beberapa tabel
export function useLive(tabel, onChange) {
  const ref = useRef(onChange)
  ref.current = onChange
  const kunci = tabel.join(',')
  useEffect(() => {
    const ch = supabase.channel('live-' + kunci + '-' + Math.random().toString(36).slice(2))
    kunci.split(',').forEach((t) =>
      ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => ref.current())
    )
    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [kunci])
}

// Panggil fungsi secara berkala (cadangan jika realtime terlambat)
export function useInterval(fn, ms) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}