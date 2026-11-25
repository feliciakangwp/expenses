import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Transaction, Category, PaymentMethod, UserPreferences, Budget } from '@/types'
import { DEMO_CATEGORIES, DEMO_TRANSACTIONS, DEMO_PAYMENT_METHODS, DEMO_BUDGETS, enrichDemoTransactions } from '@/data/demo'
import { isSupabaseConfigured } from '@/lib/supabase'

export type AccentColor = 'purple' | 'red' | 'blue' | 'green' | 'yellow' | 'orange'

interface AppState {
  // Auth
  user: User | null
  isDemoMode: boolean

  // Data
  transactions: Transaction[]
  categories: Category[]
  paymentMethods: PaymentMethod[]
  budgets: Budget[]
  preferences: UserPreferences | null

  // UI
  privacyMode: boolean
  theme: 'light' | 'dark' | 'system'
  accentColor: AccentColor
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  setDemoMode: (val: boolean) => void
  setTransactions: (t: Transaction[]) => void
  addTransaction: (t: Transaction) => void
  updateTransaction: (t: Transaction) => void
  deleteTransaction: (id: string) => void
  setCategories: (c: Category[]) => void
  setPaymentMethods: (p: PaymentMethod[]) => void
  addPaymentMethod: (pm: PaymentMethod) => void
  removePaymentMethod: (id: string) => void
  setBudgets: (b: Budget[]) => void
  setPreferences: (p: UserPreferences) => void
  setPrivacyMode: (val: boolean) => void
  setTheme: (t: 'light' | 'dark' | 'system') => void
  setAccentColor: (c: AccentColor) => void
  setLoading: (val: boolean) => void
  loadDemoData: () => void
  reset: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isDemoMode: !isSupabaseConfigured,
      transactions: [],
      categories: [],
      paymentMethods: [],
      budgets: [],
      preferences: null,
      privacyMode: false,
      theme: 'system',
      accentColor: 'purple',
      isLoading: false,

      setUser: (user) => set({ user }),
      setDemoMode: (val) => set({ isDemoMode: val }),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
      updateTransaction: (t) =>
        set((s) => ({
          transactions: s.transactions.map((tx) => (tx.id === t.id ? t : tx)),
        })),
      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((tx) => tx.id !== id),
        })),
      setCategories: (categories) => set({ categories }),
      setPaymentMethods: (paymentMethods) => set({ paymentMethods }),
      addPaymentMethod: (pm) => set((s) => ({ paymentMethods: [...s.paymentMethods, pm] })),
      removePaymentMethod: (id) =>
        set((s) => ({ paymentMethods: s.paymentMethods.filter((p) => p.id !== id) })),
      setBudgets: (budgets) => set({ budgets }),
      setPreferences: (preferences) => set({ preferences }),
      setPrivacyMode: (privacyMode) => set({ privacyMode }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setLoading: (isLoading) => set({ isLoading }),

      loadDemoData: () =>
        set({
          isDemoMode: true,
          categories: DEMO_CATEGORIES,
          paymentMethods: DEMO_PAYMENT_METHODS,
          transactions: enrichDemoTransactions(DEMO_TRANSACTIONS),
          budgets: DEMO_BUDGETS,
          preferences: {
            id: 'demo-pref',
            user_id: 'demo-user',
            default_currency: 'SGD',
            default_payment_method_id: null,
            privacy_mode: false,
            theme: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),

      reset: () =>
        set({
          user: null,
          isDemoMode: !isSupabaseConfigured,
          transactions: [],
          categories: [],
          paymentMethods: [],
          budgets: [],
          preferences: null,
        }),
    }),
    {
      name: 'expenses-app',
      partialize: (s) => ({
        privacyMode: s.privacyMode,
        theme: s.theme,
        accentColor: s.accentColor,
        isDemoMode: s.isDemoMode,
      }),
    }
  )
)
