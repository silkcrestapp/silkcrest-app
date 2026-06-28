import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../supabaseAdmin'
import { requireAdmin } from '../middleware/requireAdmin'

const router = Router()

// -------------------------------------------------------------
// POST /invites
// Admin only — generates a one-time invite link for a save.
// Body: { save_id: string }
// Returns: { invite_url: string, token: string, expires_at: string }
// -------------------------------------------------------------
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { save_id } = req.body

  if (!save_id) {
    res.status(400).json({ error: 'save_id is required' })
    return
  }

  // Verify the save exists
  const { data: save, error: saveError } = await supabaseAdmin
    .from('save_files')
    .select('id')
    .eq('id', save_id)
    .single()

  if (saveError ?? !save) {
    res.status(404).json({ error: 'Save file not found' })
    return
  }

  const adminUser = res.locals.user

  // Insert invite row — id is auto-generated UUID which becomes the token
  const { data: invite, error } = await supabaseAdmin
    .from('owner_invites')
    .insert({
      save_id,
      created_by: adminUser.id,
      // expires_at defaults to now() + 7 days via DB default
    })
    .select('id, expires_at')
    .single()

  if (error ?? !invite) {
    res.status(500).json({ error: 'Failed to create invite' })
    return
  }

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  const invite_url = `${frontendUrl}/register?token=${invite.id}`

  res.status(201).json({
    invite_url,
    token: invite.id,
    expires_at: invite.expires_at,
  })
})

// -------------------------------------------------------------
// GET /invites/:token
// Public — validates a token before showing the registration form.
// Returns: { valid: true, save_id: string } or { valid: false, reason: string }
// -------------------------------------------------------------
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params

  const { data: invite, error } = await supabaseAdmin
    .from('owner_invites')
    .select('id, save_id, used_at, expires_at')
    .eq('id', token)
    .single()

  if (error ?? !invite) {
    res.status(200).json({ valid: false, reason: 'Invite not found' })
    return
  }

  if (invite.used_at) {
    res.status(200).json({ valid: false, reason: 'This invite has already been used' })
    return
  }

  if (new Date(invite.expires_at) < new Date()) {
    res.status(200).json({ valid: false, reason: 'This invite has expired' })
    return
  }

  res.status(200).json({ valid: true, save_id: invite.save_id })
})

export default router