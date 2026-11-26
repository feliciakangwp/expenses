import { useCallback, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import type { AccentColor } from '@/store/app'
import type { Transaction, Category, PaymentMethod, Investment, RecurringExpense } from '@/types'
import { generateId, nowSGT } from '@/lib/utils'
import { DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES } from '@/data/categories'

export function useData() {
  const {
    user, isDemoMode,
    setTransactions, setCategories, setPaymentMethods, setBudgets,
    setInvestments, setRecurringExpenses,
    addTransaction, updateTransaction, deleteTransaction,
    addCategory, updateCategory, removeCategory,
    addPaymentMethod, removePaymentMethod,
    addInvestment, updateInvestment, removeInvestment,
    addRecurringExpense, updateRecurringExpense, removeRecurringExpense,
    setTheme, setAccentColor,
    setLoading, loadDemoData,
  } = useAppStore()

  const fetchAll = useCallback(async () => {
    if (isDemoMode || !isSupabaseConfigured || !user) return

    setLoading(true)
    try {
      const [catRes, txRes, pmRes, budgetRes, invRes, recRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id).eq('is_archived', false).order('sort_order'),
        supabase.from('transactions').select('*, category:categories(*), payment_method:payment_methods(*)').eq('user_id', user.id).order('transaction_date', { ascending: false }).limit(500),
        supabase.from('payment_methods').select('*').eq('user_id', user.id).eq('is_archived', false).order('sort_order'),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('recurring_expenses').select('*').eq('user_id', user.id).eq('is_active', true),
      ])

      let cats = catRes.data as Category[] | null
      if (!cats || cats.length === 0) {
        const toInsert = DEFAULT_CATEGORIES
          .filter((c) => c.transaction_type === 'expense' || c.transaction_type === 'income')
          .map((c, i) => ({ id: generateId(), user_id: user!.id, ...c, is_system: false, sort_order: i + 1, created_at: nowSGT(), updated_at: nowSGT() }))
        const { data: inserted } = await supabase.from('categories').insert(toInsert as any).select('*')
        cats = inserted as Category[] | null
      }
      if (cats) setCategories(cats)
      if (txRes.data) setTransactions(txRes.data as Transaction[])
      if (pmRes.data) setPaymentMethods(pmRes.data as PaymentMethod[])
      if (budgetRes.data) setBudgets(budgetRes.data)
      if (invRes.data) setInvestments(invRes.data as Investment[])
      if (recRes.data) setRecurringExpenses(recRes.data as RecurringExpense[])

      // Load theme/accentColor from user metadata
      const meta = user.user_metadata
      if (meta?.theme) setTheme(meta.theme)
      if (meta?.accentColor) setAccentColor(meta.accentColor as AccentColor)
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, user, setCategories, setTransactions, setPaymentMethods, setBudgets, setLoading])

  const saveTransaction = useCallback(
    async (data: {
      categoryId: string
      subcategoryId: string | null
      amount: number
      currency?: string
      paymentMethodId: string | null
      description: string
      merchant?: string
      transactionDate: string
      notes: string
      isNeeds: boolean | null
      type?: Transaction['type']
    }): Promise<Transaction | null> => {
      const newTx: Transaction = {
        id: generateId(),
        user_id: user?.id ?? 'demo-user',
        type: data.type ?? 'expense',
        category_id: data.categoryId,
        subcategory_id: data.subcategoryId,
        amount: data.amount,
        currency: data.currency ?? 'SGD',
        original_amount: null,
        original_currency: null,
        exchange_rate: null,
        description: data.description || null,
        merchant: data.merchant ?? null,
        payment_method_id: data.paymentMethodId,
        is_needs: data.isNeeds,
        is_fixed: null,
        is_recurring: false,
        recurring_expense_id: null,
        notes: data.notes || null,
        transaction_date: data.transactionDate,
        created_at: nowSGT(),
        updated_at: nowSGT(),
      }

      if (isDemoMode) {
        const categories = useAppStore.getState().categories
        const paymentMethods = useAppStore.getState().paymentMethods
        const enriched: Transaction = {
          ...newTx,
          category: categories.find((c) => c.id === newTx.category_id),
          payment_method: paymentMethods.find((p) => p.id === newTx.payment_method_id),
        }
        addTransaction(enriched)
        return enriched
      }

      const insertData = {
        id: newTx.id,
        user_id: user!.id,
        type: newTx.type,
        category_id: newTx.category_id,
        subcategory_id: newTx.subcategory_id,
        amount: newTx.amount,
        currency: newTx.currency,
        original_amount: newTx.original_amount,
        original_currency: newTx.original_currency,
        exchange_rate: newTx.exchange_rate,
        description: newTx.description,
        merchant: newTx.merchant,
        payment_method_id: newTx.payment_method_id,
        is_needs: newTx.is_needs,
        is_fixed: newTx.is_fixed,
        is_recurring: newTx.is_recurring,
        recurring_expense_id: newTx.recurring_expense_id,
        notes: newTx.notes,
        transaction_date: newTx.transaction_date,
        created_at: newTx.created_at,
        updated_at: newTx.updated_at,
      }

      const { data: saved, error } = await supabase
        .from('transactions')
        .insert(insertData as any)
        .select('*, category:categories(*), payment_method:payment_methods(*)')
        .single()

      if (error) throw error
      if (saved) {
        addTransaction(saved as Transaction)
        return saved as Transaction
      }
      return null
    },
    [isDemoMode, user, addTransaction]
  )

  const editTransaction = useCallback(
    async (id: string, data: Partial<Transaction>): Promise<void> => {
      if (isDemoMode) {
        const existing = useAppStore.getState().transactions.find((t) => t.id === id)
        if (existing) {
          const cats = useAppStore.getState().categories
          const pms = useAppStore.getState().paymentMethods
          const updated: Transaction = {
            ...existing,
            ...data,
            updated_at: nowSGT(),
            category: data.category_id
              ? cats.find((c) => c.id === data.category_id)
              : existing.category,
            payment_method: data.payment_method_id !== undefined
              ? pms.find((p) => p.id === data.payment_method_id)
              : existing.payment_method,
          }
          updateTransaction(updated)
        }
        return
      }

      const updatePayload: Record<string, unknown> = { ...data, updated_at: nowSGT() }
      const { data: updated, error } = await (supabase as any)
        .from('transactions')
        .update(updatePayload)
        .eq('id', id)
        .select('*, category:categories(*), payment_method:payment_methods(*)')
        .single()

      if (error) throw error
      if (updated) updateTransaction(updated as Transaction)
    },
    [isDemoMode, updateTransaction]
  )

  const removeTransaction = useCallback(
    async (id: string): Promise<void> => {
      if (isDemoMode) {
        deleteTransaction(id)
        return
      }
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
      deleteTransaction(id)
    },
    [isDemoMode, deleteTransaction]
  )

  const savePaymentMethod = useCallback(
    async (pm: PaymentMethod): Promise<void> => {
      if (isDemoMode) {
        addPaymentMethod(pm)
        return
      }
      const { error } = await supabase.from('payment_methods').insert([pm] as any)
      if (error) throw error
      addPaymentMethod(pm)
    },
    [isDemoMode, addPaymentMethod]
  )

  const deletePaymentMethod = useCallback(
    async (id: string): Promise<void> => {
      if (isDemoMode) {
        removePaymentMethod(id)
        return
      }
      const { error } = await supabase.from('payment_methods').delete().eq('id', id)
      if (error) throw error
      removePaymentMethod(id)
    },
    [isDemoMode, removePaymentMethod]
  )

  // Budget
  const saveBudget = useCallback(
    async (year: number, month: number, amount: number): Promise<void> => {
      const store = useAppStore.getState()
      const existing = store.budgets.find((b) => !b.category_id && b.period === 'monthly' && b.year === year && b.month === month)
      if (isDemoMode) { store.setBudgetForMonth(year, month, amount); return }
      if (existing) {
        await (supabase.from('budgets') as any).update({ amount, updated_at: nowSGT() }).eq('id', existing.id)
      } else {
        const row = { id: generateId(), user_id: user!.id, category_id: null, amount, period: 'monthly', year, month, created_at: nowSGT(), updated_at: nowSGT() }
        await supabase.from('budgets').insert([row] as any)
      }
      store.setBudgetForMonth(year, month, amount)
    },
    [isDemoMode, user]
  )

  // Investments
  const saveInvestment = useCallback(
    async (inv: Investment): Promise<void> => {
      if (isDemoMode) { addInvestment(inv); return }
      const { error } = await supabase.from('investments').insert([inv] as any)
      if (error) throw error
      addInvestment(inv)
    },
    [isDemoMode, addInvestment]
  )

  const editInvestment = useCallback(
    async (inv: Investment): Promise<void> => {
      if (isDemoMode) { updateInvestment(inv); return }
      const { error } = await (supabase.from('investments') as any).update({ ...inv, updated_at: nowSGT() }).eq('id', inv.id)
      if (error) throw error
      updateInvestment(inv)
    },
    [isDemoMode, updateInvestment]
  )

  const deleteInvestment = useCallback(
    async (id: string): Promise<void> => {
      if (isDemoMode) { removeInvestment(id); return }
      const { error } = await supabase.from('investments').delete().eq('id', id)
      if (error) throw error
      removeInvestment(id)
    },
    [isDemoMode, removeInvestment]
  )

  // Recurring expenses
  const saveRecurring = useCallback(
    async (rec: RecurringExpense): Promise<void> => {
      if (isDemoMode) { addRecurringExpense(rec); return }
      const { error } = await supabase.from('recurring_expenses').insert([rec] as any)
      if (error) throw error
      addRecurringExpense(rec)
    },
    [isDemoMode, addRecurringExpense]
  )

  const editRecurring = useCallback(
    async (rec: RecurringExpense): Promise<void> => {
      if (isDemoMode) { updateRecurringExpense(rec); return }
      const { error } = await (supabase.from('recurring_expenses') as any).update({ ...rec, updated_at: nowSGT() }).eq('id', rec.id)
      if (error) throw error
      updateRecurringExpense(rec)
    },
    [isDemoMode, updateRecurringExpense]
  )

  const deleteRecurring = useCallback(
    async (id: string): Promise<void> => {
      if (isDemoMode) { removeRecurringExpense(id); return }
      const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
      if (error) throw error
      removeRecurringExpense(id)
    },
    [isDemoMode, removeRecurringExpense]
  )

  // Categories
  const saveCategory = useCallback(
    async (cat: Category): Promise<void> => {
      if (isDemoMode) { addCategory(cat); return }
      const { error } = await supabase.from('categories').insert([cat] as any)
      if (error) throw error
      addCategory(cat)
    },
    [isDemoMode, addCategory]
  )

  const editCategory = useCallback(
    async (cat: Category): Promise<void> => {
      if (isDemoMode) { updateCategory(cat); return }
      const { error } = await (supabase.from('categories') as any).update({ ...cat, updated_at: nowSGT() }).eq('id', cat.id)
      if (error) throw error
      updateCategory(cat)
    },
    [isDemoMode, updateCategory]
  )

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      if (isDemoMode) { removeCategory(id); return }
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      removeCategory(id)
    },
    [isDemoMode, removeCategory]
  )

  // Preferences — save theme/accentColor to Supabase user metadata
  const savePreferences = useCallback(
    async (prefs: { theme?: string; accentColor?: string }): Promise<void> => {
      if (isDemoMode || !isSupabaseConfigured) return
      await supabase.auth.updateUser({ data: { ...user?.user_metadata, ...prefs } })
    },
    [isDemoMode, user]
  )

  return {
    fetchAll,
    saveTransaction, editTransaction, removeTransaction,
    saveCategory, editCategory, deleteCategory,
    savePaymentMethod, deletePaymentMethod,
    saveBudget,
    saveInvestment, editInvestment, deleteInvestment,
    saveRecurring, editRecurring, deleteRecurring,
    savePreferences,
  }
}
