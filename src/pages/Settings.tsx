import { useState } from 'react'
import { Moon, Sun, Monitor, Eye, EyeOff, LogOut, User, CreditCard, Trash2, Info, Shield, ChevronRight, Pencil, Plus, Check, X, Utensils, Car, Home, ShoppingBag, Dumbbell, HeartPulse, Sparkles, Laptop, Plane, Gamepad2, BookOpen, Users, HandHeart, ShieldIcon, Landmark, CircleEllipsis, Banknote, TrendingUp, Coffee, Gift, Baby, PawPrint, Zap, Music, Camera, Briefcase, Bus, Bike, Pizza, Wine, Film, ShoppingCart, Package, Stethoscope, Pill, Scissors, Shirt, Tv, Wifi, Phone, GraduationCap, Building2, Trees, Star, Heart, Wallet, PiggyBank, Receipt, Tag } from 'lucide-react'
import { useAppStore } from '@/store/app'
import type { AccentColor } from '@/store/app'
import type { Category } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { cn, generateId, nowSGT } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'

const ICON_OPTIONS: { name: string; Icon: React.ElementType }[] = [
  { name: 'utensils', Icon: Utensils }, { name: 'coffee', Icon: Coffee }, { name: 'pizza', Icon: Pizza },
  { name: 'wine', Icon: Wine }, { name: 'car', Icon: Car }, { name: 'bus', Icon: Bus },
  { name: 'bike', Icon: Bike }, { name: 'plane', Icon: Plane }, { name: 'home', Icon: Home },
  { name: 'building-2', Icon: Building2 }, { name: 'zap', Icon: Zap }, { name: 'wifi', Icon: Wifi },
  { name: 'phone', Icon: Phone }, { name: 'laptop', Icon: Laptop }, { name: 'tv', Icon: Tv },
  { name: 'shopping-bag', Icon: ShoppingBag }, { name: 'shopping-cart', Icon: ShoppingCart },
  { name: 'shirt', Icon: Shirt }, { name: 'package', Icon: Package }, { name: 'dumbbell', Icon: Dumbbell },
  { name: 'heart-pulse', Icon: HeartPulse }, { name: 'stethoscope', Icon: Stethoscope },
  { name: 'pill', Icon: Pill }, { name: 'sparkles', Icon: Sparkles }, { name: 'scissors', Icon: Scissors },
  { name: 'book-open', Icon: BookOpen }, { name: 'graduation-cap', Icon: GraduationCap },
  { name: 'gamepad-2', Icon: Gamepad2 }, { name: 'film', Icon: Film }, { name: 'music', Icon: Music },
  { name: 'camera', Icon: Camera }, { name: 'users', Icon: Users }, { name: 'baby', Icon: Baby },
  { name: 'gift', Icon: Gift }, { name: 'paw-print', Icon: PawPrint }, { name: 'trees', Icon: Trees },
  { name: 'hand-heart', Icon: HandHeart }, { name: 'shield', Icon: ShieldIcon }, { name: 'landmark', Icon: Landmark },
  { name: 'banknote', Icon: Banknote }, { name: 'trending-up', Icon: TrendingUp }, { name: 'piggy-bank', Icon: PiggyBank },
  { name: 'wallet', Icon: Wallet }, { name: 'receipt', Icon: Receipt }, { name: 'briefcase', Icon: Briefcase },
  { name: 'tag', Icon: Tag }, { name: 'star', Icon: Star }, { name: 'heart', Icon: Heart },
  { name: 'circle-ellipsis', Icon: CircleEllipsis },
]

const COLOR_OPTIONS = [
  '#f97316','#ef4444','#ec4899','#f43f5e','#a855f7','#8b5cf6','#6366f1',
  '#3b82f6','#0ea5e9','#06b6d4','#10b981','#22c55e','#84cc16','#eab308',
  '#f59e0b','#78716c','#64748b','#94a3b8',
]

export function Settings() {
  const {
    user, isDemoMode, theme, setTheme, privacyMode, setPrivacyMode,
    accentColor, setAccentColor, paymentMethods, categories,
  } = useAppStore()
  const { signOut } = useAuth()
  const { savePaymentMethod, deletePaymentMethod, savePreferences, saveCategory, editCategory, deleteCategory } = useData()
  const [signingOut, setSigningOut] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCardName, setNewCardName] = useState('')

  // Categories state
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', icon: 'circle-ellipsis', color: '#6366f1', type: 'expense' as 'expense' | 'income' })
  const [showIconPicker, setShowIconPicker] = useState(false)

  const expenseCategories = categories.filter((c) => !c.is_archived && c.transaction_type === 'expense')

  const openAddCat = () => {
    setEditingCat(null)
    setCatForm({ name: '', icon: 'circle-ellipsis', color: '#6366f1', type: 'expense' })
    setShowCatForm(true)
    setShowIconPicker(false)
  }

  const openEditCat = (cat: Category) => {
    setEditingCat(cat)
    setCatForm({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.transaction_type as 'expense' | 'income' })
    setShowCatForm(true)
    setShowIconPicker(false)
  }

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return
    const base = {
      user_id: user?.id ?? 'demo-user',
      name: catForm.name.trim(),
      icon: catForm.icon,
      color: catForm.color,
      transaction_type: catForm.type as Category['transaction_type'],
      is_needs: null,
      is_fixed: null,
      monthly_budget: null,
      is_archived: false,
      is_system: false,
      is_pinned: false,
    }
    if (editingCat) {
      await editCategory({ ...editingCat, ...base, updated_at: nowSGT() })
    } else {
      const existing = categories.filter((c) => c.transaction_type === catForm.type)
      await saveCategory({
        ...base,
        id: generateId(),
        sort_order: existing.length + 1,
        created_at: nowSGT(),
        updated_at: nowSGT(),
      })
    }
    setShowCatForm(false)
    setEditingCat(null)
  }

  const handleDeleteCat = async (cat: Category) => {
    if (!window.confirm(`Delete "${cat.name}"? Existing transactions won't be affected.`)) return
    await deleteCategory(cat.id)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  const handleAddCard = async () => {
    if (!newCardName.trim()) return
    await savePaymentMethod({
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

      <div className="px-5 md:px-8 pb-8 max-w-5xl mx-auto">
        {/* Profile — full width */}
        <Card className="p-4 mb-4">
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

        {/* Two-column grid on desktop */}
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6 md:items-start mb-4">
          {/* Left column: Appearance + Accent Color */}
          <div className="flex flex-col gap-4">
            {/* Appearance */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Appearance</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {THEMES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setTheme(value); savePreferences({ theme: value }) }}
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
                    onClick={() => { setAccentColor(value); savePreferences({ accentColor: value }) }}
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
          </div>

          {/* Right column: Payment Methods + Categories */}
          <div className="flex flex-col gap-4">
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
                        onClick={() => deletePaymentMethod(pm.id)}
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

            {/* Categories */}
            <Card>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Categories</h3>
                <button onClick={openAddCat} className="text-xs font-medium text-primary-600 dark:text-primary-400">+ Add</button>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-800/50 mt-1">
                {expenseCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{cat.name}</span>
                    <button onClick={() => openEditCat(cat)} className="text-gray-300 dark:text-gray-600 hover:text-primary-500 transition-colors mr-1">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteCat(cat)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {expenseCategories.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">No expense categories yet</div>
                )}
              </div>

              {showCatForm && (
                <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    {editingCat ? 'Edit Category' : 'New Category'}
                  </p>

                  <input
                    value={catForm.name}
                    onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Category name"
                    className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/50 mb-3"
                    autoFocus
                  />

                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setShowIconPicker((v) => !v)}
                      className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <CategoryIcon icon={catForm.icon} color={catForm.color} size="sm" />
                      <span className="text-xs">Icon</span>
                    </button>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCatForm((f) => ({ ...f, color: c }))}
                          className={cn(
                            'h-6 w-6 rounded-full transition-all',
                            catForm.color === c && 'ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 scale-110'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {showIconPicker && (
                    <div className="grid grid-cols-8 gap-1.5 mb-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800">
                      {ICON_OPTIONS.map(({ name, Icon }) => (
                        <button
                          key={name}
                          onClick={() => { setCatForm((f) => ({ ...f, icon: name })); setShowIconPicker(false) }}
                          className={cn(
                            'flex items-center justify-center h-8 w-8 rounded-lg transition-all',
                            catForm.icon === name
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                        >
                          <Icon size={16} />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveCat} disabled={!catForm.name.trim()} className="flex-1 gap-1">
                      <Check size={14} /> {editingCat ? 'Save' : 'Add'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setShowCatForm(false); setEditingCat(null) }} className="gap-1">
                      <X size={14} /> Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Bottom section — full width, constrained on desktop */}
        <div className="flex flex-col gap-4 md:max-w-md">
          {/* Security */}
          {!isDemoMode && (
            <Card>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                <button
                  onClick={() => {}}
                  className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <Shield size={18} className="text-gray-500 dark:text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 text-left">Security</span>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </button>
              </div>
            </Card>
          )}

          {/* Demo Mode Info */}
          {isDemoMode && (
            <Card className="p-4">
              <div className="flex gap-3">
                <Info size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Demo Mode Active</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    You're viewing sample data. Sign in to save your real transactions across devices.
                  </p>
                  {isSupabaseConfigured && (
                    <Button
                      size="sm"
                      onClick={() => {
                        useAppStore.getState().reset()
                        window.location.reload()
                      }}
                      className="w-full"
                    >
                      Sign in / Create account
                    </Button>
                  )}
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
    </div>
  )
}
