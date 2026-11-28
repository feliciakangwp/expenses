import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { subMonths, startOfMonth, endOfMonth, format, parseISO, eachDayOfInterval } from 'date-fns'

const PM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a855f7']
import { useAppStore } from '@/store/app'
import { useCategorySpending } from '@/hooks/useStats'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { PeriodSelector, periodToRange } from '@/components/ui/PeriodSelector'

type RangeMonths = 1 | 3 | 6 | 12
const RANGES: { value: RangeMonths; label: string }[] = [
  { value: 1, label: '1M' },
  { value: 3, label: '3M' },
  { value: 6, label: '6M' },
  { value: 12, label: '12M' },
]

export function Insights() {
  const { transactions, privacyMode } = useAppStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [rangeMonths, setRangeMonths] = useState<RangeMonths>(1)

  const { start, end } = useMemo(() => {
    const endMonthDate = new Date(year, month - 1, 1)
    const endDate = endOfMonth(endMonthDate)
    const startDate = startOfMonth(subMonths(endMonthDate, rangeMonths - 1))
    return {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd'),
    }
  }, [year, month, rangeMonths])

  const periodLabel = useMemo(() => {
    if (rangeMonths === 1) return format(new Date(year, month - 1, 1), 'MMMM yyyy')
    const s = format(parseISO(start), 'MMM yyyy')
    const e = format(parseISO(end), 'MMM yyyy')
    return `${s} – ${e}`
  }, [rangeMonths, year, month, start, end])

  const catSpending = useCategorySpending(start, end)

  const expenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const date = t.transaction_date.split('T')[0]
      return date >= start && date <= end
    })
  }, [transactions, start, end])

  const totalSpend = expenses.reduce((s, t) => s + t.amount, 0)

  const incomeForPeriod = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.type !== 'income') return false
        const date = t.transaction_date.split('T')[0]
        return date >= start && date <= end
      })
      .reduce((s, t) => s + t.amount, 0)
  }, [transactions, start, end])

  const overspent = incomeForPeriod > 0 && totalSpend > incomeForPeriod
  const remaining = Math.max(0, incomeForPeriod - totalSpend)
  const overspentAmt = Math.max(0, totalSpend - incomeForPeriod)
  const spendPct = incomeForPeriod > 0 ? (totalSpend / incomeForPeriod) * 100 : 0

  const incomeExpenseData = useMemo(() => {
    if (incomeForPeriod === 0 && totalSpend === 0) return [{ name: 'No data', value: 1, color: '#e5e7eb' }]
    if (incomeForPeriod === 0) return [{ name: 'Expenses', value: totalSpend, color: '#ef4444' }]
    const expenseSlice = Math.min(totalSpend, incomeForPeriod)
    const remainingSlice = Math.max(0, incomeForPeriod - totalSpend)
    const result = []
    if (expenseSlice > 0) result.push({ name: 'Expenses', value: expenseSlice, color: overspent ? '#ef4444' : 'var(--color-primary-500)' })
    if (remainingSlice > 0) result.push({ name: 'Remaining', value: remainingSlice, color: '#10b981' })
    return result
  }, [incomeForPeriod, totalSpend, overspent])

  const fmt = (cents: number) => privacyMode ? '••••' : `$${(cents / 100).toFixed(2)}`

  const days = useMemo(() => {
    const s = parseISO(start)
    const e = parseISO(end)
    return eachDayOfInterval({ start: s, end: e }).length
  }, [start, end])
  const avgDaily = days > 0 ? totalSpend / days : 0

  // Trend: daily for 1M, monthly for 3M/6M/12M
  const trendData = useMemo(() => {
    if (rangeMonths === 1) {
      const map = new Map<string, number>()
      for (const t of expenses) {
        const date = t.transaction_date.split('T')[0]
        map.set(date, (map.get(date) ?? 0) + t.amount)
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([date, amount]) => ({
          label: format(parseISO(date), 'd MMM'),
          amount: amount / 100,
        }))
    }
    // Monthly aggregation
    const map = new Map<string, number>()
    for (const t of expenses) {
      const key = t.transaction_date.slice(0, 7) // 'yyyy-MM'
      map.set(key, (map.get(key) ?? 0) + t.amount)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, amount]) => ({
        label: format(parseISO(key + '-01'), 'MMM yy'),
        amount: amount / 100,
      }))
  }, [expenses, rangeMonths])

  const pieData = catSpending.slice(0, 8).map((cs) => ({
    name: cs.category.name,
    value: cs.amount / 100,
    color: cs.category.color,
  }))

  const pmSpending = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>()
    for (const t of expenses) {
      const key = t.payment_method_id ?? '__cash__'
      const name = t.payment_method?.name ?? 'Cash / Other'
      const cur = map.get(key)
      if (cur) cur.amount += t.amount
      else map.set(key, { name, amount: t.amount })
    }
    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .map((pm) => ({
        name: pm.name,
        amount: pm.amount / 100,
        pct: totalSpend > 0 ? (pm.amount / totalSpend) * 100 : 0,
      }))
  }, [expenses, totalSpend])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader title="Insights" subtitle={periodLabel} />

      {/* Range + Period selector */}
      <div className="px-5 mb-2 flex items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1">
          {RANGES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRangeMonths(value)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                rangeMonths === value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rangeMonths === 1 && (
        <PeriodSelector
          transactions={transactions}
          year={year}
          month={month}
          onChange={(y, m) => { setYear(y); setMonth(m) }}
        />
      )}

      <div className="px-5 flex flex-col gap-4 pb-8 md:grid md:grid-cols-2">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          {[
            { label: 'Total Spent', value: totalSpend },
            { label: 'Daily Average', value: avgDaily },
          ].map(({ label, value }) => (
            <Card key={label} className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
              <AmountDisplay cents={Math.round(value)} size="lg" />
            </Card>
          ))}
        </div>

        {/* Income vs Expenses */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Income vs Expenses</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={incomeExpenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={incomeExpenseData.length > 1 ? 2 : 0}
                    strokeWidth={0}
                  >
                    {incomeExpenseData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {incomeForPeriod === 0 && totalSpend === 0 ? (
                  <span className="text-xs text-gray-400">No data</span>
                ) : incomeForPeriod === 0 ? (
                  <>
                    <span className="text-xs text-gray-400 mb-0.5">Spent</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-50">{fmt(totalSpend)}</span>
                  </>
                ) : overspent ? (
                  <>
                    <span className="text-xs text-red-500 font-semibold">Over by</span>
                    <span className="text-sm font-bold text-red-500">{fmt(overspentAmt)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">{Math.round(spendPct)}%</span>
                    <span className="text-xs text-gray-400">spent</span>
                  </>
                )}
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500">Income</span>
                </div>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{fmt(incomeForPeriod)}</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: overspent ? '#ef4444' : 'var(--color-primary-500)' }} />
                  <span className="text-xs text-gray-500">Spent</span>
                </div>
                <span className={`text-xs font-semibold ${overspent ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{fmt(totalSpend)}</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className={`w-2 h-2 rounded-full ${overspent ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <span className="text-xs text-gray-500">{overspent ? 'Over' : 'Left'}</span>
                </div>
                <span className={`text-xs font-semibold ${overspent ? 'text-red-500' : 'text-emerald-600'}`}>
                  {overspent ? `-${fmt(overspentAmt)}` : fmt(remaining)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Spending by Category — Donut */}
        {pieData.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending by Category</h3>
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2">
                {pieData.slice(0, 6).map((d) => {
                  const cs = catSpending.find((x) => x.category.name === d.name)
                  return (
                    <div key={d.name} className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{d.name}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 ml-auto">
                        {cs ? `${cs.percentage.toFixed(0)}%` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Spending Trend */}
        {trendData.length > 1 && (
          <Card className="p-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {rangeMonths === 1 ? 'Daily Spending' : 'Monthly Spending'}
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  formatter={(value) => [privacyMode ? '••••' : `$${Number(value).toFixed(2)}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="var(--color-primary-600)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Spending by Payment Method */}
        {pmSpending.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending by Payment Method</h3>
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={pmSpending} cx="50%" cy="50%" innerRadius={50} outerRadius={72}
                    dataKey="amount" startAngle={90} endAngle={-270}
                    paddingAngle={pmSpending.length > 1 ? 2 : 0} strokeWidth={0}
                  >
                    {pmSpending.map((_, i) => <Cell key={i} fill={PM_COLORS[i % PM_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [privacyMode ? '••••' : `$${Number(value).toFixed(2)}`, 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2">
                {pmSpending.map((pm, i) => (
                  <div key={pm.name} className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PM_COLORS[i % PM_COLORS.length] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{pm.name}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 ml-auto">{pm.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Category Breakdown */}
        {catSpending.length > 0 && (
          <Card className="md:col-span-2">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Breakdown</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {catSpending.map((cs) => (
                <div key={cs.category.id} className="flex items-center gap-3 px-4 py-3">
                  <CategoryIcon icon={cs.category.icon} color={cs.category.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{cs.category.name}</span>
                      <AmountDisplay cents={cs.amount} size="md" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{ width: `${cs.percentage}%`, backgroundColor: cs.category.color }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{cs.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
