import { useMemo, useState } from 'react'
import { Plus, Pencil, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useAppStore } from '@/store/app'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { Button } from '@/components/ui/Button'
import { PeriodSelector, periodToRange } from '@/components/ui/PeriodSelector'
import { format } from 'date-fns'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function Budget() {
  const { transactions, budgets, setBudgetForMonth } = useAppStore()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [editing, setEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  const { start: monthStart, end: monthEnd } = periodToRange(year, month)
  const selectedDate = new Date(year, month - 1, 1)

  const monthExpenses = useMemo(
    () => transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const d = t.transaction_date.split('T')[0]
      return d >= monthStart && d <= monthEnd
    }),
    [transactions, monthStart, monthEnd]
  )

  const totalSpent = monthExpenses.reduce((s, t) => s + t.amount, 0)

  const daysInMonth = new Date(year, month, 0).getDate()
  const daysElapsed = year === now.getFullYear() && month === now.getMonth() + 1
    ? now.getDate()
    : daysInMonth
  const daysRemaining = year === now.getFullYear() && month === now.getMonth() + 1
    ? daysInMonth - now.getDate() + 1
    : 0
  const projectedSpend = daysElapsed > 0 ? (totalSpent / daysElapsed) * daysInMonth : 0

  const overallBudget = budgets.find(
    (b) => !b.category_id && b.period === 'monthly' && b.year === year && b.month === month
  )

  const pct = overallBudget ? (totalSpent / overallBudget.amount) * 100 : 0
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
  const statusColor = pct >= 100 ? 'text-red-500' : pct >= 75 ? 'text-amber-500' : 'text-emerald-600'

  const handleSaveBudget = () => {
    const amount = Math.round(parseFloat(budgetInput) * 100)
    if (amount > 0) {
      setBudgetForMonth(year, month, amount)
      setEditing(false)
      setBudgetInput('')
    }
  }

  const startEdit = () => {
    setBudgetInput(overallBudget ? (overallBudget.amount / 100).toFixed(2) : '')
    setEditing(true)
  }

  // Year overview: all 12 months, filtered to those with data
  const yearChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const { start: s, end: e } = periodToRange(year, m)
      const b = budgets.find(
        (bgt) => !bgt.category_id && bgt.period === 'monthly' && bgt.year === year && bgt.month === m
      )
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date.split('T')[0] >= s && t.transaction_date.split('T')[0] <= e)
        .reduce((sum, t) => sum + t.amount, 0)
      return {
        month: MONTH_SHORT[i],
        budget: b ? b.amount / 100 : 0,
        spent: spent / 100,
        overspent: b ? spent > b.amount : false,
      }
    }).filter((d) => d.budget > 0 || d.spent > 0)
  }, [budgets, transactions, year])

  const overspentCount = yearChartData.filter((d) => d.overspent).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader title="Budget" subtitle={format(selectedDate, 'MMMM yyyy')} />

      <PeriodSelector
        transactions={transactions}
        year={year}
        month={month}
        onChange={(y, m) => { setYear(y); setMonth(m); setEditing(false) }}
      />

      <div className="px-5 flex flex-col gap-4 pb-8">
        {/* Monthly Budget Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {format(selectedDate, 'MMMM yyyy')} Budget
            </h3>
            {overallBudget && !editing && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Monthly budget for {format(selectedDate, 'MMMM yyyy')}
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                    placeholder="0.00"
                    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-7 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/50"
                    autoFocus
                  />
                </div>
                <Button size="sm" onClick={handleSaveBudget} disabled={!budgetInput || parseFloat(budgetInput) <= 0}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : overallBudget ? (
            <>
              <div className="mb-3">
                <div className="flex justify-between mb-2 text-xs text-gray-500">
                  <span>Spent</span>
                  <div className="flex items-center gap-1">
                    <AmountDisplay cents={totalSpent} size="sm" />
                    <span>/</span>
                    <AmountDisplay cents={overallBudget.amount} size="sm" color="muted" />
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-2.5 rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className={`text-xs font-medium ${statusColor}`}>
                    {pct >= 100 ? `${(pct - 100).toFixed(0)}% over budget` : `${pct.toFixed(0)}% used`}
                  </span>
                  {overallBudget.amount - totalSpent > 0 ? (
                    <span className="text-xs text-gray-400">
                      <AmountDisplay cents={overallBudget.amount - totalSpent} size="sm" color="muted" /> left
                    </span>
                  ) : (
                    <span className="text-xs text-red-400">Over budget</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs text-gray-500 mb-1">Days Remaining</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{daysRemaining}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs text-gray-500 mb-1">Projected (est.)</p>
                  <AmountDisplay cents={Math.round(projectedSpend)} size="lg" />
                  <p className="text-[10px] text-gray-400 mt-0.5">At current pace</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
                <Target size={22} className="text-primary-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">No budget set</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                Set a monthly budget to track your spending goals
              </p>
              <Button size="sm" onClick={startEdit} className="gap-1.5">
                <Plus size={14} />
                Set Budget for {format(selectedDate, 'MMM')}
              </Button>
            </div>
          )}
        </Card>

        {/* Year Overview Chart */}
        {yearChartData.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {year} Overview
              </h3>
              {overspentCount > 0 && (
                <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                  {overspentCount} month{overspentCount > 1 ? 's' : ''} over budget
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-500">Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-primary-500)' }} />
                <span className="text-xs text-gray-500">Spent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-xs text-gray-500">Over budget</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={yearChartData}
                barCategoryGap="20%"
                barGap={2}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `$${Number(value).toFixed(0)}`,
                    name === 'budget' ? 'Budget' : 'Spent',
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="budget" fill="#e5e7eb" radius={[2, 2, 0, 0]} name="Budget" />
                <Bar dataKey="spent" radius={[2, 2, 0, 0]} name="Spent">
                  {yearChartData.map((d, i) => (
                    <Cell key={i} fill={d.overspent ? '#ef4444' : 'var(--color-primary-500)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Spending total when no chart data yet */}
        {yearChartData.length === 0 && totalSpent > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {format(selectedDate, 'MMMM')} Spending
            </h3>
            <AmountDisplay cents={totalSpent} size="xl" />
            <p className="text-xs text-gray-400 mt-1">
              {daysElapsed} day{daysElapsed !== 1 ? 's' : ''} elapsed ·{' '}
              ~${(totalSpent / 100 / Math.max(1, daysElapsed)).toFixed(2)}/day
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
