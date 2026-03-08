import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { syncUser } from '../services/auth.service'
import { useAppStore } from '../store/useAppStore'

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const { user, setUser } = useAppStore()
  const navigate = useNavigate()
  const hasSynced = useRef(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session, hasSynced.current)
        if (event === 'SIGNED_IN' && session && !hasSynced.current) {
          hasSynced.current = true
          try {
            console.log('Syncing user...')
            const res = await syncUser(session.access_token)
            console.log('User synced:', res)
            setUser(res)
          } catch (err) {
            console.error('Failed to sync user:', err)
            await supabase.auth.signOut()
            navigate('/login')
          } finally {
            setLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          hasSynced.current = false
          setUser(null)
          setLoading(false)
        } else if (!session) {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, navigate])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/')
  }

  return { user, loading, signInWithGoogle, signOut }
}
