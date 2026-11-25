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

function AppContent() {
  const { user, isDemoMode, theme } = useAppStore()
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

  const isAuthenticated = isDemoMode || Boolean(user)

  if (!isAuthenticated) {
    return <Auth />
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar — desktop */}
      <SideNav />

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-0">
        {/* On desktop, constrain width for readability */}
        <div className="max-w-4xl mx-auto">
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
