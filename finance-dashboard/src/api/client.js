const rawBase = import.meta.env.VITE_API_URL ?? ''
const BASE = rawBase.replace(/\/$/, '')

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (!BASE) return p
  return `${BASE}${p}`
}

/**
 * @param {string} path - e.g. /api/auth/login
 * @param {RequestInit & { token?: string | null, json?: unknown }} options
 */
export async function api(path, options = {}) {
  const { token, json: body, headers: h, ...rest } = options
  const headers = new Headers(h)
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(apiUrl(path), {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : rest.body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.message
    if (typeof msg === 'string') throw new Error(msg)
    if (Array.isArray(data.errors)) {
      const first = data.errors[0]
      throw new Error(first?.message || JSON.stringify(data.errors))
    }
    throw new Error(typeof data.error === 'string' ? data.error : res.statusText || 'Request failed')
  }
  return data
}
