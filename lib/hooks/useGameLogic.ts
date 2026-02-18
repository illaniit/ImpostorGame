import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/store/game'
import { Room, Player } from '@/lib/types'

export function useGameLogic(roomId: string, initialRoom: Room, initialPlayers: Player[], userId: string) {
    const supabase = createClient()
    const { setRoom, setPlayers, updatePlayer, addPlayer, room, secrets, setSecrets } = useGameStore()

    useEffect(() => {
        // Set initial state
        setRoom(initialRoom)
        setPlayers(initialPlayers)

        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    setRoom(payload.new as Room)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'players',
                    filter: `room_id=eq.${roomId}`,
                },
                async (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        // Fetch profile data for the new player
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('username, avatar_url')
                            .eq('id', payload.new.user_id)
                            .single();

                        addPlayer({ ...payload.new as Player, ...profile });
                    } else if (payload.eventType === 'UPDATE') {
                        updatePlayer(payload.new.id, payload.new as Partial<Player>);
                    }
                    // Handle DELETE if kicked?
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, supabase, setRoom, setPlayers, addPlayer, updatePlayer, initialRoom, initialPlayers])

    // Fetch secrets when game starts
    useEffect(() => {
        if (room?.status === 'PLAYING' && !secrets) {
            const myPlayer = initialPlayers.find(p => p.user_id === userId); // Note: initialPlayers might be stale if new players joined? 
            // Better determine myPlayerId from store players.
            // But store players are updated via realtime.

            // We need to find "Me" in the current players list.
            // We can't easily access store state here without selector or subscription.
            // But we can just query by user_id in DB? No, need player_id.
            // We can query `players` table by `user_id` and `room_id` to get `player_id`.

            const fetchSecret = async () => {
                const { data: player } = await supabase.from('players').select('id').eq('room_id', roomId).eq('user_id', userId).single();
                if (player) {
                    const { data: secret } = await supabase.from('player_roles').select('*').eq('player_id', player.id).single();
                    if (secret) setSecrets(secret);
                }
            }
            fetchSecret();
        }
    }, [room?.status, userId, roomId, secrets, setSecrets, supabase]); // Depend on room.status

    return { room }
}
