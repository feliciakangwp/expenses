import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TIMEZONE = 'Asia/Singapore'

export function formatCurrency(
  cents: number,
  currency = 'SGD',
  privacyMode = false
): string {
  if (privacyMode) return '••••'
  const amount = cents / 100
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatAmount(cents: number, privacyMode = false): string {
  if (privacyMode) return '••••'
  return (cents / 100).toFixed(2)
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'd MMM yyyy')
}

export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'd MMM')
}

export function formatTime(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'h:mm a')
}

export function nowSGT(): string {
  const now = new Date()
  return formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss")
}

export function todaySGT(): string {
  const now = new Date()
  return formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd')
}

export function getWeekRange(): { start: string; end: string } {
  const now = toZonedTime(new Date(), TIMEZONE)
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

export function getMonthRange(): { start: string; end: string } {
  const now = toZonedTime(new Date(), TIMEZONE)
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

export function getTodayRange(): { start: string; end: string } {
  const today = todaySGT()
  return { start: today, end: today }
}

export function parseCentsFromString(str: string): number {
  const numeric = parseFloat(str.replace(/[^0-9.]/g, ''))
  if (isNaN(numeric)) return 0
  return Math.round(numeric * 100)
}

export function groupTransactionsByDate<T extends { transaction_date: string }>(
  transactions: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const t of transactions) {
    const date = t.transaction_date.split('T')[0]
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(t)
  }
  return groups
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateId(): string {
  return crypto.randomUUID()
}
