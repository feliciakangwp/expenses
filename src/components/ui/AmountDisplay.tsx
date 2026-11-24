import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'

interface AmountDisplayProps {
  cents: number
  currency?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'default' | 'muted' | 'green' | 'red'
  showSign?: boolean
  forcePrivacy?: boolean
}

export function AmountDisplay({
  cents,
  currency = 'SGD',
  className,
  size = 'md',
  color = 'default',
  showSign = false,
  forcePrivacy = false,
}: AmountDisplayProps) {
  const privacyMode = useAppStore((s) => s.privacyMode)
  const hidden = privacyMode || forcePrivacy

  const amount = cents / 100
  const formatted = hidden
    ? '••••'
    : new Intl.NumberFormat('en-SG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Math.abs(amount))

  const sign = showSign && cents > 0 ? '+' : cents < 0 ? '−' : ''

  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
          'text-xl': size === 'lg',
          'text-3xl': size === 'xl',
        },
        {
          'text-gray-900 dark:text-gray-50': color === 'default',
          'text-gray-500 dark:text-gray-400': color === 'muted',
          'text-emerald-600 dark:text-emerald-400': color === 'green',
          'text-red-500 dark:text-red-400': color === 'red',
        },
        className
      )}
    >
      {sign}{formatted}
    </span>
  )
}
