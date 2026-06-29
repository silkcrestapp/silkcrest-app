import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

type Step = 'validating' | 'invalid' | 'form' | 'google' | 'submitting' | 'done'

interface InviteValidation {
  valid: boolean
  save_id?: string
  reason?: string
}

interface FormState {
  display_name: string
  display_name_jp: string
  silks_color: string
  silks_pattern: string
}

const EMPTY_FORM: FormState = {
  display_name: '',
  display_name_jp: '',
  silks_color: '',
  silks_pattern: '',
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [step, setStep] = useState<Step>(token ? 'validating' : 'invalid')
  const [inviteData, setInviteData] = useState<InviteValidation | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  const submittingRef = useRef(false)

  // --- Step 1: Validate the invite token ---
  useEffect(() => {
    if (!token) {
      return
    }

    // --- Step 4: POST to backend to create the owner ---
    async function submitRegistration(accessToken: string) {
      if (submittingRef.current) return
      submittingRef.current = true
      // Restore form data from sessionStorage after OAuth redirect
      const savedForm = sessionStorage.getItem('silkcrest_reg_form')
      const savedToken = sessionStorage.getItem('silkcrest_reg_token')
      const restoredForm: FormState = savedForm ? JSON.parse(savedForm) : form

      try {
        const res = await fetch(`${apiUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invite_token: savedToken ?? token,
            access_token: accessToken,
            display_name: restoredForm.display_name,
            display_name_jp: restoredForm.display_name_jp || undefined,
            silks_color: restoredForm.silks_color || undefined,
            silks_pattern: restoredForm.silks_pattern || undefined,
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
        sessionStorage.removeItem('silkcrest_reg_token')

        setStep('done')
      } catch {
        setError('Could not reach the server. Please try again.')
        setStep('form')
      }
    }

    async function init() {
      const savedToken = sessionStorage.getItem('silkcrest_reg_token')

      // Check for returning Google OAuth session before doing anything else
      if (savedToken) {
        const { data: { session } } = await supabase.auth.getSession()
        const isGoogleSession = session?.user?.app_metadata?.provider === 'google'

        // console.log('OAuth return check:', { savedToken, session: !!session, isGoogleSession })

        if (session && isGoogleSession) {
          setStep('submitting')
          await submitRegistration(session.access_token)
          return
        }
      }

      // Only reach here if this is a fresh visit (no saved token, or token exists but no Google session yet)
      const res = await fetch(`${apiUrl}/invites/${token}`)
      const data: InviteValidation = await res.json()
      setInviteData(data)
      setStep(data.valid ? 'form' : 'invalid')
    }

    init()
  }, [apiUrl, form, token])

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // --- Step 2: Owner fills in form, then triggers Google sign-in ---
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.display_name.trim()) {
      setError('Display name is required.')
      return
    }

    // Store form data in sessionStorage so it survives the OAuth redirect
    sessionStorage.setItem('silkcrest_reg_form', JSON.stringify(form))
    sessionStorage.setItem('silkcrest_reg_token', token ?? '')

    setStep('google')

    // Trigger Google OAuth — Supabase redirects to Google, then back to /register
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/register?token=${token}`,
      },
    })
  }

  // --- Render ---

  if (step === 'validating') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <p className="text-muted-foreground text-sm">Validating invite link…</p>
      </div>
    )
  }

  if (step === 'invalid') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h1 className="text-xl font-medium mb-3">Invalid invite link</h1>
        <p className="text-sm text-muted-foreground">
          {inviteData?.reason ?? 'This link is missing, expired, or has already been used.'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Ask your administrator for a new invite link.
        </p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h1 className="text-xl font-medium mb-3">Welcome to Silkcrest</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your owner account has been created successfully.
        </p>
        <button
          onClick={() => navigate('/portal')}
          className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Go to your portal
        </button>
      </div>
    )
  }

  if (step === 'submitting') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <p className="text-muted-foreground text-sm">Setting up your account…</p>
      </div>
    )
  }

  if (step === 'google') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <p className="text-muted-foreground text-sm">Redirecting to Google…</p>
      </div>
    )
  }

  // step === 'form'
  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-medium mb-1">オーナー登録</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Fill in your owner details, then sign in with Google to complete registration.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Display name <span className="text-destructive">*</span>
          </label>
          <input
            name="display_name"
            value={form.display_name}
            onChange={handleFormChange}
            placeholder="e.g. Sunrise Stables"
            required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Display name (Japanese)
            <span className="ml-1.5 text-xs text-muted-foreground">optional</span>
          </label>
          <input
            name="display_name_jp"
            value={form.display_name_jp}
            onChange={handleFormChange}
            placeholder="e.g. サンライズスタブル"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Silks color
            <span className="ml-1.5 text-xs text-muted-foreground">optional</span>
          </label>
          <input
            name="silks_color"
            value={form.silks_color}
            onChange={handleFormChange}
            placeholder="e.g. Red and white"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Silks pattern
            <span className="ml-1.5 text-xs text-muted-foreground">optional</span>
          </label>
          <input
            name="silks_pattern"
            value={form.silks_pattern}
            onChange={handleFormChange}
            placeholder="e.g. Chevron"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </form>
    </div>
  )
}