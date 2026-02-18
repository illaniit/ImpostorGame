"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Users, Skull } from "lucide-react";
import { createRoom } from "@/lib/actions/room";

export default function Home() {
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length === 4) {
      router.push(`/room/${joinCode.toUpperCase()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-12">
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-20 rounded-full"></div>
          <Skull className="w-24 h-24 text-purple-500 relative z-10 mx-auto" />
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-purple-200 to-purple-600">
          IMPOSTOR
        </h1>
        <p className="text-xl text-zinc-400 max-w-md mx-auto">
          Trust no one. The deception begins now.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        {/* Create Room Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:border-purple-500/50 transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
              <Play className="w-8 h-8 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold">New Game</h2>
          </div>
          <p className="text-zinc-400 mb-8 h-12">Host a new session and invite your friends via code.</p>
          <form action={createRoom}>
            <input type="hidden" name="impostorCount" value="1" />
            <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/20">
              Create Room
            </button>
          </form>
        </div>

        {/* Join Room Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:border-pink-500/50 transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-pink-500/10 rounded-xl group-hover:bg-pink-500/20 transition-colors">
              <Users className="w-8 h-8 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold">Join Game</h2>
          </div>
          <p className="text-zinc-400 mb-8 h-12">Enter the 4-letter room code to join an existing session.</p>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              placeholder="CODE"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-center font-mono text-xl uppercase placeholder:text-zinc-700 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <button type="submit" disabled={joinCode.length !== 4} className="px-6 bg-zinc-800 hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-zinc-800 text-white font-bold rounded-xl transition-all">
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
