-- Enable RLS on users table
alter table users enable row level security;

-- Policy to allow users to read their own data
create policy "Users can read own data"
  on users for select
  using (auth.uid()::text = wallet_address);

-- Policy to allow users to create their own profile
create policy "Users can create own profile"
  on users for insert
  with check (auth.uid()::text = wallet_address);

-- Policy to allow users to update their own profile
create policy "Users can update own profile"
  on users for update
  using (auth.uid()::text = wallet_address)
  with check (auth.uid()::text = wallet_address);
