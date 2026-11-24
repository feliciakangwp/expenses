import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { AmountDisplay } from '@/components/ui/AmountDisplay'
import type { Transaction } from '@/types'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TransactionItemProps {
  transaction: Transaction
  onClick?: () => void
}

export function TransactionItem({ transaction: t, onClick }: TransactionItemProps) {
  const isIncome = t.type === 'income'
  const isInvestment = t.type === 'investment' || t.type === 'savings'
  const cat = t.category

  if (!cat) return null

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors text-left"
    >
      <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
          {t.description || t.merchant || cat.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(t.transaction_date)}</span>
          {t.payment_method && (
            <>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{t.payment_method.name}</span>
            </>
          )}
        </div>
      </div>

      <AmountDisplay
        cents={t.amount}
        currency={t.currency}
        size="md"
        color={isIncome || isInvestment ? 'green' : 'default'}
        showSign={isIncome || isInvestment}
      />
    </button>
  )
}
