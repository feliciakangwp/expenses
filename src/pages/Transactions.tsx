import { useState, useMemo } from 'react'
import { Search, Download, X } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { useData } from '@/hooks/useData'
import { TransactionItem } from '@/components/expenses/TransactionItem'
import { TransactionDetail } from '@/components/expenses/TransactionDetail'
import { PageHeader } from '@/components/layout/PageHeader'
import { Sheet } from '@/components/ui/Sheet'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { PeriodSelector, periodToRange } from '@/components/ui/PeriodSelector'
import { useToast } from '@/components/ui/Toast'
import type { Transaction } from '@/types'
import { formatDate } from '@/lib/utils'
import { groupTransactionsByDate } from '@/lib/utils'
import { format } from 'date-fns'

export function Transactions() {
  const { transactions } = useAppStore()
  const { removeTransaction } = useData()
  const { toast } = useToast()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const { start: periodStart, end: periodEnd } = periodToRange(year, month)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const dateStr = t.transaction_date.split('T')[0]
      if (dateStr < periodStart || dateStr > periodEnd) return false
      if (filterType !== 'all' && t.type !== filterType) return false
      if (search) {
        const q = search.toLowerCase()
        const catName = t.category?.name?.toLowerCase() ?? ''
        const desc = t.description?.toLowerCase() ?? ''
        const merchant = t.merchant?.toLowerCase() ?? ''
        return catName.includes(q) || desc.includes(q) || merchant.includes(q)
      }
      return true
    })
  }, [transactions, periodStart, periodEnd, search, filterType])

  const grouped = useMemo(() => {
    return groupTransactionsByDate(filtered)
  }, [filtered])

  const dateKeys = useMemo(
    () => Array.from(grouped.keys()).sort((a, b) => (a > b ? -1 : 1)),
    [grouped]
  )

  const handleDelete = (tx: Transaction) => {
    removeTransaction(tx.id)
    setSelectedTx(null)
    toast('Transaction deleted', {
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => {
          const { addTransaction } = useAppStore.getState()
          addTransaction(tx)
        },
      },
    })
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Category', 'Description', 'Merchant', 'Amount', 'Currency', 'Payment Method'],
      ...filtered.map((t) => [
        t.transaction_date.split('T')[0],
        t.type,
        t.category?.name ?? '',
        t.description ?? '',
        t.merchant ?? '',
        (t.amount / 100).toFixed(2),
        t.currency,
        t.payment_method?.name ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TYPE_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'expense', label: 'Expenses' },
    { value: 'income', label: 'Income' },
    { value: 'investment', label: 'Investments' },
    { value: 'transfer', label: 'Transfers' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader
        title="Transactions"
        right={
          <button
            onClick={exportCSV}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            <Download size={16} />
          </button>
        }
      />

      <PeriodSelector
        transactions={transactions}
        year={year}
        month={month}
        onChange={(y, m) => { setYear(y); setMonth(m) }}
      />

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full rounded-2xl bg-white dark:bg-gray-900 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 shadow-sm border border-gray-100 dark:border-gray-800 outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Type Filter */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              filterType === value
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {dateKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 dark:text-gray-400">
            {search ? 'No transactions match your search' : 'No transactions yet'}
          </p>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-4">
          {dateKeys.map((date) => {
            const dayTxs = grouped.get(date) ?? []
            const dayTotal = dayTxs
              .filter((t) => t.type === 'expense' || t.type === 'refund')
              .reduce((s, t) => s + (t.type === 'refund' ? -t.amount : t.amount), 0)

            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {formatDate(date + 'T00:00:00')}
                  </span>
                  {dayTotal > 0 && (
                    <AmountDisplay cents={dayTotal} size="sm" color="muted" />
                  )}
                </div>
                <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {dayTxs.map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        onClick={() => setSelectedTx(tx)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet
        open={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
        title="Transaction"
      >
        {selectedTx && (
          <TransactionDetail
            transaction={selectedTx}
            onDelete={() => handleDelete(selectedTx)}
            onClose={() => setSelectedTx(null)}
          />
        )}
      </Sheet>
    </div>
  )
}
