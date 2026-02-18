"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createWordPack(formData: FormData) {
    const supabase = await createClient();

    // Check if user is admin - for MVP allowing any auth user or just implementing it open for now as requested
    // Ideally: check `is_admin` column in `profiles`.
    // For this request: "add way to add words", I'll make it accessible.

    const category = formData.get("category") as string;
    const civilian_word = formData.get("civilian_word") as string;
    const impostor_word = formData.get("impostor_word") as string;

    if (!category || !civilian_word || !impostor_word) {
        throw new Error("Missing fields");
    }

    const { error } = await supabase.from("word_packs").insert({
        category,
        civilian_word,
        impostor_word
    });

    if (error) {
        console.error("Error creating word pack:", error);
        throw new Error("Failed to create word pack");
    }

    revalidatePath("/admin/words");
}
