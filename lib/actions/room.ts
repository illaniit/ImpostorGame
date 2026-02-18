"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function createRoom(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const impostorCount = parseInt(formData.get("impostorCount") as string) || 1;
    let code = generateCode();
    let unique = false;

    // Simple retry loop for uniqueness (could be better, but sufficient for MVPs)
    while (!unique) {
        const { data } = await supabase
            .from("rooms")
            .select("id")
            .eq("code", code)
            .single();
        if (!data) {
            unique = true;
        } else {
            code = generateCode();
        }
    }

    const { data: room, error } = await supabase
        .from("rooms")
        .insert({
            code,
            host_id: user.id,
            impostor_count: impostorCount,
            status: "LOBBY",
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating room:", error);
        throw new Error("Failed to create room");
    }

    // We don't join the player here implicitly; the client will navigate and the Room component will handle "Join/Subscribe".
    // Actually, standard pattern is to insert the player record now?
    // User req: "Join Room: Input code. Lobby State: Show list."
    // If host creates it, they should be in it.
    // I'll redirect, and let the Room Page logic handle "If I am authenticated and opening this page, add me to players if not already".
    // This allows refreshing to work robustly.

    redirect(`/room/${code}`);
}
