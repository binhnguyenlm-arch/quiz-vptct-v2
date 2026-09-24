begin;
create table if not exists public.question_books(
 id uuid primary key default gen_random_uuid(),
 topic text not null check(topic in ('law','military','planning','relations','archives')),
 title text not null check(length(title) between 1 and 180),
 status text not null default 'draft' check(status in ('draft','published')),
 questions jsonb not null check(jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 1 and 500),
 question_count integer generated always as (jsonb_array_length(questions)) stored,
 content_hash text not null,created_by uuid references public.learning_people(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),published_at timestamptz,
 unique(topic,content_hash)
);
alter table public.question_books enable row level security;
revoke all on public.question_books from public,anon,authenticated;
grant all on public.question_books to service_role;
create index if not exists question_books_catalog_idx on public.question_books(status,topic,published_at desc);
create table if not exists public.question_book_practice(id uuid primary key,book_id uuid not null references public.question_books(id),participant text not null,completed_at timestamptz not null default now());
alter table public.question_book_practice enable row level security;
revoke all on public.question_book_practice from public,anon,authenticated;
grant all on public.question_book_practice to service_role;
create table if not exists public.question_book_exams(id uuid primary key,book_id uuid not null references public.question_books(id),completed_at timestamptz not null);
alter table public.question_book_exams enable row level security;
revoke all on public.question_book_exams from public,anon,authenticated;
grant all on public.question_book_exams to service_role;
create or replace function public.record_question_book_exam() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.finished_at is not null and old.finished_at is null then
 insert into question_book_exams(id,book_id,completed_at) select new.id,b.id,new.finished_at from question_books b where split_part(new.board,':',1)='book-'||b.id::text on conflict do nothing;
 end if;return new;
end $$;
revoke all on function public.record_question_book_exam() from public,anon,authenticated;
drop trigger if exists record_question_book_exam on public.vptct_mock_attempts;
create trigger record_question_book_exam after update of finished_at on public.vptct_mock_attempts for each row execute function public.record_question_book_exam();
create table if not exists public.builtin_book_metadata(id text primary key,title text not null,updated_on date);
alter table public.builtin_book_metadata enable row level security;
revoke all on public.builtin_book_metadata from public,anon,authenticated;
grant all on public.builtin_book_metadata to service_role;
insert into builtin_book_metadata(id,title) values('politics-current','100 câu hỏi ôn tập nhận thức chính trị · TEST') on conflict do nothing;
create or replace function public.question_book_counts() returns jsonb language sql security invoker set search_path=public,pg_temp as $$
select coalesce(jsonb_object_agg(topic,n),'{}'::jsonb)||jsonb_build_object('__mock',(select count(*) from question_book_exams)) from (
select topic,count(*) n from (
select b.topic from question_book_practice p join question_books b on b.id=p.book_id
union all select b.topic from question_book_exams a join question_books b on b.id=a.book_id
) t group by topic) s;
$$;
revoke all on function public.question_book_counts() from public,anon,authenticated;
grant execute on function public.question_book_counts() to service_role;
commit;
