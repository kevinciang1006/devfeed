import { createClient } from '@supabase/supabase-js'
import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../types'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

import type { SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-key'
    )
  }
  return _supabase
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await getSupabase().auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const [dbUser] = await db.select().from(users).where(eq(users.supabaseId, user.id)).limit(1)

    if (dbUser) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl,
        supabaseId: dbUser.supabaseId,
      }
    } else {
      req.user = {
        id: '',
        email: user.email ?? null,
        name: user.user_metadata?.full_name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        supabaseId: user.id,
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await getSupabase().auth.getUser(token)

    if (!error && user) {
      const [dbUser] = await db.select().from(users).where(eq(users.supabaseId, user.id)).limit(1)
      if (dbUser) {
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          avatarUrl: dbUser.avatarUrl,
          supabaseId: dbUser.supabaseId,
        }
      }
    }

    next()
  } catch {
    next()
  }
}
