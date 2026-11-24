import { useMemo } from 'react'
import { useAppStore } from '@/store/app'
import type { CategorySpending, DashboardStats } from '@/types'
import { getTodayRange, getWeekRange, getMonthRange } from '@/lib/utils'

function filterExpenses(transactions: ReturnType<typeof useAppStore.getState>['transactions'], start: string, end: string) {
  return transactions.filter((t) => {
    if (t.type !== 'expense' && t.type !== 'refund') return false
    const date = t.transaction_date.split('T')[0]
    return date >= start && date <= end
  })
}

function sumAmount(transactions: ReturnType<typeof useAppStore.getState>['transactions']): number {
  return transactions.reduce((sum, t) => {
    if (t.type === 'refund') return sum - t.amount
    return sum + t.amount
  }, 0)
}

export function useStats(): DashboardStats {
  const { transactions, budgets } = useAppStore()

  return useMemo(() => {
    const { start: todayStart, end: todayEnd } = getTodayRange()
    const { start: weekStart, end: weekEnd } = getWeekRange()
    const { start: monthStart, end: monthEnd } = getMonthRange()

    const today = sumAmount(filterExpenses(transactions, todayStart, todayEnd))
    const week = sumAmount(filterExpenses(transactions, weekStart, weekEnd))
    const month = sumAmount(filterExpenses(transactions, monthStart, monthEnd))

    const now = new Date()
    const overallBudget = budgets.find(
      (b) =>
        b.category_id === null &&
        b.period === 'monthly' &&
        b.year === now.getFullYear() &&
        b.month === now.getMonth() + 1
    )

    return {
      today,
      week,
      month,
      monthBudget: overallBudget?.amount ?? null,
      monthBudgetUsed: overallBudget ? month : 0,
    }
  }, [transactions, budgets])
}

export function useCategorySpending(start: string, end: string): CategorySpending[] {
  const { transactions, categories } = useAppStore()

  return useMemo(() => {
    const expenses = filterExpenses(transactions, start, end)
    const totalAmount = sumAmount(expenses)

    const catMap = new Map<string, { amount: number; count: number }>()
    for (const t of expenses) {
      const existing = catMap.get(t.category_id) ?? { amount: 0, count: 0 }
      catMap.set(t.category_id, {
        amount: existing.amount + (t.type === 'refund' ? -t.amount : t.amount),
        count: existing.count + 1,
      })
    }

    return Array.from(catMap.entries())
      .map(([catId, { amount, count }]) => ({
        category: categories.find((c) => c.id === catId)!,
        amount,
        count,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      }))
      .filter((s) => s.category)
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, categories, start, end])
}
