import { useState, useMemo, useEffect } from 'react'
import { Search, Download, X, Plus, TrendingUp, ChevronDown, ChevronUp, Trash2, ChevronLeft, RefreshCw, XCircle } from 'lucide-react'
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
import type { Transaction, Investment, RecurringExpense, Frequency } from '@/types'
import { formatDate, generateId, nowSGT } from '@/lib/utils'
import { groupTransactionsByDate } from '@/lib/utils'
import { format, differenceInDays, parseISO } from 'date-fns'

type TabType = 'expenses' | 'income' | 'investments'
type InvSort = 'ticker' | 'newest' | 'cost'

const fmtPx = (p: number) => Number(p.toFixed(2)).toString()

const advanceDate = (date: string, freq: Frequency): string => {
  const d = new Date(date + 'T00:00:00')
  if (freq === 'weekly') d.setDate(d.getDate() + 7)
  else if (freq === 'biweekly') d.setDate(d.getDate() + 14)
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (freq === 'quarterly') d.setMonth(d.getMonth() + 3)
  else if (freq === 'annual') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

// ─── Transaction Edit Form ────────────────────────────────────────────────────

function EditTransactionForm({
  transaction: t,
  onSave,
  onStopRecurring,
  onCancel,
}: {
  transaction: Transaction
  onSave: (data: Partial<Transaction> & { recurringFrequency: Frequency; recurringEndDate: string | null }) => Promise<void>
  onStopRecurring?: () => Promise<void>
  onCancel: () => void
}) {
  const { paymentMethods, recurringExpenses } = useAppStore()
  const linkedRec = t.recurring_expense_id
    ? recurringExpenses.find((r) => r.id === t.recurring_expense_id) ?? null
    : null

  const [date, setDate] = useState(t.transaction_date.slice(0, 10))
  const [description, setDescription] = useState(t.description ?? '')
  const [merchant, setMerchant] = useState(t.merchant ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(t.payment_method_id)
  const [isRecurring, setIsRecurring] = useState(t.is_recurring)
  const [recurringFreq, setRecurringFreq] = useState<Frequency>(linkedRec?.frequency ?? 'monthly')
  const [recurringEndDate, setRecurringEndDate] = useState<string>(linkedRec?.end_date ?? '')
  const [saving, setSaving] = useState(false)
  const [stopping, setStopping] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        transaction_date: date + 'T' + t.transaction_date.slice(11),
        description: description.trim() || null,
        merchant: merchant.trim() || null,
        payment_method_id: paymentMethodId,
        is_recurring: isRecurring,
        recurringFrequency: recurringFreq,
        recurringEndDate: recurringEndDate || null,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStop = async () => {
    if (!onStopRecurring) return
    setStopping(true)
    try { await onStopRecurring() } finally { setStopping(false) }
  }

  return (
    <div className="px-5 pb-6 flex flex-col gap-4">
      <button
        onClick={onCancel}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 -mb-1 self-start"
      >
        <ChevronLeft size={15} />
        Back
      </button>

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

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Lunch with client"
          className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
        />
      </div>

      {/* Merchant */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Merchant</label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="e.g. Starbucks"
          className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Payment Method</label>
        <select
          value={paymentMethodId ?? ''}
          onChange={(e) => setPaymentMethodId(e.target.value || null)}
          className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">None</option>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.name}</option>
          ))}
        </select>
      </div>

      {/* Recurring toggle */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setIsRecurring(!isRecurring)}
          className={`flex items-center justify-between w-full rounded-xl px-4 py-3 transition-colors ${
            isRecurring
              ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
              : 'bg-gray-50 dark:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <RefreshCw size={15} className={isRecurring ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
            <span className={`text-sm font-medium ${isRecurring ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
              Recurring expense
            </span>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${isRecurring ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Frequency selector + end date */}
        {isRecurring && (
          <div className="flex flex-col gap-2 px-1">
            <div className="flex gap-2 flex-wrap">
              {(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRecurringFreq(f)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    recurringFreq === f
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Last payment date (optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                {recurringEndDate && (
                  <button
                    type="button"
                    onClick={() => setRecurringEndDate('')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {recurringEndDate && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Recurring stops after {recurringEndDate}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stop recurring — only shown when there's an active recurring schedule */}
        {linkedRec?.is_active && (
          <button
            type="button"
            onClick={handleStop}
            disabled={stopping}
            className="flex items-center gap-1.5 self-start text-sm text-red-500 dark:text-red-400 font-medium py-1 px-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <XCircle size={14} />
            {stopping ? 'Stopping…' : 'Stop recurring schedule'}
          </button>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full mt-1">
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  )
}

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

type InvType = 'stock' | 'options'

function PriceInput({ label, value, onChange, placeholder = '0.00' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-6 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
        />
      </div>
    </div>
  )
}

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
  const [invType, setInvType] = useState<InvType>(initial?.investment_type ?? 'stock')
  const [ticker, setTicker] = useState(initial?.ticker ?? '')
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? '')
  const [buyPrice, setBuyPrice] = useState(initial?.buy_price?.toString() ?? '')
  const [sellPrice, setSellPrice] = useState(initial?.sell_price?.toString() ?? '')
  const [buyDate, setBuyDate] = useState(initial?.buy_date ?? format(new Date(), 'yyyy-MM-dd'))
  // Options-only
  const [optionType, setOptionType] = useState<'call' | 'put'>(initial?.option_type ?? 'call')
  const [strikePrice, setStrikePrice] = useState(initial?.strike_price?.toString() ?? '')
  const [expiryDate, setExpiryDate] = useState(initial?.expiry_date ?? '')
  const [isExpired, setIsExpired] = useState(initial?.is_expired ?? false)

  useEffect(() => {
    if (open && !initial) {
      setInvType('stock')
      setTicker('')
      setQuantity('')
      setBuyPrice('')
      setSellPrice('')
      setBuyDate(format(new Date(), 'yyyy-MM-dd'))
      setOptionType('call')
      setStrikePrice('')
      setExpiryDate('')
      setIsExpired(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const isEdit = !!initial
  const isOptions = invType === 'options'

  const canSave = ticker.trim() !== '' && parseFloat(quantity) > 0 && parseFloat(buyPrice) > 0
    && (!isOptions || (strikePrice !== '' && expiryDate !== ''))

  const handleSave = () => {
    if (!canSave) return
    onSave({
      investment_type: invType,
      ticker: ticker.trim().toUpperCase(),
      quantity: parseFloat(quantity),
      buy_price: parseFloat(buyPrice),
      sell_price: sellPrice && parseFloat(sellPrice) > 0 ? parseFloat(sellPrice) : null,
      buy_date: buyDate,
      option_type: isOptions ? optionType : null,
      strike_price: isOptions && strikePrice ? parseFloat(strikePrice) : null,
      expiry_date: isOptions ? expiryDate || null : null,
      is_expired: isOptions ? isExpired : false,
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? ticker : 'Add Position'}>
      <div className="px-5 flex flex-col gap-4 pb-6">
        {/* Type toggle — only on new entries */}
        {!isEdit && (
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {(['stock', 'options'] as InvType[]).map((t) => (
              <button
                key={t}
                onClick={() => setInvType(t)}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  invType === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                }`}
              >
                {t === 'stock' ? 'Stock / ETF' : 'Options Premium'}
              </button>
            ))}
          </div>
        )}

        {/* Ticker */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {isOptions ? 'Underlying Ticker' : 'Ticker Symbol'}
          </label>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm font-mono font-bold text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
            autoFocus={!isEdit}
          />
        </div>

        {/* Options-only: Call/Put + Strike */}
        {isOptions && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Option Type</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {(['call', 'put'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOptionType(t)}
                    className={`flex-1 py-2 text-xs font-semibold capitalize transition-all ${
                      optionType === t
                        ? t === 'call' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <PriceInput label="Strike Price ($)" value={strikePrice} onChange={setStrikePrice} />
          </div>
        )}

        {/* Quantity / Contracts + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {isOptions ? 'Contracts' : 'Quantity'}
            </label>
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
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {isOptions ? 'Entry Date' : 'Buy Date'}
            </label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>

        {/* Options-only: Expiry Date */}
        {isOptions && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        )}

        {/* Price fields */}
        <div className="grid grid-cols-2 gap-3">
          <PriceInput
            label={isOptions ? 'Premium / Contract ($)' : 'Buy Price ($)'}
            value={buyPrice}
            onChange={setBuyPrice}
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {isOptions ? 'Buyback Price ($)' : 'Sell Price ($)'}
              {' '}<span className="text-gray-400 font-normal">optional</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.00"
                disabled={isOptions && isExpired}
                className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-6 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Options: expired worthless toggle */}
        {isOptions && (
          <button
            onClick={() => { setIsExpired(!isExpired); if (!isExpired) setSellPrice('') }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-all ${
              isExpired
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-emerald-500 border-emerald-500' : 'border-gray-400'}`}>
              {isExpired && <span className="text-white text-[10px] font-bold">✓</span>}
            </span>
            Expired worthless (keep full premium)
          </button>
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
  const { investments, user, isDemoMode } = useAppStore()
  const { saveInvestment, editInvestment, deleteInvestment } = useData()
  const [addOpen, setAddOpen] = useState(false)
  const [editInv, setEditInv] = useState<Investment | null>(null)
  const [sort, setSort] = useState<InvSort>('newest')
  const [closedExpanded, setClosedExpanded] = useState(false)

  const isClosedPosition = (i: Investment) => {
    if ((i.investment_type ?? 'stock') === 'options') return i.is_expired || i.sell_price !== null
    return i.sell_price !== null
  }
  const open = investments.filter((i) => !isClosedPosition(i))
  const closed = investments.filter((i) => isClosedPosition(i))

  const positionPnl = (i: Investment) => {
    if ((i.investment_type ?? 'stock') === 'options') {
      const buyback = i.sell_price ?? 0
      return (i.buy_price - buyback) * i.quantity
    }
    return (i.sell_price! - i.buy_price) * i.quantity
  }

  const totalOpen = open.reduce((s, i) => s + i.buy_price * i.quantity, 0)
  const totalClosedPnl = closed.reduce((s, i) => s + positionPnl(i), 0)
  const totalInvestment = totalOpen + totalClosedPnl

  const sortedOpen = useMemo(() => {
    const copy = [...open]
    if (sort === 'ticker') copy.sort((a, b) => a.ticker.localeCompare(b.ticker))
    else if (sort === 'newest') copy.sort((a, b) => (a.buy_date < b.buy_date ? 1 : -1))
    else if (sort === 'cost') copy.sort((a, b) => b.buy_price * b.quantity - a.buy_price * a.quantity)
    return copy
  }, [open, sort])

  const handleAddSave = (data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    saveInvestment({
      ...data,
      id: generateId(),
      user_id: isDemoMode ? 'demo-user' : (user?.id ?? 'demo-user'),
      created_at: nowSGT(),
      updated_at: nowSGT(),
    })
  }

  const handleEditSave = (data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editInv) return
    editInvestment({ ...editInv, ...data, updated_at: nowSGT() })
    setEditInv(null)
  }

  const handleDelete = () => {
    if (!editInv) return
    deleteInvestment(editInv.id)
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
            {sortedOpen.map((inv) => {
              const isOpt = (inv.investment_type ?? 'stock') === 'options'
              return (
              <button
                key={inv.id}
                onClick={() => setEditInv(inv)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOpt ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                  <span className={`text-xs font-bold ${isOpt ? 'text-indigo-700 dark:text-indigo-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {inv.ticker.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-gray-50 font-mono">{inv.ticker}</span>
                    {isOpt && inv.option_type && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${inv.option_type === 'call' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        {inv.option_type.toUpperCase()}
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isOpt ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                      {isOpt ? 'Premium' : 'Open'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isOpt
                      ? `$${inv.strike_price != null ? fmtPx(inv.strike_price) : '—'} strike · ${inv.quantity} contract${inv.quantity !== 1 ? 's' : ''} · exp ${inv.expiry_date ?? '—'}`
                      : `$${fmtPx(inv.buy_price)} × ${inv.quantity} · ${daysOpen(inv.buy_date)}d`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-50">
                    ${(inv.buy_price * inv.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400">{isOpt ? 'premium' : 'cost'}</p>
                </div>
              </button>
              )
            })}
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
                  const isOpt = (inv.investment_type ?? 'stock') === 'options'
                  const pnl = positionPnl(inv)
                  const closedLabel = isOpt
                    ? inv.is_expired ? 'Expired' : 'Closed'
                    : 'Closed'
                  const subtext = isOpt
                    ? inv.is_expired
                      ? `Premium $${fmtPx(inv.buy_price)} × ${inv.quantity} → Expired worthless`
                      : `Premium $${fmtPx(inv.buy_price)} → Buyback $${fmtPx(inv.sell_price!)} × ${inv.quantity}`
                    : `Buy $${fmtPx(inv.buy_price)} → Sell $${fmtPx(inv.sell_price!)} × ${inv.quantity}`
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-gray-50 font-mono">{inv.ticker}</span>
                          {isOpt && inv.option_type && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${inv.option_type === 'call' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                              {inv.option_type.toUpperCase()}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{closedLabel}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtext}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-semibold ${pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  const { transactions, categories, recurringExpenses } = useAppStore()
  const { removeTransaction, saveTransaction, restoreTransaction, editTransaction, saveRecurring, editRecurring } = useData()
  const { toast } = useToast()

  const now = new Date()
  const [tab, setTab] = useState<TabType>(() => {
    try { return (localStorage.getItem('txn-tab') as TabType) || 'expenses' } catch { return 'expenses' }
  })

  useEffect(() => {
    try { localStorage.setItem('txn-tab', tab) } catch {}
  }, [tab])
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [txEditMode, setTxEditMode] = useState(false)
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
        onClick: () => restoreTransaction(tx),
      },
    })
  }

  const handleDeleteAndStop = (tx: Transaction) => {
    removeTransaction(tx.id)
    if (tx.recurring_expense_id) {
      const existing = recurringExpenses.find((r) => r.id === tx.recurring_expense_id)
      if (existing) editRecurring({ ...existing, is_active: false, updated_at: nowSGT() })
    }
    setSelectedTx(null)
    toast('Transaction deleted and recurring schedule stopped', { type: 'info' })
  }

  const handleEditTx = async (data: Partial<Transaction> & { recurringFrequency: Frequency; recurringEndDate: string | null }) => {
    if (!selectedTx) return
    const { recurringFrequency, recurringEndDate, ...txData } = data
    const wasRecurring = selectedTx.is_recurring
    const isNowRecurring = txData.is_recurring ?? wasRecurring
    let recurringExpenseId = selectedTx.recurring_expense_id

    // Turning recurring ON — create a new RecurringExpense
    if (!wasRecurring && isNowRecurring && !recurringExpenseId) {
      const freq = recurringFrequency ?? 'monthly'
      const txDate = (txData.transaction_date ?? selectedTx.transaction_date).split('T')[0]
      const rec: RecurringExpense = {
        id: generateId(),
        user_id: selectedTx.user_id,
        name: (txData.description ?? selectedTx.description) || selectedTx.category?.name || 'Recurring',
        amount: selectedTx.amount,
        currency: selectedTx.currency,
        category_id: selectedTx.category_id,
        subcategory_id: selectedTx.subcategory_id ?? null,
        payment_method_id: txData.payment_method_id !== undefined ? txData.payment_method_id : selectedTx.payment_method_id,
        frequency: freq,
        next_payment_date: advanceDate(txDate, freq),
        end_date: recurringEndDate,
        is_active: true,
        auto_record: false,
        notes: null,
        created_at: nowSGT(),
        updated_at: nowSGT(),
        category: selectedTx.category,
      }
      await saveRecurring(rec)
      recurringExpenseId = rec.id
    }

    // Turning recurring OFF — deactivate existing
    if (wasRecurring && !isNowRecurring && selectedTx.recurring_expense_id) {
      const existing = recurringExpenses.find((r) => r.id === selectedTx.recurring_expense_id)
      if (existing) await editRecurring({ ...existing, is_active: false, updated_at: nowSGT() })
      recurringExpenseId = null
    }

    // Still recurring — update frequency or end_date if changed
    if (wasRecurring && isNowRecurring && selectedTx.recurring_expense_id) {
      const existing = recurringExpenses.find((r) => r.id === selectedTx.recurring_expense_id)
      if (existing) {
        const freqChanged = recurringFrequency && recurringFrequency !== existing.frequency
        const endDateChanged = recurringEndDate !== (existing.end_date ?? '')
        if (freqChanged || endDateChanged) {
          await editRecurring({
            ...existing,
            frequency: recurringFrequency ?? existing.frequency,
            end_date: recurringEndDate,
            updated_at: nowSGT(),
          })
        }
      }
    }

    await editTransaction(selectedTx.id, { ...txData, recurring_expense_id: recurringExpenseId })
    setSelectedTx(null)
    setTxEditMode(false)
    toast('Transaction updated', { type: 'success' })
  }

  const handleStopRecurring = async () => {
    if (!selectedTx?.recurring_expense_id) return
    const existing = recurringExpenses.find((r) => r.id === selectedTx.recurring_expense_id)
    if (existing) await editRecurring({ ...existing, is_active: false, updated_at: nowSGT() })
    setSelectedTx(null)
    setTxEditMode(false)
    toast('Recurring schedule stopped', { type: 'success' })
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

      {/* Detail / Edit Sheet */}
      <Sheet
        open={selectedTx !== null}
        onClose={() => { setSelectedTx(null); setTxEditMode(false) }}
        title={txEditMode ? 'Edit Transaction' : 'Transaction'}
      >
        {selectedTx && !txEditMode && (
          <TransactionDetail
            transaction={selectedTx}
            recurringFrequency={
              selectedTx.recurring_expense_id
                ? recurringExpenses.find((r) => r.id === selectedTx.recurring_expense_id)?.frequency
                : undefined
            }
            onEdit={() => setTxEditMode(true)}
            onDelete={() => handleDelete(selectedTx)}
            onDeleteAndStop={selectedTx.recurring_expense_id ? () => handleDeleteAndStop(selectedTx) : undefined}
            onClose={() => { setSelectedTx(null); setTxEditMode(false) }}
          />
        )}
        {selectedTx && txEditMode && (
          <EditTransactionForm
            transaction={selectedTx}
            onSave={handleEditTx}
            onStopRecurring={selectedTx.recurring_expense_id ? handleStopRecurring : undefined}
            onCancel={() => setTxEditMode(false)}
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
