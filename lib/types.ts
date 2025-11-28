export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    isAdmin?: boolean;
    likedTracks?: string[];
}

export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    duration: number; // seconds
    storagePath: string;
    coverPath: string;
    uploadedBy: string;
    createdAt: number; // timestamp
    explicit: boolean;
    plays: number;
    genre1?: string;
    genre2?: string;
    genre3?: string;
    relevancy1?: string; // Track ID
    relevancy2?: string; // Track ID
    relevancy3?: string; // Track ID
}

export interface Playlist {
    id: string;
    title: string;
    description?: string;
    ownerId: string;
    trackIds: string[];
    createdAt: number;
    public: boolean;
}

export interface Ad {
    id: string;
    title: string;
    storagePath: string;
    coverPath: string;
    ctaUrl?: string;
    duration: number;
    active: boolean;
    weight: number;
    createdAt: number;
}

export interface PlayHistory {
    userId: string;
    trackId: string;
    startedAt: number;
    endedAt: number;
    secondsPlayed: number;
}

export interface Section {
    id: string;
    title: string;
    order: number;
    trackIds: string[];
}
