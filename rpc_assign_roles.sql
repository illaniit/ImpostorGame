-- Function to safely insert roles (called by Server Action)
create or replace function assign_roles(p_roles jsonb)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  -- Clear existing roles if restarting?
  -- delete from player_roles where player_id in (select player_id from jsonb_to_recordset(p_roles) as x(player_id uuid));

  for r in select * from jsonb_to_recordset(p_roles) as x(player_id uuid, role player_role, secret_word text)
  loop
    insert into player_roles (player_id, role, secret_word)
    values (r.player_id, r.role, r.secret_word)
    on conflict (player_id) do update set role = r.role, secret_word = r.secret_word;
  end loop;
end;
$$;
