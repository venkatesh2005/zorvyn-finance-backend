import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatMoney, idOf } from '../utils/format'
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatCard({ title, value, sub, icon: Icon, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    slate: 'bg-slate-50 text-slate-700 ring-slate-100',
  }
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ring-1 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { token, canViewAnalytics } = useAuth()
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState(null)
  const [categoryStats, setCategoryStats] = useState(null)
  const [expenseType, setExpenseType] = useState('expense')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setLoading(true)
      try {
        const sumRes = await api('/api/dashboard/summary', { method: 'GET', token })
        if (cancelled) return
        setSummary(sumRes.data)

        if (canViewAnalytics) {
          const tr = await api('/api/dashboard/trends?months=6', { method: 'GET', token })
          if (cancelled) return
          setTrends(tr.data)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token, canViewAnalytics])

  useEffect(() => {
    if (!canViewAnalytics || !token) return
    let cancelled = false
    api(`/api/dashboard/category-stats?type=${expenseType}`, { method: 'GET', token })
      .then((res) => {
        if (!cancelled) setCategoryStats(res.data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [expenseType, token, canViewAnalytics])

  const overview = summary?.overview
  const chartData =
    trends?.trends?.map((t) => ({
      label: `${MONTHS[(t.month || 1) - 1]} ${t.year}`,
      income: Number(t.income?.total ?? t.income ?? 0),
      expense: Number(t.expense?.total ?? t.expense ?? 0),
    })) ?? []

  const categoryChartData =
    categoryStats?.stats?.slice(0, 8).map((s) => ({
      name: s._id,
      total: s.total,
    })) ?? []

  if (loading && !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{error}</div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Overview of income, expenses, and recent activity.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total income"
          value={formatMoney(overview?.totalIncome)}
          sub={`${overview?.incomeCount ?? 0} transactions`}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          title="Total expenses"
          value={formatMoney(overview?.totalExpense)}
          sub={`${overview?.expenseCount ?? 0} transactions`}
          icon={TrendingDown}
          tone="rose"
        />
        <StatCard
          title="Net balance"
          value={formatMoney(overview?.netBalance)}
          sub="Income − expenses"
          icon={Wallet}
          tone="indigo"
        />
        <StatCard
          title="Recent items"
          value={String(summary?.recentActivity?.length ?? 0)}
          sub="Latest in feed"
          icon={Activity}
          tone="slate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Category mix</h2>
          <p className="text-sm text-slate-500">Totals by type from the API</p>
          <ul className="mt-4 space-y-3">
            {(summary?.categoryBreakdown ?? []).map((block) => (
              <li key={block._id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{block._id}</p>
                <div className="mt-2 space-y-2">
                  {(block.categories ?? []).map((c) => (
                    <div
                      key={c.category}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="capitalize text-slate-700">{c.category}</span>
                      <span className="font-medium text-slate-900">{formatMoney(c.total)}</span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
            {!(summary?.categoryBreakdown ?? []).length && (
              <li className="text-sm text-slate-500">No category data yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.recentActivity ?? []).map((r) => (
                  <tr key={idOf(r)} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 text-slate-600">{formatDate(r.date)}</td>
                    <td className="py-2.5 capitalize text-slate-800">{r.type}</td>
                    <td className="py-2.5 font-medium text-slate-900">{formatMoney(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(summary?.recentActivity ?? []).length && (
              <p className="py-6 text-center text-sm text-slate-500">No recent records.</p>
            )}
          </div>
        </div>
      </div>

      {!canViewAnalytics && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-6 text-center">
          <p className="font-medium text-slate-800">Analytics locked</p>
          <p className="mt-1 text-sm text-slate-600">
            Trends and category analytics require an analyst or admin role.
          </p>
        </div>
      )}

      {canViewAnalytics && (
        <>
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Monthly trends</h2>
            <p className="text-sm text-slate-500">Income vs expense by month</p>
            <div className="mt-4 h-80 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      formatter={(value) => formatMoney(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No trend data in range.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Category statistics</h2>
                <p className="text-sm text-slate-500">Top categories by total amount</p>
              </div>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="mt-4 h-80 w-full">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={categoryChartData}
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => (v?.length > 12 ? `${v.slice(0, 12)}…` : v)}
                    />
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Bar dataKey="total" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No stats for this filter.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
