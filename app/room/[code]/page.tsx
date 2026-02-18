import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GameRoom from "@/components/GameRoom";

export default async function Page({ params }: { params: { code: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/room/${params.code}`);
    }

    // 1. Fetch Room
    const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", params.code.toUpperCase())
        .single();

    if (!room) return notFound();

    // 2. Check if player exists, if not join
    let { data: player } = await supabase
        .from("players")
        .select(`
        *,
        profiles (
            username,
            avatar_url
        )
    `)
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

    if (!player) {
        if (room.status !== "LOBBY") {
            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
                        <p>This operation is already in progress.</p>
                    </div>
                </div>
            );
        }

        // Insert player
        const { error } = await supabase.from("players").insert({
            room_id: room.id,
            user_id: user.id
        });

        if (error) {
            console.error("Join error", error);
            return <div>Failed to join room. Please try again.</div>;
        }

        const { data: newPlayer } = await supabase
            .from("players")
            .select(`
            *,
            profiles (
                username,
                avatar_url
            )
        `)
            .eq("room_id", room.id)
            .eq("user_id", user.id)
            .single();
        player = newPlayer;
    }

    // 3. Fetch all players for initial state
    const { data: players } = await supabase
        .from("players")
        .select(`
        *,
        profiles (
            username,
            avatar_url
        )
    `)
        .eq("room_id", room.id);

    // Map flat structure for the client
    const formattedPlayers = players?.map((p: any) => ({
        ...p,
        username: p.profiles?.username || p.user_id.split('-')[0], // Fallback
        avatar_url: p.profiles?.avatar_url,
        profiles: undefined // Remove nested object
    })) || [];

    return <GameRoom room={room} players={formattedPlayers} user={user} />;
}
