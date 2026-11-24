import { useState } from 'react'
import { Moon, Sun, Monitor, Eye, EyeOff, LogOut, User, CreditCard, ChevronRight, Info, Shield } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Settings() {
  const { user, isDemoMode, theme, setTheme, privacyMode, setPrivacyMode } = useAppStore()
  const { signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  const THEMES = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <PageHeader title="Settings" />

      <div className="px-5 flex flex-col gap-4">
        {/* Profile */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <User size={22} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              {isDemoMode ? (
                <>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">Demo Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Data is not saved</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">
                    {user?.user_metadata?.full_name ?? 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Appearance</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all',
                  theme === value
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                )}
              >
                <Icon size={18} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {privacyMode ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
              <span className="text-sm text-gray-700 dark:text-gray-300">Privacy Mode</span>
            </div>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                privacyMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                  privacyMode ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </Card>

        {/* Data */}
        {!isDemoMode && (
          <Card>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {[
                { icon: CreditCard, label: 'Payment Methods', action: () => {} },
                { icon: Shield, label: 'Security', action: () => {} },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <Icon size={18} className="text-gray-500 dark:text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 text-left">{label}</span>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Demo Mode Info */}
        {isDemoMode && (
          <Card className="p-4">
            <div className="flex gap-3">
              <Info size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Demo Mode Active</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You're viewing sample data. Connect Supabase to save real transactions across devices.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* App Info */}
        <Card className="p-4">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Expenses</span>
            <span>v1.0.0</span>
          </div>
        </Card>

        {/* Sign Out */}
        {!isDemoMode && (
          <Button
            variant="ghost"
            size="lg"
            onClick={handleSignOut}
            loading={signingOut}
            className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
          >
            <LogOut size={18} />
            Sign Out
          </Button>
        )}
      </div>
    </div>
  )
}
