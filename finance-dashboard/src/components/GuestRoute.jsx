import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function GuestRoute({ children }) {
  const { token, user, loading } = useAuth()

  if (loading && token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (token && user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
