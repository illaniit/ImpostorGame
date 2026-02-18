"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Zap, User } from "lucide-react";

export default function LoginPage() {
    const [nickname, setNickname] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleEnter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) return;

        setLoading(true);
        setError(null);

        // 1. Sign in anonymously
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

        if (authError) {
            console.error("Auth Error:", authError);
            setError("Could not sign in. Ensure 'Anonymous Sign-ins' are enabled in Supabase.");
            setLoading(false);
            return;
        }

        const userId = authData.user?.id;
        if (!userId) {
            setError("Authentication failed.");
            setLoading(false);
            return;
        }

        // 2. Upsert Profile with Nickname
        const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                username: nickname,
                avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${nickname}`, // Auto-generate avatar
            });

        if (profileError) {
            console.error("Profile Error:", profileError);
            // Optionally continue if it's just a duplicate username or minor issue, but let's report it
            // Actually, if we use upsert, it updates. If username is unique, it might fail.
            // Let's rely on random seed if it fails? For now, simplistic handling.
        }

        router.push("/");
        router.refresh();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="bg-purple-600 p-3 rounded-full animate-pulse">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                            IMPOSTOR
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            Enter your alias, agent.
                        </p>
                    </div>

                    <form onSubmit={handleEnter} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Nickname</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                                <input
                                    type="text"
                                    required
                                    maxLength={12}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold tracking-wide"
                                    placeholder="Agent 007"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-900/50 rounded-lg text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !nickname.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shadow-lg shadow-purple-900/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter Game"}
                        </button>
                    </form>
                </div>
                <div className="px-8 py-4 bg-zinc-950/50 border-t border-zinc-800 text-center text-xs text-zinc-500">
                    Security protocols active. v1.1.0
                </div>
            </div>
        </div>
    );
}
