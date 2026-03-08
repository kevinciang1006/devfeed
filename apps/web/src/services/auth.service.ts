// Auth service — user sync and profile
import { fetchAPI } from '../lib/api'
import type { User, GetMeResponse } from '@devfeed/shared'

export const syncUser = (token?: string) =>
  fetchAPI<User>('/api/auth/sync', { method: 'POST', token })

export const getMe = () =>
  fetchAPI<GetMeResponse['user']>('/api/auth/me')
