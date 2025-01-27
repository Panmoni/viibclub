-- Add new columns to users table
alter table users
  add column if not exists emojis text[],
  add column if not exists country_code text;

-- Create index on country_code for faster lookups
create index if not exists users_country_code_idx on users (country_code);

-- Set default values for existing rows
update users
set emojis = '{}',
    country_code = null
where emojis is null
   or country_code is null;
