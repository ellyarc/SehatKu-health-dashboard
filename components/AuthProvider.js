'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

// Menyediakan: user (akun login), profil (peran), diri (data pasien milik sendiri)
export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, profil: null, diri: null })

  const muat = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return setState({ loading: false, user: null, profil: null, diri: null })
    const [{ data: profil }, { data: diri }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('pasien').select('*').eq('user_id', session.user.id).maybeSingle(),
    ])
    setState({ loading: false, user: session.user, profil, diri })
  }, [])

  useEffect(() => {
    muat()
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_OUT') setState({ loading: false, user: null, profil: null, diri: null })
    })
    return () => sub.subscription.unsubscribe()
  }, [muat])

  return <Ctx.Provider value={{ ...state, muat }}>{children}</Ctx.Provider>
}