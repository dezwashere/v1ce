create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default '',
  sobriety_date date not null,
  birthday date,
  substances text[] not null default '{}',
  coin_shape_path text,
  coin_color text not null default 'gold',
  coin_shape text not null default 'circle',
  coin_background text,
  coin_background_color text,
  number_style text not null default 'classic',
  coin_show_border boolean not null default true,
  coin_border_color text,
  coin_number_color text,
  coin_photo text,
  coin_image_only boolean not null default false,
  coin_motto text not null default '' check (char_length(coin_motto) <= 50),
  avatar_url text,
  gifted_count integer not null default 0 check (gifted_count >= 0),
  is_premium boolean not null default false,
  coin_balance integer not null default 0 check (coin_balance >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.friend_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  is_active_in_lounge boolean not null default false,
  created_at timestamptz not null default now(),
  check (requester_id <> recipient_id)
);

create unique index if not exists friend_connections_unique_pair_idx
on public.friend_connections (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.lounge_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  giveaway_month text not null check (giveaway_month ~ '^\d{4}-\d{2}$'),
  is_winner boolean not null default false,
  created_at timestamptz not null default now(),
  unique (email, giveaway_month)
);

alter table public.profiles enable row level security;
alter table public.friend_connections enable row level security;
alter table public.blocked_users enable row level security;
alter table public.lounge_messages enable row level security;
alter table public.giveaway_entries enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check (id = (select auth.uid()) and (user_id is null or user_id = (select auth.uid())));

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and (user_id is null or user_id = (select auth.uid())));

create policy "Participants can read friend connections"
on public.friend_connections for select to authenticated
using (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));

create policy "Users can request friends"
on public.friend_connections for insert to authenticated
with check (
  requester_id = (select auth.uid())
  and not exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = recipient_id and b.blocked_id = (select auth.uid()))
       or (b.blocker_id = (select auth.uid()) and b.blocked_id = recipient_id)
  )
);

create policy "Participants can update friend connections"
on public.friend_connections for update to authenticated
using (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()))
with check (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));

create policy "Participants can delete friend connections"
on public.friend_connections for delete to authenticated
using (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));

create policy "Users can read their blocks"
on public.blocked_users for select to authenticated
using (blocker_id = (select auth.uid()));

create policy "Users can block profiles"
on public.blocked_users for insert to authenticated
with check (blocker_id = (select auth.uid()));

create policy "Users can remove their blocks"
on public.blocked_users for delete to authenticated
using (blocker_id = (select auth.uid()));

create policy "Accepted friends can view lounge messages"
on public.lounge_messages for select to authenticated
using (
  sender_id = (select auth.uid())
  or exists (
    select 1 from public.friend_connections f
    where f.status = 'accepted'
      and (
        (f.requester_id = (select auth.uid()) and f.recipient_id = lounge_messages.sender_id)
        or (f.recipient_id = (select auth.uid()) and f.requester_id = lounge_messages.sender_id)
      )
  )
);

create policy "Accepted friends can send lounge messages"
on public.lounge_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.friend_connections f
    where f.status = 'accepted'
      and (f.requester_id = (select auth.uid()) or f.recipient_id = (select auth.uid()))
  )
);

create or replace function public.find_profile_by_email(target_email text)
returns table (id uuid, display_name text, avatar_url text)
language sql
security definer
set search_path = ''
stable
as $$
  select p.id, p.display_name, p.avatar_url
  from public.profiles p
  where lower(p.email) = lower(trim(target_email))
    and p.id <> (select auth.uid())
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = p.id and b.blocked_id = (select auth.uid()))
         or (b.blocker_id = (select auth.uid()) and b.blocked_id = p.id)
    )
  limit 1
$$;

create or replace function public.get_my_friend_connections()
returns table (
  id uuid,
  requester_id uuid,
  recipient_id uuid,
  status text,
  created_at timestamptz,
  is_active_in_lounge boolean,
  requester_name text,
  requester_avatar text,
  recipient_name text,
  recipient_avatar text
)
language sql
security definer
set search_path = ''
stable
as $$
  select f.id, f.requester_id, f.recipient_id, f.status, f.created_at,
         f.is_active_in_lounge, requester.display_name, requester.avatar_url,
         recipient.display_name, recipient.avatar_url
  from public.friend_connections f
  join public.profiles requester on requester.id = f.requester_id
  join public.profiles recipient on recipient.id = f.recipient_id
  where f.requester_id = (select auth.uid()) or f.recipient_id = (select auth.uid())
  order by f.created_at desc
$$;

create or replace function public.get_lounge_messages()
returns table (
  id uuid,
  sender_id uuid,
  body text,
  created_at timestamptz,
  display_name text,
  avatar_url text
)
language sql
security definer
set search_path = ''
stable
as $$
  select m.id, m.sender_id, m.body, m.created_at, p.display_name, p.avatar_url
  from public.lounge_messages m
  join public.profiles p on p.id = m.sender_id
  where m.sender_id = (select auth.uid())
     or exists (
       select 1 from public.friend_connections f
       where f.status = 'accepted'
         and (
           (f.requester_id = (select auth.uid()) and f.recipient_id = m.sender_id)
           or (f.recipient_id = (select auth.uid()) and f.requester_id = m.sender_id)
         )
     )
  order by m.created_at asc
  limit 200
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  return new;
end;
$$;

revoke all on function public.find_profile_by_email(text) from public, anon;
revoke all on function public.get_my_friend_connections() from public, anon;
revoke all on function public.get_lounge_messages() from public, anon;
grant execute on function public.find_profile_by_email(text) to authenticated;
grant execute on function public.get_my_friend_connections() to authenticated;
grant execute on function public.get_lounge_messages() to authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

create policy "Public avatar access"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload their own avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can update their own avatars"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
