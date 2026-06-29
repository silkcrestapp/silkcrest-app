import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

type Step = 'validating' | 'invalid' | 'form' | 'google' | 'submitting' | 'done'

interface InviteValidation {
  valid: boolean
  save_id?: string
  reason?: string
}

export function useGoogleInit() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  useEffect(() => {
    async function init() {
      if (!token) return

      let savedToken = sessionStorage.getItem('silkcrest_reg_token')
      const { data: { session } } = await supabase.auth.getSession()

      // Only treat as returning from Google if session is from Google OAuth
      const isGoogleSession = session?.user?.app_metadata?.provider === 'google'

      if (savedToken && session && isGoogleSession) {
        setStep('submitting')
        await submitRegistration(session.access_token)
        return
      }

      // Normal flow — validate the invite token
      const res = await fetch(`${apiUrl}/invites/${token}`)
      const data: InviteValidation = await res.json()
      setStep(data.valid ? 'form' : 'invalid')
    }

    init()
  }, [token])

  const [step, setStep] = useState<Step>('validating')
  const [inviteData, setInviteData] = useState<InviteValidation | null>(null)

  async function submitRegistration(accessToken: string) {
    // Restore form data from sessionStorage after OAuth redirect
    const savedForm = sessionStorage.getItem('silkcrest_reg_form')
    const restoredForm: FormState = savedForm ? JSON.parse(savedForm) : { ...EMPTY_FORM, display_name: 'default_display_name', display_name_jp: 'default_display_name_jp' } // default values

    try {
      const res = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_token: token,
          access_token,
          display_name: restoredForm.display_name,
          display_name_jp: restoredForm.display_name_jp || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Registration failed.')
        setStep('form')
        return
      }

      // Clean up sessionStorage
      sessionStorage.removeItem('silkcrest_reg_form')

      setStep('done')
    } catch (error) {
      setError('Could not reach the server. Please try again.')
      console.error(error)
      setStep('form')
    }
  }

  return step
}

export default useGoogleInit