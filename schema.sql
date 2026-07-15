-- Supabase Database Schema for NoBrokerCars

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'seller', 'admin')),
  avatar text,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  banned boolean default false not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Admins can update any profile" 
  on public.profiles for update 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete any profile" 
  on public.profiles for delete 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(substring(new.email from 1 for 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Cars Table
create table public.cars (
  id text primary key, -- Allows both slug IDs and UUIDs
  name text not null,
  make text not null,
  model text not null,
  year integer not null,
  fuel_type text,
  transmission text,
  mileage text,
  ownership text,
  location text,
  price numeric not null,
  price_display text,
  tag text,
  image text, -- Main photo URL
  gallery text[] default '{}'::text[], -- Array of gallery photo URLs
  description text,
  seller_email text not null,
  seller_name text,
  seller_phone text,
  seller_type text default 'Private Seller',
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'sold')),
  views integer default 0 not null,
  inquiry_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  specs jsonb default '[]'::jsonb,
  color text,
  registration text,
  negotiable boolean default true not null
);

-- Enable RLS for cars
alter table public.cars enable row level security;

-- Cars Policies
create policy "Active/sold cars are viewable by everyone" 
  on public.cars for select 
  using (status in ('active', 'sold') or (auth.role() = 'authenticated' and auth.jwt()->>'email' = seller_email));

create policy "Sellers can view all their own cars"
  on public.cars for select
  using (auth.role() = 'authenticated' and auth.jwt()->>'email' = seller_email);

create policy "Admins can view all cars"
  on public.cars for select
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Authenticated users can insert cars" 
  on public.cars for insert 
  with check (auth.role() = 'authenticated');

create policy "Users can update their own cars" 
  on public.cars for update 
  using (auth.role() = 'authenticated' and auth.jwt()->>'email' = seller_email);

create policy "Admins can update any car" 
  on public.cars for update 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can delete their own cars" 
  on public.cars for delete 
  using (auth.role() = 'authenticated' and auth.jwt()->>'email' = seller_email);

create policy "Admins can delete any car" 
  on public.cars for delete 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );


-- 3. Saved Cars (Favorites) Table
create table public.saved_cars (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  car_id text references public.cars(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, car_id)
);

-- Enable RLS for saved_cars
alter table public.saved_cars enable row level security;

-- Saved Cars Policies
create policy "Users can view their own saved cars" 
  on public.saved_cars for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own saved cars" 
  on public.saved_cars for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved cars" 
  on public.saved_cars for delete 
  using (auth.uid() = user_id);


-- 4. Inquiries Table
create table public.inquiries (
  id uuid default gen_random_uuid() primary key,
  car_id text references public.cars(id) on delete cascade not null,
  seller_email text not null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text not null,
  message text not null,
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for inquiries
alter table public.inquiries enable row level security;

-- Inquiries Policies
create policy "Sellers can view inquiries for their listings" 
  on public.inquiries for select 
  using (auth.role() = 'authenticated' and auth.jwt()->>'email' = seller_email);

create policy "Buyers can view inquiries they made" 
  on public.inquiries for select 
  using (auth.role() = 'authenticated' and auth.jwt()->>'email' = buyer_email);

create policy "Admins can view any inquiry" 
  on public.inquiries for select 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Anyone can insert an inquiry" 
  on public.inquiries for insert 
  with check (true);

create policy "Sellers can mark inquiries as read" 
  on public.inquiries for update 
  using (auth.role() = 'authenticated' and auth.jwt()->>'email' = seller_email);

create policy "Admins can update any inquiry" 
  on public.inquiries for update 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );


-- 5. Contacts Table
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text not null,
  subject text,
  message text not null,
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for contacts
alter table public.contacts enable row level security;

-- Contacts Policies
create policy "Anyone can submit a contact message" 
  on public.contacts for insert 
  with check (true);

-- Allow admins to view contact messages
create policy "Admins can view contacts" 
  on public.contacts for select 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update contacts" 
  on public.contacts for update 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete contacts" 
  on public.contacts for delete 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );


-- 6. Settings Table
create table public.settings (
  id text primary key default 'platform',
  admin_whatsapp text not null default '919999999999',
  listing_fee text not null default 'Free',
  ai_model text not null default 'v2.4',
  email_notifications boolean not null default true,
  moderation_enabled boolean not null default true,
  site_name text not null default 'NoBrokerCars'
);

-- Enable RLS for settings
alter table public.settings enable row level security;

-- Settings Policies
create policy "Settings are viewable by everyone" 
  on public.settings for select 
  using (true);

create policy "Admins can update settings" 
  on public.settings for update 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Insert initial setting row
insert into public.settings (id, admin_whatsapp, listing_fee, ai_model, email_notifications, moderation_enabled, site_name)
values ('platform', '919999999999', 'Free', 'v2.4', true, true, 'NoBrokerCars')
on conflict (id) do nothing;


-- 7. Storage Config (car-images bucket and policies)
insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do nothing;

drop policy if exists "Allow public upload to car-images" on storage.objects;
create policy "Allow public upload to car-images"
on storage.objects for insert
with check (bucket_id = 'car-images');

drop policy if exists "Allow public read from car-images" on storage.objects;
create policy "Allow public read from car-images"
on storage.objects for select
using (bucket_id = 'car-images');

