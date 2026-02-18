"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: email.split("@")[0], // Default username
                },
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setError("Account created! You can now sign in.");
            setLoading(false);
        }
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
                            Enter the deception check.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="agent@impostor.game"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-900/50 rounded-lg text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSignUp}
                                disabled={loading}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>
                </div>
                <div className="px-8 py-4 bg-zinc-950/50 border-t border-zinc-800 text-center text-xs text-zinc-500">
                    Secure connection established. v1.0.0
                </div>
            </div>
        </div>
    );
}
