-- V1CE friend profiles and per-photo privacy.
-- Additive only: existing rows remain, and existing milestone photos default private.

alter table public.profiles
  add column if not exists milestone_display_format text not null default 'automatic'
  check (milestone_display_format in ('automatic', 'total_days', 'years_months_days'));

alter table public.milestone_memories
  add column if not exists is_public boolean not null default false;

drop policy if exists "milestone memories accepted friends public read" on public.milestone_memories;
create policy "milestone memories accepted friends public read"
on public.milestone_memories for select to authenticated
using (
  is_public
  and exists (
    select 1 from public.friend_connections f
    where f.status = 'accepted'
      and ((f.requester_id = (select auth.uid()) and f.recipient_id = milestone_memories.user_id)
        or (f.recipient_id = (select auth.uid()) and f.requester_id = milestone_memories.user_id))
  )
);

update storage.buckets set public = false where id = 'milestone-photos';
drop policy if exists "milestone photos public read" on storage.objects;
drop policy if exists "milestone photos owner or accepted friend read" on storage.objects;
create policy "milestone photos owner or accepted friend read"
on storage.objects for select to authenticated
using (
  bucket_id = 'milestone-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.milestone_memories m
      join public.friend_connections f on f.status = 'accepted'
      where m.is_public
        and (m.photo_url like '%' || name)
        and ((f.requester_id = (select auth.uid()) and f.recipient_id = m.user_id)
          or (f.recipient_id = (select auth.uid()) and f.requester_id = m.user_id))
    )
  )
);

drop function if exists public.get_accepted_friend_profiles(uuid[]);
create or replace function public.get_accepted_friend_profiles(target_ids uuid[])
returns table (
  id uuid,
  display_name text,
  sobriety_date date,
  birthday date,
  personal_quote text,
  milestone_display_format text,
  coin_color text,
  coin_shape text,
  coin_motto text,
  number_style text,
  avatar_url text,
  default_avatar_seed text,
  show_coin boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, p.sobriety_date, p.birthday, p.personal_quote,
    p.milestone_display_format, p.coin_color, p.coin_shape, p.coin_motto,
    p.number_style, p.avatar_url, p.default_avatar_seed, p.show_coin
  from public.profiles p
  where p.id = any(target_ids)
    and exists (
      select 1 from public.friend_connections f
      where f.status = 'accepted'
        and ((f.requester_id = (select auth.uid()) and f.recipient_id = p.id)
          or (f.recipient_id = (select auth.uid()) and f.requester_id = p.id))
    );
$$;
revoke all on function public.get_accepted_friend_profiles(uuid[]) from public, anon;
grant execute on function public.get_accepted_friend_profiles(uuid[]) to authenticated;
