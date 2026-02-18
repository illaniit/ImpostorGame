-- Function to Start Game (Assign Roles)
create or replace function start_game(p_room_id uuid, p_impostor_count int)
returns void
language plpgsql
security definer
as $$
declare
  v_word_pack record;
  v_players record[];
  v_impostor_indices int[];
  v_i int;
  v_role player_role;
  v_word text;
  v_player record;
begin
  -- 1. Check if room exists and is LOBBY
  if not exists (select 1 from rooms where id = p_room_id and status = 'LOBBY') then
    raise exception 'Room not in LOBBY state';
  end if;

  -- 2. Get Word Pack (Random)
  select * into v_word_pack from word_packs order by random() limit 1;
  if not found then
    raise exception 'No word packs found';
  end if;

  -- 3. Get Players
  select array_agg(row(id, user_id)) into v_players from players where room_id = p_room_id;
  
  if array_length(v_players, 1) < 3 then
     raise exception 'Not enough players';
  end if;

  -- 4. Shuffle and Assign
  -- Simple Shuffle Logic or just Random assignment
  -- We'll iterate and assign.
  
  -- Create role entries
  for v_i in 1..array_length(v_players, 1) loop
    v_player := v_players[v_i];
    
    -- Logic to determine if impostor:
    -- This is hard to do purely in PLPGSQL with exact counts efficiently without temporary tables or array slicing.
    -- Alternative: We trust the Client/Server Action to pass the assignments?
    -- NO, Server Action cannot see `player_roles` to verify or create if we lock it down.
    -- But Server Action CAN Insert. RLS checks usually apply to Select/Update/Delete. Insert is checked via WITH CHECK.
    -- If we allow "Authenticated" to Insert `player_roles`, any user can insert any role?
    -- RLS for Insert: `with check ( true )`? No, we should restrict.
    -- Better -> RPC is safest.
  end loop;
  
  -- SIMPLER APPROACH for MVP:
  -- Server Action does the randomization logic.
  -- Server Action Calls `insert_game_roles(json_data)`.
  -- `insert_game_roles` is SECURITY DEFINER.
  -- Validates that the Caller is the HOST of the room.
end;
$$;

-- Better Approach: `check_game_over` function.
create or replace function check_game_over(p_room_id uuid)
returns text -- 'CIVILIANS_WIN', 'IMPOSTORS_WIN', 'CONTINUE'
language plpgsql
security definer
as $$
declare
  v_impostors_alive int;
  v_civilians_alive int;
begin
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
