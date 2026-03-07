import type { Request } from 'express'

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
  supabaseId: string
}

export interface AuthRequest extends Request {
  user?: AuthUser
}
