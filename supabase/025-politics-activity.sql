-- Run after 024. Completed rounds only; replaying requests does not add counts/pages.
begin;
create or replace function public.politics_learning_pending(actor uuid) returns jsonb
language sql security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object('total',count(*),'open',count(*) filter(where r.state='open'),'closed',count(*) filter(where r.state='closed'))
 from learning_rounds r
 where r.deleted_at is null and r.state in ('open','closed')
 and exists(select 1 from learning_people u where u.id=actor and u.active and u.deleted_at is null)
 and exists(select 1 from learning_assigned a where a.round_id=r.id and a.person_id=actor)
 and not exists(select 1 from learning_completed c where c.round_id=r.id and c.person_id=actor);
$$;
revoke all on function public.politics_learning_pending(uuid) from public,anon,authenticated;
grant execute on function public.politics_learning_pending(uuid) to service_role;
create or replace function public.green_politics_done() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.status='done' and new.finished_at is not null then
  insert into green_usage(id,document_id,pages,created_at)
  values('mock:'||new.id,'bank:politics',green_question_pages(new.questions),new.finished_at)
  on conflict(id) do nothing;
 end if;
 return new;
end $$;
revoke all on function public.green_politics_done() from public,anon,authenticated;
grant execute on function public.green_politics_done() to service_role;
drop trigger if exists green_politics_done on public.politics_attempts;
create trigger green_politics_done after insert or update on public.politics_attempts
for each row execute function public.green_politics_done();
-- Backfill completed exams, including the 100-question package. Full-bank entries share the existing mock key.
insert into green_usage(id,document_id,pages,created_at)
select 'mock:'||id,'bank:politics',green_question_pages(questions),finished_at
from politics_attempts where status='done' and finished_at is not null
on conflict(id) do nothing;
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
 select (select count(*) from vptct_mock_attempts m where m.finished_at is not null and not exists(select 1 from politics_attempts a where a.id=m.id)) + (select count(*) from politics_attempts where status='done' and finished_at is not null) into mock;
 select coalesce(jsonb_object_agg(id,n),'{}'::jsonb) into rounds from (
  select r.id,count(distinct done.person_id) n from learning_rounds r
  left join (select round_id,person_id from learning_completed union select round_id,person_id from learning_completion_history) done on done.round_id=r.id
  where r.state in ('open','closed') group by r.id
 ) totals;
 return jsonb_build_object('politics',jsonb_build_object('practice',practice,'mock',mock),'rounds',rounds,'green',jsonb_build_object('pages',coalesce((select sum(pages) from green_usage),0),'documents',(select count(*) from green_documents),'unknownUsages',(select count(*) from green_usage where pages is null),'unknownDocuments',(select count(*) from green_documents where kind<>'bank' and pages is null)));
end $$;
revoke all on function public.vptct_study_counts(jsonb) from public,anon,authenticated;
grant execute on function public.vptct_study_counts(jsonb) to service_role;

commit;
