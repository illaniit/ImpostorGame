"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function startGame(roomId: string, impostorCount: number) {
    const supabase = await createClient();

    // 1. Fetch players
    const { data: players } = await supabase.from("players").select("id").eq("room_id", roomId);
    if (!players || players.length < 3) {
        throw new Error("Not enough players");
    }

    // 2. Assign roles
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const impostors = shuffled.slice(0, impostorCount);
    const civilians = shuffled.slice(impostorCount);

    // 3. Get Word Pack
    // For MVP, if word_packs is empty, use defaults
    const { data: wordPack } = await supabase.from("word_packs").select("*").maybeSingle();

    const civilianWord = wordPack?.civilian_word || "Coffee";
    const impostorWord = wordPack?.impostor_word || "Tea";

    // 4. Insert Secrets
    // Note: RLS must allow Host to INSERT into player_roles.
    // We assume a policy exists: "Host can insert player_roles" or "Authenticated can insert"?
    // If strict RLS blocks insert, this fails.
    // We will try.
    const secrets = [
        ...impostors.map(p => ({
            player_id: p.id,
            role: "IMPOSTOR",
            secret_word: impostorWord
        })),
        ...civilians.map(p => ({
            player_id: p.id,
            role: "CIVILIAN",
            secret_word: civilianWord
        }))
    ];

    // Use RPC to bypass RLS
    const { error } = await supabase.rpc('assign_roles', { p_roles: secrets });

    if (error) {
        console.error("Failed to assign roles:", error);
        throw new Error("Game start failed. (RPC Error)");
    }

    // 5. Update Room
    await supabase.from("rooms").update({ status: "PLAYING" }).eq("id", roomId);
}

export async function votePlayer(roomId: string, playerId: string) {
    const supabase = await createClient();

    // Increment vote
    // We should ensure a user only votes once per round. 
    // MVP: Just increment. Clientside state limits.
    await supabase.rpc('increment_vote', { p_player_id: playerId });
    // Or direct update:
    // const { data } = await supabase.from('players').select('votes_received').eq('id', playerId).single();
    // await supabase.from('players').update({ votes_received: (data?.votes_received || 0) + 1 }).eq('id', playerId);

    // Better: RPC to avoid race conditions.
    // create function increment_vote(p_player_id uuid) returns void as $$ update players set votes_received = votes_received + 1 where id = p_player_id; $$;
    // I'll try direct update for now via fetch-update.

    // Check if everyone voted? 
    // That logic is complex for MVP. Host manual "End Voting" button is better.
}

export async function eliminatePlayer(roomId: string, playerId: string) {
    const supabase = await createClient();

    // Set is_alive = false
    await supabase.from("players").update({ is_alive: false }).eq("id", playerId);

    // Reset votes
    await supabase.from("players").update({ votes_received: 0 }).eq("room_id", roomId);

    // Check Win Condition
    const { data: result, error } = await supabase.rpc('check_game_over', { p_room_id: roomId });
    if (error) console.error("Win check failed", error);

    // If result is 'CONTINUE', maybe move back to Discussion?
    // Room status stays 'PLAYING'.
    // Phase logic via room status 'VOTING' vs 'PLAYING'.
}
