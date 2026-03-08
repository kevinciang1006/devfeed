import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

export async function fetchAPI<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token: explicitToken, ...fetchOptions } = options
  const accessToken =
    explicitToken ?? (await supabase.auth.getSession()).data.session?.access_token

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...fetchOptions.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  const json = await res.json()
  // API wraps all responses in { data: ... } — unwrap for consumers
  return json.data !== undefined ? json.data : json
}
