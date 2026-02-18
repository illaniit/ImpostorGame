-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Enable Realtime for Game Tables (Fixes "Need to Refresh")
begin;
  -- Add tables to the publication used by Supabase Realtime
  alter publication supabase_realtime add table rooms;
  alter publication supabase_realtime add table players;
  alter publication supabase_realtime add table player_roles; 
commit;

-- 2. Create RPC for Voting
create or replace function increment_vote(p_player_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update players
  set votes_received = votes_received + 1
  where id = p_player_id;
end;
$$;

-- 3. Create RPC for Assigning Roles (Start Game)
create or replace function assign_roles(p_roles jsonb)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  -- Insert roles securely (bypassing RLS for the insert)
  for r in select * from jsonb_to_recordset(p_roles) as x(player_id uuid, role player_role, secret_word text)
  loop
    insert into player_roles (player_id, role, secret_word)
    values (r.player_id, r.role, r.secret_word)
    on conflict (player_id) do update set role = r.role, secret_word = r.secret_word;
  end loop;
end;
$$;

-- 4. Create RPC for Checking Game Over
create or replace function check_game_over(p_room_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_impostors_alive int;
  v_civilians_alive int;
  v_total_players int;
begin
  -- Count alive stats
  select count(*) into v_impostors_alive
  from players p
  join player_roles pr on p.id = pr.player_id
  where p.room_id = p_room_id and p.is_alive = true and pr.role = 'IMPOSTOR';

  select count(*) into v_civilians_alive
  from players p
  join player_roles pr on p.id = pr.player_id
  where p.room_id = p_room_id and p.is_alive = true and pr.role = 'CIVILIAN';

  if v_impostors_alive = 0 then
    update rooms set status = 'ENDED' where id = p_room_id;
    return 'CIVILIANS_WIN';
  end if;

  if v_impostors_alive >= v_civilians_alive then
    update rooms set status = 'ENDED' where id = p_room_id;
    return 'IMPOSTORS_WIN';
  end if;

  return 'CONTINUE';
end;
$$;

-- 5. Create RPC for Resetting Votes (New Round)
create or replace function reset_votes(p_room_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update players set votes_received = 0 where room_id = p_room_id;
end;
$$;

-- 6. Grant Permissions (Crucial for Anon/Auth users to call these)
grant execute on function increment_vote(uuid) to anon, authenticated, service_role;
grant execute on function assign_roles(jsonb) to anon, authenticated, service_role;
grant execute on function check_game_over(uuid) to anon, authenticated, service_role;
grant execute on function reset_votes(uuid) to anon, authenticated, service_role;
