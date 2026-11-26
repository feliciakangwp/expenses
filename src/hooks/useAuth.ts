import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import { useData } from './useData'

export function useAuth() {
  const { user, setUser, loadDemoData, reset } = useAppStore()
  const { fetchAll } = useData()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadDemoData()
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAll()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (useAppStore.getState().isDemoMode) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAll()
      } else {
        reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string, rememberMe = true) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // If "remember me" is off, session expires on browser close (Supabase default is persistent).
    // We flag it so the app can clear on tab close if needed.
    if (!rememberMe) {
      sessionStorage.setItem('session_only', '1')
    } else {
      sessionStorage.removeItem('session_only')
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    reset()
  }

  return { user, signIn, signUp, signOut }
}
