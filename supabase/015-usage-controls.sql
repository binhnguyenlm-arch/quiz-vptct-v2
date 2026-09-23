begin;
create table if not exists public.web_usage_settings(
 id boolean primary key default true check(id),uploads_paused boolean not null default false,exams_paused boolean not null default false,
 exam_month_limit integer check(exam_month_limit>=1),pdf_file_mb integer check(pdf_file_mb between 1 and 20),pdf_storage_mb integer check(pdf_storage_mb>=1),updated_at timestamptz not null default now()
);
insert into public.web_usage_settings(id) values(true) on conflict do nothing;
create table if not exists public.web_exam_months(month date primary key,starts bigint not null default 0);
insert into public.web_exam_months(month,starts)
 select date_trunc('month',started_at at time zone 'Asia/Ho_Chi_Minh')::date,count(*) from public.vptct_mock_attempts group by 1
 on conflict do nothing;
create table if not exists public.web_pdf_allocations(path text primary key,bytes bigint not null check(bytes between 1 and 20971520),created_at timestamptz not null default now());
alter table public.web_usage_settings enable row level security;
alter table public.web_exam_months enable row level security;
alter table public.web_pdf_allocations enable row level security;
revoke all on public.web_usage_settings,public.web_exam_months,public.web_pdf_allocations from public,anon,authenticated;
grant all on public.web_usage_settings,public.web_exam_months,public.web_pdf_allocations to service_role;

create or replace function public.web_usage(p jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare s web_usage_settings; month_start date:=date_trunc('month',now() at time zone 'Asia/Ho_Chi_Minh')::date; used bigint; n bigint;
begin
 select * into s from web_usage_settings where id for update;
 if p->>'op'='set' then
  if not exists(select 1 from learning_people where id=(p->>'actor')::uuid and active and role='admin' and deleted_at is null) then raise exception 'FORBIDDEN'; end if;
  update web_usage_settings set uploads_paused=(p->>'uploads_paused')::boolean,exams_paused=(p->>'exams_paused')::boolean,
   exam_month_limit=(p->>'exam_month_limit')::integer,pdf_file_mb=(p->>'pdf_file_mb')::integer,pdf_storage_mb=(p->>'pdf_storage_mb')::integer,updated_at=now() where id returning * into s;
 elsif p->>'op'='reserve' then
  if s.uploads_paused then raise exception 'UPLOADS_PAUSED'; end if;
  n:=(p->>'bytes')::bigint;
  if n<1 or n>20971520 or (s.pdf_file_mb is not null and n>s.pdf_file_mb::bigint*1048576) then raise exception 'PDF_FILE_LIMIT'; end if;
  if coalesce(p->>'path','')!~'^r2/[a-f0-9-]{36}/[a-f0-9-]{36}\.pdf$' then raise exception 'INVALID'; end if;
  if exists(select 1 from web_pdf_allocations where path=p->>'path') then raise exception 'INVALID'; end if;
  select coalesce(sum(bytes),0) into used from web_pdf_allocations;
  if s.pdf_storage_mb is not null and used+n>s.pdf_storage_mb::bigint*1048576 then raise exception 'PDF_STORAGE_LIMIT'; end if;
  insert into web_pdf_allocations(path,bytes) values(p->>'path',n);
 elsif p->>'op'='release' then
  delete from web_pdf_allocations where path=p->>'path';
 elsif p->>'op' is distinct from 'get' then raise exception 'INVALID';
 end if;
 select coalesce(sum(bytes),0) into used from web_pdf_allocations;
 return jsonb_build_object('settings',to_jsonb(s),'pdfBytes',used,'examStarts',coalesce((select starts from web_exam_months where month=month_start),0),'month',month_start);
end;$$;
revoke all on function public.web_usage(jsonb) from public,anon,authenticated;
grant execute on function public.web_usage(jsonb) to service_role;

create or replace function public.web_exam_start_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare s web_usage_settings; m date:=date_trunc('month',now() at time zone 'Asia/Ho_Chi_Minh')::date; n bigint;
begin
 select * into s from web_usage_settings where id for update;
 if s.exams_paused then raise exception 'EXAMS_PAUSED'; end if;
 insert into web_exam_months(month) values(m) on conflict do nothing;
 select starts into n from web_exam_months where month=m;
 if s.exam_month_limit is not null and n>=s.exam_month_limit then raise exception 'EXAM_MONTH_LIMIT'; end if;
 update web_exam_months set starts=starts+1 where month=m;
 return new;
end;$$;
revoke all on function public.web_exam_start_guard() from public,anon,authenticated;
drop trigger if exists web_exam_start_guard on public.vptct_mock_attempts;
create trigger web_exam_start_guard before insert on public.vptct_mock_attempts for each row execute function public.web_exam_start_guard();
commit;
