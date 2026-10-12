-- Run with `supabase db push` or in the Supabase SQL editor. UTC is used throughout.
create extension if not exists pgcrypto;
revoke create on schema public from public,anon,authenticated;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 username text not null check (char_length(username) between 2 and 24),
 avatar_url text, role text not null default 'user' check(role in ('user','admin')),
 streak integer not null default 0, best_streak integer not null default 0, last_challenge_date date,
 created_at timestamptz not null default now()
);
create table public.games (
 slug text primary key, name text not null, category text not null,
 premium boolean not null default false, enabled boolean not null default true,
 featured boolean not null default true, plays bigint not null default 0
);
create table public.daily_challenges (
 date date primary key, game_slug text not null references public.games(slug),
 seed integer not null, solution text not null check(solution ~ '^[A-Z]{5}$')
);
create table public.game_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 game_slug text not null references public.games(slug), seed integer not null, challenge_date date,
 guesses jsonb not null default '[]', started_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '2 hours', finished_at timestamptz
);
create unique index daily_word_attempt on public.game_sessions(user_id,challenge_date) where game_slug='word-game';
create table public.scores (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 game_slug text not null references public.games(slug), score integer not null check(score >= 0),
 session_id uuid unique references public.game_sessions(id), room_id uuid,
 created_at timestamptz not null default now()
);
create index scores_leaderboard_idx on public.scores(game_slug,created_at desc,score desc);
create index scores_user_idx on public.scores(user_id,created_at desc);
create unique index scores_room_user_idx on public.scores(user_id,room_id) where room_id is not null;
create table public.achievements (id text primary key,name text not null,description text not null,icon text not null);
create table public.user_achievements (user_id uuid references public.profiles(id) on delete cascade,achievement_id text references public.achievements(id),unlocked_at timestamptz not null default now(),primary key(user_id,achievement_id));
create table public.subscriptions (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 stripe_customer_id text unique, stripe_subscription_id text unique,
 status text not null default 'inactive', current_period_end timestamptz,
 cancel_at_period_end boolean not null default false, event_created bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table public.match_rooms (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 host_id uuid not null references public.profiles(id), guest_id uuid references public.profiles(id),
 board jsonb not null default '[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]',
 turn uuid not null references public.profiles(id), status text not null default 'waiting' check(status in('waiting','playing','finished','abandoned')),
 winner_id uuid references public.profiles(id), host_seen_at timestamptz not null default now(),guest_seen_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.scores add constraint scores_room_fk foreign key(room_id) references public.match_rooms(id);
create table public.match_moves (id bigint generated always as identity primary key,room_id uuid not null references public.match_rooms(id) on delete cascade,user_id uuid not null references public.profiles(id),column_index integer not null check(column_index between 0 and 6),move_number integer not null,created_at timestamptz not null default now(),unique(room_id,move_number));
create table public.skins (id text primary key,name text not null,color text not null,premium boolean not null default true);
create table public.user_skins (user_id uuid references public.profiles(id) on delete cascade,skin_id text references public.skins(id),primary key(user_id,skin_id));
create table public.feature_flags (key text primary key,enabled boolean not null default true);
create table public.analytics_events (id bigint generated always as identity primary key,user_id uuid references public.profiles(id) on delete set null,event text not null check(event in('game_start','game_end','purchase')),game_slug text references public.games(slug),created_at timestamptz not null default now());
create table public.rate_limits (key text primary key,count integer not null default 0,reset_at timestamptz not null);
create table public.stripe_events (id text primary key,created_at timestamptz not null default now());

-- Enable RLS even on server-only tables. No client writes to authoritative data.
do $$ declare t text; begin
 foreach t in array array['profiles','games','daily_challenges','game_sessions','scores','achievements','user_achievements','subscriptions','match_rooms','match_moves','skins','user_skins','feature_flags','analytics_events','rate_limits','stripe_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
grant select on public.profiles,public.games,public.scores,public.achievements,public.skins,public.feature_flags to anon,authenticated;
grant select(date,game_slug,seed) on public.daily_challenges to anon,authenticated;
grant select on public.user_achievements,public.subscriptions,public.match_rooms,public.match_moves,public.user_skins to authenticated;
grant update(username,avatar_url) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select using(true);
create policy profiles_self_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy games_read on public.games for select using(true);
create policy challenges_read on public.daily_challenges for select using(true);
create policy scores_read on public.scores for select using(true);
create policy achievements_read on public.achievements for select using(true);
create policy skins_read on public.skins for select using(true);
create policy flags_read on public.feature_flags for select using(true);
create policy own_achievements on public.user_achievements for select using(user_id=auth.uid());
create policy own_skins on public.user_skins for select using(user_id=auth.uid());
create policy own_subscription on public.subscriptions for select using(user_id=auth.uid());
create policy room_members on public.match_rooms for select using(auth.uid() in(host_id,guest_id));
create policy move_members on public.match_moves for select using(exists(select 1 from public.match_rooms r where r.id=room_id and auth.uid() in(r.host_id,r.guest_id)));

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,username) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'username',''),split_part(new.email,'@',1),'Player'),20)||right(new.id::text,4));
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- Backfill accounts that predate this migration.
insert into public.profiles(id,username) select id,left(coalesce(split_part(email,'@',1),'Player'),20)||right(id::text,4) from auth.users on conflict do nothing;

create view public.leaderboard_all_time with(security_invoker=true) as
 select s.user_id,p.username,p.avatar_url,s.game_slug,max(s.score)::integer as score,
 dense_rank() over(partition by s.game_slug order by max(s.score) desc) as rank
 from public.scores s join public.profiles p on p.id=s.user_id group by s.user_id,p.username,p.avatar_url,s.game_slug;
create view public.leaderboard_daily with(security_invoker=true) as
 select s.user_id,p.username,p.avatar_url,s.game_slug,max(s.score)::integer as score,
 dense_rank() over(partition by s.game_slug order by max(s.score) desc) as rank
 from public.scores s join public.profiles p on p.id=s.user_id where s.created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'
 group by s.user_id,p.username,p.avatar_url,s.game_slug;
create view public.leaderboard_weekly with(security_invoker=true) as
 select s.user_id,p.username,p.avatar_url,s.game_slug,max(s.score)::integer as score,
 dense_rank() over(partition by s.game_slug order by max(s.score) desc) as rank
 from public.scores s join public.profiles p on p.id=s.user_id where s.created_at>=date_trunc('week',now() at time zone 'UTC') at time zone 'UTC'
 group by s.user_id,p.username,p.avatar_url,s.game_slug;
-- Global compares standings across games rather than adding incomparable raw scores.
create view public.leaderboard_global with(security_invoker=true) as
 select user_id,username,avatar_url,sum(greatest(0,101-rank))::integer as score,
 dense_rank() over(order by sum(greatest(0,101-rank)) desc) as rank from public.leaderboard_all_time group by user_id,username,avatar_url;
grant select on public.leaderboard_all_time,public.leaderboard_daily,public.leaderboard_weekly,public.leaderboard_global to anon,authenticated;

create function public.consume_rate_limit(p_key text,p_limit integer,p_window integer) returns boolean language plpgsql security definer set search_path=public as $$
declare c integer;
begin
 insert into rate_limits(key,count,reset_at) values(p_key,1,now()+make_interval(secs=>p_window))
 on conflict(key) do update set count=case when rate_limits.reset_at<=now() then 1 else rate_limits.count+1 end,
 reset_at=case when rate_limits.reset_at<=now() then now()+make_interval(secs=>p_window) else rate_limits.reset_at end returning count into c;
 return c<=p_limit;
end $$;

create function public.complete_run(p_session uuid,p_user uuid,p_score integer,p_won boolean) returns uuid language plpgsql security definer set search_path=public as $$
declare s game_sessions; sid uuid; prof profiles; new_streak integer;
begin
 select * into s from game_sessions where id=p_session and user_id=p_user for update;
 if not found or s.expires_at<now() then raise exception 'Session expired';end if;
 if s.finished_at is not null then select id into sid from scores where session_id=s.id;return sid;end if;
 if not exists(select 1 from games where slug=s.game_slug and enabled) then raise exception 'Game disabled';end if;
 if exists(select 1 from games where slug=s.game_slug and premium) and not exists(select 1 from subscriptions where user_id=p_user and status in('active','trialing') and current_period_end>now()) then raise exception 'Premium required';end if;
 insert into scores(user_id,game_slug,score,session_id) values(p_user,s.game_slug,p_score,s.id) returning id into sid;
 update game_sessions set finished_at=now() where id=s.id;
 update games set plays=plays+1 where slug=s.game_slug;
 insert into analytics_events(user_id,event,game_slug) values(p_user,'game_end',s.game_slug);
 insert into user_achievements(user_id,achievement_id) values(p_user,'first-game') on conflict do nothing;
 if s.game_slug='2048' and p_score>=10000 then insert into user_achievements(user_id,achievement_id) values(p_user,'number-cruncher') on conflict do nothing;end if;
 if s.game_slug='word-game' and p_won then
 select * into prof from profiles where id=p_user for update;
 if prof.last_challenge_date is null or prof.last_challenge_date<s.challenge_date then
 new_streak=case when prof.last_challenge_date=s.challenge_date-1 then prof.streak+1 else 1 end;
 update profiles set streak=new_streak,best_streak=greatest(best_streak,new_streak),last_challenge_date=s.challenge_date where id=p_user;
 if new_streak>=7 then insert into user_achievements(user_id,achievement_id) values(p_user,'week-streak') on conflict do nothing;end if;
 end if;end if;
 return sid;
end $$;

-- Word guesses are serialized so parallel requests cannot exceed six tries.
create function public.record_word_guess(p_session uuid,p_user uuid,p_guess text) returns jsonb language plpgsql security definer set search_path=public as $$
declare s game_sessions; answer text; v_guesses jsonb;
begin
 select * into s from game_sessions where id=p_session and user_id=p_user and game_slug='word-game' for update;
 if not found or s.expires_at<now() or s.finished_at is not null then raise exception 'Session expired or complete';end if;
 select solution into answer from daily_challenges where date=s.challenge_date;
 if jsonb_array_length(s.guesses)>=6 or s.guesses @> jsonb_build_array(answer) then raise exception 'No guesses remaining';end if;
 v_guesses=s.guesses||jsonb_build_array(p_guess);
 update game_sessions set guesses=v_guesses where id=s.id;
 return jsonb_build_object('guesses',v_guesses,'answer',answer);
end $$;

create function public.apply_subscription_event(p_event text,p_created bigint,p_user uuid,p_customer text,p_subscription text,p_status text,p_end timestamptz,p_cancel boolean) returns boolean language plpgsql security definer set search_path=public as $$
begin
 insert into stripe_events(id) values(p_event) on conflict do nothing;
 if not found then return false;end if;
 insert into subscriptions(user_id,stripe_customer_id,stripe_subscription_id,status,current_period_end,cancel_at_period_end,event_created)
 values(p_user,p_customer,p_subscription,p_status,p_end,p_cancel,p_created)
 on conflict(user_id) do update set stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,status=excluded.status,current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,event_created=excluded.event_created,updated_at=now()
 where subscriptions.event_created<=excluded.event_created;
 if p_status in('active','trialing') then
 insert into user_skins(user_id,skin_id) select p_user,id from skins on conflict do nothing;
 if not exists(select 1 from analytics_events where user_id=p_user and event='purchase') then insert into analytics_events(user_id,event) values(p_user,'purchase');end if;
 end if;return true;
end $$;

-- Realtime rooms: all state changes happen in locked, authenticated RPCs.
create function public.create_match_room() returns public.match_rooms language plpgsql security definer set search_path=public as $$
declare r match_rooms; active_count integer;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if not consume_rate_limit('room:'||auth.uid()::text,10,60) then raise exception 'Too many rooms';end if;
 select count(*) into active_count from match_rooms where host_id=auth.uid() and status in('waiting','playing') and updated_at>now()-interval '1 hour';
 if active_count>=3 then raise exception 'Finish your existing rooms first';end if;
 insert into match_rooms(code,host_id,turn) values(upper(encode(gen_random_bytes(4),'hex')),auth.uid(),auth.uid()) returning * into r;return r;
end $$;
create function public.join_match_room(p_code text) returns public.match_rooms language plpgsql security definer set search_path=public as $$
declare r match_rooms;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if not consume_rate_limit('join:'||auth.uid()::text,15,60) then raise exception 'Too many attempts';end if;
 select * into r from match_rooms where code=upper(p_code) for update;
 if not found then raise exception 'Room not found';end if;
 if auth.uid() in(r.host_id,r.guest_id) then return r;end if;
 if r.status<>'waiting' or r.guest_id is not null or r.host_seen_at<now()-interval '2 minutes' then raise exception 'Room is unavailable';end if;
 update match_rooms set guest_id=auth.uid(),guest_seen_at=now(),status='playing',updated_at=now() where id=r.id returning * into r;
 insert into analytics_events(user_id,event,game_slug) values(r.host_id,'game_start','connect-4'),(r.guest_id,'game_start','connect-4');return r;
end $$;
create function public.play_match_move(p_room uuid,p_column integer) returns public.match_rooms language plpgsql security definer set search_path=public as $$
declare r match_rooms; b jsonb; row_index integer; token integer; dr integer; dc integer; i integer; n integer; rr integer; cc integer; win boolean=false; total integer;
begin
 select * into r from match_rooms where id=p_room for update;
 if not found or auth.uid() is null or auth.uid() not in(r.host_id,r.guest_id) or r.guest_id is null then raise exception 'Not a room member';end if;
 if r.status<>'playing' or r.turn<>auth.uid() or p_column not between 0 and 6 then raise exception 'Invalid move or not your turn';end if;
 b=r.board;row_index=5;
 while row_index>=0 and (b->row_index->>p_column)::integer<>0 loop row_index=row_index-1;end loop;
 if row_index<0 then raise exception 'Column is full';end if;
 token=case when auth.uid()=r.host_id then 1 else 2 end;
 b=jsonb_set(b,array[row_index::text,p_column::text],to_jsonb(token));
 for dr in -1..1 loop for dc in -1..1 loop
 if dr<>0 or dc<>0 then n=1;
 for i in 1..3 loop rr=row_index+dr*i;cc=p_column+dc*i;exit when rr not between 0 and 5 or cc not between 0 and 6 or (b->rr->>cc)::integer<>token;n=n+1;end loop;
 for i in 1..3 loop rr=row_index-dr*i;cc=p_column-dc*i;exit when rr not between 0 and 5 or cc not between 0 and 6 or (b->rr->>cc)::integer<>token;n=n+1;end loop;
 if n>=4 then win=true;end if;end if;end loop;end loop;
 select count(*) into total from match_moves where room_id=r.id;
 insert into match_moves(room_id,user_id,column_index,move_number) values(r.id,auth.uid(),p_column,total+1);
 update match_rooms set board=b,turn=case when auth.uid()=r.host_id then r.guest_id else r.host_id end,status=case when win or total+1=42 then 'finished' else 'playing' end,winner_id=case when win then auth.uid() end,updated_at=now(),host_seen_at=case when auth.uid()=r.host_id then now() else host_seen_at end,guest_seen_at=case when auth.uid()=r.guest_id then now() else guest_seen_at end where id=r.id returning * into r;
 if r.status='finished' then
 insert into scores(user_id,game_slug,score,room_id) values(r.host_id,'connect-4',case when not win then 50 when r.winner_id=r.host_id then 100 else 0 end,r.id),(r.guest_id,'connect-4',case when not win then 50 when r.winner_id=r.guest_id then 100 else 0 end,r.id);
 insert into user_achievements(user_id,achievement_id) values(r.host_id,'first-game'),(r.guest_id,'first-game') on conflict do nothing;
 update games set plays=plays+1 where slug='connect-4';insert into analytics_events(user_id,event,game_slug) values(r.host_id,'game_end','connect-4'),(r.guest_id,'game_end','connect-4');end if;
 return r;
end $$;
create function public.heartbeat_match(p_room uuid,p_leave boolean default false) returns public.match_rooms language plpgsql security definer set search_path=public as $$
declare r match_rooms; other_seen timestamptz;
begin
 select * into r from match_rooms where id=p_room for update;
 if not found or auth.uid() is null or (auth.uid()<>r.host_id and (r.guest_id is null or auth.uid()<>r.guest_id)) then raise exception 'Not a room member';end if;
 other_seen=case when auth.uid()=r.host_id then r.guest_seen_at else r.host_seen_at end;
 update match_rooms set host_seen_at=case when auth.uid()=r.host_id then now() else host_seen_at end,guest_seen_at=case when auth.uid()=r.guest_id then now() else guest_seen_at end,status=case when status in('finished','abandoned') then status when p_leave or (other_seen is not null and other_seen<now()-interval '90 seconds') then 'abandoned' else status end,updated_at=now() where id=p_room returning * into r;return r;
end $$;

-- Restrict every function, including SECURITY DEFINER functions, explicitly.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer),public.complete_run(uuid,uuid,integer,boolean),public.record_word_guess(uuid,uuid,text),public.apply_subscription_event(text,bigint,uuid,text,text,text,timestamptz,boolean) to service_role;
grant execute on function public.create_match_room(),public.join_match_room(text),public.play_match_move(uuid,integer),public.heartbeat_match(uuid,boolean) to authenticated;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;

insert into games(slug,name,category,premium) values('2048','2048','Puzzle',false),('word-game','Word Club','Word',false),('endless-runner','Cloud Runner','Arcade',false),('match-3','Sweet Shuffle','Puzzle',true),('connect-4','Four in a Row','Multiplayer',false);
insert into achievements values('first-game','First of many','Finish your first ranked game.','flag'),('number-cruncher','Number cruncher','Score 10,000 in 2048.','hash'),('week-streak','A little every day','Solve Word Club seven days in a row.','flame');
insert into skins values('sunset','Sunset','#ec633c',false),('mint','Mint condition','#77b49b',true),('lavender','Daydream','#aaa0d5',true);
insert into feature_flags values('multiplayer',true),('ads',true);
-- Random server-only answers; the public seed does not determine the solution.
insert into daily_challenges(date,game_slug,seed,solution)
select d::date,'word-game',(floor(random()*2147483646)+1)::integer,
 (array['CRANE','PLANT','BRAVE','CLOUD','SWEET','LIGHT','SHARE','GAMES','DREAM','FLAME','GRAPE','SMILE','OCEAN','PEACH','SPARK','TRAIL','HEART','GREEN','SOUND','STONE','WORLD','MAGIC','BLOOM','NIGHT','CHESS','RIVER','APPLE','HONEY'])[(floor(random()*28)+1)::integer]
from generate_series((now() at time zone 'UTC')::date,((now() at time zone 'UTC')::date+30)::date,interval '1 day') d;
alter publication supabase_realtime add table public.match_rooms;
