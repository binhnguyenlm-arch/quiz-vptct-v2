-- 007: chạy sau 001–006. Giữ bộ đếm tích lũy khi gỡ tài liệu.
begin;
alter table public.learning_docs add column if not exists a4_pages integer check(a4_pages>0 and a4_pages<=100000);
alter table public.vptct_practice_completions add column if not exists a4_pages integer check(a4_pages>0 and a4_pages<=100000);
create table if not exists public.green_documents(id text primary key,kind text not null,pages integer,created_at timestamptz not null default now());
create table if not exists public.green_usage(id text primary key,document_id text not null,pages integer,created_at timestamptz not null default now());
alter table public.green_documents enable row level security;
alter table public.green_usage enable row level security;
revoke all on public.green_documents,public.green_usage from public,anon,authenticated;
grant all on public.green_documents,public.green_usage to service_role;
insert into green_documents(id,kind) values('bank:politics','bank') on conflict do nothing;
create or replace function public.green_question_pages(qs jsonb) returns integer
language sql immutable set search_path=public,pg_temp as $$
 select greatest(1,ceil(coalesce(sum(length(q->>'question')+coalesce((select sum(length(value)) from jsonb_each_text(q->'options')),0)+12),0)/3000.0)::integer) from jsonb_array_elements(qs) q;
$$;
-- Lưu độ dài trước khi xóa phần nội dung.
create or replace function public.green_doc_before() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.kind='text' and new.body is not null then new.a4_pages:=greatest(1,ceil(length(new.body)/3000.0)::integer); end if;
 return new;
end $$;
drop trigger if exists green_doc_before on learning_docs;
create trigger green_doc_before before insert or update on learning_docs for each row execute function green_doc_before();
create or replace function public.green_doc_after() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 insert into green_documents(id,kind,pages) values(new.id::text,new.kind,new.a4_pages) on conflict(id) do update set pages=coalesce(excluded.pages,green_documents.pages);
 if new.a4_pages is not null then update green_usage set pages=new.a4_pages where document_id=new.id::text and pages is null; end if;
 return new;
end $$;
drop trigger if exists green_doc_after on learning_docs;
create trigger green_doc_after after insert or update on learning_docs for each row execute function green_doc_after();
update learning_docs set a4_pages=greatest(1,ceil(length(body)/3000.0)::integer) where kind='text' and body is not null and a4_pages is null;
insert into green_documents(id,kind,pages) select id::text,kind,a4_pages from learning_docs on conflict do nothing;
create or replace function public.green_mock_done() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.finished_at is not null then insert into green_usage(id,document_id,pages,created_at) values('mock:'||new.id,'bank:politics',green_question_pages(new.questions),new.finished_at) on conflict do nothing; end if;
 return new;
end $$;
drop trigger if exists green_mock_done on vptct_mock_attempts;
create trigger green_mock_done after insert or update on vptct_mock_attempts for each row execute function green_mock_done();
insert into green_usage(id,document_id,pages,created_at) select 'mock:'||id,'bank:politics',green_question_pages(questions),finished_at from vptct_mock_attempts where finished_at is not null on conflict do nothing;
create or replace function public.green_practice_done() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 insert into green_usage(id,document_id,pages,created_at) values('practice:'||new.id,'bank:politics',new.a4_pages,new.completed_at) on conflict do nothing;return new;
end $$;
drop trigger if exists green_practice_done on vptct_practice_completions;
create trigger green_practice_done after insert on vptct_practice_completions for each row execute function green_practice_done();
insert into green_usage(id,document_id,pages,created_at) select 'practice:'||id,'bank:politics',a4_pages,completed_at from vptct_practice_completions on conflict do nothing;
create or replace function public.green_learning_done() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 insert into green_usage(id,document_id,pages,created_at)
 select 'learning:'||new.person_id||':'||d.id,d.id::text,d.a4_pages,new.completed_at from learning_docs d join learning_receipts rec on rec.doc_id=d.id and rec.person_id=new.person_id
 where d.round_id=new.round_id and rec.confirmed_at<=new.completed_at on conflict do nothing;
 return new;
end $$;
drop trigger if exists green_learning_done on learning_completed;
create trigger green_learning_done after insert on learning_completed for each row execute function green_learning_done();
insert into green_usage(id,document_id,pages,created_at)
 select 'learning:'||c.person_id||':'||d.id,d.id::text,d.a4_pages,min(c.completed_at)
 from (select round_id,person_id,completed_at from learning_completed union all select round_id,person_id,completed_at from learning_completion_history) c
 join learning_docs d on d.round_id=c.round_id join learning_receipts rec on rec.doc_id=d.id and rec.person_id=c.person_id and rec.confirmed_at<=c.completed_at
 group by c.person_id,d.id,d.a4_pages on conflict do nothing;
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
  insert into learning_docs(round_id,title,kind,body,path,position,a4_pages) values(rid,p->>'title',p->>'kind',p->>'body',p->>'path',pos,(p->>'a4_pages')::integer);
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
create or replace function public.vptct_study_counts(p jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare rounds jsonb; practice bigint; mock bigint;
begin
 if p->>'op'='practice' then
  if p->>'participant' is null or length(p->>'participant')<>64 then raise exception 'INVALID'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p->>'participant',0));
  if exists(select 1 from vptct_practice_completions where id=(p->>'id')::uuid) then return '{"ok":true}'::jsonb; end if;
  if (select count(*) from vptct_practice_completions where participant=p->>'participant' and completed_at>now()-interval '1 hour')>=60 then raise exception 'RATE_LIMIT'; end if;
  insert into vptct_practice_completions(id,participant,a4_pages) values((p->>'id')::uuid,p->>'participant',(p->>'a4_pages')::integer);
  return '{"ok":true}'::jsonb;
 end if;
 if p->>'op' is distinct from 'summary' then raise exception 'INVALID'; end if;
 select count(*) into practice from vptct_practice_completions;
 select count(*) into mock from vptct_mock_attempts where finished_at is not null;
 select coalesce(jsonb_object_agg(id,n),'{}'::jsonb) into rounds from (
  select r.id,count(distinct done.person_id) n from learning_rounds r
  left join (select round_id,person_id from learning_completed union select round_id,person_id from learning_completion_history) done on done.round_id=r.id
  where r.state in ('open','closed') group by r.id
 ) totals;
 return jsonb_build_object('politics',jsonb_build_object('practice',practice,'mock',mock),'rounds',rounds,'green',jsonb_build_object('pages',coalesce((select sum(pages) from green_usage),0),'documents',(select count(*) from green_documents),'unknownUsages',(select count(*) from green_usage where pages is null),'unknownDocuments',(select count(*) from green_documents where kind<>'bank' and pages is null)));
end $$;
revoke all on function public.vptct_study_counts(jsonb) from public,anon,authenticated;
grant execute on function public.vptct_study_counts(jsonb) to service_role;

revoke all on function public.green_question_pages(jsonb),public.green_doc_before(),public.green_doc_after(),public.green_mock_done(),public.green_practice_done(),public.green_learning_done() from public,anon,authenticated;
grant execute on function public.green_question_pages(jsonb),public.green_doc_before(),public.green_doc_after(),public.green_mock_done(),public.green_practice_done(),public.green_learning_done() to service_role;
commit;
