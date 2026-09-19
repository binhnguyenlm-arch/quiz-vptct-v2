-- Chạy sau 001, 002 và 004. Không xóa dữ liệu hiện có.
begin;
create table if not exists public.vptct_practice_completions (
 id uuid primary key, participant text not null, completed_at timestamptz not null default now()
);
create index if not exists vptct_practice_completions_rate on public.vptct_practice_completions(participant,completed_at);
alter table public.vptct_practice_completions enable row level security;
revoke all on public.vptct_practice_completions from public,anon,authenticated;
grant all on public.vptct_practice_completions to service_role;
create or replace function public.vptct_study_counts(p jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare rounds jsonb; practice bigint; mock bigint;
begin
 if p->>'op'='practice' then
  if p->>'participant' is null or length(p->>'participant')<>64 then raise exception 'INVALID'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p->>'participant',0));
  if exists(select 1 from vptct_practice_completions where id=(p->>'id')::uuid) then return '{"ok":true}'::jsonb; end if;
  if (select count(*) from vptct_practice_completions where participant=p->>'participant' and completed_at>now()-interval '1 hour')>=60 then raise exception 'RATE_LIMIT'; end if;
  insert into vptct_practice_completions(id,participant) values((p->>'id')::uuid,p->>'participant');
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
 return jsonb_build_object('politics',jsonb_build_object('practice',practice,'mock',mock),'rounds',rounds);
end $$;
revoke all on function public.vptct_study_counts(jsonb) from public,anon,authenticated;
grant execute on function public.vptct_study_counts(jsonb) to service_role;
commit;
