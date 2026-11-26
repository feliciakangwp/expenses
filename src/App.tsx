import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav, SideNav } from '@/components/layout/AppNav'
import { ToastProvider } from '@/components/ui/Toast'
import { Home } from '@/pages/Home'
import { Transactions } from '@/pages/Transactions'
import { Insights } from '@/pages/Insights'
import { Budget } from '@/pages/Budget'
import { Settings } from '@/pages/Settings'
import { Auth } from '@/pages/Auth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { UpdateBanner } from '@/components/ui/UpdateBanner'

const COLOR_PALETTES: Record<string, Record<string, string>> = {
  purple: { '50':'#f5f3ff','100':'#ede9fe','200':'#ddd6fe','300':'#c4b5fd','400':'#a78bfa','500':'#8b5cf6','600':'#7c3aed','700':'#6d28d9','800':'#5b21b6','900':'#4c1d95','950':'#2e1065' },
  red:    { '50':'#fef2f2','100':'#fee2e2','200':'#fecaca','300':'#fca5a5','400':'#f87171','500':'#ef4444','600':'#dc2626','700':'#b91c1c','800':'#991b1b','900':'#7f1d1d','950':'#450a0a' },
  blue:   { '50':'#f0f5f9','100':'#dde8f1','200':'#c1d5e6','300':'#9dbfda','400':'#89afcc','500':'#7b9bb5','600':'#6a89a2','700':'#56758e','800':'#43607a','900':'#324b60','950':'#1e3040' },
  green:  { '50':'#f0fdf4','100':'#dcfce7','200':'#bbf7d0','300':'#86efac','400':'#4ade80','500':'#22c55e','600':'#16a34a','700':'#15803d','800':'#166534','900':'#14532d','950':'#052e16' },
  yellow: { '50':'#fffbeb','100':'#fef3c7','200':'#fde68a','300':'#fcd34d','400':'#fbbf24','500':'#f59e0b','600':'#d97706','700':'#b45309','800':'#92400e','900':'#78350f','950':'#451a03' },
  orange: { '50':'#fff7ed','100':'#ffedd5','200':'#fed7aa','300':'#fdba74','400':'#fb923c','500':'#f97316','600':'#ea580c','700':'#c2410c','800':'#9a3412','900':'#7c2d12','950':'#431407' },
}

function AppContent() {
  const { user, isDemoMode, theme, accentColor } = useAppStore()
  useAuth()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  useEffect(() => {
    const palette = COLOR_PALETTES[accentColor] ?? COLOR_PALETTES.purple
    Object.entries(palette).forEach(([shade, value]) => {
      document.documentElement.style.setProperty(`--color-primary-${shade}`, value)
    })
  }, [accentColor])

  const isAuthenticated = isDemoMode || Boolean(user)

  if (!isAuthenticated) {
    return <Auth />
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <UpdateBanner />
      {/* Sidebar — desktop */}
      <SideNav />

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-0 overflow-x-hidden">
        {/* On desktop, constrain width for readability */}
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Bottom nav — mobile */}
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/expenses">
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  )
}
