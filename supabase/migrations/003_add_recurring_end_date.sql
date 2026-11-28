-- Add optional end date to recurring_expenses
alter table recurring_expenses
  add column if not exists end_date date;
