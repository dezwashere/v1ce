-- Milestone memories: optional 50-character note + photo per reached milestone.
create table if not exists public.milestone_memories (
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_days integer not null,
  blurb text not null default '' check (char_length(blurb) <= 50),
  photo_url text,
  updated_at timestamptz not null default now(),
  primary key (user_id, milestone_days)
);
alter table public.milestone_memories enable row level security;
drop policy if exists "milestone memories own read" on public.milestone_memories;
drop policy if exists "milestone memories own insert" on public.milestone_memories;
drop policy if exists "milestone memories own update" on public.milestone_memories;
drop policy if exists "milestone memories own delete" on public.milestone_memories;
create policy "milestone memories own read" on public.milestone_memories for select to authenticated using (auth.uid() = user_id);
create policy "milestone memories own insert" on public.milestone_memories for insert to authenticated with check (auth.uid() = user_id);
create policy "milestone memories own update" on public.milestone_memories for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "milestone memories own delete" on public.milestone_memories for delete to authenticated using (auth.uid() = user_id);
insert into storage.buckets (id,name,public) values ('milestone-photos','milestone-photos',true)
on conflict (id) do update set name='milestone-photos', public=true;
drop policy if exists "milestone photos public read" on storage.objects;
drop policy if exists "milestone photos own insert" on storage.objects;
drop policy if exists "milestone photos own update" on storage.objects;
drop policy if exists "milestone photos own delete" on storage.objects;
create policy "milestone photos public read" on storage.objects for select using (bucket_id='milestone-photos');
create policy "milestone photos own insert" on storage.objects for insert to authenticated with check (bucket_id='milestone-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "milestone photos own update" on storage.objects for update to authenticated using (bucket_id='milestone-photos' and owner_id=auth.uid()::text);
create policy "milestone photos own delete" on storage.objects for delete to authenticated using (bucket_id='milestone-photos' and owner_id=auth.uid()::text);