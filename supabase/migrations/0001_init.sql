-- WFC Questionnaire — schema
-- Run this in the Supabase SQL editor of your project (or `supabase db push`).

create extension if not exists "pgcrypto";

create table if not exists public.responses (
  token text primary key,
  data jsonb not null default '{}'::jsonb,
  submitted boolean not null default false,
  submission_ref text,
  submitted_at timestamptz,
  pdf_path text,
  docx_path text,
  email_sent boolean not null default false,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists responses_set_updated_at on public.responses;
create trigger responses_set_updated_at
  before update on public.responses
  for each row execute function public.set_updated_at();

-- RLS: this app has no end-user auth — the token in the URL is the capability.
-- All reads/writes go through the server (service-role key) via Next.js API routes,
-- so the browser never talks to Supabase directly. Lock the table down from anon/public.
alter table public.responses enable row level security;
-- No policies are created for anon/authenticated, so only the service role
-- (which bypasses RLS) can read or write. Do not add a public policy here.

-- Storage bucket for generated PDF / DOCX exports.
insert into storage.buckets (id, name, public)
values ('wfc-exports', 'wfc-exports', false)
on conflict (id) do nothing;

-- Only the service role touches this bucket (signed URLs are used for downloads),
-- so no public storage policies are added either.
