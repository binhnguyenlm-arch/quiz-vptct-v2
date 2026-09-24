begin;
create or replace function public.web_overall_ranking(p jsonb) returns jsonb
language sql security invoker set search_path=public,pg_temp as $$
with accounts as (
 select id,name,photo,audience from learning_people where active and deleted_at is null and role='member'
), attempts as (
 select a.*,coalesce(question_total,jsonb_array_length(questions)) n,
 split_part(board,':',1) bank from vptct_mock_attempts a
 where eligible and finished_at is not null and person_id in (select id from accounts)
), best as (
 select distinct on(person_id,bank) person_id,bank,correct,n from attempts where n>0
 order by person_id,bank,correct::numeric/n desc,elapsed,finished_at,id
), catalog as (
 select bank,max(n) n from (
 select bank,n from attempts where n>0 union all
 select x->>'bank',(x->>'total')::integer from jsonb_array_elements(coalesce(p->'banks','[]')) x
 ) s group by bank
), exams as (
 select person_id,sum(correct) correct,sum(n) total,count(*) banks from best group by person_id
), cohort as (
 select a.person_id,a.round_id,u.audience,c.completed_at,
 count(*) over(partition by a.round_id,u.audience) members,
 rank() over(partition by a.round_id,u.audience order by c.completed_at nulls last) place
 from learning_assigned a join accounts u on u.id=a.person_id
 join learning_rounds r on r.id=a.round_id and r.deleted_at is null and r.state in ('open','closed')
 left join learning_completed c on c.person_id=a.person_id and c.round_id=a.round_id
), study as (
 select person_id,count(*) assigned,count(completed_at) completed,
 avg(case when completed_at is null then 0 when members=1 then 1
 else (members-place)::numeric/(members-1) end) early
 from cohort group by person_id
), scores as (
 select u.id,u.name,u.photo,coalesce(e.correct,0) correct,coalesce(e.total,0) total,
 coalesce(e.banks,0) banks,coalesce(s.assigned,0) assigned,coalesce(s.completed,0) completed,
 round(coalesce(50.0*e.correct/nullif((select sum(n) from catalog),0),0),2) exam_points,
 round(coalesce(30.0*s.completed/nullif(s.assigned,0),0),2) study_points,
 round(coalesce(20.0*s.early,0),2) early_points
 from accounts u left join exams e on e.person_id=u.id left join study s on s.person_id=u.id
), totals as (
 select *,exam_points+study_points+early_points score from scores
), ranked as (
 select *,rank() over(order by score desc) rank from totals
)
select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(r) order by score desc,name,id) from ranked r),'[]'::jsonb),
 'questionTotal',coalesce((select sum(n) from catalog),0),'asOf',now());
$$;
revoke all on function public.web_overall_ranking(jsonb) from public,anon,authenticated;
grant execute on function public.web_overall_ranking(jsonb) to service_role;
commit;
