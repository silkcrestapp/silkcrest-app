import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../supabaseAdmin'

const router = Router()

// -------------------------------------------------------------
// POST /register
// Public — called after the user completes Google OAuth on the frontend.
// The frontend exchanges the Google OAuth code via Supabase, gets a session,
// then sends the session access_token here along with owner details and the invite token.
//
// Body: {
//   invite_token: string
//   access_token: string       ← Supabase session token from Google OAuth
//   display_name: string
//   display_name_jp?: string
//   silks_color?: string
//   silks_pattern?: string
// }
// -------------------------------------------------------------
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const {
    invite_token,
    access_token,
    display_name,
    display_name_jp,
    silks_color,
    silks_pattern,
  } = req.body

  // --- Validate required fields ---
  if (!invite_token || !access_token || !display_name) {
    res.status(400).json({ error: 'invite_token, access_token, and display_name are required' })
    return
  }

  // --- Validate invite token ---
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('owner_invites')
    .select('id, save_id, used_at, expires_at')
    .eq('id', invite_token)
    .single()

  if (inviteError ?? !invite) {
    res.status(400).json({ error: 'Invalid invite token' })
    return
  }

  if (invite.used_at) {
    res.status(400).json({ error: 'This invite has already been used' })
    return
  }

  if (new Date(invite.expires_at) < new Date()) {
    res.status(400).json({ error: 'This invite has expired' })
    return
  }

  // --- Verify the Google OAuth session and get the user ---
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(access_token)

  if (authError ?? !user) {
    res.status(401).json({ error: 'Invalid or expired access token' })
    return
  }

  const email = user.email

  if (!email) {
    res.status(400).json({ error: 'Google account has no email address' })
    return
  }

  // --- Check this Google account isn't already linked to an owner ---
  const { data: existingOwner } = await supabaseAdmin
    .from('owners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (existingOwner) {
    res.status(409).json({ error: 'This Google account is already registered as an owner' })
    return
  }

  // --- Create the owner row ---
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from('owners')
    .insert({
      display_name,
      display_name_jp: display_name_jp ?? null,
      silks_color: silks_color ?? null,
      silks_pattern: silks_pattern ?? null,
      auth_user_id: user.id,
      email,
    })
    .select('id')
    .single()

  if (ownerError ?? !owner) {
    console.error('Failed to create owner:', ownerError)
    res.status(500).json({ error: 'Failed to create owner record' })
    return
  }

  // --- Link owner to the save via save_owners ---
  const { error: saveOwnerError } = await supabaseAdmin
    .from('save_owners')
    .insert({
      save_id: invite.save_id,
      owner_id: owner.id,
    })

  if (saveOwnerError) {
    // Roll back the owner row to avoid orphaned records
    await supabaseAdmin.from('owners').delete().eq('id', owner.id)
    console.error('Failed to link owner to save:', saveOwnerError)
    res.status(500).json({ error: 'Failed to link owner to save file' })
    return
  }

  // --- Mark invite as used ---
  await supabaseAdmin
    .from('owner_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite_token)

  res.status(201).json({
    owner_id: owner.id,
    message: 'Registration successful',
  })
})

export default router