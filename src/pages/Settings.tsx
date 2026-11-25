import { useState } from 'react'
import { Moon, Sun, Monitor, Eye, EyeOff, LogOut, User, CreditCard, Trash2, Info, Shield, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/app'
import type { AccentColor } from '@/store/app'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { cn, generateId } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Settings() {
  const {
    user, isDemoMode, theme, setTheme, privacyMode, setPrivacyMode,
    accentColor, setAccentColor, paymentMethods, addPaymentMethod, removePaymentMethod,
  } = useAppStore()
  const { signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCardName, setNewCardName] = useState('')

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  const handleAddCard = () => {
    if (!newCardName.trim()) return
    addPaymentMethod({
      id: generateId(),
      user_id: user?.id ?? 'demo-user',
      name: newCardName.trim(),
      icon: 'credit-card',
      sort_order: paymentMethods.length + 1,
      is_default: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setNewCardName('')
    setShowAddCard(false)
  }

  const THEMES = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  const ACCENT_COLORS = [
    { value: 'purple' as AccentColor, bg: 'bg-violet-600', label: 'Purple' },
    { value: 'red' as AccentColor,    bg: 'bg-red-600',    label: 'Red' },
    { value: 'blue' as AccentColor,   bg: 'bg-blue-600',   label: 'Blue' },
    { value: 'green' as AccentColor,  bg: 'bg-green-600',  label: 'Green' },
    { value: 'yellow' as AccentColor, bg: 'bg-amber-500',  label: 'Yellow' },
    { value: 'orange' as AccentColor, bg: 'bg-orange-600', label: 'Orange' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader title="Settings" />

      <div className="px-5 md:max-w-lg flex flex-col gap-4">
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

        {/* Accent Color */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Accent Color</h3>
          <div className="grid grid-cols-6 gap-3">
            {ACCENT_COLORS.map(({ value, bg, label }) => (
              <button
                key={value}
                onClick={() => setAccentColor(value)}
                title={label}
                className={cn(
                  'h-9 w-full rounded-xl transition-all',
                  bg,
                  accentColor === value && 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110'
                )}
              />
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Methods</h3>
            <button
              onClick={() => setShowAddCard(true)}
              className="text-xs font-medium text-primary-600 dark:text-primary-400"
            >
              + Add
            </button>
          </div>
          {paymentMethods.filter(p => !p.is_archived).length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No cards added yet</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {paymentMethods.filter(p => !p.is_archived).map((pm) => (
                <div key={pm.id} className="flex items-center gap-3 px-4 py-3">
                  <CreditCard size={16} className="text-gray-400" />
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{pm.name}</span>
                  <button
                    onClick={() => removePaymentMethod(pm.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {showAddCard && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  value={newCardName}
                  onChange={e => setNewCardName(e.target.value)}
                  placeholder="Card name (e.g. DBS Visa)"
                  onKeyDown={e => e.key === 'Enter' && handleAddCard()}
                  className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/50"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddCard} disabled={!newCardName.trim()}>Add</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Data */}
        {!isDemoMode && (
          <Card>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {[
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
