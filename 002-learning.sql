-- Run once after 001-mock.sql. No changes to quiz data.
begin;
create table if not exists public.learning_people(id uuid primary key references auth.users(id), username text unique not null, name text not null, role text not null default 'member' check(role in ('admin','member')), active boolean not null default true);
create table if not exists public.learning_rounds(id uuid primary key default gen_random_uuid(), title text not null, description text not null default '', year integer not null default extract(year from now()) check(year between 2020 and 2200), state text not null default 'draft' check(state in ('draft','open','closed')), created_at timestamptz not null default now());
create table if not exists public.learning_docs(id uuid primary key default gen_random_uuid(), round_id uuid not null references public.learning_rounds(id), title text not null, kind text not null check(kind in ('text','pdf')), body text, path text, position integer not null, removed boolean not null default false, unique(round_id,position));
create table if not exists public.learning_assigned(round_id uuid references public.learning_rounds(id), person_id uuid references public.learning_people(id), primary key(round_id,person_id));
create table if not exists public.learning_receipts(doc_id uuid references public.learning_docs(id), person_id uuid references public.learning_people(id), confirmed_at timestamptz not null default now(), primary key(doc_id,person_id));
create table if not exists public.learning_completed(round_id uuid references public.learning_rounds(id), person_id uuid references public.learning_people(id), completed_at timestamptz not null default now(), name_snapshot text not null, primary key(round_id,person_id));
alter table public.learning_people enable row level security;
alter table public.learning_rounds enable row level security;
alter table public.learning_docs enable row level security;
alter table public.learning_assigned enable row level security;
alter table public.learning_receipts enable row level security;
alter table public.learning_completed enable row level security;
revoke all on public.learning_people,public.learning_rounds,public.learning_docs,public.learning_assigned,public.learning_receipts,public.learning_completed from anon,authenticated;
grant all on public.learning_people,public.learning_rounds,public.learning_docs,public.learning_assigned,public.learning_receipts,public.learning_completed to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('learning-private','learning-private',false,20971520,array['application/pdf']) on conflict(id) do nothing;
create or replace function public.learning_action(actor uuid,p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare me learning_people; r learning_rounds; d learning_docs; result jsonb; rid uuid; pos integer;
begin
 select * into me from learning_people where id=actor and active;
 if me.id is null then raise exception 'FORBIDDEN'; end if;
 if p->>'op'='confirm' then
  select * into d from learning_docs where id=(p->>'id')::uuid;
  select * into r from learning_rounds where id=d.round_id for update;
  if r.state<>'open' or d.removed or d.id is null or not exists(select 1 from learning_assigned where round_id=r.id and person_id=actor) then raise exception 'FORBIDDEN'; end if;
  insert into learning_receipts(doc_id,person_id) values(d.id,actor) on conflict do nothing;
  if not exists(select 1 from learning_docs x where x.round_id=r.id and not exists(select 1 from learning_receipts y where y.doc_id=x.id and y.person_id=actor)) then
   insert into learning_completed(round_id,person_id,name_snapshot) values(r.id,actor,me.name) on conflict do nothing;
  end if;
  return jsonb_build_object('ok',true);
 end if;
 if me.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 if p->>'op'='createRound' then
  insert into learning_rounds(title,description,year) values(p->>'title',coalesce(p->>'description',''),(p->>'year')::integer) returning id into rid;
 elsif p->>'op'='addDoc' then
  rid:=(p->>'round_id')::uuid;
  select * into r from learning_rounds where id=rid for update;
  if r.state<>'draft' or r.id is null then raise exception 'DRAFT_ONLY'; end if;
  select coalesce(max(position),0)+1 into pos from learning_docs where round_id=rid;
  insert into learning_docs(round_id,title,kind,body,path,position) values(rid,p->>'title',p->>'kind',p->>'body',p->>'path',pos);
 elsif p->>'op'='editText' then
  select * into d from learning_docs where id=(p->>'id')::uuid;
  select * into r from learning_rounds where id=d.round_id for update;
  if r.state<>'draft' or d.kind<>'text' or d.id is null then raise exception 'DRAFT_ONLY'; end if;
  update learning_docs set title=p->>'title',body=p->>'body' where id=d.id;
 elsif p->>'op'='publish' then
  rid:=(p->>'id')::uuid;
  select * into r from learning_rounds where id=rid for update;
  if r.state<>'draft' or not exists(select 1 from learning_docs where round_id=rid) then raise exception 'NO_DOCUMENTS'; end if;
  insert into learning_assigned select rid,id from learning_people where active and role='member';
  if not exists(select 1 from learning_assigned where round_id=rid) then raise exception 'NO_MEMBERS'; end if;
  update learning_rounds set state='open' where id=rid;
 elsif p->>'op'='close' then
  update learning_rounds set state='closed' where id=(p->>'id')::uuid and state='open';
 elsif p->>'op'='erase' then
  select * into d from learning_docs where id=(p->>'id')::uuid;
  select * into r from learning_rounds where id=d.round_id for update;
  if r.state<>'closed' or d.id is null then raise exception 'CLOSE_FIRST'; end if;
  update learning_docs set body=null,path=null,removed=true where id=d.id;
 else raise exception 'INVALID_ACTION'; end if;
 return jsonb_build_object('ok',true,'id',rid);
end $$;
revoke all on function public.learning_action(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.learning_action(uuid,jsonb) to service_role;
commit;
