-- Lịch CTĐ, CTCT. Chạy sau các migration hiện có, không sửa dữ liệu học tập.
begin;
create table if not exists public.office_task_categories(id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name)) between 1 and 100));
create unique index if not exists office_category_name on public.office_task_categories(lower(btrim(name)));
insert into public.office_task_categories(name) select n from unnest(array['Xây dựng kế hoạch','Xây dựng hướng dẫn tuyên truyền','Xây dựng hướng dẫn CTĐ, CTCT']) n where not exists(select 1 from public.office_task_categories where lower(name)=lower(n));
create table if not exists public.office_tasks (
 id uuid primary key default gen_random_uuid(), received_at timestamptz not null,
 content text not null check(length(btrim(content)) between 1 and 4000), category_id uuid not null references public.office_task_categories(id),
 lead_id uuid not null references public.learning_people(id), due_at timestamptz not null,
 created_by uuid not null references public.learning_people(id), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), version integer not null default 1,
 completed_at timestamptz, completed_by uuid references public.learning_people(id),
 result_text text not null default '', check(due_at>=received_at)
);
create table if not exists public.office_task_helpers (
 task_id uuid not null references public.office_tasks(id), person_id uuid not null references public.learning_people(id),
 primary key(task_id,person_id)
);
create table if not exists public.office_task_updates (
 id uuid primary key default gen_random_uuid(), task_id uuid not null references public.office_tasks(id),
 actor uuid not null references public.learning_people(id), actor_name text not null,
 kind text not null check(kind in ('created','assigned','progress','completed','reopened')),
 body text not null check(length(btrim(body)) between 1 and 4000), created_at timestamptz not null default now(),
 file_key text, file_name text, file_bytes integer,
 check((file_key is null and file_name is null and file_bytes is null) or
 (file_key ~ '^office-tasks/[a-f0-9-]{36}/[a-f0-9-]{36}\.(pdf|doc|docx)$' and length(file_name) between 1 and 180 and file_bytes between 1 and 3145728))
);
create index if not exists office_task_completed on public.office_tasks(completed_at,category_id) where completed_at is not null;
create index if not exists office_task_due on public.office_tasks(due_at) where completed_at is null;
create index if not exists office_task_received on public.office_tasks(received_at desc,id);
create index if not exists office_task_lead on public.office_tasks(lead_id) where completed_at is null;
create index if not exists office_task_helper_person on public.office_task_helpers(person_id,task_id);
create index if not exists office_task_history on public.office_task_updates(task_id,created_at desc,id);
alter table public.office_tasks enable row level security;
alter table public.office_task_categories enable row level security;
alter table public.office_task_helpers enable row level security;
alter table public.office_task_updates enable row level security;
revoke all on public.office_tasks,public.office_task_helpers,public.office_task_updates,public.office_task_categories from public,anon,authenticated;
grant all on public.office_tasks,public.office_task_helpers,public.office_task_updates,public.office_task_categories to service_role;

create or replace function public.office_task_action(p jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare me learning_people; t office_tasks; tid uuid; op text:=p->>'op'; page_no integer;
 hs uuid[]; total_count integer; rows_out jsonb; people_out jsonb; counts_out jsonb; selected boolean; groups_out jsonb; categories_out jsonb;
begin
 select * into me from learning_people where id=(p->>'actor')::uuid and active and deleted_at is null;
 if me.id is null then raise exception 'FORBIDDEN'; end if;
 if op='category' then
  if me.role<>'admin' then raise exception 'FORBIDDEN'; end if;
  if length(btrim(coalesce(p->>'name',''))) not between 1 and 100 then raise exception 'INVALID'; end if;
  insert into office_task_categories(name) values(btrim(p->>'name'));
  return jsonb_build_object('ok',true);
 end if;
 if op='export' then
  if (p->>'from') is null or (p->>'until') is null or (p->>'from')::timestamptz >= (p->>'until')::timestamptz or coalesce(p->>'date_field','') not in ('received','completed') then raise exception 'INVALID'; end if;
  select coalesce(jsonb_agg(to_jsonb(z)),'[]') into rows_out from (
   select exp.received_at,exp.content,c.name category_name,l.name lead_name,
    coalesce((select string_agg(lp.name,', ' order by lp.name) from office_task_helpers h join learning_people lp on lp.id=h.person_id where h.task_id=exp.id),'') helper_names,
    exp.due_at,exp.completed_at,exp.result_text,
    case when exp.completed_at is not null then 'Đã hoàn thành' when exp.due_at<now() then 'Quá hạn' when exp.due_at<=now()+interval '2 days' then 'Sắp đến hạn' else 'Đang thực hiện' end status
   from office_tasks exp join office_task_categories c on c.id=exp.category_id join learning_people l on l.id=exp.lead_id
   where (case when p->>'date_field'='received' then exp.received_at else exp.completed_at end)>=(p->>'from')::timestamptz and
    (case when p->>'date_field'='received' then exp.received_at else exp.completed_at end)<(p->>'until')::timestamptz
   order by exp.received_at desc,exp.id limit 5001
  ) z;
  if jsonb_array_length(rows_out)>5000 then raise exception 'EXPORT_LIMIT'; end if;
  return jsonb_build_object('rows',rows_out,'serverTime',now());
 end if;
 if op='list' then
  page_no:=greatest(1,least(100000,coalesce((p->>'page')::integer,1)));
  if coalesce(p->>'tab','all') not in ('all','mine','summary') then raise exception 'INVALID'; end if;
  if p->>'tab'='summary' and ((p->>'from') is null or (p->>'until') is null or (p->>'from')::timestamptz >= (p->>'until')::timestamptz) then raise exception 'INVALID'; end if;
  select jsonb_build_object('total',count(*),'completed',count(*) filter(where completed_at is not null),
   'overdue',count(*) filter(where completed_at is null and due_at<now()),
   'soon',count(*) filter(where completed_at is null and due_at>=now() and due_at<=now()+interval '2 days'),
   'mine',count(*) filter(where completed_at is null and (lead_id=me.id or exists(select 1 from office_task_helpers h where h.task_id=office_tasks.id and h.person_id=me.id))))
   into counts_out from office_tasks;
  select count(*) into total_count from office_tasks x where coalesce(p->>'tab','all')='all' or
   (p->>'tab'='mine' and x.completed_at is null and (x.lead_id=me.id or exists(select 1 from office_task_helpers h where h.task_id=x.id and h.person_id=me.id))) or
   (p->>'tab'='summary' and x.completed_at >= (p->>'from')::timestamptz and x.completed_at < (p->>'until')::timestamptz and (nullif(p->>'category','') is null or x.category_id=(p->>'category')::uuid));
  select coalesce(jsonb_agg(to_jsonb(z)),'[]') into rows_out from (
   select x.*,l.name lead_name,c.name category_name,
    coalesce((select jsonb_agg(jsonb_build_object('id',h.person_id,'name',lp.name) order by lp.name,h.person_id) from office_task_helpers h join learning_people lp on lp.id=h.person_id where h.task_id=x.id),'[]') helpers,
    (x.lead_id=me.id or exists(select 1 from office_task_helpers h where h.task_id=x.id and h.person_id=me.id)) assigned,
    case when x.completed_at is not null then 'done' when x.due_at<now() then 'overdue' when x.due_at<=now()+interval '2 days' then 'soon' else 'active' end status
   from office_tasks x join learning_people l on l.id=x.lead_id join office_task_categories c on c.id=x.category_id
   where coalesce(p->>'tab','all')='all' or (p->>'tab'='mine' and x.completed_at is null and (x.lead_id=me.id or exists(select 1 from office_task_helpers h where h.task_id=x.id and h.person_id=me.id))) or
   (p->>'tab'='summary' and x.completed_at >= (p->>'from')::timestamptz and x.completed_at < (p->>'until')::timestamptz and (nullif(p->>'category','') is null or x.category_id=(p->>'category')::uuid))
   order by (x.completed_at is null and x.due_at<=now()+interval '2 days') desc,
    case when x.completed_at is null and x.due_at<=now()+interval '2 days' then x.due_at end asc,
    x.received_at desc,x.id limit 20 offset (page_no-1)*20
  ) z;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'username',username) order by name,username),'[]') into people_out
   from learning_people where me.role='admin' and active and deleted_at is null;
  select coalesce(jsonb_agg(to_jsonb(c) order by c.name),'[]') into categories_out from office_task_categories c;
  select coalesce(jsonb_agg(to_jsonb(g) order by g.name),'[]') into groups_out from (
   select c.id,c.name,count(x.id) count from office_task_categories c left join office_tasks x on x.category_id=c.id and x.completed_at >= (p->>'from')::timestamptz and x.completed_at < (p->>'until')::timestamptz
   where p->>'tab'='summary' group by c.id,c.name
  ) g;
  return jsonb_build_object('rows',rows_out,'total',total_count,'counts',counts_out,'people',people_out,'categories',categories_out,'groups',groups_out,'serverTime',now());
 end if;
 if op='create' or op='edit' then
  if me.role<>'admin' then raise exception 'FORBIDDEN'; end if;
  if not exists(select 1 from office_task_categories where id=(p->>'category_id')::uuid) then raise exception 'INVALID'; end if;
  if length(btrim(coalesce(p->>'content',''))) not between 1 and 4000 or
    (p->>'due_at')::timestamptz < (p->>'received_at')::timestamptz then raise exception 'INVALID'; end if;
  hs:=array(select jsonb_array_elements_text(coalesce(p->'helpers','[]'))::uuid);
  if cardinality(hs)>100 or cardinality(hs)<>(select count(distinct a) from unnest(hs) a) or (p->>'lead_id')::uuid=any(hs) then raise exception 'INVALID'; end if;
  if not exists(select 1 from learning_people where id=(p->>'lead_id')::uuid and active and deleted_at is null) or
   exists(select 1 from unnest(hs) a where not exists(select 1 from learning_people where id=a and active and deleted_at is null)) then raise exception 'MEMBER'; end if;
  if op='create' then
   insert into office_tasks(received_at,content,category_id,lead_id,due_at,created_by) values((p->>'received_at')::timestamptz,btrim(p->>'content'),(p->>'category_id')::uuid,(p->>'lead_id')::uuid,(p->>'due_at')::timestamptz,me.id) returning id into tid;
  else
   select * into t from office_tasks where id=(p->>'id')::uuid for update;
   if t.id is null then raise exception 'NOT_FOUND'; end if;
   if t.version is distinct from (p->>'version')::integer then raise exception 'CONFLICT'; end if;
   if t.completed_at is not null then raise exception 'CLOSED'; end if;
   tid:=t.id;
   update office_tasks set received_at=(p->>'received_at')::timestamptz,content=btrim(p->>'content'),category_id=(p->>'category_id')::uuid,lead_id=(p->>'lead_id')::uuid,due_at=(p->>'due_at')::timestamptz,version=version+1,updated_at=now() where id=tid;
   delete from office_task_helpers where task_id=tid;
  end if;
  insert into office_task_helpers select tid,a from unnest(hs) a;
  insert into office_task_updates(task_id,actor,actor_name,kind,body) values(tid,me.id,me.name,case when op='create' then 'created' else 'assigned' end,
   left('Phân công: '||(select name from learning_people where id=(p->>'lead_id')::uuid)||'; hỗ trợ: '||coalesce((select string_agg(name,', ' order by name) from learning_people where id=any(hs)),'Không')||'; hạn: '||to_char((p->>'due_at')::timestamptz at time zone 'Asia/Ho_Chi_Minh','DD/MM/YYYY HH24:MI')||E'\n'||btrim(p->>'content'),4000));
  return jsonb_build_object('ok',true,'id',tid);
 end if;
 select * into t from office_tasks where id=(p->>'id')::uuid for update;
 if t.id is null then raise exception 'NOT_FOUND'; end if;
 selected:=t.lead_id=me.id or exists(select 1 from office_task_helpers where task_id=t.id and person_id=me.id);
 if op='detail' then
  page_no:=greatest(1,least(100000,coalesce((p->>'page')::integer,1)));
  select coalesce(jsonb_agg(to_jsonb(z)),'[]') into rows_out from (select id,actor_name,kind,body,created_at,file_name,file_bytes from office_task_updates where task_id=t.id order by created_at desc,id limit 20 offset (page_no-1)*20) z;
  return jsonb_build_object('task',to_jsonb(t),'updates',rows_out,'total',(select count(*) from office_task_updates where task_id=t.id));
 elsif op='file' then
  select jsonb_build_object('key',file_key,'name',file_name) into rows_out from office_task_updates where task_id=t.id and id=(p->>'update_id')::uuid and file_key is not null;
  if rows_out is null then raise exception 'NOT_FOUND'; end if;
  return rows_out;
 end if;
 if t.version is distinct from (p->>'version')::integer then raise exception 'CONFLICT'; end if;
 if op='report' then
  if not selected and me.role<>'admin' then raise exception 'FORBIDDEN'; end if;
  if t.completed_at is not null then raise exception 'CLOSED'; end if;
  if length(btrim(coalesce(p->>'body',''))) not between 1 and 4000 then raise exception 'RESULT_REQUIRED'; end if;
  if coalesce((p->>'complete')::boolean,false) and t.lead_id<>me.id and me.role<>'admin' then raise exception 'FORBIDDEN'; end if;
  if p->>'file_key' is not null and (p->>'file_key') not like 'office-tasks/'||t.id||'/%' then raise exception 'INVALID'; end if;
  insert into office_task_updates(task_id,actor,actor_name,kind,body,file_key,file_name,file_bytes)
   values(t.id,me.id,me.name,case when coalesce((p->>'complete')::boolean,false) then 'completed' else 'progress' end,btrim(p->>'body'),p->>'file_key',p->>'file_name',(p->>'file_bytes')::integer);
  update office_tasks set result_text=btrim(p->>'body'),version=version+1,updated_at=now(),
   completed_at=case when coalesce((p->>'complete')::boolean,false) then now() else null end,
   completed_by=case when coalesce((p->>'complete')::boolean,false) then me.id else null end where id=t.id;
 elsif op='reopen' then
  if me.role<>'admin' then raise exception 'FORBIDDEN'; end if;
  if t.completed_at is null then raise exception 'INVALID'; end if;
  if length(btrim(coalesce(p->>'body',''))) not between 1 and 4000 then raise exception 'RESULT_REQUIRED'; end if;
  update office_tasks set completed_at=null,completed_by=null,version=version+1,updated_at=now() where id=t.id;
  insert into office_task_updates(task_id,actor,actor_name,kind,body) values(t.id,me.id,me.name,'reopened',btrim(p->>'body'));
 else raise exception 'INVALID';
 end if;
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.office_task_action(jsonb) from public,anon,authenticated;
grant execute on function public.office_task_action(jsonb) to service_role;
commit;
