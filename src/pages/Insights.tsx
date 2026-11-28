import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { subMonths, startOfMonth, endOfMonth, format, parseISO, eachDayOfInterval } from 'date-fns'
import { ChevronRight, X, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

const PM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a855f7']
import { useAppStore } from '@/store/app'
import { useCategorySpending } from '@/hooks/useStats'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { PeriodSelector, periodToRange } from '@/components/ui/PeriodSelector'
import { cn } from '@/lib/utils'

type RangeMonths = 1 | 3 | 6 | 12
const RANGES: { value: RangeMonths; label: string }[] = [
  { value: 1, label: '1M' },
  { value: 3, label: '3M' },
  { value: 6, label: '6M' },
  { value: 12, label: '12M' },
]

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly',
  quarterly: 'Quarterly', annual: 'Annual',
}

const toMonthly = (amount: number, freq: string): number => {
  if (freq === 'weekly') return (amount * 52) / 12
  if (freq === 'biweekly') return (amount * 26) / 12
  if (freq === 'monthly') return amount
  if (freq === 'quarterly') return amount / 3
  if (freq === 'annual') return amount / 12
  return amount
}

export function Insights() {
  const { transactions, categories, recurringExpenses, privacyMode } = useAppStore()
  const now = new Date()
  const [activeTab, setActiveTab] = useState<'expenses' | 'savings'>('expenses')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [rangeMonths, setRangeMonths] = useState<RangeMonths>(1)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

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
  const fmtK = (cents: number) => privacyMode ? '••••' : `$${(cents / 100).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const days = useMemo(() => {
    const s = parseISO(start)
    const e = parseISO(end)
    return eachDayOfInterval({ start: s, end: e }).length
  }, [start, end])
  const avgDaily = days > 0 ? totalSpend / days : 0

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
    const map = new Map<string, number>()
    for (const t of expenses) {
      const key = t.transaction_date.slice(0, 7)
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

  const selectedCategory = useMemo(
    () => catSpending.find((cs) => cs.category.id === selectedCategoryId) ?? null,
    [catSpending, selectedCategoryId]
  )

  const categoryTransactions = useMemo(() => {
    if (!selectedCategoryId) return []
    return expenses
      .filter((t) => t.category_id === selectedCategoryId)
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
  }, [expenses, selectedCategoryId])

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

  const recurringData = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const active = recurringExpenses.filter(
      (r) => r.is_active && (!r.end_date || r.end_date >= today)
    )
    const totalMonthly = active.reduce((s, r) => s + toMonthly(r.amount, r.frequency), 0)

    const catMap = new Map<string, { name: string; color: string; monthly: number; count: number }>()
    for (const r of active) {
      const cat = categories.find((c) => c.id === r.category_id) ?? r.category
      const key = r.category_id
      const monthly = toMonthly(r.amount, r.frequency)
      const existing = catMap.get(key)
      if (existing) { existing.monthly += monthly; existing.count++ }
      else catMap.set(key, { name: cat?.name ?? 'Other', color: cat?.color ?? '#6366f1', monthly, count: 1 })
    }

    const byCategory = Array.from(catMap.values())
      .sort((a, b) => b.monthly - a.monthly)
      .map((c) => ({ ...c, pct: totalMonthly > 0 ? (c.monthly / totalMonthly) * 100 : 0 }))

    const activeWithCat = active.map((r) => ({
      ...r,
      resolvedCategory: categories.find((c) => c.id === r.category_id) ?? r.category,
    })).sort((a, b) => toMonthly(b.amount, b.frequency) - toMonthly(a.amount, a.frequency))

    return { active, totalMonthly, byCategory, activeWithCat }
  }, [recurringExpenses, categories])

  // ── Savings tab data ─────────────────────────────────────────────────────

  // Last 13 months (12 past complete + current)
  const savingsHistory = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 13 }, (_, i) => {
      const monthDate = subMonths(startOfMonth(today), 12 - i)
      const monthKey = format(monthDate, 'yyyy-MM')
      const isCurrentMonth = i === 12

      const monthIncome = transactions
        .filter((t) => t.type === 'income' && t.transaction_date.slice(0, 7) === monthKey)
        .reduce((s, t) => s + t.amount, 0)
      const monthExpenses = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date.slice(0, 7) === monthKey)
        .reduce((s, t) => s + t.amount, 0)
      const actual = monthIncome - monthExpenses
      const hasData = monthIncome > 0 || monthExpenses > 0

      return { monthKey, label: format(monthDate, 'MMM yyyy'), actual, income: monthIncome, expenses: monthExpenses, hasData, isCurrentMonth }
    })
  }, [transactions])

  // Average monthly savings from last 6 complete months that have data
  const avgMonthlySavings = useMemo(() => {
    const pastWithData = savingsHistory.filter((m) => !m.isCurrentMonth && m.hasData).slice(-6)
    if (pastWithData.length === 0) return null
    return pastWithData.reduce((s, m) => s + m.actual, 0) / pastWithData.length
  }, [savingsHistory])

  const totalSavedToDate = useMemo(() => {
    return savingsHistory.filter((m) => !m.isCurrentMonth && m.hasData).reduce((s, m) => s + m.actual, 0)
  }, [savingsHistory])

  // 5-year cumulative projection
  const fiveYearProjection = useMemo(() => {
    if (avgMonthlySavings === null) return []
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1

    let cumulative = 0
    return Array.from({ length: 5 }, (_, y) => {
      const yr = currentYear + y
      let annual: number
      if (y === 0) {
        const pastThisYear = savingsHistory.filter((m) => !m.isCurrentMonth && m.monthKey.startsWith(`${yr}`))
        const actualThisYear = pastThisYear.reduce((s, m) => s + m.actual, 0)
        const remainingMonths = 12 - currentMonth + 1 // current + future months this year
        annual = actualThisYear + remainingMonths * avgMonthlySavings
      } else {
        annual = avgMonthlySavings * 12
      }
      cumulative += annual
      return { year: `${yr}`, annual: annual / 100, cumulative: cumulative / 100 }
    })
  }, [savingsHistory, avgMonthlySavings])

  const currentMonthData = savingsHistory[savingsHistory.length - 1]

  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader title="Insights" subtitle={activeTab === 'expenses' ? periodLabel : 'Savings overview'} />

      {/* Tab toggle */}
      <div className="px-5 mb-3">
        <div className="flex rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setActiveTab('expenses')}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
              activeTab === 'expenses'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
              activeTab === 'savings'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            Savings
          </button>
        </div>
      </div>

      {/* ── EXPENSES TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <>
          <div className="px-5 mb-2 flex items-center gap-3">
            <div className="flex gap-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1">
              {RANGES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRangeMonths(value)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                    rangeMonths === value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
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

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Income vs Expenses</h3>
              <div className="flex flex-col items-center gap-4">
                <div className="relative" style={{ width: 160, height: 160 }}>
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={incomeExpenseData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={72}
                        dataKey="value"
                        startAngle={90} endAngle={-270}
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
                    <span className={cn('text-xs font-semibold', overspent ? 'text-red-500' : 'text-gray-800 dark:text-gray-200')}>{fmt(totalSpend)}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className={cn('w-2 h-2 rounded-full', overspent ? 'bg-red-500' : 'bg-emerald-500')} />
                      <span className="text-xs text-gray-500">{overspent ? 'Over' : 'Left'}</span>
                    </div>
                    <span className={cn('text-xs font-semibold', overspent ? 'text-red-500' : 'text-emerald-600')}>
                      {overspent ? `-${fmt(overspentAmt)}` : fmt(remaining)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

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

            {recurringData.active.length > 0 && (
              <Card className="p-4 md:col-span-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <RefreshCw size={14} className="text-primary-500" />
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recurring Payments</h3>
                    </div>
                    <p className="text-xs text-gray-400">{recurringData.active.length} active schedule{recurringData.active.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <AmountDisplay cents={Math.round(recurringData.totalMonthly)} size="lg" />
                    <p className="text-xs text-gray-400 mt-0.5">estimated / month</p>
                  </div>
                </div>

                {recurringData.byCategory.length > 0 && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie
                            data={recurringData.byCategory.map((c) => ({ name: c.name, value: c.monthly / 100, color: c.color }))}
                            cx="50%" cy="50%" innerRadius={44} outerRadius={66}
                            dataKey="value" paddingAngle={recurringData.byCategory.length > 1 ? 2 : 0} strokeWidth={0}
                          >
                            {recurringData.byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                          </Pie>
                          <Tooltip
                            formatter={(v) => [privacyMode ? '••••' : `$${Number(v).toFixed(2)}/mo`, 'Monthly']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      {recurringData.byCategory.map((c) => (
                        <div key={c.name} className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{c.name}</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                            {fmt(Math.round(c.monthly))}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0 w-7 text-right">{c.pct.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {recurringData.activeWithCat.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                      {r.resolvedCategory && (
                        <CategoryIcon icon={r.resolvedCategory.icon} color={r.resolvedCategory.color} size="sm" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{FREQ_LABEL[r.frequency] ?? r.frequency}</span>
                          {r.end_date && (
                            <>
                              <span className="text-gray-200 dark:text-gray-700">·</span>
                              <span className="text-xs text-gray-400">ends {r.end_date}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <AmountDisplay cents={r.amount} size="md" />
                        {r.frequency !== 'monthly' && (
                          <p className="text-xs text-gray-400 mt-0.5">{fmt(Math.round(toMonthly(r.amount, r.frequency)))}/mo</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {catSpending.length > 0 && (
              <Card className="md:col-span-2">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Spending by Category</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Tap a category to see its transactions</p>
                </div>

                <div className="flex justify-center pt-5 pb-2">
                  <div className="relative" style={{ width: 160, height: 160 }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={pieData} cx="50%" cy="50%"
                          innerRadius={50} outerRadius={72}
                          dataKey="value" paddingAngle={pieData.length > 1 ? 2 : 0} strokeWidth={0}
                        >
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v) => [privacyMode ? '••••' : `$${Number(v).toFixed(2)}`, 'Spent']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-gray-400">Total</span>
                      <AmountDisplay cents={totalSpend} size="md" />
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {catSpending.map((cs) => (
                    <button
                      key={cs.category.id}
                      onClick={() => setSelectedCategoryId(selectedCategoryId === cs.category.id ? null : cs.category.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-left"
                    >
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
                          <span className="text-xs text-gray-400 w-7 text-right">{cs.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={cn('text-gray-300 dark:text-gray-600 flex-shrink-0 transition-transform', selectedCategoryId === cs.category.id && 'rotate-90')}
                      />
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {selectedCategory && categoryTransactions.length > 0 && (
              <Card className="md:col-span-2">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  <CategoryIcon icon={selectedCategory.category.icon} color={selectedCategory.category.color} size="sm" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{selectedCategory.category.name}</h3>
                    <p className="text-xs text-gray-400">{categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}</p>
                  </div>
                  <AmountDisplay cents={selectedCategory.amount} size="md" />
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {categoryTransactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                            {t.description || t.merchant || selectedCategory.category.name}
                          </span>
                          <AmountDisplay cents={t.amount} size="md" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{format(parseISO(t.transaction_date.split('T')[0]), 'd MMM yyyy')}</span>
                          {t.payment_method?.name && (
                            <span className="text-xs text-gray-400">· {t.payment_method.name}</span>
                          )}
                          {t.subcategory?.name && (
                            <span className="text-xs text-gray-400">· {t.subcategory.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* ── SAVINGS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'savings' && (
        <div className="px-5 flex flex-col gap-4 pb-8 md:grid md:grid-cols-2">

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <Card className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg monthly savings</p>
              {avgMonthlySavings !== null ? (
                <>
                  <div className={cn('text-xl font-bold', avgMonthlySavings >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {privacyMode ? '••••' : `${avgMonthlySavings >= 0 ? '+' : '-'}$${Math.abs(avgMonthlySavings / 100).toFixed(0)}`}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">last 6 months avg</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-1">No data yet</p>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This month so far</p>
              {currentMonthData.hasData ? (
                <div className={cn('text-xl font-bold', currentMonthData.actual >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {privacyMode ? '••••' : `${currentMonthData.actual >= 0 ? '+' : '-'}$${Math.abs(currentMonthData.actual / 100).toFixed(0)}`}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-1">No data</p>
              )}
            </Card>
          </div>

          {/* Monthly savings table */}
          <Card className="md:col-span-2 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Monthly Savings</h3>
              <p className="text-xs text-gray-400 mt-0.5">Actual = income − expenses · Projected = 6-month average</p>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Month</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 text-right">Projected</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 text-right">Actual</span>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {/* Newest first — current month first, then past 12 */}
              {[...savingsHistory].reverse().map((m) => {
                const proj = avgMonthlySavings
                const isPositive = m.actual >= 0
                const projPositive = proj !== null && proj >= 0
                const beat = proj !== null && m.hasData && !m.isCurrentMonth && m.actual > proj

                return (
                  <div key={m.monthKey} className={cn('grid grid-cols-3 items-center px-4 py-3', m.isCurrentMonth && 'bg-primary-50/40 dark:bg-primary-900/10')}>
                    <div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{m.label}</span>
                      {m.isCurrentMonth && (
                        <span className="ml-1.5 text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded-full">Now</span>
                      )}
                    </div>

                    <div className="text-right">
                      {proj !== null ? (
                        <span className={cn('text-sm font-medium', projPositive ? 'text-emerald-600' : 'text-red-500')}>
                          {privacyMode ? '••••' : `${projPositive ? '+' : ''}$${(proj / 100).toFixed(0)}`}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    <div className="text-right flex items-center justify-end gap-1.5">
                      {m.hasData ? (
                        <>
                          <span className={cn('text-sm font-medium', isPositive ? 'text-emerald-600' : 'text-red-500')}>
                            {privacyMode ? '••••' : `${isPositive ? '+' : ''}$${(m.actual / 100).toFixed(0)}`}
                          </span>
                          {!m.isCurrentMonth && proj !== null && (
                            beat
                              ? <TrendingUp size={12} className="text-emerald-500 flex-shrink-0" />
                              : <TrendingDown size={12} className="text-red-400 flex-shrink-0" />
                          )}
                          {m.isCurrentMonth && (
                            <span className="text-[10px] text-gray-400">so far</span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 5-year projection */}
          {fiveYearProjection.length > 0 && (
            <Card className="p-4 md:col-span-2">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">5-Year Savings Projection</h3>
                <p className="text-xs text-gray-400 mt-0.5">Based on your avg monthly savings of {avgMonthlySavings !== null ? (privacyMode ? '••••/mo' : `$${(avgMonthlySavings / 100).toFixed(0)}/mo`) : '—'}</p>
              </div>

              {/* Cumulative total at year 5 */}
              <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Total in 5 years</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">at current savings rate</p>
                </div>
                <span className={cn('text-xl font-bold', (fiveYearProjection.at(-1)?.cumulative ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                  {privacyMode ? '••••' : fmtK(Math.round((fiveYearProjection.at(-1)?.cumulative ?? 0) * 100))}
                </span>
              </div>

              {/* Year-by-year bars */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fiveYearProjection} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]?.payload
                      if (!d) return null
                      return (
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-lg border border-gray-100 dark:border-gray-800">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>
                          <p className="text-xs text-gray-500">Annual savings: <span className="font-medium text-gray-700 dark:text-gray-300">{privacyMode ? '••••' : fmtK(Math.round(d.annual * 100))}</span></p>
                          <p className="text-xs text-emerald-600 font-medium">Cumulative: {privacyMode ? '••••' : fmtK(Math.round(d.cumulative * 100))}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="cumulative" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Year-by-year breakdown */}
              <div className="mt-4 grid grid-cols-5 gap-2">
                {fiveYearProjection.map((y) => (
                  <div key={y.year} className="text-center">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{y.year}</p>
                    <p className={cn('text-xs font-medium mt-0.5', y.cumulative >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                      {privacyMode ? '••' : fmtK(Math.round(y.cumulative * 100))}
                    </p>
                    <p className="text-[10px] text-gray-400">cumulative</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!savingsHistory.some((m) => m.hasData) && (
            <Card className="md:col-span-2 p-8 text-center">
              <TrendingUp size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No data yet</p>
              <p className="text-xs text-gray-400">Record income and expenses to see your savings here.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
