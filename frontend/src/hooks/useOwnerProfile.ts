import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { type Owner } from '../types/database'

interface OwnerProfileState {
  owner: Owner | null
  isOwner: boolean
  loading: boolean
  error: string | null
}

export function useOwnerProfile(): OwnerProfileState {
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchOwnerProfile() {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) {
          setOwner(null)
          setLoading(false)
        }
        return
      }

      const { data, error: fetchError } = await supabase
        .from('owners')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (cancelled) return

      if (fetchError ?? !data) {
        setOwner(null)
        setError(fetchError?.message ?? null)
      } else {
        setOwner(data)
      }

      setLoading(false)
    }

    fetchOwnerProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchOwnerProfile()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return {
    owner,
    isOwner: owner !== null,
    loading,
    error,
  }
}