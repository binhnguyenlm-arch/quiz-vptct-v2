-- Chạy sau SQL 021. Chỉ công khai 5 nội dung, hạn và trạng thái.
begin;
create or replace function public.office_home_preview() returns jsonb
language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
 select x.id,x.content,x.due_at,
 case when x.completed_at is not null then 'done' when x.due_at<now() then 'overdue' when x.due_at<=now()+interval '2 days' then 'soon' else 'active' end status
 from office_tasks x
 order by (x.completed_at is null and x.due_at<=now()+interval '2 days') desc,
 case when x.completed_at is null and x.due_at<=now()+interval '2 days' then x.due_at end asc,
 x.received_at desc,x.id limit 5
 ) t;
$$;
revoke all on function public.office_home_preview() from public,anon,authenticated;
grant execute on function public.office_home_preview() to service_role;
commit;
