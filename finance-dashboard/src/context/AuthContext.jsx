import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

const STORAGE_KEY = 'finance_dashboard_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem(STORAGE_KEY))

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUser(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    api('/api/auth/me', { method: 'GET', token })
      .then((res) => {
        if (!cancelled) setUser(res.data?.user ?? null)
      })
      .catch(() => {
        if (!cancelled) logout()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, logout])

  const login = useCallback(async (email, password) => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      json: { email, password },
    })
    const t = res.data?.token
    if (!t) throw new Error('No token returned')
    localStorage.setItem(STORAGE_KEY, t)
    setToken(t)
    setUser(res.data?.user ?? null)
    return res
  }, [])

  const register = useCallback(async (payload) => {
    const res = await api('/api/auth/register', {
      method: 'POST',
      json: payload,
    })
    const t = res.data?.token
    if (t) {
      localStorage.setItem(STORAGE_KEY, t)
      setToken(t)
      setUser(res.data?.user ?? null)
    }
    return res
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      register,
      isAdmin: user?.role === 'admin',
      isAnalyst: user?.role === 'analyst' || user?.role === 'admin',
      canCreateRecord: user?.role === 'analyst' || user?.role === 'admin',
      canEditRecord: user?.role === 'admin',
      canViewAnalytics: user?.role === 'analyst' || user?.role === 'admin',
    }),
    [token, user, loading, login, logout, register]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
