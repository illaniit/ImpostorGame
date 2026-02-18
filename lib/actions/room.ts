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

    // Ensure profile exists (Robust handling)
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

    if (!profile) {
        console.log("Profile missing for user, creating now...", user.id);
        const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            username: user.email?.split("@")[0] || "user",
            avatar_url: "",
            is_admin: false
        });
        if (profileError) {
            console.error("Failed to auto-create profile:", profileError);
            // Continue anyway, maybe trigger handled it or race condition
        }
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

    console.log(`Creating room with code: ${code} for host: ${user.id}`);

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
        throw new Error("Failed to create room: " + error.message);
    }

    console.log("Room created successfully, redirecting...");
    redirect(`/room/${code}`);
}
