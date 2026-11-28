import { useMemo, useState } from 'react'
import { Plus, Pencil, Target, X, Check, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useAppStore } from '@/store/app'
import { useData } from '@/hooks/useData'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { Button } from '@/components/ui/Button'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { PeriodSelector, periodToRange } from '@/components/ui/PeriodSelector'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function Budget() {
  const { transactions, budgets, categories } = useAppStore()
  const { saveCategoryBudget } = useData()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { start: monthStart, end: monthEnd } = periodToRange(year, month)
  const selectedDate = new Date(year, month - 1, 1)

  const daysInMonth = new Date(year, month, 0).getDate()
  const daysElapsed = year === now.getFullYear() && month === now.getMonth() + 1
    ? now.getDate()
    : daysInMonth
  const daysRemaining = year === now.getFullYear() && month === now.getMonth() + 1
    ? daysInMonth - now.getDate() + 1
    : 0

  const monthExpenses = useMemo(
    () => transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const d = t.transaction_date.split('T')[0]
      return d >= monthStart && d <= monthEnd
    }),
    [transactions, monthStart, monthEnd]
  )

  const totalSpent = monthExpenses.reduce((s, t) => s + t.amount, 0)
  const projectedSpend = daysElapsed > 0 ? (totalSpent / daysElapsed) * daysInMonth : 0

  // Per-category spending for this month
  const spendByCat = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of monthExpenses) {
      if (t.category_id) map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount)
    }
    return map
  }, [monthExpenses])

  // Category budgets for this month
  const catBudgetMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of budgets) {
      if (b.category_id && b.period === 'monthly' && b.year === year && b.month === month) {
        map.set(b.category_id, b.amount)
      }
    }
    return map
  }, [budgets, year, month])

  // Categories to display: has a budget OR has spending this month
  const displayCategories = useMemo(() => {
    const ids = new Set([...catBudgetMap.keys(), ...spendByCat.keys()])
    return categories
      .filter((c) => ids.has(c.id))
      .map((c) => ({
        ...c,
        spent: spendByCat.get(c.id) ?? 0,
        budgeted: catBudgetMap.get(c.id) ?? null,
      }))
      .sort((a, b) => {
        // Overspent first, then by spending desc
        const aOver = a.budgeted !== null && a.spent > a.budgeted
        const bOver = b.budgeted !== null && b.spent > b.budgeted
        if (aOver !== bOver) return aOver ? -1 : 1
        return b.spent - a.spent
      })
  }, [categories, catBudgetMap, spendByCat])

  // Totals
  const totalBudgeted = Array.from(catBudgetMap.values()).reduce((s, v) => s + v, 0)
  const budgetedCatSpend = displayCategories
    .filter((c) => c.budgeted !== null)
    .reduce((s, c) => s + c.spent, 0)
  const unbudgetedSpend = totalSpent - budgetedCatSpend
  const overspentCats = displayCategories.filter((c) => c.budgeted !== null && c.spent > c.budgeted)
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
  const overallBarColor = overallPct >= 100 ? 'bg-red-500' : overallPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
  const overallStatusColor = overallPct >= 100 ? 'text-red-500' : overallPct >= 75 ? 'text-amber-500' : 'text-emerald-600'

  const startEdit = (catId: string, current: number | null) => {
    setEditingCat(catId)
    setEditValue(current !== null ? (current / 100).toFixed(2) : '')
  }

  const saveEdit = async (catId: string) => {
    const amount = Math.round(parseFloat(editValue) * 100)
    if (amount > 0) {
      await saveCategoryBudget(year, month, catId, amount)
    }
    setEditingCat(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCat(null)
    setEditValue('')
  }

  // Year overview: sum of category budgets per month
  const yearChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const { start: s, end: e } = periodToRange(year, m)
      const monthBudget = budgets
        .filter((b) => b.category_id && b.period === 'monthly' && b.year === year && b.month === m)
        .reduce((sum, b) => sum + b.amount, 0)
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date.split('T')[0] >= s && t.transaction_date.split('T')[0] <= e)
        .reduce((sum, t) => sum + t.amount, 0)
      const spentDollars = spent / 100
      const budgetDollars = monthBudget > 0 ? monthBudget / 100 : null
      return {
        month: MONTH_SHORT[i],
        withinBudget: budgetDollars !== null ? Math.min(spentDollars, budgetDollars) : 0,
        overspend: budgetDollars !== null ? Math.max(0, spentDollars - budgetDollars) : 0,
        noBudget: budgetDollars === null ? spentDollars : 0,
        budgetAmt: budgetDollars ?? 0,
        totalSpent: spentDollars,
        hasBudget: budgetDollars !== null,
      }
    }).filter((d) => d.withinBudget > 0 || d.overspend > 0 || d.noBudget > 0)
  }, [budgets, transactions, year])

  const overspentMonths = yearChartData.filter((d) => d.overspend > 0).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader title="Budget" subtitle={format(selectedDate, 'MMMM yyyy')} />

      <PeriodSelector
        transactions={transactions}
        year={year}
        month={month}
        onChange={(y, m) => { setYear(y); setMonth(m); setEditingCat(null) }}
      />

      <div className="px-5 flex flex-col gap-4 pb-8 md:grid md:grid-cols-2 md:items-start">

        {/* Category Budgets */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Budgets</h3>
            <span className="text-xs text-gray-400">{format(selectedDate, 'MMM yyyy')}</span>
          </div>

          {displayCategories.length === 0 ? (
            <div className="text-center py-10 px-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
                <Target size={22} className="text-primary-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">No budgets set</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                Start spending or set category budgets below
              </p>
              <p className="text-xs text-gray-400">
                Tap <span className="font-medium text-primary-500">+ Set budget</span> next to any category below
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {displayCategories.map((cat) => {
                const pct = cat.budgeted ? (cat.spent / cat.budgeted) * 100 : null
                const isOver = pct !== null && pct >= 100
                const isWarn = pct !== null && pct >= 75 && pct < 100
                const barColor = isOver ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                const isEditing = editingCat === cat.id

                return (
                  <div key={cat.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{cat.name}</span>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') cancelEdit() }}
                                  placeholder="0.00"
                                  autoFocus
                                  className="w-24 rounded-lg bg-gray-50 dark:bg-gray-800 pl-5 pr-2 py-1 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
                                />
                              </div>
                              <button
                                onClick={() => saveEdit(cat.id)}
                                disabled={!editValue || parseFloat(editValue) <= 0}
                                className="rounded-lg bg-primary-600 text-white p-1 disabled:opacity-40"
                              >
                                <Check size={12} />
                              </button>
                              <button onClick={cancelEdit} className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 p-1">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(cat.id, cat.budgeted)}
                              className={cn(
                                'flex items-center gap-1 text-xs flex-shrink-0',
                                cat.budgeted !== null
                                  ? 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                                  : 'text-primary-600 dark:text-primary-400 font-medium'
                              )}
                            >
                              {cat.budgeted !== null ? (
                                <>
                                  <Pencil size={10} />
                                  ${(cat.budgeted / 100).toFixed(0)}
                                </>
                              ) : (
                                <>
                                  <Plus size={10} />
                                  Set budget
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                            {pct !== null && (
                              <div
                                className={cn('h-1.5 rounded-full transition-all', barColor)}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {cat.budgeted !== null ? (
                              <span className={cn('text-xs font-medium', isOver ? 'text-red-500' : isWarn ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400')}>
                                ${(cat.spent / 100).toFixed(0)} / ${(cat.budgeted / 100).toFixed(0)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">${(cat.spent / 100).toFixed(0)} spent</span>
                            )}
                          </div>
                        </div>

                        {isOver && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            Over by ${((cat.spent - cat.budgeted!) / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add budget for other categories */}
          {categories.filter((c) => !catBudgetMap.has(c.id) && !spendByCat.has(c.id)).length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Other categories</p>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => !catBudgetMap.has(c.id) && !spendByCat.has(c.id))
                  .map((c) => (
                    editingCat === c.id ? (
                      <div key={c.id} className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{c.name}</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') cancelEdit() }}
                            placeholder="0.00"
                            autoFocus
                            className="w-20 rounded-lg bg-gray-50 dark:bg-gray-800 pl-5 pr-2 py-1 text-xs text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
                          />
                        </div>
                        <button onClick={() => saveEdit(c.id)} disabled={!editValue || parseFloat(editValue) <= 0} className="rounded-lg bg-primary-600 text-white p-1 disabled:opacity-40">
                          <Check size={10} />
                        </button>
                        <button onClick={cancelEdit} className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 p-1">
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <button
                        key={c.id}
                        onClick={() => startEdit(c.id, null)}
                        className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        <Plus size={10} />
                        {c.name}
                      </button>
                    )
                  ))}
              </div>
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Overall Summary */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {format(selectedDate, 'MMMM yyyy')} Overview
            </h3>

            {totalBudgeted > 0 ? (
              <>
                <div className="mb-3">
                  <div className="flex justify-between mb-1.5 text-xs text-gray-500">
                    <span>Total spent</span>
                    <div className="flex items-center gap-1">
                      <AmountDisplay cents={totalSpent} size="sm" />
                      <span>/</span>
                      <AmountDisplay cents={totalBudgeted} size="sm" color="muted" />
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={cn('h-2.5 rounded-full transition-all', overallBarColor)}
                      style={{ width: `${Math.min(100, overallPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className={cn('text-xs font-medium', overallStatusColor)}>
                      {overallPct >= 100 ? `${(overallPct - 100).toFixed(0)}% over budget` : `${overallPct.toFixed(0)}% used`}
                    </span>
                    {totalBudgeted > totalSpent ? (
                      <span className="text-xs text-gray-400">
                        <AmountDisplay cents={totalBudgeted - totalSpent} size="sm" color="muted" /> left
                      </span>
                    ) : (
                      <span className="text-xs text-red-400">Over budget</span>
                    )}
                  </div>
                </div>

                {overspentCats.length > 0 && (
                  <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={12} className="text-red-500" />
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                        {overspentCats.length} categor{overspentCats.length > 1 ? 'ies' : 'y'} over budget
                      </p>
                    </div>
                    {overspentCats.map((c) => (
                      <p key={c.id} className="text-xs text-red-500 ml-4">
                        {c.name}: over by ${((c.spent - c.budgeted!) / 100).toFixed(2)}
                      </p>
                    ))}
                  </div>
                )}

                {unbudgetedSpend > 0 && (
                  <div className="mb-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 px-3 py-2 flex items-center justify-between">
                    <p className="text-xs text-amber-700 dark:text-amber-400">Unbudgeted spend</p>
                    <AmountDisplay cents={unbudgetedSpend} size="sm" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
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
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No category budgets set</p>
                <p className="text-xs text-gray-400">Set budgets per category on the left to see your overall progress here.</p>
                {totalSpent > 0 && (
                  <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                    <p className="text-xs text-gray-500 mb-1">Spent this month</p>
                    <AmountDisplay cents={totalSpent} size="lg" />
                  </div>
                )}
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
                {overspentMonths > 0 && (
                  <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                    {overspentMonths} month{overspentMonths > 1 ? 's' : ''} over budget
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-xs text-gray-500">Within budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="text-xs text-gray-500">Over budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-600" />
                  <span className="text-xs text-gray-500">No budget</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={yearChartData} barCategoryGap="25%" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
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
                          {d.hasBudget ? (
                            <>
                              <p className="text-xs text-gray-500">Budget: <span className="font-medium text-gray-700 dark:text-gray-300">${d.budgetAmt.toFixed(0)}</span></p>
                              <p className={`text-xs ${d.overspend > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                Spent: <span className="font-medium">${d.totalSpent.toFixed(0)}</span>
                              </p>
                              {d.overspend > 0 && (
                                <p className="text-xs text-red-500 font-medium">Over by: ${d.overspend.toFixed(0)}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-gray-500">Spent: <span className="font-medium text-gray-700 dark:text-gray-300">${d.totalSpent.toFixed(0)}</span></p>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="noBudget" stackId="a" fill="#d1d5db" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="withinBudget" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="overspend" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
