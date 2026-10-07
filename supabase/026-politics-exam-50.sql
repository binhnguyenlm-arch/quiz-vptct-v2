begin;
alter table public.politics_attempts add column if not exists total_deadline timestamptz;
create or replace function public.politics_exam(p jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a politics_attempts;me learning_people; ts timestamptz:=clock_timestamp(); q jsonb; n integer; permission text; score integer; answered integer;
begin
 select * into me from learning_people where id=(p->>'actor')::uuid and active and deleted_at is null for update;
 if not found then raise exception 'SESSION';end if;
 select audience into permission from politics_permissions where person_id=me.id;
 if p->>'op'='assign' then
  if me.role<>'admin' then raise exception 'FORBIDDEN';end if;
  if not exists(select 1 from learning_people where id=(p->>'person')::uuid and active and deleted_at is null) then raise exception 'NOT_FOUND';end if;
  if nullif(p->>'audience','') is null then delete from politics_permissions where person_id=(p->>'person')::uuid;
  else insert into politics_permissions(person_id,audience,updated_by) values((p->>'person')::uuid,p->>'audience',me.id) on conflict(person_id) do update set audience=excluded.audience,updated_by=me.id,updated_at=now();end if;
  update politics_attempts set status='aborted',finished_at=ts where person_id=(p->>'person')::uuid and status='active' and audience is distinct from nullif(p->>'audience','');
  return '{"ok":true}'::jsonb;
 end if;
 if p->>'op'='start' then
  if permission is null or permission<>p->>'audience' then raise exception 'FORBIDDEN';end if;
  select * into a from politics_attempts where person_id=me.id and status='active';
  if not found then
   if (select count(*) from politics_attempts where person_id=me.id and started_at>ts-interval '1 hour')>=20 then raise exception 'RATE_LIMIT';end if;
   if jsonb_array_length(p->'questions') not between 1 and 1000 then raise exception 'INVALID';end if;
   if p->>'package'='50' and (jsonb_array_length(p->'questions')<>50 or (p->>'full')::boolean) then raise exception 'INVALID';end if;
   insert into politics_attempts(person_id,audience,bank_version,full_bank,questions,deadline,total_deadline) values(me.id,permission,p->>'version',(p->>'full')::boolean,p->'questions',ts+interval '2 minutes',case when p->>'package'='50' then ts+interval '30 minutes' else null end) returning * into a;
  end if;
 elsif p->>'op' in ('resume','answer','discard') then
  select * into a from politics_attempts where person_id=me.id and id=(p->>'id')::uuid for update;
  if not found then raise exception 'NOT_FOUND';end if;
 else raise exception 'INVALID';end if;
 n:=jsonb_array_length(a.questions);
 if a.status='active' and permission is distinct from a.audience then a.status:='aborted';end if;
 while a.status='active' and ts>=a.deadline and (a.total_deadline is null or a.deadline<=a.total_deadline) loop
  a.timeouts:=a.timeouts+1;a.cursor:=a.cursor+1;a.deadline:=a.deadline+interval '2 minutes';
  if a.timeouts>=10 then a.status:='aborted';elsif a.cursor>=n then a.status:='done';end if;
 end loop;
 if a.status='active' and a.total_deadline is not null and ts>=a.total_deadline then a.status:='done';a.cursor:=n;end if;
 if a.status='active' and p->>'op'='discard' then a.status:='aborted';end if;
 if a.status='active' and p->>'op'='answer' and (p->>'cursor')::integer=a.cursor then
  q:=a.questions->a.cursor;
  if not (q->'options' ? (p->>'answer')) then raise exception 'INVALID';end if;
  a.answers:=a.answers||jsonb_build_object(q->>'id',p->>'answer');a.timeouts:=0;a.cursor:=a.cursor+1;a.deadline:=ts+interval '2 minutes';
  if a.cursor>=n then a.status:='done';end if;
 end if;
 if a.status<>'active' and a.finished_at is null then
  a.finished_at:=ts;select count(*) into score from jsonb_array_elements(a.questions) x where a.answers->>(x->>'id')=x->>'correct_answer';a.correct:=score;select count(*) into answered from jsonb_object_keys(a.answers);
  -- Only complete full-bank exams contribute to ranking, once per bank via existing best-result logic.
  if a.status='done' and a.full_bank then
   insert into vptct_mock_attempts(id,participant,token_hash,name,package_id,board,eligible,questions,answers,started_at,expires_at,finished_at,correct,wrong,unanswered,elapsed,person_id,question_total)
   values(a.id,'politics:'||me.id,'disabled',me.name,'politics-full','politics-'||a.audience||'-'||a.bank_version||':full',me.role='member',a.questions,a.answers,a.started_at,a.deadline,ts,score,answered-score,n-answered,greatest(0,extract(epoch from ts-a.started_at)::integer),me.id,n) on conflict(id) do nothing;
  end if;
 end if;
 update politics_attempts set answers=a.answers,cursor=a.cursor,timeouts=a.timeouts,deadline=a.deadline,status=a.status,finished_at=a.finished_at,correct=a.correct where id=a.id;
 return jsonb_build_object('id',a.id,'audience',a.audience,'full',a.full_bank,'cursor',a.cursor,'total',n,'deadline',a.deadline,'total_deadline',a.total_deadline,'now',ts,'status',a.status,'timeouts',a.timeouts,'correct',a.correct,'question',case when a.status='active' then (a.questions->a.cursor)-'correct_answer' else null end,'review',case when a.status='done' then a.questions else '[]'::jsonb end,'answers',case when a.status='done' then a.answers else '{}'::jsonb end);
end $$;
revoke all on function public.politics_exam(jsonb) from public,anon,authenticated;
grant execute on function public.politics_exam(jsonb) to service_role;
commit;
