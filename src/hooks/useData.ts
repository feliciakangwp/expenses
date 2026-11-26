import { useCallback, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import type { Transaction, Category, Subcategory, PaymentMethod } from '@/types'
import { generateId, nowSGT } from '@/lib/utils'
import { DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES } from '@/data/categories'

export function useData() {
  const {
    user, isDemoMode,
    setTransactions, setCategories, setPaymentMethods, setBudgets,
    addTransaction, updateTransaction, deleteTransaction,
    addPaymentMethod, removePaymentMethod,
    setLoading, loadDemoData,
  } = useAppStore()

  const fetchAll = useCallback(async () => {
    if (isDemoMode || !isSupabaseConfigured || !user) return

    setLoading(true)
    try {
      const [catRes, txRes, pmRes, budgetRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('sort_order'),
        supabase
          .from('transactions')
          .select('*, category:categories(*), payment_method:payment_methods(*)')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .limit(500),
        supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('sort_order'),
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id),
      ])

      let cats = catRes.data as Category[] | null
      if (!cats || cats.length === 0) {
        // New user — seed default categories
        const toInsert = DEFAULT_CATEGORIES
          .filter((c) => c.transaction_type === 'expense' || c.transaction_type === 'income')
          .map((c, i) => ({
            id: generateId(),
            user_id: user!.id,
            ...c,
            is_system: false,
            sort_order: i + 1,
            created_at: nowSGT(),
            updated_at: nowSGT(),
          }))
        const { data: inserted } = await supabase.from('categories').insert(toInsert as any).select('*')
        cats = inserted as Category[] | null
      }
      if (cats) setCategories(cats)
      if (txRes.data) setTransactions(txRes.data as Transaction[])
      if (pmRes.data) setPaymentMethods(pmRes.data as PaymentMethod[])
      if (budgetRes.data) setBudgets(budgetRes.data)
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

  return { fetchAll, saveTransaction, editTransaction, removeTransaction, savePaymentMethod, deletePaymentMethod }
}
