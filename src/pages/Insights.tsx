import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useAppStore } from '@/store/app'
import { useCategorySpending } from '@/hooks/useStats'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { getMonthRange, formatDate } from '@/lib/utils'
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

type Period = 'week' | 'month' | '3months' | 'year'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Months' },
  { value: 'year', label: 'Year' },
]

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date()
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    return {
      start: format(d, 'yyyy-MM-dd'),
      end: format(now, 'yyyy-MM-dd'),
    }
  }
  if (period === 'month') return getMonthRange()
  if (period === '3months') {
    const d = subMonths(now, 2)
    return {
      start: format(startOfMonth(d), 'yyyy-MM-dd'),
      end: format(endOfMonth(now), 'yyyy-MM-dd'),
    }
  }
  return {
    start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
    end: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'),
  }
}

export function Insights() {
  const { transactions, privacyMode } = useAppStore()
  const [period, setPeriod] = useState<Period>('month')

  const { start, end } = getPeriodRange(period)
  const catSpending = useCategorySpending(start, end)

  const expenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const date = t.transaction_date.split('T')[0]
      return date >= start && date <= end
    })
  }, [transactions, start, end])

  const totalSpend = expenses.reduce((s, t) => s + t.amount, 0)
  const days = useMemo(() => {
    const s = parseISO(start)
    const e = parseISO(end)
    return eachDayOfInterval({ start: s, end: e }).length
  }, [start, end])
  const avgDaily = days > 0 ? totalSpend / days : 0

  // Daily trend data
  const dailyData = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of expenses) {
      const date = t.transaction_date.split('T')[0]
      map.set(date, (map.get(date) ?? 0) + t.amount)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, amount]) => ({
        date: format(parseISO(date), 'd MMM'),
        amount: amount / 100,
      }))
  }, [expenses])

  const pieData = catSpending.slice(0, 8).map((cs) => ({
    name: cs.category.name,
    value: cs.amount / 100,
    color: cs.category.color,
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <PageHeader title="Insights" />

      {/* Period Selector */}
      <div className="px-5 mb-4 flex gap-2">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              period === value
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
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

        {/* Spending by Category — Donut */}
        {pieData.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Spending by Category
            </h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 flex flex-col gap-1.5">
                {pieData.slice(0, 5).map((d) => {
                  const cs = catSpending.find((x) => x.category.name === d.name)
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {cs ? `${cs.percentage.toFixed(0)}%` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Daily Trend */}
        {dailyData.length > 1 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Daily Spending
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => [privacyMode ? '••••' : `$${Number(value).toFixed(2)}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Category Breakdown */}
        {catSpending.length > 0 && (
          <Card>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Breakdown</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {catSpending.map((cs) => (
                <div key={cs.category.id} className="flex items-center gap-3 px-4 py-3">
                  <CategoryIcon icon={cs.category.icon} color={cs.category.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {cs.category.name}
                      </span>
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
