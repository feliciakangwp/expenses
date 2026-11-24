import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NumericKeypadProps {
  value: string
  onChange: (val: string) => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']

export function NumericKeypad({ value, onChange }: NumericKeypadProps) {
  const handleKey = (key: string) => {
    if (key === 'del') {
      onChange(value.slice(0, -1) || '0')
      return
    }
    if (value === '0' && key !== '.') {
      onChange(key)
      return
    }
    if (key === '.' && value.includes('.')) return
    const parts = value.split('.')
    if (parts[1] !== undefined && parts[1].length >= 2) return
    if (value.replace('.', '').length >= 10) return
    onChange(value + key)
  }

  return (
    <div className="grid grid-cols-3 gap-2 px-2">
      {KEYS.map((key) => (
        <button
          key={key}
          onPointerDown={(e) => {
            e.preventDefault()
            handleKey(key)
          }}
          className={cn(
            'flex h-14 items-center justify-center rounded-2xl text-xl font-semibold transition-all active:scale-95',
            key === 'del'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              : 'bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          {key === 'del' ? <Delete size={20} /> : key}
        </button>
      ))}
    </div>
  )
}
