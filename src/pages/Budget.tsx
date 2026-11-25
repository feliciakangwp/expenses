import { useMemo, useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Button } from '@/components/ui/Button'
import { PeriodSelector, periodToRange } from '@/components/ui/PeriodSelector'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function Budget() {
  const { transactions, budgets, categories } = useAppStore()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { start: monthStart, end: monthEnd } = periodToRange(year, month)
  const selectedDate = new Date(year, month - 1, 1)

  const monthExpenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const date = t.transaction_date.split('T')[0]
      return date >= monthStart && date <= monthEnd
    })
  }, [transactions, monthStart, monthEnd])

  const totalSpent = monthExpenses.reduce((s, t) => s + t.amount, 0)

  const daysInMonth = new Date(year, month, 0).getDate()
  const daysRemaining = year === now.getFullYear() && month === now.getMonth() + 1
    ? daysInMonth - now.getDate() + 1
    : 0

  const overallBudget = budgets.find(
    (b) => !b.category_id && b.period === 'monthly' && b.year === year && b.month === month
  )

  // Category spending
  const catSpendMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of monthExpenses) {
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount)
    }
    return map
  }, [monthExpenses])

  const categoryBudgets = budgets.filter((b) => b.category_id)

  // Projected spend
  const daysElapsed = year === now.getFullYear() && month === now.getMonth() + 1
    ? now.getDate()
    : daysInMonth
  const projectedSpend = daysElapsed > 0 ? (totalSpent / daysElapsed) * daysInMonth : 0

  function BudgetBar({ spent, budget, label }: { spent: number; budget: number; label: string }) {
    const pct = budget > 0 ? (spent / budget) * 100 : 0
    const remaining = budget - spent
    const color = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
    const textColor = pct >= 100 ? 'text-red-500' : pct >= 75 ? 'text-amber-500' : 'text-emerald-600'

    return (
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <div className="flex items-center gap-2">
            <AmountDisplay cents={spent} size="sm" />
            <span className="text-xs text-gray-400">/</span>
            <AmountDisplay cents={budget} size="sm" color="muted" />
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
          <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-xs font-medium ${textColor}`}>
            {pct >= 100 ? `${(pct - 100).toFixed(0)}% over` : `${pct.toFixed(0)}% used`}
          </span>
          <span className="text-xs text-gray-400">
            {remaining > 0 ? (
              <AmountDisplay cents={remaining} size="sm" color="muted" />
            ) : (
              <span className="text-red-400">Exceeded</span>
            )}{' '}
            remaining
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader title="Budget" subtitle={format(selectedDate, 'MMMM yyyy')} />

      <PeriodSelector
        transactions={transactions}
        year={year}
        month={month}
        onChange={(y, m) => { setYear(y); setMonth(m) }}
      />

      <div className="px-5 flex flex-col gap-4">
        {/* Overall Budget */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Monthly Budget</h3>
            <Target size={16} className="text-primary-500" />
          </div>

          {overallBudget ? (
            <>
              <BudgetBar spent={totalSpent} budget={overallBudget.amount} label="Total Spending" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs text-gray-500 mb-1">Days Remaining</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{daysRemaining}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs text-gray-500 mb-1">Projected (est.)</p>
                  <AmountDisplay cents={Math.round(projectedSpend)} size="lg" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Based on current pace</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">No budget set for this month</p>
              <Button size="sm" variant="secondary" className="gap-1.5">
                <Plus size={14} />
                Set Budget
              </Button>
            </div>
          )}
        </Card>

        {/* Category Budgets */}
        {categoryBudgets.length > 0 && (
          <Card>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Budgets</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {categoryBudgets.map((b) => {
                const cat = categories.find((c) => c.id === b.category_id)
                if (!cat) return null
                const spent = catSpendMap.get(cat.id) ?? 0
                const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0
                const color = pct >= 100 ? 'text-red-500' : pct >= 75 ? 'text-amber-500' : 'text-emerald-600'

                return (
                  <div key={b.id} className="px-4 py-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                          <AmountDisplay cents={spent} size="md" />
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={cn(
                          'h-1.5 rounded-full transition-all',
                          pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={`text-xs font-medium ${color}`}>{pct.toFixed(0)}% used</span>
                      <span className="text-xs text-gray-400">of <AmountDisplay cents={b.amount} size="sm" /></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Spending Summary */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">This Month's Spending</h3>
          <div className="flex justify-between items-center">
            <AmountDisplay cents={totalSpent} size="xl" />
            <div className="text-right">
              <p className="text-xs text-gray-400">{daysElapsed} days elapsed</p>
              <p className="text-xs text-gray-400 mt-0.5">
                ~${ (totalSpent / 100 / daysElapsed).toFixed(2) }/day
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
