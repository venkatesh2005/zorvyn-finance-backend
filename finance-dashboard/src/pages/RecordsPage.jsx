import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, TYPES } from '../constants/recordMeta'
import { formatDate, formatMoney, idOf } from '../utils/format'

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

const emptyForm = {
  amount: '',
  type: 'expense',
  category: 'food',
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

export function RecordsPage() {
  const { token, canCreateRecord, canEditRecord } = useAuth()
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 })
  const [filters, setFilters] = useState({ type: '', category: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const page = pagination.page

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (filters.type) params.set('type', filters.type)
    if (filters.category) params.set('category', filters.category)
    try {
      const res = await api(`/api/records?${params}`, { method: 'GET', token })
      setRecords(res.data?.records ?? [])
      setPagination((p) => ({ ...p, ...res.data?.pagination }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, page, filters.type, filters.category])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setForm(emptyForm)
    setModal('create')
  }

  function openEdit(r) {
    const d = r.date ? new Date(r.date).toISOString().slice(0, 10) : emptyForm.date
    setForm({
      amount: String(r.amount),
      type: r.type,
      category: r.category,
      date: d,
      description: r.description || '',
    })
    setModal({ type: 'edit', id: idOf(r) })
  }

  async function submitCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/records', {
        method: 'POST',
        token,
        json: {
          amount: Number(form.amount),
          type: form.type,
          category: form.category,
          date: form.date ? new Date(form.date).toISOString() : undefined,
          description: form.description || undefined,
        },
      })
      setModal(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function submitEdit(e) {
    e.preventDefault()
    if (modal?.type !== 'edit') return
    setSaving(true)
    try {
      await api(`/api/records/${modal.id}`, {
        method: 'PUT',
        token,
        json: {
          amount: Number(form.amount),
          type: form.type,
          category: form.category,
          date: form.date ? new Date(form.date).toISOString() : undefined,
          description: form.description || undefined,
        },
      })
      setModal(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete(id) {
    if (!window.confirm('Delete this record?')) return
    try {
      await api(`/api/records/${id}`, { method: 'DELETE', token })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Records</h1>
          <p className="mt-1 text-slate-600">Financial transactions you can access.</p>
        </div>
        {canCreateRecord && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New record
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <Filter className="hidden h-5 w-5 text-slate-400 sm:block" />
        <div>
          <label className="block text-xs font-medium text-slate-500">Type</label>
          <select
            value={filters.type}
            onChange={(e) => {
              setFilters((f) => ({ ...f, type: e.target.value }))
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Category</label>
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters((f) => ({ ...f, category: e.target.value }))
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-slate-700">By</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No records match your filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={idOf(r)} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 capitalize text-slate-800">{r.type}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">{r.category}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatMoney(r.amount)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.createdBy?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {canEditRecord && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(idOf(r))}
                              className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages || 1} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {modal === 'create' && (
        <Modal title="New record" onClose={() => setModal(null)}>
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Amount</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit record" onClose={() => setModal(null)}>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Amount</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
