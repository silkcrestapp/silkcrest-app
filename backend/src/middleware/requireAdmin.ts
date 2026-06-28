import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../supabaseAdmin'

// Expects the frontend to send the user's JWT in the Authorization header:
// Authorization: Bearer <supabase-session-access-token>
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }

  const token = authHeader.slice(7)

  // Verify the JWT and get the user
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error ?? !user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  // Check the user is in admin_profiles
  const { data: adminProfile } = await supabaseAdmin
    .from('admin_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!adminProfile) {
    res.status(403).json({ error: 'Forbidden — admin access required' })
    return
  }

  // Attach user to request for use in route handlers
  res.locals.user = user
  next()
}