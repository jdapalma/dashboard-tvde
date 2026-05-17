-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Transactions table
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount decimal(12,2) not null check (amount > 0),
  category text not null,
  platform text not null default 'uber' check (platform in ('uber', 'bolt', 'otro')),
  description text,
  receipt_url text,
  source text not null default 'manual' check (source in ('manual', 'ocr')),
  date date not null default current_date,
  trips_count int,
  created_at timestamptz default now()
);

-- Categories table
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  type text not null check (type in ('income', 'expense'))
);

-- Insert default categories
insert into categories (name, type) values
  ('Combustible', 'expense'),
  ('Mantenimiento', 'expense'),
  ('Comisión plataforma', 'expense'),
  ('Propinas', 'expense'),
  ('Lavado', 'expense'),
  ('Seguro', 'expense'),
  ('Otro', 'expense'),
  ('Viajes', 'income'),
  ('Propinas', 'income'),
  ('Bonificación', 'income'),
  ('Otro', 'income');

-- Indexes
create index idx_transactions_user_id on transactions(user_id);
create index idx_transactions_date on transactions(date);
create index idx_transactions_type on transactions(type);

-- Row Level Security
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table categories enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Transactions policies
create policy "Users can view own transactions"
  on transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on transactions for delete
  using (auth.uid() = user_id);

-- Categories policies (public read)
create policy "Anyone can view categories"
  on categories for select
  using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
