import { useCallback, useEffect, useState } from 'react'
import { Pencil, UserX } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../constants/recordMeta'
import { idOf } from '../utils/format'

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function UsersPage() {
  const { token, user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalUser, setModalUser] = useState(null)
  const [editRole, setEditRole] = useState('viewer')
  const [editStatus, setEditStatus] = useState('active')
  const [saving, setSaving] = useState(false)

  const page = pagination.page

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await api(`/api/users?${params}`, { method: 'GET', token })
      setUsers(res.data?.users ?? [])
      setPagination((p) => ({ ...p, ...res.data?.pagination }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, page, roleFilter, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  function openEdit(u) {
    setModalUser(u)
    setEditRole(u.role)
    setEditStatus(u.status)
  }

  async function submitEdit(e) {
    e.preventDefault()
    if (!modalUser) return
    const uid = idOf(modalUser)
    setSaving(true)
    try {
      await api(`/api/users/${uid}`, {
        method: 'PATCH',
        token,
        json: { role: editRole, status: editStatus },
      })
      setModalUser(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function softDelete(u) {
    const uid = idOf(u)
    if (uid === idOf(me)) {
      setError('You cannot delete your own account.')
      return
    }
    if (!window.confirm(`Soft-delete ${u.name}? They will be hidden from default queries.`)) return
    try {
      await api(`/api/users/${uid}`, { method: 'DELETE', token })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users</h1>
        <p className="mt-1 text-slate-600">Admin-only directory and access control.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-slate-500">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const uid = idOf(u)
                  const isSelf = uid === idOf(me)
                  return (
                    <tr key={uid} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3 capitalize text-slate-800">{u.role}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{u.status}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => softDelete(u)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                            aria-label="Deactivate"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages || 1} · {pagination.total} users
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modalUser && (
        <Modal title={`Edit ${modalUser.name}`} onClose={() => setModalUser(null)}>
          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {idOf(modalUser) === idOf(me) && (
                <p className="mt-1 text-xs text-amber-700">You cannot demote yourself from admin.</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalUser(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (idOf(modalUser) === idOf(me) && editRole !== 'admin')}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
