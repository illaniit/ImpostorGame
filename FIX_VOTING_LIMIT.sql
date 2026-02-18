-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Add 'has_voted' column to players table
alter table players add column has_voted boolean default false;

-- 2. Update increment_vote to check for previous votes and mark as voted
create or replace function increment_vote(p_target_id uuid, p_voter_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_room_id uuid;
begin
  -- Get room_id from target
  select room_id into v_room_id from players where id = p_target_id;

  -- Check if voter is in the same room (basic check) and hasn't voted
  if exists (select 1 from players where id = p_voter_id and has_voted = true) then
    raise exception 'You have already voted this round';
  end if;

  -- Increment vote
  update players
  set votes_received = votes_received + 1
  where id = p_target_id;

  -- Mark voter as voted
  update players
  set has_voted = true
  where id = p_voter_id;
end;
$$;

-- 3. Update reset_votes to also reset the 'has_voted' flag
create or replace function reset_votes(p_room_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update players 
  set votes_received = 0, 
      has_voted = false 
  where room_id = p_room_id;
end;
$$;

-- 4. Grant permissions again just in case
grant execute on function increment_vote(uuid, uuid) to anon, authenticated, service_role;
grant execute on function reset_votes(uuid) to anon, authenticated, service_role;
