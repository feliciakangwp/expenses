import { useState } from 'react'
import { Trash2, Edit3, Copy, Calendar, CreditCard, Tag, Store, MessageSquare, RefreshCw } from 'lucide-react'
import type { Transaction } from '@/types'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import { Button } from '@/components/ui/Button'
import { formatDate, formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TransactionDetailProps {
  transaction: Transaction
  recurringFrequency?: string
  onEdit?: () => void
  onDelete?: () => void
  onDeleteAndStop?: () => void
  onDuplicate?: () => void
  onClose: () => void
}

export function TransactionDetail({ transaction: t, recurringFrequency, onEdit, onDelete, onDeleteAndStop, onDuplicate, onClose }: TransactionDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const cat = t.category

  if (!cat) return null

  const isIncome = t.type === 'income'
  const isInvestment = t.type === 'investment' || t.type === 'savings'

  const rows = [
    t.merchant && { icon: Store, label: 'Merchant', value: t.merchant },
    t.payment_method && { icon: CreditCard, label: 'Payment', value: t.payment_method.name },
    { icon: Calendar, label: 'Date', value: `${formatDate(t.transaction_date)} · ${formatTime(t.transaction_date)}` },
    t.description && { icon: MessageSquare, label: 'Description', value: t.description },
    t.is_recurring && { icon: RefreshCw, label: 'Recurring', value: recurringFrequency ? recurringFrequency.charAt(0).toUpperCase() + recurringFrequency.slice(1) : 'Yes' },
    t.notes && { icon: Tag, label: 'Notes', value: t.notes },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[]

  return (
    <div className="px-5 pb-8">
      {/* Header */}
      <div className="flex flex-col items-center py-6 gap-3">
        <CategoryIcon icon={cat.icon} color={cat.color} size="lg" />
        <div className="text-center">
          <AmountDisplay
            cents={t.amount}
            currency={t.currency}
            size="xl"
            color={isIncome || isInvestment ? 'green' : 'default'}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cat.name}</p>
          {t.description && <p className="text-base font-medium text-gray-800 dark:text-gray-200 mt-0.5">{t.description}</p>}
        </div>
      </div>

      {/* Detail Rows */}
      {rows.length > 0 && (
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700/50 mb-5">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Icon size={14} />
                <span className="text-sm">{label}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recurring delete note */}
      {confirmDelete && t.is_recurring && (
        <div className="mb-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-4 py-3">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-0.5">Recurring schedule not affected</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">Only this transaction will be deleted. Future payments will continue as scheduled.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {onDuplicate && (
            <Button variant="secondary" size="sm" onClick={onDuplicate} className="flex-1 gap-1.5">
              <Copy size={14} />
              Duplicate
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={onEdit} className="flex-1 gap-1.5">
              <Edit3 size={14} />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant={confirmDelete ? 'danger' : 'ghost'}
              size="sm"
              onClick={() => {
                if (confirmDelete) {
                  onDelete()
                  onClose()
                } else {
                  setConfirmDelete(true)
                  setTimeout(() => setConfirmDelete(false), 3000)
                }
              }}
              className={cn('gap-1.5', !onEdit && !onDuplicate && 'flex-1')}
            >
              <Trash2 size={14} />
              {confirmDelete ? 'Delete this only' : 'Delete'}
            </Button>
          )}
        </div>

        {/* Delete + stop recurring — shown only in confirm state for recurring transactions */}
        {confirmDelete && t.is_recurring && onDeleteAndStop && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => { onDeleteAndStop(); onClose() }}
            className="w-full gap-1.5"
          >
            <Trash2 size={14} />
            Delete + stop recurring schedule
          </Button>
        )}
      </div>
    </div>
  )
}
