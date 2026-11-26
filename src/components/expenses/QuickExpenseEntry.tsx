import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Check, CreditCard, Calendar, MessageSquare, Plus } from 'lucide-react'
import type { Category, PaymentMethod, Subcategory } from '@/types'
import { NumericKeypad } from './NumericKeypad'
import { CategoryPicker } from './CategoryPicker'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { parseCentsFromString } from '@/lib/utils'

interface QuickExpenseEntryProps {
  categories: Category[]
  subcategories: Record<string, Subcategory[]>
  paymentMethods: PaymentMethod[]
  defaultPaymentMethodId?: string | null
  recentCategoryIds?: string[]
  onSave: (data: {
    category: Category
    subcategoryId: string | null
    amount: number
    paymentMethodId: string | null
    description: string
    transactionDate: string
    isNeeds: boolean | null
    isRecurring: boolean
    recurringFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual'
  }) => Promise<void>
}

export function QuickExpenseEntry({
  categories,
  subcategories,
  paymentMethods,
  defaultPaymentMethodId,
  recentCategoryIds = [],
  onSave,
}: QuickExpenseEntryProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [amount, setAmount] = useState('0')
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(defaultPaymentMethodId ?? null)
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFreq, setRecurringFreq] = useState<'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual'>('monthly')
  const [showMore, setShowMore] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const cents = parseCentsFromString(amount)
  const canSave = selectedCategory !== null && cents > 0

  const handleSave = async () => {
    if (!canSave || !selectedCategory) return
    setSaving(true)
    try {
      await onSave({
        category: selectedCategory,
        subcategoryId,
        amount: cents,
        paymentMethodId,
        description,
        transactionDate: `${transactionDate}T${format(new Date(), 'HH:mm:ss')}`,
        isNeeds: selectedCategory.is_needs,
        isRecurring,
        recurringFrequency: recurringFreq,
      })
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setAmount('0')
        setDescription('')
        setSubcategoryId(null)
        setTransactionDate(format(new Date(), "yyyy-MM-dd"))
        setIsRecurring(false)
        setShowMore(false)
      }, 1200)
    } finally {
      setSaving(false)
    }
  }

  const catSubcats = selectedCategory ? (subcategories[selectedCategory.id] ?? []) : []
  const visiblePaymentMethods = paymentMethods.filter((p) => !p.is_archived)

  return (
    <div className="flex flex-col gap-4">
      {/* Category Picker */}
      <div>
        <p className="px-5 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Category
        </p>
        <CategoryPicker
          categories={categories}
          selected={selectedCategory}
          onSelect={(cat) => {
            setSelectedCategory(cat)
            setSubcategoryId(null)
          }}
          recentIds={recentCategoryIds}
        />
      </div>

      {/* Amount Display — mobile only */}
      <div className="md:hidden px-5 text-center">
        <div
          className={cn(
            'text-5xl font-bold tracking-tight transition-colors',
            cents === 0
              ? 'text-gray-300 dark:text-gray-700'
              : 'text-gray-900 dark:text-gray-50'
          )}
        >
          <span className="text-2xl font-semibold text-gray-400 mr-1">$</span>
          {amount === '0' ? '0.00' : amount}
        </div>
      </div>

      {/* Amount Input — desktop only */}
      <div className="hidden md:block px-5">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount === '0' ? '' : amount}
            onChange={(e) => setAmount(e.target.value || '0')}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="0.00"
            className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-3 text-3xl font-bold text-gray-900 dark:text-gray-50 placeholder-gray-300 dark:placeholder-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50"
            autoFocus
          />
        </div>
        <p className="text-xs text-gray-400 text-center mt-1.5">Type amount · Press <kbd className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-[10px] font-mono">↵</kbd> to save</p>
      </div>

      {/* Keypad — mobile only */}
      <div className="md:hidden">
        <NumericKeypad value={amount} onChange={setAmount} />
      </div>

      {/* Payment Method — always visible */}
      <div className="px-5">
        <label className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          <CreditCard size={12} />
          Payment method
        </label>
        <div className="flex flex-wrap gap-2">
          {visiblePaymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => setPaymentMethodId(pm.id === paymentMethodId ? null : pm.id)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-sm font-medium transition-all',
                paymentMethodId === pm.id
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              )}
            >
              {pm.name}
            </button>
          ))}
          {visiblePaymentMethods.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-1">No cards added — add one in Settings</p>
          )}
        </div>
      </div>

      {/* More Details Toggle */}
      <div className="px-5">
        <button
          onClick={() => setShowMore(!showMore)}
          className="md:hidden flex w-full items-center justify-between py-2 text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          <span>{showMore ? 'Less details' : 'More details'}</span>
          {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 pb-2">
                {/* Subcategory */}
                {catSubcats.length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Subcategory
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {catSubcats.map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => setSubcategoryId(sc.id === subcategoryId ? null : sc.id)}
                          className={cn(
                            'rounded-xl px-3 py-1.5 text-sm font-medium transition-all',
                            subcategoryId === sc.id
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          )}
                        >
                          {sc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="relative">
                  <MessageSquare size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Date */}
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Recurring */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isRecurring ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isRecurring && <Check size={10} className="text-white" />}
                    </div>
                    Recurring
                  </button>
                  {isRecurring && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setRecurringFreq(f)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all capitalize ${recurringFreq === f ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Button */}
      <div className="px-5 pb-4">
        <Button
          onClick={handleSave}
          disabled={!canSave}
          loading={saving}
          size="lg"
          className={cn(
            'w-full text-base transition-all duration-300',
            saved && 'bg-emerald-500 hover:bg-emerald-500'
          )}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="saved"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Check size={20} />
                Saved!
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {canSave
                  ? `Save $${amount === '0' ? '0.00' : amount}`
                  : selectedCategory
                  ? 'Enter amount'
                  : 'Select a category'}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  )
}
