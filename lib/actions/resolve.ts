"use server";

import { createClient } from "@/lib/supabase/server";

export async function resolveVoting(roomId: string) {
    const supabase = await createClient();

    // 1. Get votes
    const { data: players } = await supabase.from("players").select("id, votes_received").eq("room_id", roomId).eq("is_alive", true);

    if (!players || players.length === 0) return;

    // 2. Find max
    let maxVotes = -1;
    let maxPlayerId = null;
    let tie = false;

    players.forEach(p => {
        if (p.votes_received > maxVotes) {
            maxVotes = p.votes_received;
            maxPlayerId = p.id;
            tie = false;
        } else if (p.votes_received === maxVotes) {
            tie = true;
        }
    });

    // 3. Eliminate if no tie (or handle tie? Rules didn't specify. Standard: Tie = Skip)
    if (!tie && maxPlayerId) {
        await supabase.from("players").update({ is_alive: false }).eq("id", maxPlayerId);
    }

    // 4. Reset votes
    await supabase.from("players").update({ votes_received: 0 }).eq("room_id", roomId);

    // 5. Check Win Condition
    const { data: result } = await supabase.rpc('check_game_over', { p_room_id: roomId });

    if (result !== 'CIVILIANS_WIN' && result !== 'IMPOSTORS_WIN') {
        // Back to playing (Discussion)
        await supabase.from("rooms").update({ status: 'PLAYING' }).eq("id", roomId);
    }
}
