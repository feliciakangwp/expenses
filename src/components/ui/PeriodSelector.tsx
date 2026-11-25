import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Transaction } from '@/types'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface PeriodSelectorProps {
  transactions: Transaction[]
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function PeriodSelector({ transactions, year, month, onChange }: PeriodSelectorProps) {
  const { years, monthsForYear } = useMemo(() => {
    const pairs = new Set<string>()
    const now = new Date()
    pairs.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    for (const t of transactions) {
      const d = t.transaction_date.split('T')[0]
      if (d) {
        const [y, m] = d.split('-')
        if (y && m) pairs.add(`${y}-${m}`)
      }
    }
    const sorted = [...pairs].sort()
    const ys = [...new Set(sorted.map(p => Number(p.split('-')[0])))].sort((a, b) => b - a)
    const mfy = sorted
      .filter(p => p.startsWith(String(year)))
      .map(p => Number(p.split('-')[1]))
      .sort((a, b) => b - a)
    return { years: ys, monthsForYear: mfy }
  }, [transactions, year])

  return (
    <div className="flex items-center gap-2 px-5 py-3">
      <div className="relative">
        <select
          value={year}
          onChange={e => {
            const y = Number(e.target.value)
            const availMonths = [...new Set(
              transactions
                .map(t => t.transaction_date.split('T')[0])
                .filter(d => d.startsWith(String(y)))
                .map(d => Number(d.split('-')[1]))
            )].sort((a, b) => b - a)
            const now = new Date()
            const newM = y === now.getFullYear() ? now.getMonth() + 1 : (availMonths[0] ?? 1)
            onChange(y, newM)
          }}
          className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-3 pr-8 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={month}
          onChange={e => onChange(year, Number(e.target.value))}
          className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-3 pr-8 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
        >
          {monthsForYear.map(m => (
            <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

export function periodToRange(year: number, month: number): { start: string; end: string } {
  const d = new Date(year, month - 1, 1)
  const start = format(startOfMonth(d), 'yyyy-MM-dd')
  const end = format(endOfMonth(d), 'yyyy-MM-dd')
  return { start, end }
}
