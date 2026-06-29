import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useSave } from '../context/useSave'

interface GeneratedInvite {
  invite_url: string
  expires_at: string
}

export default function InvitePage() {
  const { activeSaveId, activeSaveName } = useSave()
  const [loading, setLoading] = useState(false)
  const [invite, setInvite] = useState<GeneratedInvite | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateInvite() {
    if (!activeSaveId) return

    setLoading(true)
    setError(null)
    setInvite(null)
    setCopied(false)

    // Get the current admin's session token to authenticate the API call
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setError('You must be logged in as admin.')
      setLoading(false)
      return
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ save_id: activeSaveId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to generate invite')
        return
      }

      setInvite(data)
    } catch {
      setError('Could not reach the API. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    if (!invite) return
    await navigator.clipboard.writeText(invite.invite_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiresFormatted = invite
    ? new Date(invite.expires_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <h1 className="text-2xl font-medium mb-1">オーナー招待</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Generate a one-time registration link for a new owner.
        The link expires in 7 days and can only be used once.
      </p>

      <div className="rounded-lg border bg-card p-5 mb-6">
        <p className="text-sm text-muted-foreground mb-1">Active save</p>
        <p className="font-medium">{activeSaveName ?? '—'}</p>
      </div>

      <button
        onClick={generateInvite}
        disabled={loading || !activeSaveId}
        className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? 'Generating…' : 'Generate invite link'}
      </button>

      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      {invite && (
        <div className="mt-6 rounded-lg border bg-card p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Registration link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted rounded px-3 py-2 break-all">
                {invite.invite_url}
              </code>
              <button
                onClick={copyToClipboard}
                className="shrink-0 rounded-md border px-3 py-2 text-xs hover:bg-muted transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Expires: {expiresFormatted}
          </p>
          <p className="text-xs text-muted-foreground border-t pt-3">
            Send this link to the owner. They will sign in with Google
            and complete their profile to join <strong>{activeSaveName}</strong>.
          </p>
        </div>
      )}
    </div>
  )
}