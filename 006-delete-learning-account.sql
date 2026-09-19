-- Giữ hồ sơ học tập khi xóa thông tin đăng nhập.
begin;
alter table public.learning_people drop constraint if exists learning_people_id_fkey;
alter table public.learning_people add column if not exists deleted_at timestamptz;
alter table public.learning_people add column if not exists auth_deleted boolean not null default false;
create or replace function public.learning_delete_account(actor uuid,target uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from learning_people where id=actor and active and role='admin') or actor=target then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from learning_people where id=target and role='member') then raise exception 'FORBIDDEN'; end if;
 update learning_people set active=false,username='deleted.'||target::text,deleted_at=coalesce(deleted_at,now()) where id=target;
 return '{"ok":true}'::jsonb;
end $$;
revoke all on function public.learning_delete_account(uuid,uuid) from public,anon,authenticated;
grant execute on function public.learning_delete_account(uuid,uuid) to service_role;
commit;
