import { NavLink } from 'react-router-dom'
import { Home, List, BarChart2, Target, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/transactions', icon: List, label: 'Transactions' },
  { to: '/insights', icon: BarChart2, label: 'Insights' },
  { to: '/budget', icon: Target, label: 'Budget' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

// Bottom nav — mobile only
export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-colors min-w-[56px]',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl transition-all', isActive && 'bg-primary-100 dark:bg-primary-900/40')}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                </div>
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// Sidebar nav — desktop only
export function SideNav() {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-30 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-8">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
          <span className="text-xl">💰</span>
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-gray-50 leading-tight">Expenses</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Personal Finance</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Menu</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-150 text-sm font-medium',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 pb-6">
        <p className="text-xs text-gray-300 dark:text-gray-700">v1.0.0</p>
      </div>
    </aside>
  )
}
