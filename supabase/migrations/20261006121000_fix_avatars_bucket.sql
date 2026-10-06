-- Repair an incorrectly named avatars bucket created in production and keep the expected bucket available.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set name = excluded.name, public = excluded.public;
