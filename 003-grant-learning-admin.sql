-- First create admin@vptct.internal in Supabase Authentication > Users.
-- Choose your own password there and enable Auto Confirm User.
-- This is an internal login identifier, not a mailbox.
do $$
declare uid uuid;
begin
 select id into uid from auth.users where email='admin@vptct.internal' and email_confirmed_at is not null;
 if uid is null then raise exception 'Create and confirm admin@vptct.internal in Authentication > Users first.'; end if;
 insert into public.learning_people(id,username,name,role,active)
 values(uid,'admin','Nguyễn Thanh Bình','admin',true)
 on conflict(id) do update set username=excluded.username,name=excluded.name,role='admin',active=true;
end $$;
