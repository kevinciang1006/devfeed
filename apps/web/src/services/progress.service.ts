// Progress service — user stats and streaks
import { fetchAPI } from '../lib/api'
import type { GetProgressResponse } from '@devfeed/shared'

export const getProgress = () =>
  fetchAPI<GetProgressResponse>('/api/progress')
