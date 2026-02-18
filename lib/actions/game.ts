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

    // Use the RPC we just created
    const { error } = await supabase.rpc('increment_vote', { p_player_id: playerId });

    if (error) {
        console.error("Vote failed:", error);
    }
}

export async function eliminatePlayer(roomId: string, playerId: string) {
    const supabase = await createClient();

    // Set is_alive = false
    await supabase.from("players").update({ is_alive: false }).eq("id", playerId);

    // Reset votes for next round (if continuing)
    // Actually, we should probably reset votes at start of round, but let's do it here or via RPC
    await supabase.rpc('reset_votes', { p_room_id: roomId });

    // Check Win Condition
    const { data: result, error } = await supabase.rpc('check_game_over', { p_room_id: roomId });
    if (error) console.error("Win check failed", error);

    // If result is 'CIVILIANS_WIN' or 'IMPOSTORS_WIN', the RPC already updated the room status to 'ENDED'.
    // If 'CONTINUE', we might want to go back to DISCUSSION?
    // Let's assume the host manually moves to Discussion or we auto-move.
    if (result === 'CONTINUE') {
        await supabase.from("rooms").update({ status: "PLAYING" }).eq("id", roomId);
    }
}
