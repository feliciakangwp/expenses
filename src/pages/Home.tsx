import { useState, useMemo } from 'react'
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { useData } from '@/hooks/useData'
import { useStats } from '@/hooks/useStats'
import { QuickExpenseEntry } from '@/components/expenses/QuickExpenseEntry'
import { TransactionDetail } from '@/components/expenses/TransactionDetail'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import type { Transaction, Subcategory, RecurringExpense } from '@/types'
import { getMonthRange, generateId, nowSGT } from '@/lib/utils'
import { format, parseISO, addWeeks, addMonths, addYears } from 'date-fns'

function advanceDate(date: string, freq: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual'): string {
  const d = parseISO(date)
  switch (freq) {
    case 'weekly': return format(addWeeks(d, 1), 'yyyy-MM-dd')
    case 'biweekly': return format(addWeeks(d, 2), 'yyyy-MM-dd')
    case 'monthly': return format(addMonths(d, 1), 'yyyy-MM-dd')
    case 'quarterly': return format(addMonths(d, 3), 'yyyy-MM-dd')
    case 'annual': return format(addYears(d, 1), 'yyyy-MM-dd')
  }
}

const FREQ_LABELS: Record<string, string> = { weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annually' }

function RecurringWidget() {
  const { recurringExpenses, updateRecurringExpense, categories } = useAppStore()
  const { saveTransaction } = useData()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  const active = recurringExpenses.filter((r) => r.is_active)
  if (active.length === 0) return null

  const overdue = active.filter((r) => r.next_payment_date <= today)
  const upcoming = active.filter((r) => r.next_payment_date > today)

  const handleRecord = async (rec: RecurringExpense) => {
    const cat = categories.find((c) => c.id === rec.category_id)
    if (!cat) return
    try {
      await saveTransaction({
        categoryId: rec.category_id,
        subcategoryId: rec.subcategory_id,
        amount: rec.amount,
        paymentMethodId: rec.payment_method_id,
        description: rec.name,
        transactionDate: `${rec.next_payment_date}T00:00:00`,
        notes: '',
        isNeeds: cat.is_needs,
        type: 'expense',
      })
      updateRecurringExpense({ ...rec, next_payment_date: advanceDate(rec.next_payment_date, rec.frequency), updated_at: nowSGT() })
      toast(`${rec.name} recorded`, { type: 'success' })
    } catch {
      toast('Failed to record', { type: 'error' })
    }
  }

  const handleSkip = (rec: RecurringExpense) => {
    updateRecurringExpense({ ...rec, next_payment_date: advanceDate(rec.next_payment_date, rec.frequency), updated_at: nowSGT() })
    toast(`${rec.name} skipped`, { type: 'info' })
  }

  return (
    <Card className="mx-4 md:mx-0 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recurring</span>
          {overdue.length > 0 && (
            <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
              {overdue.length} due
            </span>
          )}
          <span className="text-xs text-gray-400">{active.length} items</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
          {[...overdue, ...upcoming].map((rec) => {
            const isDue = rec.next_payment_date <= today
            const cat = categories.find((c) => c.id === rec.category_id)
            return (
              <div key={rec.id} className={`px-4 py-3 ${isDue ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                <div className="flex items-center gap-3">
                  {cat && <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{rec.name}</span>
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full flex-shrink-0">{FREQ_LABELS[rec.frequency]}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ${(rec.amount / 100).toFixed(2)} · {isDue
                        ? <span className="text-amber-600 dark:text-amber-400">Due {rec.next_payment_date}</span>
                        : `Next ${rec.next_payment_date}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleRecord(rec)}
                      className="rounded-lg bg-primary-600 text-white text-xs font-medium px-2.5 py-1.5"
                    >
                      Record
                    </button>
                    <button
                      onClick={() => handleSkip(rec)}
                      className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium px-2.5 py-1.5"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export function Home() {
  const {
    transactions, categories, paymentMethods, preferences,
    privacyMode, setPrivacyMode, isDemoMode,
  } = useAppStore()
  const { saveTransaction, removeTransaction } = useData()
  const stats = useStats()
  const { toast } = useToast()

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  // Build subcategory map
  const subcategoryMap = useMemo(() => {
    const map: Record<string, Subcategory[]> = {}
    // In demo mode, derive from category data only
    return map
  }, [categories])

  // Category IDs sorted by usage frequency (most used first)
  const recentCategoryIds = useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense')
    const freq = new Map<string, number>()
    for (const t of expenseTx.slice(0, 100)) {
      freq.set(t.category_id, (freq.get(t.category_id) ?? 0) + 1)
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
  }, [transactions])

  // Payment methods sorted by usage frequency (most used first)
  const sortedPaymentMethods = useMemo(() => {
    const freq = new Map<string, number>()
    for (const t of transactions) {
      if (t.payment_method_id) {
        freq.set(t.payment_method_id, (freq.get(t.payment_method_id) ?? 0) + 1)
      }
    }
    return [...paymentMethods]
      .filter((p) => !p.is_archived)
      .sort((a, b) => (freq.get(b.id) ?? 0) - (freq.get(a.id) ?? 0))
  }, [transactions, paymentMethods])

  const { start: monthStart, end: monthEnd } = getMonthRange()
  const topCategories = useMemo(() => {
    const expenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const date = t.transaction_date.split('T')[0]
      return date >= monthStart && date <= monthEnd
    })
    const catMap = new Map<string, number>()
    for (const t of expenses) {
      catMap.set(t.category_id, (catMap.get(t.category_id) ?? 0) + t.amount)
    }
    return [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, amount]) => ({
        category: categories.find((c) => c.id === id),
        amount,
      }))
      .filter((x) => x.category)
  }, [transactions, categories, monthStart, monthEnd])

  const handleSave = async (data: Parameters<typeof QuickExpenseEntry>[0]['onSave'] extends (d: infer D) => any ? D : never) => {
    try {
      const saved = await saveTransaction({
        categoryId: data.category.id,
        subcategoryId: data.subcategoryId,
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
        description: data.description,
        transactionDate: data.transactionDate,
        notes: '',
        isNeeds: data.isNeeds,
        type: 'expense',
      })
      if (saved) {
        if (data.isRecurring) {
          const rec: RecurringExpense = {
            id: generateId(),
            user_id: saved.user_id,
            name: data.description || data.category.name,
            amount: data.amount,
            currency: 'SGD',
            category_id: data.category.id,
            subcategory_id: data.subcategoryId,
            payment_method_id: data.paymentMethodId,
            frequency: data.recurringFrequency,
            next_payment_date: advanceDate(data.transactionDate.split('T')[0], data.recurringFrequency),
            is_active: true,
            auto_record: false,
            notes: null,
            created_at: nowSGT(),
            updated_at: nowSGT(),
            category: data.category,
          }
          useAppStore.getState().addRecurringExpense(rec)
        }
        toast('Expense saved', {
          type: 'success',
          action: {
            label: 'Undo',
            onClick: () => removeTransaction(saved.id),
          },
        })
      }
    } catch (err) {
      toast('Failed to save expense', { type: 'error' })
    }
  }

  const budgetPct = stats.monthBudget ? (stats.monthBudgetUsed / stats.monthBudget) * 100 : null
  const budgetColor = budgetPct === null ? 'bg-primary-500' : budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-primary-700 md:bg-gray-50 dark:bg-gray-950">
      {/* Mobile Header (hidden on desktop) */}
      <div
        className="md:hidden bg-gradient-to-br from-primary-600 to-primary-800 px-5 pb-6"
        style={{ paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 0px) + 1.25rem))' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-primary-200 text-sm">{greeting} 👋</p>
            <h1 className="text-white text-xl font-bold mt-0.5">My Expenses</h1>
          </div>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="rounded-xl bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
                Demo
              </span>
            )}
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white"
            >
              {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Stats Row — mobile */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Today', value: stats.today },
            { label: 'This Week', value: stats.week },
            { label: 'This Month', value: stats.month },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-3">
              <p className="text-xs text-primary-200 mb-1">{label}</p>
              <AmountDisplay cents={value} size="lg" className="text-white font-bold" />
            </div>
          ))}
        </div>

        {stats.monthBudget && (
          <div className="mt-3 rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-3">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-primary-200">Monthly Budget</span>
              <span className="text-xs text-white font-medium">
                {privacyMode ? '••• / •••' : `$${(stats.monthBudgetUsed / 100).toFixed(0)} / $${(stats.monthBudget / 100).toFixed(0)}`}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div
                className={`h-1.5 rounded-full transition-all ${budgetColor}`}
                style={{ width: `${Math.min(100, budgetPct ?? 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header (hidden on mobile) */}
      <div className="hidden md:flex items-center justify-between px-6 pt-8 pb-6">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-0.5">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {isDemoMode && (
            <span className="rounded-xl bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              Demo Mode
            </span>
          )}
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Desktop Stats Row */}
      <div className="hidden md:grid grid-cols-3 gap-4 px-6 mb-6">
        {[
          { label: 'Today', value: stats.today, emoji: '📅' },
          { label: 'This Week', value: stats.week, emoji: '📆' },
          { label: 'This Month', value: stats.month, emoji: '🗓️' },
        ].map(({ label, value, emoji }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{emoji}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
            <AmountDisplay cents={value} size="xl" />
          </Card>
        ))}
      </div>

      {/* Main content area: 2-col on desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-6 md:px-6 md:items-start">
        {/* Left: Quick Entry */}
        <div>
          {/* Mobile: overlap card */}
          <div className="mx-4 -mt-4 md:hidden">
            <Card className="overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Add Expense</h2>
              </div>
              <QuickExpenseEntry
                categories={categories}
                subcategories={subcategoryMap}
                paymentMethods={sortedPaymentMethods}
                defaultPaymentMethodId={preferences?.default_payment_method_id}
                recentCategoryIds={recentCategoryIds}
                onSave={handleSave}
              />
            </Card>
          </div>

          {/* Desktop: regular card */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Add Expense</h2>
              </div>
              <QuickExpenseEntry
                categories={categories}
                subcategories={subcategoryMap}
                paymentMethods={sortedPaymentMethods}
                defaultPaymentMethodId={preferences?.default_payment_method_id}
                recentCategoryIds={recentCategoryIds}
                onSave={handleSave}
              />
            </Card>
          </div>
        </div>

        {/* Right: Top Categories + Recent */}
        <div className="mt-5 md:mt-0 flex flex-col gap-4">
          {/* Budget bar on desktop */}
          {stats.monthBudget && (
            <Card className="hidden md:block p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Budget</span>
                <span className="text-xs text-gray-500">
                  {privacyMode ? '••• / •••' : `$${(stats.monthBudgetUsed / 100).toFixed(0)} / $${(stats.monthBudget / 100).toFixed(0)}`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-2 rounded-full transition-all ${budgetColor}`}
                  style={{ width: `${Math.min(100, budgetPct ?? 0)}%` }}
                />
              </div>
            </Card>
          )}

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <Card className="mx-4 p-4 md:mx-0">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Top categories this month
              </h2>
              <div className="flex flex-col gap-2">
                {topCategories.map(({ category: cat, amount }) => {
                  const monthTotal = stats.month
                  const pct = monthTotal > 0 ? (amount / monthTotal) * 100 : 0
                  return (
                    <div key={cat!.id} className="flex items-center gap-3">
                      <CategoryIcon icon={cat!.icon} color={cat!.color} size="sm" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat!.name}</span>
                          <AmountDisplay cents={amount} size="md" />
                        </div>
                        <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-1 rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cat!.color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Recurring Expenses */}
          <RecurringWidget />

        </div>
      </div>

      {/* Transaction Detail Sheet */}
      <Sheet
        open={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
        title="Transaction"
      >
        {selectedTx && (
          <TransactionDetail
            transaction={selectedTx}
            onDelete={() => {
              removeTransaction(selectedTx.id)
              setSelectedTx(null)
              toast('Transaction deleted', {
                type: 'info',
                action: {
                  label: 'Undo',
                  onClick: async () => {
                    const { addTransaction } = useAppStore.getState()
                    addTransaction(selectedTx)
                  },
                },
              })
            }}
            onClose={() => setSelectedTx(null)}
          />
        )}
      </Sheet>
    </div>
  )
}
