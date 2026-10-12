-- Aggregate lifetime stats in SQL; never derive them from a truncated recent-history page.
create view public.personal_bests with(security_invoker=true) as
 select user_id,game_slug,max(score)::integer as score from public.scores group by user_id,game_slug;
grant select on public.personal_bests to authenticated;
-- Guard direct RPC access to disabled multiplayer; the UI flag is not the authority.
create function public.guard_match_settings() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from feature_flags where key='multiplayer' and enabled) or not exists(select 1 from games where slug='connect-4' and enabled) then
 if tg_op='INSERT' or (old.status='waiting' and new.status='playing') or old.board<>new.board then raise exception 'Multiplayer is currently unavailable';end if;
 end if;
 -- If an admin marks Connect 4 Premium, both participants must be entitled.
 if exists(select 1 from games where slug='connect-4' and premium) and (tg_op='INSERT' or old.board<>new.board or old.guest_id is distinct from new.guest_id) then
 if not exists(select 1 from subscriptions where user_id=new.host_id and status in('active','trialing') and current_period_end>now()) or
 (new.guest_id is not null and not exists(select 1 from subscriptions where user_id=new.guest_id and status in('active','trialing') and current_period_end>now())) then raise exception 'Premium is required';end if;
 end if;return new;
end $$;
revoke all on function public.guard_match_settings() from public,anon,authenticated;
create trigger match_settings_guard before insert or update on public.match_rooms for each row execute function public.guard_match_settings();
