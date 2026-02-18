"use client";

import { useGameLogic } from "@/lib/hooks/useGameLogic";
import { Player, Room } from "@/lib/types";
import { useGameStore } from "@/lib/store/game";
import { Loader2, User, Crown, Skull } from "lucide-react";

interface GameRoomProps {
    room: Room;
    players: Player[];
    user: any; // Auth User
}

export default function GameRoom({ room: initialRoom, players: initialPlayers, user }: GameRoomProps) {
    useGameLogic(initialRoom.id, initialRoom, initialPlayers, user.id);
    const { room, players, secrets } = useGameStore();

    if (!room) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-purple-500" /></div>;

    const isHost = room.host_id === user.id;
    const myPlayer = players.find(p => p.user_id === user.id);
    const userIsAlive = myPlayer?.is_alive ?? true;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div>
                    <h1 className="text-xl font-bold text-zinc-200">Room Code</h1>
                    <p className="text-4xl font-mono font-black tracking-widest text-purple-500">{room.code}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-zinc-400">Status</div>
                    <div className="font-bold text-pink-500">{room.status}</div>
                </div>
            </div>

            {room.status === 'LOBBY' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {players.map((p) => (
                        <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 relative group">
                            {room.host_id === p.user_id && <Crown className="w-5 h-5 text-yellow-500 absolute top-2 right-2" />}
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full" /> : <User className="w-8 h-8 text-zinc-500" />}
                            </div>
                            <div className="font-medium text-zinc-200">{p.username || 'Unknown Agent'}</div>
                        </div>
                    ))}

                    {/* Empty Slots visualization if we want? No, dynamic list. */}
                </div>
            )}

            {/* Host Controls */}
            {isHost && room.status === 'LOBBY' && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={async () => {
                            // Import dynamically or use imported action
                            const { startGame } = await import("@/lib/actions/game");
                            await startGame(room.id, room.impostor_count);
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={players.length < 3} // Min players constraint
                    >
                        {players.length < 3 ? `Need ${3 - players.length} more to start` : 'START GAME'}
                    </button>
                </div>
            )}

            {/* Game Views */}
            {room.status !== 'LOBBY' && (
                <div className="space-y-8">
                    {/* Role Reveal Section */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">{room.status === 'PLAYING' ? 'DISCUSSION PHASE' : 'VOTING PHASE'}</h2>
                        {secrets && (
                            <div className="p-6 bg-zinc-800 rounded-xl border border-zinc-700 inline-block shadow-2xl">
                                <p className="text-zinc-400 text-sm mb-2">YOUR SECRET</p>
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 uppercase">
                                    {secrets.role === 'IMPOSTOR' ? 'IMPOSTOR' : 'CIVILIAN'}
                                </div>
                                <div className="mt-2 text-xl text-white font-mono bg-zinc-950 px-4 py-2 rounded">
                                    {secrets.secret_word || '???'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Player Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {players.map((p) => {
                            const isMe = p.user_id === user.id;
                            const canVote = room.status === 'VOTING' && userIsAlive && !p.is_alive === false; // Logic check needed

                            return (
                                <div key={p.id}
                                    onClick={async () => {
                                        // Handle Vote
                                        if (room.status === 'VOTING' && !isMe && p.is_alive) {
                                            const { votePlayer } = await import("@/lib/actions/game");
                                            await votePlayer(room.id, p.id);
                                        }
                                    }}
                                    className={`bg-zinc-900/50 border p-4 rounded-xl flex flex-col items-center gap-2 relative group transition-all
                            ${!p.is_alive ? 'opacity-50 grayscale border-zinc-800' : 'border-zinc-700 hover:border-purple-500 cursor-pointer'}
                            ${room.status === 'VOTING' ? 'hover:scale-105' : ''}
                         `}>
                                    {room.host_id === p.user_id && <Crown className="w-5 h-5 text-yellow-500 absolute top-2 right-2" />}
                                    {!p.is_alive && <Skull className="w-8 h-8 text-red-500 absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />}

                                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
                                        {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-zinc-500" />}
                                    </div>
                                    <div className="font-medium text-zinc-200 truncate w-full text-center">{p.username || 'Agent'}</div>

                                    {room.status === 'VOTING' && p.votes_received > 0 && (
                                        <div className="absolute -top-2 -left-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
                                            {p.votes_received}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Action Bar */}
                    {isHost && (
                        <div className="flex justify-center gap-4 fixed bottom-8 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800">
                            {room.status === 'PLAYING' && (
                                <button
                                    onClick={async () => {
                                        const { createClient } = await import("@/lib/supabase/client");
                                        const supabase = createClient();
                                        await supabase.from("rooms").update({ status: 'VOTING' }).eq("id", room.id);
                                    }}
                                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
                                >
                                    START VOTING
                                </button>
                            )}
                            {room.status === 'VOTING' && (
                                <button
                                    onClick={async () => {
                                        const { resolveVoting } = await import("@/lib/actions/resolve");
                                        await resolveVoting(room.id);
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
                                >
                                    ELIMINATE MOST VOTED
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

