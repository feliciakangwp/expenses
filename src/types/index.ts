export type TransactionType =
  | 'expense'
  | 'income'
  | 'investment'
  | 'savings'
  | 'transfer'
  | 'refund'

export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'annual'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  default_currency: string
  default_payment_method_id: string | null
  privacy_mode: boolean
  theme: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  icon: string
  color: string
  transaction_type: TransactionType
  is_needs: boolean | null
  is_fixed: boolean | null
  monthly_budget: number | null
  sort_order: number
  is_archived: boolean
  is_system: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface Subcategory {
  id: string
  category_id: string
  user_id: string | null
  name: string
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  name: string
  icon: string
  sort_order: number
  is_default: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  category_id: string
  subcategory_id: string | null
  amount: number
  currency: string
  original_amount: number | null
  original_currency: string | null
  exchange_rate: number | null
  description: string | null
  merchant: string | null
  payment_method_id: string | null
  is_needs: boolean | null
  is_fixed: boolean | null
  is_recurring: boolean
  recurring_expense_id: string | null
  notes: string | null
  transaction_date: string
  created_at: string
  updated_at: string
  // Joined fields
  category?: Category
  subcategory?: Subcategory
  payment_method?: PaymentMethod
}

export interface Budget {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  period: 'monthly' | 'annual'
  year: number
  month: number | null
  created_at: string
  updated_at: string
  category?: Category
}

export interface RecurringExpense {
  id: string
  user_id: string
  name: string
  amount: number
  currency: string
  category_id: string
  subcategory_id: string | null
  payment_method_id: string | null
  frequency: Frequency
  next_payment_date: string
  is_active: boolean
  auto_record: boolean
  notes: string | null
  created_at: string
  updated_at: string
  category?: Category
  payment_method?: PaymentMethod
}

export interface Investment {
  id: string
  user_id: string
  ticker: string
  quantity: number          // shares (stock) or contracts (options)
  buy_price: number         // cost per share (stock) or premium received per contract (options)
  sell_price: number | null // sell price (stock) or buyback cost per contract (options)
  buy_date: string          // trade entry date  yyyy-MM-dd
  // Options-specific fields (null for stocks)
  investment_type: 'stock' | 'options'
  option_type: 'call' | 'put' | null
  strike_price: number | null
  expiry_date: string | null
  is_expired: boolean        // true = option expired worthless (full premium kept)
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  today: number
  week: number
  month: number
  monthBudget: number | null
  monthBudgetUsed: number
}

export interface CategorySpending {
  category: Category
  amount: number
  count: number
  percentage: number
}
