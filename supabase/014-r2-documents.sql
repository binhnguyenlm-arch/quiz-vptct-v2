-- Preserve a link to the original Supabase file until the administrator cleans it up.
begin;
alter table public.learning_docs add column if not exists legacy_path text;
comment on column public.learning_docs.legacy_path is 'Original Supabase PDF retained after a verified R2 migration.';
commit;
