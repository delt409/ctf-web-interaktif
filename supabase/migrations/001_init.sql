-- Run in Supabase SQL Editor. Core MVP schema and security.
create extension if not exists pgcrypto;
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null default '',created_at timestamptz not null default now());
create table public.user_roles(user_id uuid not null references auth.users(id) on delete cascade,role text not null check(role in ('student','admin')),primary key(user_id,role));
create table public.learning_modules(id uuid primary key default gen_random_uuid(),slug text unique not null,title text not null,description text not null default '',display_order integer not null default 0,is_published boolean not null default true);
create table public.lessons(id uuid primary key default gen_random_uuid(),module_id uuid not null references public.learning_modules(id),title text not null,content text not null default '',is_published boolean not null default false,created_at timestamptz not null default now());
create table public.lesson_progress(student_id uuid not null references auth.users(id) on delete cascade,lesson_id uuid not null references public.lessons(id),status text not null check(status in ('completed')),completed_at timestamptz not null default now(),primary key(student_id,lesson_id));
create table public.challenges(id uuid primary key default gen_random_uuid(),module_id uuid not null references public.learning_modules(id),title text not null,description text not null default '',difficulty text not null check(difficulty in ('easy','medium','hard')),points integer not null default 100 check(points between 0 and 10000),is_published boolean not null default false,created_at timestamptz not null default now());
create table public.challenge_secrets(challenge_id uuid primary key references public.challenges(id) on delete cascade,flag_hash text not null);
create table public.challenge_submissions(id uuid primary key default gen_random_uuid(),student_id uuid not null references auth.users(id) on delete cascade,challenge_id uuid not null references public.challenges(id),is_correct boolean not null,submitted_at timestamptz not null default now());
create index on public.challenge_submissions(student_id,challenge_id,submitted_at desc);
create table public.challenge_completions(student_id uuid not null references auth.users(id) on delete cascade,challenge_id uuid not null references public.challenges(id),awarded_points integer not null check(awarded_points>=0),completed_at timestamptz not null default now(),primary key(student_id,challenge_id));
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''));insert into public.user_roles(user_id,role) values(new.id,'student');return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin')$$;
revoke all on function public.is_admin() from public;grant execute on function public.is_admin() to authenticated;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.learning_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_secrets enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.challenge_completions enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()) or public.is_admin());
create policy profiles_admin_read on public.profiles for select to authenticated using(public.is_admin());
create policy roles_read on public.user_roles for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy modules_read on public.learning_modules for select to anon,authenticated using(is_published or public.is_admin());
create policy modules_admin_write on public.learning_modules for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy lessons_read on public.lessons for select to anon,authenticated using(is_published or public.is_admin());
create policy lessons_admin_write on public.lessons for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy progress_read on public.lesson_progress for select to authenticated using(student_id=(select auth.uid()) or public.is_admin());
create policy progress_insert on public.lesson_progress for insert to authenticated with check(student_id=(select auth.uid()) and exists(select 1 from public.lessons where id=lesson_id and is_published));
create policy progress_update on public.lesson_progress for update to authenticated using(student_id=(select auth.uid())) with check(student_id=(select auth.uid()) and status='completed');
create policy challenges_read on public.challenges for select to anon,authenticated using(is_published or public.is_admin());
create policy challenges_admin_write on public.challenges for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy secrets_admin_read on public.challenge_secrets for select to authenticated using(public.is_admin());
create policy submissions_read on public.challenge_submissions for select to authenticated using(student_id=(select auth.uid()) or public.is_admin());
create policy completions_read on public.challenge_completions for select to authenticated using(student_id=(select auth.uid()) or public.is_admin());
-- Submission uses a security definer function. Never expose secrets via SELECT to students.
create function public.submit_ctf_flag(p_challenge_id uuid,p_flag text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid := auth.uid();v_hash text;v_points integer;v_correct boolean;v_awarded integer:=0;v_last timestamptz;
begin
if v_user is null then raise exception 'Unauthorized';end if;
if length(p_flag)<1 or length(p_flag)>256 then raise exception 'Invalid flag';end if;
-- Serialize submissions per user/challenge to avoid concurrent rate-limit bypass.
perform pg_advisory_xact_lock(hashtextextended(v_user::text||p_challenge_id::text,0));
select max(submitted_at) into v_last from public.challenge_submissions where student_id=v_user and challenge_id=p_challenge_id;
if v_last is not null and v_last>now()-interval '3 seconds' then raise exception 'Wait before retry';end if;
select s.flag_hash,c.points into v_hash,v_points from public.challenges c join public.challenge_secrets s on s.challenge_id=c.id where c.id=p_challenge_id and c.is_published=true;
if not found then raise exception 'Challenge unavailable';end if;
v_correct := crypt(p_flag,v_hash)=v_hash;
insert into public.challenge_submissions(student_id,challenge_id,is_correct) values(v_user,p_challenge_id,v_correct);
if v_correct then
insert into public.challenge_completions(student_id,challenge_id,awarded_points) values(v_user,p_challenge_id,v_points) on conflict do nothing returning awarded_points into v_awarded;
end if;
return jsonb_build_object('correct',v_correct,'pointsAwarded',coalesce(v_awarded,0),'message',case when v_correct then 'Flag benar!' else 'Flag belum tepat' end);
end$$;
revoke all on function public.submit_ctf_flag(uuid,text) from public,anon;
grant execute on function public.submit_ctf_flag(uuid,text) to authenticated;
-- Public leaderboard only exposes pseudonyms and aggregate scores.
create view public.public_leaderboard with (security_invoker=true) as
select 'Siswa-'||left(c.student_id::text,8) as display_name,coalesce(sum(c.awarded_points),0)::bigint as total_xp,count(*)::bigint as solved_count from public.challenge_completions c group by c.student_id;
grant select on public.public_leaderboard to authenticated;
-- Leaderboard is opt-in for cross-student aggregate visibility; MVP uses a definer RPC.
create function public.get_leaderboard() returns table(display_name text,total_xp bigint,solved_count bigint) language sql stable security definer set search_path='' as $$select 'Siswa-'||left(c.student_id::text,8),sum(c.awarded_points)::bigint,count(*)::bigint from public.challenge_completions c group by c.student_id order by 2 desc limit 50$$;
revoke all on function public.get_leaderboard() from public,anon;grant execute on function public.get_leaderboard() to authenticated;
insert into public.learning_modules(slug,title,description,display_order) values('linux','Linux Fundamentals','Terminal, filesystem, permission',1),('network','Computer Networking','TCP/IP, DNS, subnetting',2),('server','Server Administration','SSH, Nginx, systemd',3),('cyber','Cybersecurity','Analisis log dan keamanan defensif',4);
insert into public.lessons(module_id,title,content,is_published) select id,'Perintah Linux Dasar',E'Gunakan pwd untuk melihat direktori aktif.\nGunakan ls untuk melihat isi folder.\nGunakan cat untuk membaca file.\nLatihan: jelaskan perbedaan pwd dan ls.',true from public.learning_modules where slug='linux';
insert into public.challenges(module_id,title,description,difficulty,points,is_published) select id,'Linux: Direktori Aktif','Perintah Linux apa yang digunakan untuk menampilkan direktori kerja saat ini? Submit dalam format CTF{perintah}.','easy',100,true from public.learning_modules where slug='linux';
insert into public.challenge_secrets(challenge_id,flag_hash) select id,crypt('CTF{pwd}',gen_salt('bf')) from public.challenges where title='Linux: Direktori Aktif';
