import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav } from '@/components/layout/BottomNav'
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

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      if (mq.matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  const isAuthenticated = isDemoMode || Boolean(user)

  if (!isAuthenticated && isSupabaseConfigured) {
    return <Auth />
  }

  if (!isAuthenticated && !isSupabaseConfigured) {
    // Auto-load demo if not configured
    return <Auth />
  }

  return (
    <div className="max-w-md mx-auto relative">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
