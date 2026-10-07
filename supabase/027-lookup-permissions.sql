-- Run after 024. No images, OCR text or lookup history are stored.
begin;
create table if not exists public.lookup_permissions (
 person_id uuid primary key references public.learning_people(id) on delete cascade,
 granted_by uuid references public.learning_people(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.lookup_permissions enable row level security;
revoke all on public.lookup_permissions from public, anon, authenticated;
grant all on public.lookup_permissions to service_role;
commit;
