begin;
alter table public.learning_people add column if not exists position text not null default '';
alter table public.learning_people add column if not exists photo text not null default '';
alter table public.office_campaigns add column if not exists period text not null default '';
alter table public.office_campaigns add column if not exists collectives jsonb not null default '[]'::jsonb;
alter table public.office_campaigns alter column date drop not null;
alter table public.office_campaigns drop constraint if exists office_campaigns_honorees_check;
commit;
