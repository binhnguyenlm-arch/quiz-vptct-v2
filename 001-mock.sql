-- Chạy một lần trong SQL Editor của dự án Supabase MỚI.
-- Không xóa hoặc thay đổi bảng của dự án cũ.
create table if not exists public.vptct_mock_attempts (
 id uuid primary key default gen_random_uuid(), participant text not null, token_hash text not null,
 name text not null, package_id text not null, board text not null, eligible boolean not null,
 questions jsonb not null, answers jsonb not null default '{}', revision integer not null default 0,
 started_at timestamptz not null default clock_timestamp(), expires_at timestamptz not null,
 finished_at timestamptz, correct integer, wrong integer, unanswered integer, elapsed integer, improved boolean
);
alter table public.vptct_mock_attempts enable row level security;
revoke all on public.vptct_mock_attempts from anon,authenticated;
grant all on public.vptct_mock_attempts to service_role;
create index if not exists vptct_mock_board_idx on public.vptct_mock_attempts(board,correct desc,elapsed);
create index if not exists vptct_mock_participant_idx on public.vptct_mock_attempts(participant,started_at);

create or replace function public.vptct_mock(p jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.vptct_mock_attempts; now_at timestamptz; total integer; ncorrect integer; nanswered integer; r bigint; rows jsonb; public_q jsonb; new_answers jsonb; best boolean;
begin
 now_at:=clock_timestamp();
 if p->>'op'='board' then
   select coalesce(jsonb_agg(to_jsonb(t)),'[]') into rows from (
    select name,correct,jsonb_array_length(questions) as total,elapsed,rank() over(order by correct desc,elapsed asc) as rank from (
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
