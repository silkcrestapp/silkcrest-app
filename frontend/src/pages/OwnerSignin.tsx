// src/pages/OwnerSignIn.tsx
import { supabase } from '../utils/supabaseClient'

export default function OwnerSignIn() {
  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/portal' },
    })
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">Owner Sign In</h1>
      <button onClick={signIn} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">
        Continue with Google
      </button>
    </div>
  )
}