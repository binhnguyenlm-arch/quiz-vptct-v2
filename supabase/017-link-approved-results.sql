-- Only the five explicitly approved identities. Never creates quiz results.
begin;
create table if not exists public.ranking_legacy_links(attempt_id uuid primary key,person_id uuid not null,original_name text,linked_at timestamptz not null default now());
alter table public.ranking_legacy_links enable row level security;
revoke all on public.ranking_legacy_links from public,anon,authenticated;
grant all on public.ranking_legacy_links to service_role;
do $$
declare m record; target uuid; matches integer;
begin
 for m in select * from (values
 ('Vũ Việt Hải',array['Vũ Việt Hải']),
 ('Vũ Thúy Hà',array['Vũ Thúy Hà','Vũ Thuý Hà','Thuyha Vu']),
 ('Vũ Phương Thanh Thảo',array['Vũ Phương Thanh Thảo']),
 ('Đoàn Thị Nga',array['Đoàn Thị Nga']),
 ('Nguyễn Thanh Bình',array['Nguyễn Thanh Bình'])
 ) v(account_name,aliases) loop
 select count(*),(array_agg(id))[1] into matches,target from learning_people
 where active and deleted_at is null and lower(regexp_replace(trim(name),'\s+',' ','g'))=any(
 case when m.account_name='Vũ Thúy Hà' then array[lower('Vũ Thúy Hà'),lower('Vũ Thuý Hà')] else array[lower(m.account_name)] end);
 if matches>1 then raise exception 'Trùng tên tài khoản %, cần đối chiếu ID trước khi gắn kết quả.',m.account_name; end if;
 if matches=0 then raise exception 'Không tìm thấy tài khoản đang hoạt động: %. Kiểm tra tên trước khi chạy lại.',m.account_name; end if;
 insert into ranking_legacy_links(attempt_id,person_id,original_name)
 select id,target,name from vptct_mock_attempts a where a.person_id is null and eligible and finished_at is not null
 and coalesce(question_total,jsonb_array_length(questions))=100
 and lower(regexp_replace(trim(name),'\s+',' ','g')) in (select lower(x) from unnest(m.aliases) x)
 on conflict(attempt_id) do nothing;
 update vptct_mock_attempts a set person_id=target from ranking_legacy_links b
 where a.id=b.attempt_id and b.person_id=target and a.person_id is null;
 end loop;
end $$;
select p.name,count(*) as so_bai_da_gan from ranking_legacy_links l join learning_people p on p.id=l.person_id group by p.id,p.name order by p.name;
commit;
