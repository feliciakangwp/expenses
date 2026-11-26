import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Transaction, Category, PaymentMethod, UserPreferences, Budget, Investment, RecurringExpense } from '@/types'
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
  investments: Investment[]
  recurringExpenses: RecurringExpense[]
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
  addCategory: (c: Category) => void
  updateCategory: (c: Category) => void
  removeCategory: (id: string) => void
  setPaymentMethods: (p: PaymentMethod[]) => void
  addPaymentMethod: (pm: PaymentMethod) => void
  removePaymentMethod: (id: string) => void
  setBudgets: (b: Budget[]) => void
  setBudgetForMonth: (year: number, month: number, amount: number) => void
  setInvestments: (invs: Investment[]) => void
  addInvestment: (inv: Investment) => void
  updateInvestment: (inv: Investment) => void
  removeInvestment: (id: string) => void
  setRecurringExpenses: (recs: RecurringExpense[]) => void
  addRecurringExpense: (r: RecurringExpense) => void
  updateRecurringExpense: (r: RecurringExpense) => void
  removeRecurringExpense: (id: string) => void
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
      investments: [],
      recurringExpenses: [],
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
      addCategory: (c) => set((s) => ({ categories: [...s.categories, c] })),
      updateCategory: (c) => set((s) => ({ categories: s.categories.map((x) => (x.id === c.id ? c : x)) })),
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((x) => x.id !== id) })),
      setPaymentMethods: (paymentMethods) => set({ paymentMethods }),
      addPaymentMethod: (pm) => set((s) => ({ paymentMethods: [...s.paymentMethods, pm] })),
      removePaymentMethod: (id) =>
        set((s) => ({ paymentMethods: s.paymentMethods.filter((p) => p.id !== id) })),
      setBudgets: (budgets) => set({ budgets }),
      setInvestments: (investments) => set({ investments }),
      addInvestment: (inv) => set((s) => ({ investments: [...s.investments, inv] })),
      updateInvestment: (inv) => set((s) => ({ investments: s.investments.map((i) => (i.id === inv.id ? inv : i)) })),
      removeInvestment: (id) => set((s) => ({ investments: s.investments.filter((i) => i.id !== id) })),
      setRecurringExpenses: (recurringExpenses) => set({ recurringExpenses }),
      addRecurringExpense: (r) => set((s) => ({ recurringExpenses: [...s.recurringExpenses, r] })),
      updateRecurringExpense: (r) => set((s) => ({ recurringExpenses: s.recurringExpenses.map((x) => (x.id === r.id ? r : x)) })),
      removeRecurringExpense: (id) => set((s) => ({ recurringExpenses: s.recurringExpenses.filter((x) => x.id !== id) })),
      setBudgetForMonth: (year, month, amount) =>
        set((s) => {
          const existing = s.budgets.find(
            (b) => !b.category_id && b.period === 'monthly' && b.year === year && b.month === month
          )
          if (existing) {
            return { budgets: s.budgets.map((b) => b.id === existing.id ? { ...b, amount, updated_at: new Date().toISOString() } : b) }
          }
          return {
            budgets: [...s.budgets, {
              id: `budget-${year}-${month}-${Date.now()}`,
              user_id: s.user?.id ?? 'demo-user',
              category_id: null,
              amount,
              period: 'monthly' as const,
              year,
              month,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }],
          }
        }),
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
          investments: [],
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
        budgets: s.isDemoMode ? s.budgets : [],
        investments: s.isDemoMode ? s.investments : [],
        recurringExpenses: s.isDemoMode ? s.recurringExpenses : [],
        paymentMethods: s.isDemoMode ? s.paymentMethods : [],
      }),
    }
  )
)
