-- Upgrade existing learning module. Keep all receipts and archived completions.
begin;
create table if not exists public.learning_completion_history(round_id uuid,person_id uuid,completed_at timestamptz,name_snapshot text,archived_at timestamptz not null default now(),reason text not null,primary key(round_id,person_id,completed_at));
alter table public.learning_completion_history enable row level security;
revoke all on public.learning_completion_history from anon,authenticated;
grant all on public.learning_completion_history to service_role;
create or replace function public.learning_action(actor uuid,p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare me learning_people; r learning_rounds; d learning_docs; result jsonb; rid uuid; pos integer;
begin
 select * into me from learning_people where id=actor and active;
 if me.id is null then raise exception 'FORBIDDEN'; end if;
 if p->>'op'='confirm' then
  select * into d from learning_docs where id=(p->>'id')::uuid;
  select * into r from learning_rounds where id=d.round_id for update;
  select * into d from learning_docs where id=(p->>'id')::uuid;
  if r.state<>'open' or d.removed or d.id is null or not exists(select 1 from learning_assigned where round_id=r.id and person_id=actor) then raise exception 'FORBIDDEN'; end if;
  insert into learning_receipts(doc_id,person_id) values(d.id,actor) on conflict do nothing;
  if not exists(select 1 from learning_docs x where x.round_id=r.id and not x.removed and not exists(select 1 from learning_receipts y where y.doc_id=x.id and y.person_id=actor)) then
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
  if r.state not in ('draft','open') or r.id is null then raise exception 'ROUND_CLOSED'; end if;
  if r.state='open' then
   insert into learning_completion_history select c.*,now(),'supplement' from learning_completed c where round_id=rid on conflict do nothing;
   delete from learning_completed where round_id=rid;
  end if;
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
  if r.state<>'draft' or not exists(select 1 from learning_docs where round_id=rid and not removed) then raise exception 'NO_DOCUMENTS'; end if;
  insert into learning_assigned select rid,id from learning_people where active and role='member';
  if not exists(select 1 from learning_assigned where round_id=rid) then raise exception 'NO_MEMBERS'; end if;
  update learning_rounds set state='open' where id=rid;
 elsif p->>'op'='close' then
  update learning_rounds set state='closed' where id=(p->>'id')::uuid and state='open';
 elsif p->>'op'='erase' then
  select * into d from learning_docs where id=(p->>'id')::uuid;
  select * into r from learning_rounds where id=d.round_id for update;
  if r.id is null or d.id is null then raise exception 'NOT_FOUND'; end if;
  update learning_docs set body=null,removed=true where id=d.id;
  if r.state='open' and exists(select 1 from learning_docs where round_id=r.id and not removed) then
   insert into learning_completed(round_id,person_id,name_snapshot)
   select r.id,a.person_id,u.name from learning_assigned a join learning_people u on u.id=a.person_id
   where a.round_id=r.id and not exists(select 1 from learning_docs x where x.round_id=r.id and not x.removed and not exists(select 1 from learning_receipts y where y.doc_id=x.id and y.person_id=a.person_id))
   on conflict do nothing;
  end if;
 else raise exception 'INVALID_ACTION'; end if;
 return jsonb_build_object('ok',true,'id',rid);
end $$;
revoke all on function public.learning_action(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.learning_action(uuid,jsonb) to service_role;
commit;
