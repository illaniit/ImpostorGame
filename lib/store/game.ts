import { create } from 'zustand'
import { Player, PlayerSecret, Room } from '@/lib/types'

interface GameState {
    room: Room | null;
    players: Player[];
    secrets: PlayerSecret | null;
    setRoom: (room: Room) => void;
    setPlayers: (players: Player[]) => void;
    setSecrets: (secrets: PlayerSecret | null) => void;
    updatePlayer: (id: string, updates: Partial<Player>) => void;
    addPlayer: (player: Player) => void;
    removePlayer: (id: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
    room: null,
    players: [],
    secrets: null,
    setRoom: (room) => set({ room }),
    setPlayers: (players) => set({ players }),
    setSecrets: (secrets) => set({ secrets }),
    updatePlayer: (id, updates) =>
        set((state) => ({
            players: state.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
    addPlayer: (player) =>
        set((state) => ({
            players: [...state.players.filter((p) => p.id !== player.id), player],
        })),
    removePlayer: (id) =>
        set((state) => ({
            players: state.players.filter((p) => p.id !== id),
        })),
}))
