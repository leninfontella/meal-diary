-- Execute este arquivo no SQL Editor do projeto Supabase.
create extension if not exists pgcrypto;

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null,
  meal_time time not null,
  meal_type text check (meal_type is null or meal_type in ('Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro')),
  note text check (char_length(note) <= 500),
  photo_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meals_user_date_idx on public.meals (user_id, meal_date, meal_time);

alter table public.meals enable row level security;

drop policy if exists "Users can read own meals" on public.meals;
create policy "Users can read own meals"
on public.meals for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own meals" on public.meals;
create policy "Users can create own meals"
on public.meals for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own meals" on public.meals;
create policy "Users can update own meals"
on public.meals for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own meals" on public.meals;
create policy "Users can delete own meals"
on public.meals for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meals_set_updated_at on public.meals;
create trigger meals_set_updated_at
before update on public.meals
for each row execute function public.set_updated_at();

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text check (name is null or char_length(name) between 2 and 80),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  submitted_name text := trim(coalesce(new.raw_user_meta_data ->> 'name', ''));
begin
  insert into public.profiles (user_id, name)
  values (
    new.id,
    case when char_length(submitted_name) between 2 and 80 then submitted_name else null end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own meal photos" on storage.objects;
create policy "Users can read own meal photos"
on storage.objects for select
to authenticated
using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can upload own meal photos" on storage.objects;
create policy "Users can upload own meal photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete own meal photos" on storage.objects;
create policy "Users can delete own meal photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can read own profile photos" on storage.objects;
create policy "Users can read own profile photos"
on storage.objects for select
to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can upload own profile photos" on storage.objects;
create policy "Users can upload own profile photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete own profile photos" on storage.objects;
create policy "Users can delete own profile photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
