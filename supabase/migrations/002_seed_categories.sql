-- =============================================================
-- Seed System Categories and Subcategories
-- =============================================================

-- System categories (user_id = null, is_system = true)
insert into categories (name, icon, color, transaction_type, is_needs, is_fixed, sort_order, is_system)
values
  ('Food & Drinks',              'utensils',          '#f97316', 'expense',    true,  false, 1,  true),
  ('Transport',                  'car',                '#3b82f6', 'expense',    true,  false, 2,  true),
  ('Housing & Utilities',        'home',               '#8b5cf6', 'expense',    true,  true,  3,  true),
  ('Shopping',                   'shopping-bag',       '#ec4899', 'expense',    false, false, 4,  true),
  ('Health & Fitness',           'dumbbell',           '#10b981', 'expense',    true,  false, 5,  true),
  ('Medical & Wellness',         'heart-pulse',        '#ef4444', 'expense',    true,  false, 6,  true),
  ('Beauty & Personal Care',     'sparkles',           '#f43f5e', 'expense',    true,  false, 7,  true),
  ('Technology & Subscriptions', 'laptop',             '#6366f1', 'expense',    false, true,  8,  true),
  ('Travel',                     'plane',              '#0ea5e9', 'expense',    false, false, 9,  true),
  ('Leisure & Entertainment',    'clapperboard',       '#f59e0b', 'expense',    false, false, 10, true),
  ('Education & Development',    'book-open',          '#14b8a6', 'expense',    true,  false, 11, true),
  ('Family & Gifts',             'gift',               '#a855f7', 'expense',    true,  false, 12, true),
  ('Charity & Giving',           'hand-heart',         '#84cc16', 'expense',    false, false, 13, true),
  ('Insurance',                  'shield',             '#64748b', 'expense',    true,  true,  14, true),
  ('Financial Obligations',      'landmark',           '#78716c', 'expense',    true,  true,  15, true),
  ('Others',                     'circle-ellipsis',    '#94a3b8', 'expense',    null,  null,  16, true),
  ('Salary',                     'banknote',           '#22c55e', 'income',     null,  null,  17, true),
  ('Investment',                 'trending-up',        '#6366f1', 'investment', null,  null,  18, true)
on conflict do nothing;

-- Subcategories (linked to system categories)
do $$
declare
  cat_id uuid;
begin
  -- Food & Drinks
  select id into cat_id from categories where name = 'Food & Drinks' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Breakfast', 1), (cat_id, 'Lunch', 2), (cat_id, 'Dinner', 3),
      (cat_id, 'Groceries', 4), (cat_id, 'Coffee', 5), (cat_id, 'Snacks', 6),
      (cat_id, 'Food Delivery', 7) on conflict do nothing;
  end if;

  -- Transport
  select id into cat_id from categories where name = 'Transport' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Petrol', 1), (cat_id, 'Parking', 2), (cat_id, 'ERP', 3),
      (cat_id, 'Public Transport', 4), (cat_id, 'Grab', 5), (cat_id, 'Car Maintenance', 6)
      on conflict do nothing;
  end if;

  -- Housing & Utilities
  select id into cat_id from categories where name = 'Housing & Utilities' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Mortgage', 1), (cat_id, 'Rent', 2), (cat_id, 'Electricity', 3),
      (cat_id, 'Water', 4), (cat_id, 'Internet', 5), (cat_id, 'Household Supplies', 6)
      on conflict do nothing;
  end if;

  -- Shopping
  select id into cat_id from categories where name = 'Shopping' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Clothing', 1), (cat_id, 'Shoes', 2),
      (cat_id, 'Accessories', 3), (cat_id, 'Electronics', 4) on conflict do nothing;
  end if;

  -- Health & Fitness
  select id into cat_id from categories where name = 'Health & Fitness' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Gym Membership', 1), (cat_id, 'Personal Training', 2),
      (cat_id, 'Supplements', 3), (cat_id, 'Sports Equipment', 4),
      (cat_id, 'Race Registration', 5) on conflict do nothing;
  end if;

  -- Medical & Wellness
  select id into cat_id from categories where name = 'Medical & Wellness' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Doctor', 1), (cat_id, 'Dental', 2), (cat_id, 'Medication', 3),
      (cat_id, 'Physiotherapy', 4), (cat_id, 'Tuina', 5) on conflict do nothing;
  end if;

  -- Beauty & Personal Care
  select id into cat_id from categories where name = 'Beauty & Personal Care' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Skincare', 1), (cat_id, 'Facial', 2), (cat_id, 'Hair', 3),
      (cat_id, 'Aesthetics', 4), (cat_id, 'Toiletries', 5) on conflict do nothing;
  end if;

  -- Technology & Subscriptions
  select id into cat_id from categories where name = 'Technology & Subscriptions' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'AI Tools', 1), (cat_id, 'Software', 2), (cat_id, 'Mobile Plan', 3),
      (cat_id, 'Cloud Storage', 4), (cat_id, 'Streaming', 5) on conflict do nothing;
  end if;

  -- Travel
  select id into cat_id from categories where name = 'Travel' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Flights', 1), (cat_id, 'Accommodation', 2),
      (cat_id, 'Overseas Transport', 3), (cat_id, 'Activities', 4) on conflict do nothing;
  end if;

  -- Leisure & Entertainment
  select id into cat_id from categories where name = 'Leisure & Entertainment' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Movies', 1), (cat_id, 'Hobbies', 2),
      (cat_id, 'Outings', 3), (cat_id, 'Events', 4) on conflict do nothing;
  end if;

  -- Education & Development
  select id into cat_id from categories where name = 'Education & Development' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Courses', 1), (cat_id, 'Books', 2), (cat_id, 'Certifications', 3)
      on conflict do nothing;
  end if;

  -- Family & Gifts
  select id into cat_id from categories where name = 'Family & Gifts' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Parents'' Allowance', 1), (cat_id, 'Gifts', 2), (cat_id, 'Celebrations', 3)
      on conflict do nothing;
  end if;

  -- Charity & Giving
  select id into cat_id from categories where name = 'Charity & Giving' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Donations', 1), (cat_id, 'Church Contributions', 2) on conflict do nothing;
  end if;

  -- Insurance
  select id into cat_id from categories where name = 'Insurance' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Life', 1), (cat_id, 'Health', 2),
      (cat_id, 'Car', 3), (cat_id, 'Personal Insurance', 4) on conflict do nothing;
  end if;

  -- Financial Obligations
  select id into cat_id from categories where name = 'Financial Obligations' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Income Tax', 1), (cat_id, 'Bank Fees', 2), (cat_id, 'Loan Interest', 3)
      on conflict do nothing;
  end if;

  -- Others
  select id into cat_id from categories where name = 'Others' and is_system = true limit 1;
  if cat_id is not null then
    insert into subcategories (category_id, name, sort_order) values
      (cat_id, 'Miscellaneous', 1) on conflict do nothing;
  end if;
end $$;
