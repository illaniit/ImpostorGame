export type RoomStatus = 'LOBBY' | 'PLAYING' | 'VOTING' | 'ENDED';
export type PlayerRole = 'CIVILIAN' | 'IMPOSTOR' | null;

export interface Room {
    id: string;
    code: string;
    host_id: string;
    status: RoomStatus;
    impostor_count: number;
    created_at: string;
}

export interface Player {
    id: string;
    room_id: string;
    user_id: string;
    is_alive: boolean;
    votes_received: number;
    has_voted: boolean; // Added for vote limiting
    created_at: string;
    // Enriched fields from profiles
    username?: string;
    avatar_url?: string;
}

export interface PlayerSecret {
    player_id: string;
    role: PlayerRole;
    secret_word: string | null;
}
