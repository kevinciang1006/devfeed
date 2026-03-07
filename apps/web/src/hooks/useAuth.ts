import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { syncUser } from '../lib/api'
import { useAppStore } from '../store/useAppStore'

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const { user, setUser } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUser()
          .then((res) => setUser(res.user))
          .catch(console.error)
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const res = await syncUser()
            setUser(res.user)
          } catch (err) {
            console.error('Failed to sync user:', err)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser])

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
