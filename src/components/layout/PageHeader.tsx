import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, right, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-5 pb-4 page-safe-top md:pt-8', className)}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}
