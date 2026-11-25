import { useState, useMemo } from 'react'
import { Search, Download, X, Plus, TrendingUp, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { useData } from '@/hooks/useData'
import { TransactionItem } from '@/components/expenses/TransactionItem'
import { TransactionDetail } from '@/components/expenses/TransactionDetail'
import { PageHeader } from '@/components/layout/PageHeader'
import { Sheet } from '@/components/ui/Sheet'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { PeriodSelector, periodToRange } from '@/components/ui/PeriodSelector'
import { useToast } from '@/components/ui/Toast'
import type { Transaction, Investment } from '@/types'
import { formatDate, generateId, nowSGT } from '@/lib/utils'
import { groupTransactionsByDate } from '@/lib/utils'
import { format, differenceInDays, parseISO } from 'date-fns'

type TabType = 'expenses' | 'income' | 'investments'
type InvSort = 'ticker' | 'newest' | 'cost'

// ─── Income Add Form ──────────────────────────────────────────────────────────

const INCOME_SOURCES = ['Salary', 'Freelance', 'Bonus', 'Dividends', 'Rental', 'Other'] as const

function AddIncomeSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (src: string, amt: number, desc: string, date: string) => Promise<void> }) {
  const [source, setSource] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving] = useState(false)

  const canSave = source !== '' && parseFloat(amount) > 0

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave(source, Math.round(parseFloat(amount) * 100), description, date)
      setSource('')
      setAmount('')
      setDescription('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add Income">
      <div className="px-5 flex flex-col gap-4 pb-6">
        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-7 pr-3 py-2.5 text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Source */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Source</label>
          <div className="flex flex-wrap gap-2">
            {INCOME_SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
                  source === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. November paycheck"
            className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        <Button onClick={handleSave} disabled={!canSave} loading={saving} size="lg" className="w-full">
          Save Income
        </Button>
      </div>
    </Sheet>
  )
}

// ─── Investment Add/Edit Form ─────────────────────────────────────────────────

function AddInvestmentSheet({
  open,
  onClose,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  initial?: Investment | null
  onSave: (data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
  onDelete?: () => void
}) {
  const [ticker, setTicker] = useState(initial?.ticker ?? '')
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? '')
  const [buyPrice, setBuyPrice] = useState(initial?.buy_price?.toString() ?? '')
  const [sellPrice, setSellPrice] = useState(initial?.sell_price?.toString() ?? '')
  const [buyDate, setBuyDate] = useState(initial?.buy_date ?? format(new Date(), 'yyyy-MM-dd'))
  const [closing, setClosing] = useState(false)

  const isEdit = !!initial
  const canSave = ticker.trim() !== '' && parseFloat(quantity) > 0 && parseFloat(buyPrice) > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      ticker: ticker.trim().toUpperCase(),
      quantity: parseFloat(quantity),
      buy_price: parseFloat(buyPrice),
      sell_price: sellPrice && parseFloat(sellPrice) > 0 ? parseFloat(sellPrice) : null,
      buy_date: buyDate,
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? ticker : 'Add Position'}>
      <div className="px-5 flex flex-col gap-4 pb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ticker Symbol</label>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm font-mono font-bold text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
            autoFocus={!isEdit}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quantity</label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Buy Date</label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Buy Price ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-6 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sell Price ($) <span className="text-gray-400 font-normal">optional</span></label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-6 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
          </div>
        </div>

        {!sellPrice && isEdit && (
          <button
            onClick={() => setClosing(true)}
            className="text-sm text-primary-600 dark:text-primary-400 font-medium text-left"
          >
            + Close this position
          </button>
        )}
        {closing && (
          <p className="text-xs text-gray-500">Fill in the Sell Price above to close this position.</p>
        )}

        <Button onClick={handleSave} disabled={!canSave} size="lg" className="w-full">
          {isEdit ? 'Update Position' : 'Add Position'}
        </Button>

        {isEdit && onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 text-sm text-red-500 font-medium py-2"
          >
            <Trash2 size={14} />
            Delete Position
          </button>
        )}
      </div>
    </Sheet>
  )
}

// ─── Investments Tab ──────────────────────────────────────────────────────────

function InvestmentsTab() {
  const { investments, addInvestment, updateInvestment, removeInvestment, user, isDemoMode } = useAppStore()
  const [addOpen, setAddOpen] = useState(false)
  const [editInv, setEditInv] = useState<Investment | null>(null)
  const [sort, setSort] = useState<InvSort>('newest')
  const [closedExpanded, setClosedExpanded] = useState(false)

  const open = investments.filter((i) => i.sell_price === null)
  const closed = investments.filter((i) => i.sell_price !== null)

  const totalOpen = open.reduce((s, i) => s + i.buy_price * i.quantity, 0)
  const totalClosedPnl = closed.reduce((s, i) => s + (i.sell_price! - i.buy_price) * i.quantity, 0)
  const totalInvestment = totalOpen + totalClosedPnl

  const sortedOpen = useMemo(() => {
    const copy = [...open]
    if (sort === 'ticker') copy.sort((a, b) => a.ticker.localeCompare(b.ticker))
    else if (sort === 'newest') copy.sort((a, b) => (a.buy_date < b.buy_date ? 1 : -1))
    else if (sort === 'cost') copy.sort((a, b) => b.buy_price * b.quantity - a.buy_price * a.quantity)
    return copy
  }, [open, sort])

  const handleAddSave = (data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    addInvestment({
      ...data,
      id: generateId(),
      user_id: isDemoMode ? 'demo-user' : (user?.id ?? 'demo-user'),
      created_at: nowSGT(),
      updated_at: nowSGT(),
    })
  }

  const handleEditSave = (data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editInv) return
    updateInvestment({ ...editInv, ...data, updated_at: nowSGT() })
    setEditInv(null)
  }

  const handleDelete = () => {
    if (!editInv) return
    removeInvestment(editInv.id)
    setEditInv(null)
  }

  const daysOpen = (buyDate: string) => differenceInDays(new Date(), parseISO(buyDate))

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
          <TrendingUp size={24} className="text-primary-500" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No investments yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Track your stock positions and P&L</p>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus size={14} />
          Add Position
        </Button>
        <AddInvestmentSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAddSave} />
      </div>
    )
  }

  return (
    <div className="px-5 flex flex-col gap-4 pb-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Open', value: totalOpen, red: false },
          { label: 'Closed P&L', value: totalClosedPnl, red: totalClosedPnl < 0 },
          { label: 'Total', value: totalInvestment, red: totalInvestment < 0 },
        ].map(({ label, value, red }) => (
          <Card key={label} className="p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className={`text-sm font-bold ${red ? 'text-red-500' : 'text-gray-900 dark:text-gray-50'}`}>
              {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>
        ))}
      </div>

      {/* Add + Sort */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(['newest', 'ticker', 'cost'] as InvSort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`flex-shrink-0 rounded-xl px-3 py-1 text-xs font-medium transition-all ${
                sort === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {s === 'newest' ? 'Newest' : s === 'ticker' ? 'Ticker A–Z' : 'Cost ↓'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 rounded-xl bg-primary-600 text-white px-3 py-1.5 text-xs font-medium flex-shrink-0 ml-2"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Open Positions */}
      {sortedOpen.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {sortedOpen.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setEditInv(inv)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {inv.ticker.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-50 font-mono">{inv.ticker}</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">Open</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    ${inv.buy_price.toFixed(2)} × {inv.quantity} · {daysOpen(inv.buy_date)}d
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-50">
                    ${(inv.buy_price * inv.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400">cost</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Closed Positions */}
      {closed.length > 0 && (
        <div>
          <button
            onClick={() => setClosedExpanded(!closedExpanded)}
            className="flex items-center justify-between w-full py-2"
          >
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Closed Positions ({closed.length})
            </span>
            {closedExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>
          {closedExpanded && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {closed.map((inv) => {
                  const pnl = (inv.sell_price! - inv.buy_price) * inv.quantity
                  return (
                    <button
                      key={inv.id}
                      onClick={() => setEditInv(inv)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          {inv.ticker.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-gray-50 font-mono">{inv.ticker}</span>
                          <span className="text-[10px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">Closed</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Buy ${inv.buy_price.toFixed(2)} → Sell ${inv.sell_price!.toFixed(2)} × {inv.quantity}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-semibold ${pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {pnl >= 0 ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400">P&L</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AddInvestmentSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAddSave} />
      {editInv && (
        <AddInvestmentSheet
          open={!!editInv}
          onClose={() => setEditInv(null)}
          initial={editInv}
          onSave={handleEditSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Transactions() {
  const { transactions, categories } = useAppStore()
  const { removeTransaction, saveTransaction } = useData()
  const { toast } = useToast()

  const now = new Date()
  const [tab, setTab] = useState<TabType>('expenses')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [addIncomeOpen, setAddIncomeOpen] = useState(false)

  const { start: periodStart, end: periodEnd } = periodToRange(year, month)

  // ── Expenses ──
  const filteredExpenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const dateStr = t.transaction_date.split('T')[0]
      if (dateStr < periodStart || dateStr > periodEnd) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          (t.category?.name?.toLowerCase() ?? '').includes(q) ||
          (t.description?.toLowerCase() ?? '').includes(q) ||
          (t.merchant?.toLowerCase() ?? '').includes(q)
        )
      }
      return true
    })
  }, [transactions, periodStart, periodEnd, search])

  const expenseGrouped = useMemo(() => groupTransactionsByDate(filteredExpenses), [filteredExpenses])
  const expenseDateKeys = useMemo(
    () => Array.from(expenseGrouped.keys()).sort((a, b) => (a > b ? -1 : 1)),
    [expenseGrouped]
  )

  // ── Income ──
  const incomeTransactions = useMemo(
    () => transactions.filter((t) => t.type === 'income').sort((a, b) => (a.transaction_date > b.transaction_date ? -1 : 1)),
    [transactions]
  )
  const incomeGrouped = useMemo(() => groupTransactionsByDate(incomeTransactions), [incomeTransactions])
  const incomeDateKeys = useMemo(
    () => Array.from(incomeGrouped.keys()).sort((a, b) => (a > b ? -1 : 1)),
    [incomeGrouped]
  )

  const incomeCategory = useMemo(
    () => categories.find((c) => c.transaction_type === 'income'),
    [categories]
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

  const handleAddIncome = async (source: string, amountCents: number, description: string, date: string) => {
    if (!incomeCategory) return
    await saveTransaction({
      categoryId: incomeCategory.id,
      subcategoryId: null,
      amount: amountCents,
      paymentMethodId: null,
      description: description ? `${source} — ${description}` : source,
      merchant: undefined,
      transactionDate: `${date}T${format(new Date(), 'HH:mm:ss')}`,
      notes: '',
      isNeeds: null,
      type: 'income',
    })
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Category', 'Description', 'Merchant', 'Amount', 'Currency'],
      ...filteredExpenses.map((t) => [
        t.transaction_date.split('T')[0],
        t.type,
        t.category?.name ?? '',
        t.description ?? '',
        t.merchant ?? '',
        (t.amount / 100).toFixed(2),
        t.currency,
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TABS: { value: TabType; label: string }[] = [
    { value: 'expenses', label: 'Expenses' },
    { value: 'income', label: 'Income' },
    { value: 'investments', label: 'Investments' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader
        title="Transactions"
        right={
          tab === 'expenses' ? (
            <button
              onClick={exportCSV}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <Download size={16} />
            </button>
          ) : tab === 'income' ? (
            <button
              onClick={() => setAddIncomeOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary-600 text-white px-3 py-2 text-sm font-medium"
            >
              <Plus size={14} />
              Add
            </button>
          ) : null
        }
      />

      {/* Tab Selector */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              tab === value
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Expenses Tab ── */}
      {tab === 'expenses' && (
        <>
          <PeriodSelector
            transactions={transactions}
            year={year}
            month={month}
            onChange={(y, m) => { setYear(y); setMonth(m) }}
          />

          <div className="px-5 mb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className="w-full rounded-2xl bg-white dark:bg-gray-900 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 shadow-sm border border-gray-100 dark:border-gray-800 outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-gray-400">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {expenseDateKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-500 dark:text-gray-400">
                {search ? 'No expenses match your search' : 'No expenses this period'}
              </p>
            </div>
          ) : (
            <div className="px-5 flex flex-col gap-4">
              {expenseDateKeys.map((date) => {
                const dayTxs = expenseGrouped.get(date) ?? []
                const dayTotal = dayTxs.reduce((s, t) => s + t.amount, 0)
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {formatDate(date + 'T00:00:00')}
                      </span>
                      {dayTotal > 0 && <AmountDisplay cents={dayTotal} size="sm" color="muted" />}
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {dayTxs.map((tx) => (
                          <TransactionItem key={tx.id} transaction={tx} onClick={() => setSelectedTx(tx)} />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Income Tab ── */}
      {tab === 'income' && (
        <>
          {incomeDateKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="text-5xl mb-4">💰</div>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No income recorded</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Track your salary, freelance, and other income</p>
              <Button size="sm" onClick={() => setAddIncomeOpen(true)} className="gap-1.5">
                <Plus size={14} />
                Add Income
              </Button>
            </div>
          ) : (
            <div className="px-5 flex flex-col gap-4">
              {incomeDateKeys.map((date) => {
                const dayTxs = incomeGrouped.get(date) ?? []
                const dayTotal = dayTxs.reduce((s, t) => s + t.amount, 0)
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {formatDate(date + 'T00:00:00')}
                      </span>
                      {dayTotal > 0 && <AmountDisplay cents={dayTotal} size="sm" color="muted" />}
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {dayTxs.map((tx) => (
                          <TransactionItem key={tx.id} transaction={tx} onClick={() => setSelectedTx(tx)} />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Investments Tab ── */}
      {tab === 'investments' && <InvestmentsTab />}

      {/* Detail Sheet */}
      <Sheet open={selectedTx !== null} onClose={() => setSelectedTx(null)} title="Transaction">
        {selectedTx && (
          <TransactionDetail
            transaction={selectedTx}
            onDelete={() => handleDelete(selectedTx)}
            onClose={() => setSelectedTx(null)}
          />
        )}
      </Sheet>

      {/* Add Income Sheet */}
      <AddIncomeSheet
        open={addIncomeOpen}
        onClose={() => setAddIncomeOpen(false)}
        onSave={handleAddIncome}
      />
    </div>
  )
}
