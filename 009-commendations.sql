begin;
create table if not exists public.office_campaigns (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(title) between 1 and 200),
 date date not null,
 description text not null default '',
 images jsonb not null default '[]'::jsonb check(jsonb_typeof(images)='array' and jsonb_array_length(images)<=3),
 honorees jsonb not null default '[]'::jsonb check(jsonb_typeof(honorees)='array' and jsonb_array_length(honorees)<=100),
 published boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists office_campaigns_date on public.office_campaigns(date desc,id);
alter table public.office_campaigns enable row level security;
revoke all on public.office_campaigns from public, anon, authenticated;
grant select,insert,update,delete on public.office_campaigns to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('office-awards','office-awards',true,1048576,array['image/webp'])
on conflict(id) do update set public=true,file_size_limit=1048576,allowed_mime_types=array['image/webp'];
commit;
