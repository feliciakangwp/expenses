export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          default_currency: string
          default_payment_method_id: string | null
          privacy_mode: boolean
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_currency?: string
          default_payment_method_id?: string | null
          privacy_mode?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_currency?: string
          default_payment_method_id?: string | null
          privacy_mode?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          icon: string
          color: string
          transaction_type: string
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
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          icon: string
          color: string
          transaction_type?: string
          is_needs?: boolean | null
          is_fixed?: boolean | null
          monthly_budget?: number | null
          sort_order?: number
          is_archived?: boolean
          is_system?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          icon?: string
          color?: string
          transaction_type?: string
          is_needs?: boolean | null
          is_fixed?: boolean | null
          monthly_budget?: number | null
          sort_order?: number
          is_archived?: boolean
          is_system?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          user_id: string | null
          name: string
          sort_order: number
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          user_id?: string | null
          name: string
          sort_order?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          user_id?: string | null
          name?: string
          sort_order?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_methods: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          icon: string
          sort_order?: number
          is_default?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          sort_order?: number
          is_default?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: string
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
        }
        Insert: {
          id?: string
          user_id: string
          type?: string
          category_id: string
          subcategory_id?: string | null
          amount: number
          currency?: string
          original_amount?: number | null
          original_currency?: string | null
          exchange_rate?: number | null
          description?: string | null
          merchant?: string | null
          payment_method_id?: string | null
          is_needs?: boolean | null
          is_fixed?: boolean | null
          is_recurring?: boolean
          recurring_expense_id?: string | null
          notes?: string | null
          transaction_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          category_id?: string
          subcategory_id?: string | null
          amount?: number
          currency?: string
          original_amount?: number | null
          original_currency?: string | null
          exchange_rate?: number | null
          description?: string | null
          merchant?: string | null
          payment_method_id?: string | null
          is_needs?: boolean | null
          is_fixed?: boolean | null
          is_recurring?: boolean
          recurring_expense_id?: string | null
          notes?: string | null
          transaction_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: number
          period: string
          year: number
          month: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          period?: string
          year: number
          month?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          amount?: number
          period?: string
          year?: number
          month?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      recurring_expenses: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          currency: string
          category_id: string
          subcategory_id: string | null
          payment_method_id: string | null
          frequency: string
          next_payment_date: string
          is_active: boolean
          auto_record: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          currency?: string
          category_id: string
          subcategory_id?: string | null
          payment_method_id?: string | null
          frequency: string
          next_payment_date: string
          is_active?: boolean
          auto_record?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          currency?: string
          category_id?: string
          subcategory_id?: string | null
          payment_method_id?: string | null
          frequency?: string
          next_payment_date?: string
          is_active?: boolean
          auto_record?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
