-- 008: run AFTER 001–007. Groups, targeted rounds, removal and retention.
begin;
alter table learning_people add column if not exists audience text not null default 'party' check(audience in ('party','public'));
alter table learning_people add column if not exists created_at timestamptz;
update learning_people p set created_at=u.created_at from auth.users u where p.id=u.id and p.created_at is null;
update learning_people set created_at=now() where created_at is null;
alter table learning_people alter column created_at set default now();
alter table learning_people alter column created_at set not null;
alter table learning_rounds add column if not exists audience text not null default 'both' check(audience in ('party','public','both'));
alter table learning_rounds add column if not exists deleted_at timestamptz;
create or replace function public.learning_action(actor uuid,p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare me learning_people; r learning_rounds; d learning_docs; result jsonb; rid uuid; pos integer;
begin
 select * into me from learning_people where id=actor and active;
 if me.id is null then raise exception 'FORBIDDEN'; end if;
 if p->>'op'='confirm' then
  select * into d from learning_docs where id=(p->>'id')::uuid;
  select * into r from learning_rounds where id=d.round_id and deleted_at is null for update;
  select * into d from learning_docs where id=(p->>'id')::uuid;
  if r.deleted_at is not null then raise exception 'DELETED'; end if;
  if r.id is null or r.state<>'open' or d.removed or d.id is null or not exists(select 1 from learning_assigned where round_id=r.id and person_id=actor) then raise exception 'FORBIDDEN'; end if;
  insert into learning_receipts(doc_id,person_id) values(d.id,actor) on conflict do nothing;
  if not exists(select 1 from learning_docs x where x.round_id=r.id and not x.removed and not exists(select 1 from learning_receipts y where y.doc_id=x.id and y.person_id=actor)) then
   insert into learning_completed(round_id,person_id,name_snapshot) values(r.id,actor,me.name) on conflict do nothing;
  end if;
  return jsonb_build_object('ok',true);
 end if;
 if me.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 if p->>'op'='assignPerson' then
  select * into r from learning_rounds where id=(p->>'id')::uuid for update;
  if r.id is null or r.deleted_at is not null or r.state<>'open' then raise exception 'ROUND_NOT_OPEN'; end if;
  if not exists(select 1 from learning_people where id=(p->>'person_id')::uuid and active and deleted_at is null and role='member' and (r.audience='both' or audience=r.audience)) then raise exception 'WRONG_AUDIENCE'; end if;
  insert into learning_assigned(round_id,person_id) values(r.id,(p->>'person_id')::uuid) on conflict do nothing;
 elsif p->>'op'='setAudience' then
  if p->>'audience' not in ('party','public') then raise exception 'INVALID'; end if;
  update learning_people set audience=p->>'audience' where id=(p->>'id')::uuid and deleted_at is null;
 elsif p->>'op'='deleteRound' then
  update learning_rounds set deleted_at=coalesce(deleted_at,now()),state='closed' where id=(p->>'id')::uuid;
 elsif p->>'op'='purgeRound' then
  rid:=(p->>'id')::uuid;
  select * into r from learning_rounds where id=rid for update;
  if r.deleted_at is null then raise exception 'NOT_DELETED'; end if;
  delete from learning_receipts where doc_id in (select id from learning_docs where round_id=rid);
  delete from learning_completed where round_id=rid;
  delete from learning_completion_history where round_id=rid;
  delete from learning_assigned where round_id=rid;
  delete from learning_docs where round_id=rid;
  delete from learning_rounds where id=rid;
 elsif p->>'op'='createRound' then
  insert into learning_rounds(title,description,year,audience) values(p->>'title',coalesce(p->>'description',''),(p->>'year')::integer,coalesce(p->>'audience','both')) returning id into rid;
 elsif p->>'op'='addDoc' then
  rid:=(p->>'round_id')::uuid;
  select * into r from learning_rounds where id=rid for update;
  if r.deleted_at is not null then raise exception 'DELETED'; end if;
  if r.state not in ('draft','open') or r.id is null then raise exception 'ROUND_CLOSED'; end if;
  if r.deleted_at is not null then raise exception 'DELETED'; end if;
  if r.state='open' then
   insert into learning_completion_history select c.*,now(),'supplement' from learning_completed c where round_id=rid on conflict do nothing;
   delete from learning_completed where round_id=rid;
  end if;
  select coalesce(max(position),0)+1 into pos from learning_docs where round_id=rid;
  insert into learning_docs(round_id,title,kind,body,path,position,a4_pages) values(rid,p->>'title',p->>'kind',p->>'body',p->>'path',pos,(p->>'a4_pages')::integer);
 elsif p->>'op'='editText' then
  select * into d from learning_docs where id=(p->>'id')::uuid;
  select * into r from learning_rounds where id=d.round_id and deleted_at is null for update;
  if r.deleted_at is not null then raise exception 'DELETED'; end if;
  if r.id is null or r.state<>'draft' or d.kind<>'text' or d.id is null then raise exception 'DRAFT_ONLY'; end if;
  update learning_docs set title=p->>'title',body=p->>'body' where id=d.id;
 elsif p->>'op'='publish' then
  rid:=(p->>'id')::uuid;
  select * into r from learning_rounds where id=rid for update;
  if r.deleted_at is not null then raise exception 'DELETED'; end if;
  if r.state<>'draft' or not exists(select 1 from learning_docs where round_id=rid and not removed) then raise exception 'NO_DOCUMENTS'; end if;
  insert into learning_assigned select rid,id from learning_people where active and role='member' and deleted_at is null and (r.audience='both' or audience=r.audience);
  if not exists(select 1 from learning_assigned where round_id=rid) then raise exception 'NO_MEMBERS'; end if;
  update learning_rounds set state='open' where id=rid;
 elsif p->>'op'='close' then
  update learning_rounds set state='closed' where id=(p->>'id')::uuid and state='open';
 elsif p->>'op'='erase' then
  select * into d from learning_docs where id=(p->>'id')::uuid;
  select * into r from learning_rounds where id=d.round_id and deleted_at is null for update;
  if r.deleted_at is not null or r.id is null or d.id is null then raise exception 'NOT_FOUND'; end if;
  update learning_docs set body=null,removed=true where id=d.id;
  if r.deleted_at is not null then raise exception 'DELETED'; end if;
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

-- Public directory exposes only approved display fields; never credentials.
create or replace function public.learning_directory() returns jsonb language sql security invoker set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(to_jsonb(t) order by t.audience,t.created_at,t.id),'[]'::jsonb) from (
 select p.id,p.name,p.username,p.audience,p.created_at,(select count(distinct c.round_id) from (select round_id,person_id from learning_completed union select round_id,person_id from learning_completion_history) c join learning_rounds r on r.id=c.round_id where c.person_id=p.id and r.deleted_at is null and r.state<>'draft') as study_count
 from learning_people p where p.role='member' and p.deleted_at is null and p.active
 ) t;
$$;
revoke all on function public.learning_directory() from public,anon,authenticated;
grant execute on function public.learning_directory() to service_role;
alter table vptct_mock_attempts add column if not exists question_total integer;
create or replace function public.vptct_cleanup() returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 -- Keep a short retry window; explicit exit clears the result immediately.
 delete from vptct_mock_attempts where (not eligible and finished_at<now()-interval '1 hour') or (finished_at is null and expires_at<now()-interval '1 day');
 update vptct_mock_attempts set question_total=coalesce(question_total,jsonb_array_length(questions)),questions='[]',answers='{}',token_hash='' where eligible and finished_at<now()-interval '1 hour' and questions<>'[]'::jsonb;
 delete from vptct_practice_completions where completed_at<now()-interval '1 day';
end $$;
revoke all on function public.vptct_cleanup() from public,anon,authenticated;
grant execute on function public.vptct_cleanup() to service_role;
create or replace function public.vptct_mock(p jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.vptct_mock_attempts; now_at timestamptz; total integer; ncorrect integer; nanswered integer; r bigint; rows jsonb; public_q jsonb; new_answers jsonb; best boolean;
begin
 now_at:=clock_timestamp();
 perform public.vptct_cleanup();
 if p->>'op'='board' then
   select coalesce(jsonb_agg(to_jsonb(t)),'[]') into rows from (
    select name,correct,coalesce(question_total,jsonb_array_length(questions)) as total,elapsed,rank() over(order by correct desc,elapsed asc) as rank from (
     select distinct on(participant) * from public.vptct_mock_attempts where board=p->>'board' and eligible and finished_at is not null order by participant,correct desc,elapsed asc,finished_at asc
    ) b order by correct desc,elapsed asc,name limit 30
   ) t;
   return jsonb_build_object('rows',rows,'asOf',now_at);
 end if;
 if p->>'op'='start' then
   if (select count(*) from public.vptct_mock_attempts where participant=p->>'participant' and started_at>now_at-interval '1 hour')>=15 then raise exception 'RATE_LIMIT'; end if;
   insert into public.vptct_mock_attempts(participant,token_hash,name,package_id,board,eligible,questions,expires_at)
   values(p->>'participant',p->>'token_hash',p->>'name',p->>'package_id',p->>'board',(p->>'eligible')::boolean,p->'questions',now_at+make_interval(secs=>(p->>'seconds')::integer)) returning * into a;
 else
   select * into a from public.vptct_mock_attempts where id=(p->>'id')::uuid and participant=p->>'participant' and token_hash=p->>'token_hash' for update;
   if not found then raise exception 'NOT_FOUND'; end if;
   now_at:=clock_timestamp();
 end if;
 if p->>'op'='discard' then
  if a.finished_at is not null and a.eligible then
   update vptct_mock_attempts set question_total=coalesce(question_total,jsonb_array_length(questions)),questions='[]',answers='{}',token_hash='' where id=a.id;
  else delete from vptct_mock_attempts where id=a.id; end if;
  return '{"ok":true}'::jsonb;
 end if;
 if a.finished_at is null and p->>'op' in ('save','submit') and now_at<a.expires_at and coalesce((p->>'revision')::integer,0)>=a.revision then
   select coalesce(jsonb_object_agg(q->>'id',p->'answers'->>(q->>'id')),'{}') into new_answers from jsonb_array_elements(a.questions) q where (q->'options') ? (p->'answers'->>(q->>'id'));
   update public.vptct_mock_attempts set answers=new_answers,revision=(p->>'revision')::integer where id=a.id returning * into a;
 end if;
 if a.finished_at is null and (p->>'op'='submit' or now_at>=a.expires_at) then
   total:=jsonb_array_length(a.questions);
   select count(*) filter(where a.answers->>(q->>'id')=q->>'correct_answer'),count(*) filter(where a.answers ? (q->>'id')) into ncorrect,nanswered from jsonb_array_elements(a.questions) q;
   best:=not exists(select 1 from public.vptct_mock_attempts b where b.participant=a.participant and b.board=a.board and (not a.eligible or b.eligible) and b.finished_at is not null and (b.correct>ncorrect or (b.correct=ncorrect and b.elapsed<=greatest(0,ceil(extract(epoch from (least(now_at,a.expires_at)-a.started_at)))::integer))));
   update public.vptct_mock_attempts set finished_at=now_at,correct=ncorrect,wrong=nanswered-ncorrect,unanswered=total-nanswered,elapsed=greatest(0,ceil(extract(epoch from (least(now_at,a.expires_at)-a.started_at)))::integer),improved=best where id=a.id returning * into a;
 end if;
 if a.finished_at is not null then
   if a.eligible then
    select ranked.rank into r from (
     select participant,rank() over(order by correct desc,elapsed asc) as rank from (
      select distinct on(participant) participant,correct,elapsed from public.vptct_mock_attempts where board=a.board and eligible and finished_at is not null order by participant,correct desc,elapsed asc
     ) b
    ) ranked where ranked.participant=a.participant;
   end if;
   return jsonb_build_object('state','result','id',a.id,'name',a.name,'packageId',a.package_id,'board',a.board,'eligible',a.eligible,'questions',a.questions,'answers',a.answers,'correct',a.correct,'wrong',a.wrong,'unanswered',a.unanswered,'total',jsonb_array_length(a.questions),'elapsed',a.elapsed,'rank',r,'improved',a.improved,'asOf',now_at,'expired',a.finished_at>=a.expires_at);
 end if;
 select jsonb_agg(q-'correct_answer'-'explanation'-'source') into public_q from jsonb_array_elements(a.questions) q;
 return jsonb_build_object('state','active','id',a.id,'name',a.name,'packageId',a.package_id,'eligible',a.eligible,'questions',public_q,'answers',a.answers,'revision',a.revision,'startedAt',a.started_at,'expiresAt',a.expires_at,'serverNow',now_at);
end;
$$;
revoke all on function public.vptct_mock(jsonb) from public,anon,authenticated;
grant execute on function public.vptct_mock(jsonb) to service_role;
create or replace function public.vptct_study_counts(p jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare rounds jsonb; practice bigint; mock bigint;
begin
 perform vptct_cleanup();
 if p->>'op'='practice' then
  if p->>'participant' is null or length(p->>'participant')<>64 then raise exception 'INVALID'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p->>'participant',0));
  if exists(select 1 from green_usage where id='practice:'||(p->>'id')) then return '{"ok":true}'::jsonb; end if;
  if (select count(*) from vptct_practice_completions where participant=p->>'participant' and completed_at>now()-interval '1 hour')>=60 then raise exception 'RATE_LIMIT'; end if;
  insert into vptct_practice_completions(id,participant,a4_pages) values((p->>'id')::uuid,p->>'participant',(p->>'a4_pages')::integer);
  return '{"ok":true}'::jsonb;
 end if;
 if p->>'op' is distinct from 'summary' then raise exception 'INVALID'; end if;
 select count(*) into practice from green_usage where id like 'practice:%';
 select count(*) into mock from green_usage where id like 'mock:%';
 select coalesce(jsonb_object_agg(id,n),'{}'::jsonb) into rounds from (
  select r.id,count(distinct done.person_id) n from learning_rounds r
  left join (select round_id,person_id from learning_completed union select round_id,person_id from learning_completion_history) done on done.round_id=r.id
  where r.deleted_at is null and r.state in ('open','closed') group by r.id
 ) totals;
 return jsonb_build_object('politics',jsonb_build_object('practice',practice,'mock',mock),'rounds',rounds,'green',jsonb_build_object('pages',coalesce((select sum(pages) from green_usage),0),'documents',(select count(*) from green_documents),'unknownUsages',(select count(*) from green_usage where pages is null),'unknownDocuments',(select count(*) from green_documents where kind<>'bank' and pages is null)));
end $$;
revoke all on function public.vptct_study_counts(jsonb) from public,anon,authenticated;
grant execute on function public.vptct_study_counts(jsonb) to service_role;


select public.vptct_cleanup();
commit;
