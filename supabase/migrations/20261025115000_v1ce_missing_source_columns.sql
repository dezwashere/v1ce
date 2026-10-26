-- Safe replacement for the schema-only portion of skipped historical migration.
-- Does not alter RLS, storage policies, or existing data.
alter table public.friend_connections add column if not exists requester_email text;
alter table public.friend_connections add column if not exists recipient_email text;
alter table public.friend_connections add column if not exists requester_name text;
alter table public.friend_connections add column if not exists recipient_name text;
alter table public.blocked_users add column if not exists blocker_email text;
alter table public.blocked_users add column if not exists blocked_email text;
alter table public.lounge_messages add column if not exists message_type text default 'regular';
alter table public.lounge_messages add column if not exists related_friend text;
alter table public.lounge_messages add column if not exists sender_name text;
