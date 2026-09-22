-- Run after 008 and 010. Existing results keep their scores.
begin;
alter table public.vptct_mock_attempts add column if not exists person_id uuid references public.learning_people(id) on delete set null;
create or replace function public.vptct_mock(p jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.vptct_mock_attempts; now_at timestamptz; total integer; ncorrect integer; nanswered integer; r bigint; rows jsonb; public_q jsonb; new_answers jsonb; best boolean;
begin
 now_at:=clock_timestamp();
 perform public.vptct_cleanup();
 if p->>'op'='board' then
   select coalesce(jsonb_agg(to_jsonb(t)),'[]') into rows from (
    select (select photo from public.learning_people lp where lp.id=b.person_id and lp.deleted_at is null) as photo,name,correct,coalesce(question_total,jsonb_array_length(questions)) as total,elapsed,rank() over(order by correct desc,elapsed asc) as rank from (
     select distinct on(participant) * from public.vptct_mock_attempts where board=p->>'board' and eligible and finished_at is not null order by participant,correct desc,elapsed asc,finished_at asc
    ) b order by correct desc,elapsed asc,name limit 30
   ) t;
   return jsonb_build_object('rows',rows,'asOf',now_at);
 end if;
 if p->>'op'='start' then
   if (select count(*) from public.vptct_mock_attempts where participant=p->>'participant' and started_at>now_at-interval '1 hour')>=15 then raise exception 'RATE_LIMIT'; end if;
   insert into public.vptct_mock_attempts(participant,token_hash,name,package_id,board,eligible,questions,expires_at,person_id)
   values(p->>'participant',p->>'token_hash',p->>'name',p->>'package_id',p->>'board',((p->>'eligible')::boolean and nullif(p->>'person_id','') is not null),p->'questions',now_at+make_interval(secs=>(p->>'seconds')::integer),nullif(p->>'person_id','')::uuid) returning * into a;
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
update public.vptct_mock_attempts set eligible=false where finished_at is null and person_id is null;
commit;

commit;
