import { useState, useMemo } from 'react'
import { Eye, EyeOff, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app'
import { useData } from '@/hooks/useData'
import { useStats } from '@/hooks/useStats'
import { QuickExpenseEntry } from '@/components/expenses/QuickExpenseEntry'
import { TransactionItem } from '@/components/expenses/TransactionItem'
import { TransactionDetail } from '@/components/expenses/TransactionDetail'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import type { Transaction, Subcategory, Category } from '@/types'
import { formatDate } from '@/lib/utils'
import { getMonthRange } from '@/lib/utils'

const RECENT_LIMIT = 5

export function Home() {
  const {
    transactions, categories, paymentMethods, preferences,
    privacyMode, setPrivacyMode, isDemoMode,
  } = useAppStore()
  const { saveTransaction, removeTransaction } = useData()
  const stats = useStats()
  const { toast } = useToast()

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [showEntry, setShowEntry] = useState(false)

  // Build subcategory map
  const subcategoryMap = useMemo(() => {
    const map: Record<string, Subcategory[]> = {}
    // In demo mode, derive from category data only
    return map
  }, [categories])

  // Recent category IDs (most used)
  const recentCategoryIds = useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense')
    const freq = new Map<string, number>()
    for (const t of expenseTx.slice(0, 50)) {
      freq.set(t.category_id, (freq.get(t.category_id) ?? 0) + 1)
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, 8)
  }, [transactions])

  const recentTransactions = useMemo(
    () => transactions.slice(0, RECENT_LIMIT),
    [transactions]
  )

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
        merchant: data.merchant,
        transactionDate: data.transactionDate,
        notes: data.notes,
        isNeeds: data.isNeeds,
        type: 'expense',
      })
      if (saved) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-5 pt-14 pb-6 safe-area-inset-top">
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

        {/* Stats Row */}
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

        {/* Budget Bar */}
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

      {/* Quick Entry */}
      <div className="mx-4 -mt-4">
        <Card className="overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Add Expense</h2>
          </div>
          <QuickExpenseEntry
            categories={categories}
            subcategories={subcategoryMap}
            paymentMethods={paymentMethods}
            defaultPaymentMethodId={preferences?.default_payment_method_id}
            recentCategoryIds={recentCategoryIds}
            onSave={handleSave}
          />
        </Card>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="mt-5 px-5">
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
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between px-5 mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent</h2>
          </div>
          <Card>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onClick={() => setSelectedTx(tx)}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

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
