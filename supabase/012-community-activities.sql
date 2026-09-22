begin;
create table if not exists public.community_activities(
 id uuid primary key default gen_random_uuid(), org text not null check(org in ('union','women','youth')),
 title text not null check(length(trim(title)) between 1 and 200), occurred_on date not null,
 content text not null default '' check(length(content)<=10000), image text not null default '',
 created_by uuid not null, updated_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default clock_timestamp()
);
alter table public.community_activities add column if not exists author_name text not null default '';
update public.community_activities a set author_name=p.name from public.learning_people p where p.id=a.created_by and a.author_name='';
create table if not exists public.community_participants(
 activity_id uuid not null references public.community_activities(id) on delete cascade,
 person_id uuid not null, name_snapshot text not null, primary key(activity_id,person_id)
);
create index if not exists community_feed_idx on public.community_activities(org,occurred_on desc,created_at desc,id);
create index if not exists community_year_idx on public.community_activities(occurred_on);
create index if not exists community_person_idx on public.community_participants(person_id,activity_id);
alter table public.community_activities enable row level security;
alter table public.community_participants enable row level security;
revoke all on public.community_activities,public.community_participants from public,anon,authenticated;
grant select,insert,update,delete on public.community_activities,public.community_participants to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('community-activities','community-activities',true,1048576,array['image/webp']) on conflict(id) do update set public=true,file_size_limit=1048576,allowed_mime_types=array['image/webp'];

create or replace function public.community_read(p jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare org_name text; pg integer:=greatest(1,coalesce((p->>'page')::integer,1)); rp integer:=greatest(1,coalesce((p->>'rankPage')::integer,1)); yr integer:=coalesce((p->>'year')::integer,extract(year from now())::integer); total integer; rank_total integer; events jsonb; ranking jsonb; tabs jsonb; years jsonb;
begin
 select coalesce(jsonb_agg(to_jsonb(t)),'[]') into tabs from (select org,count(*) as count,max(created_at) as latest from community_activities group by org order by max(created_at) desc,org) t;
 org_name:=coalesce(nullif(p->>'org',''),tabs->0->>'org','union');
 if org_name not in ('union','women','youth') or yr<1900 or yr>2200 then raise exception 'INVALID'; end if;
 select count(*) into total from community_activities where org=org_name;
 pg:=least(pg,greatest(1,ceil(total/6.0)::integer));
 select coalesce(jsonb_agg(to_jsonb(t) order by t.occurred_on desc,t.created_at desc,t.id),'[]') into events from (
  select a.*,coalesce((select jsonb_agg(jsonb_build_object('id',m.person_id,'name',coalesce(lp.name,m.name_snapshot),'active',coalesce(lp.active and lp.deleted_at is null,false)) order by m.name_snapshot,m.person_id) from community_participants m left join learning_people lp on lp.id=m.person_id where m.activity_id=a.id),'[]') as members
  from community_activities a where org=org_name order by occurred_on desc,created_at desc,id limit 6 offset (pg-1)*6
 ) t;
 select coalesce(jsonb_agg(y order by y desc),'[]') into years from (select distinct extract(year from occurred_on)::integer as y from community_activities union select yr) t;
 select count(distinct m.person_id) into rank_total from community_participants m join community_activities a on a.id=m.activity_id where a.occurred_on>=make_date(yr,1,1) and a.occurred_on<make_date(yr+1,1,1);
 rp:=least(rp,greatest(1,ceil(rank_total/20.0)::integer));
 with counts as (
 select m.person_id,max(m.name_snapshot) as old_name,count(*) as total,count(*) filter(where a.org='union') as union_count,count(*) filter(where a.org='women') as women_count,count(*) filter(where a.org='youth') as youth_count
 from community_participants m join community_activities a on a.id=m.activity_id where a.occurred_on>=make_date(yr,1,1) and a.occurred_on<make_date(yr+1,1,1) group by m.person_id
 ), ranked as (select c.*,coalesce(lp.name,c.old_name) as name,coalesce(lp.position,'') as position,case when lp.deleted_at is null then coalesce(lp.photo,'') else '' end as photo,rank() over(order by c.total desc) as rank from counts c left join learning_people lp on lp.id=c.person_id)
 select coalesce(jsonb_agg(to_jsonb(t) order by t.rank,t.name,t.person_id),'[]') into ranking from (select * from ranked order by rank,name,person_id limit 20 offset (rp-1)*20) t;
 return jsonb_build_object('org',org_name,'tabs',tabs,'events',events,'page',pg,'pages',greatest(1,ceil(total/6.0)::integer),'total',total,'year',yr,'years',years,'ranking',ranking,'rankPage',rp,'rankPages',greatest(1,ceil(rank_total/20.0)::integer),'rankTotal',rank_total);
end $$;

create or replace function public.community_write(p jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare actor uuid:=(p->>'actor')::uuid; who learning_people; event_id uuid; previous community_activities; members jsonb:=coalesce(p->'members','[]'); wanted integer; allowed integer;
begin
 select * into who from learning_people where id=actor and active and deleted_at is null;
 if not found then raise exception 'FORBIDDEN'; end if;
 if p->>'id' is not null then
  event_id:=(p->>'id')::uuid;
  select * into previous from community_activities where id=event_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p->>'version' is null or previous.updated_at<>(p->>'version')::timestamptz then raise exception 'CONFLICT'; end if;
 end if;
 if p->>'op'='delete' then
  if who.role<>'admin' then raise exception 'FORBIDDEN'; end if;
  if event_id is null then raise exception 'INVALID'; end if;
  delete from community_activities where id=event_id;return jsonb_build_object('ok',true);
 end if;
 if p->>'op'<>'save' or jsonb_typeof(members)<>'array' or p->>'org' not in ('union','women','youth') or length(trim(coalesce(p->>'title',''))) not between 1 and 200 or length(coalesce(p->>'content',''))>10000 or coalesce(p->>'date','')!~'^\d{4}-\d{2}-\d{2}$' or extract(year from (p->>'date')::date) not between 1900 and 2200 then raise exception 'INVALID'; end if;
 if coalesce(p->>'image','')<>'' and p->>'image'!~'^images/[0-9a-f-]{36}\.webp$' then raise exception 'INVALID'; end if;
 select count(*) into wanted from jsonb_array_elements_text(members);
 if wanted<>(select count(distinct x) from jsonb_array_elements_text(members) x) then raise exception 'DUPLICATE'; end if;
 select count(*) into allowed from jsonb_array_elements_text(members) x where exists(select 1 from learning_people lp where lp.id=x::uuid and active and deleted_at is null) or (event_id is not null and exists(select 1 from community_participants m where m.activity_id=event_id and m.person_id=x::uuid));
 if wanted<>allowed then raise exception 'MEMBER'; end if;
 if event_id is null then
  insert into community_activities(org,title,occurred_on,content,image,created_by,updated_by,author_name) values(p->>'org',trim(p->>'title'),(p->>'date')::date,coalesce(p->>'content',''),coalesce(p->>'image',''),actor,actor,who.name) returning id into event_id;
 else
  update community_activities set org=p->>'org',title=trim(p->>'title'),occurred_on=(p->>'date')::date,content=coalesce(p->>'content',''),image=coalesce(p->>'image',''),updated_by=actor,updated_at=clock_timestamp() where id=event_id;
 end if;
 -- Preserve historical members while accepting only directory IDs for additions.
 insert into community_participants(activity_id,person_id,name_snapshot) select event_id,lp.id,lp.name from learning_people lp where lp.id in(select x::uuid from jsonb_array_elements_text(members) x) on conflict(activity_id,person_id) do update set name_snapshot=excluded.name_snapshot;
 delete from community_participants m where m.activity_id=event_id and not exists(select 1 from jsonb_array_elements_text(members) x where x::uuid=m.person_id);
 return jsonb_build_object('ok',true,'id',event_id);
end $$;
revoke all on function public.community_read(jsonb),public.community_write(jsonb) from public,anon,authenticated;
grant execute on function public.community_read(jsonb),public.community_write(jsonb) to service_role;
commit;

