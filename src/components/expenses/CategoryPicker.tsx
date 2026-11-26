import { useState } from 'react'
import { Pin } from 'lucide-react'
import type { Category } from '@/types'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/lib/utils'

interface CategoryPickerProps {
  categories: Category[]
  selected: Category | null
  onSelect: (cat: Category) => void
  recentIds?: string[]
}

export function CategoryPicker({ categories, selected, onSelect, recentIds = [] }: CategoryPickerProps) {
  const [showAll, setShowAll] = useState(false)

  const expenseCategories = categories.filter(
    (c) => !c.is_archived && c.transaction_type === 'expense'
  )

  const pinned = expenseCategories.filter((c) => c.is_pinned)
  const recent = expenseCategories.filter(
    (c) => !c.is_pinned && recentIds.includes(c.id)
  ).sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
  const rest = expenseCategories.filter(
    (c) => !c.is_pinned && !recentIds.includes(c.id)
  )

  const prioritised = [...pinned, ...recent, ...rest]
  const visible = showAll ? prioritised : prioritised.slice(0, 8)

  return (
    <div>
      <div className="grid grid-cols-4 md:grid-cols-6 gap-3 px-4">
        {visible.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all active:scale-95',
              selected?.id === cat.id
                ? 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-gray-900'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            )}
          >
            <div className="relative">
              <CategoryIcon icon={cat.icon} color={cat.color} size="md" />
              {cat.is_pinned && (
                <span className="absolute -top-1 -right-1 text-primary-500">
                  <Pin size={10} fill="currentColor" />
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium text-center text-gray-700 dark:text-gray-300 leading-tight line-clamp-2">
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {!showAll && prioritised.length > 8 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 w-full py-2 text-xs font-medium text-primary-600 dark:text-primary-400"
        >
          Show all categories
        </button>
      )}
    </div>
  )
}
