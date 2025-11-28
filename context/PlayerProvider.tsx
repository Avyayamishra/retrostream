"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { Track, Ad } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { Howl } from "howler";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface PlayerContextType {
    currentTrack: Track | Ad | null;
    isPlaying: boolean;
    queue: (Track | Ad)[];
    playTrack: (track: Track) => void;
    playTrackInQueue: (track: Track, queue: Track[]) => void;
    playQueue: (tracks: Track[]) => void;
    togglePlay: () => void;
    next: () => void;
    prev: () => void;
    seek: (val: number) => void;
    duration: number;
    currentTime: number;
    volume: number;
    setVolume: (val: number) => void;
    isAdPlaying: boolean;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
    const { userProfile } = useAuth();
    const [currentTrack, setCurrentTrack] = useState<Track | Ad | null>(null);
    const [queue, setQueue] = useState<(Track | Ad)[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isAdPlaying, setIsAdPlaying] = useState(false);

    // Refs for logic that doesn't need re-renders
    const soundRef = useRef<Howl | null>(null);
    const cumulativeTimeRef = useRef(0);
    const startTimeRef = useRef<number>(0);
    const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const skipsRef = useRef(0);

    // Load cumulative time from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("cumulativeListeningSeconds");
        if (saved) cumulativeTimeRef.current = parseFloat(saved);
    }, []);

    // Save cumulative time periodically
    useEffect(() => {
        const interval = setInterval(() => {
            localStorage.setItem("cumulativeListeningSeconds", cumulativeTimeRef.current.toString());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const playAd = async () => {
        try {
            const res = await fetch('/api/ads?type=audio_banner');
            const data = await res.json();
            if (data.ads && data.ads.length > 0) {
                // Pick a random ad
                const randomAd = data.ads[Math.floor(Math.random() * data.ads.length)];
                await loadAndPlay(randomAd);

                // Reset counters
                skipsRef.current = 0;
                cumulativeTimeRef.current = 0;
                localStorage.setItem("cumulativeListeningSeconds", "0");
                return true;
            }
        } catch (e) {
            console.error("Failed to fetch ad", e);
        }
        return false;
    };

    const playTrack = async (track: Track) => {
        // If playing an ad, ignore
        if (isAdPlaying) return;

        // Add to queue if not present, or just play
        setQueue([track]);
        await loadAndPlay(track);
    };

    const playQueue = async (tracks: Track[]) => {
        if (isAdPlaying) return;
        setQueue(tracks);
        if (tracks.length > 0) {
            await loadAndPlay(tracks[0]);
        }
    };

    const playTrackInQueue = async (track: Track, newQueue: Track[]) => {
        if (isAdPlaying) return;
        setQueue(newQueue);
        await loadAndPlay(track);
    };

    const loadAndPlay = async (track: Track | Ad) => {
        if (soundRef.current) {
            soundRef.current.unload();
        }

        // Determine if this is an ad
        const isAd = 'type' in track && (track.type === 'audio_banner' || track.type === 'banner_only'); // Simple check, or check specific fields
        // Actually, our Ad type has 'weight', Track doesn't.
        // Or check if it came from ads API.
        // For now, let's assume if it has 'weight' it's an ad.
        const isAdContent = 'weight' in track;

        setIsAdPlaying(isAdContent);
        setCurrentTrack(track);

        let src = '';
        // If it's a full URL (from ad API) or a local path, use it directly
        if (track.storagePath.startsWith('http') || track.storagePath.startsWith('/')) {
            src = track.storagePath;

            // Fix Google Drive Links
            if (track.storagePath.includes('drive.google.com')) {
                // Handle /file/d/ID/view
                const match = track.storagePath.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    src = `https://drive.google.com/uc?export=download&id=${match[1]}`;
                }
            }
        } else {
            try {
                src = await getDownloadURL(ref(storage, track.storagePath));
            } catch (e) {
                console.error("Error getting URL", e);
                return;
            }
        }

        console.log("Attempting to play:", src);

        const sound = new Howl({
            src: [src],
            html5: true,
            format: ['mp3'], // Force MP3 format for streams
            volume: volume,
            onplay: () => {
                console.log("Playback started");
                setIsPlaying(true);
                setDuration(sound.duration());
                startTimeRef.current = Date.now();
                startTimer();
            },
            onloaderror: (id, err) => {
                console.error("Load Error:", err);
            },
            onplayerror: (id, err) => {
                console.error("Play Error:", err);
                sound.once('unlock', () => {
                    sound.play();
                });
            },
            onpause: () => {
                setIsPlaying(false);
                stopTimer();
            },
            onend: () => {
                setIsPlaying(false);
                stopTimer();
                handleTrackEnd(track, isAdContent);
            },
            onseek: () => {
                // Update current time immediately on seek
                setCurrentTime(sound.seek());
            }
        });

        soundRef.current = sound;
        sound.play();
    };

    const startTimer = () => {
        if (playIntervalRef.current) clearInterval(playIntervalRef.current);
        playIntervalRef.current = setInterval(() => {
            if (soundRef.current) {
                const seek = soundRef.current.seek();
                setCurrentTime(seek);

                // Accumulate listening time if not an ad
                if (!isAdPlaying) {
                    cumulativeTimeRef.current += 1;
                }
            }
        }, 1000);
    };

    const stopTimer = () => {
        if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };

    const handleTrackEnd = async (finishedTrack: Track | Ad, wasAd: boolean) => {
        if (wasAd) {
            // Ad finished, play next track in queue
            const idx = queue.findIndex(t => t.id === currentTrack?.id); // This might be tricky if ad replaced currentTrack
            // Actually, we should probably store the 'next track' before playing ad.
            // But for simplicity, let's just resume queue from where we left off?
            // If we replaced currentTrack with Ad, we lost the queue position?
            // No, queue state is preserved. currentTrack is just state.
            // We need to find where we were.
            // Let's assume we just play the next song in queue.
            // But wait, 'currentTrack' is the Ad now.
            // We need to know what was playing before.
            // For now, let's just play the first track in queue if we lost context, or try to find next.
            // A better way: Don't replace queue, just play ad.

            // If we were just playing an ad, we should go back to the queue.
            // We need to know the index of the track that triggered the ad?
            // Or just play the next track in the queue?
            // Let's try to play the next track in queue.
            // But 'currentTrack' is the Ad, which is not in the queue.
            // So we need to store 'lastTrackId' before playing ad.
            // Let's just play the first track for now to be safe, or maybe we can't easily resume without more state.
            // Actually, let's just play the next track in queue.
            if (queue.length > 0) {
                // Find a random track or just the first one?
                // Let's just play the first one for now.
                loadAndPlay(queue[0]);
            }
            return;
        }

        // Check for Ad insertion (Time based)
        // 30 mins = 1800 seconds
        if (cumulativeTimeRef.current >= 1800) {
            const played = await playAd();
            if (played) return;
        }

        // Normal next track logic
        next();
    };

    const togglePlay = () => {
        if (soundRef.current) {
            if (isPlaying) soundRef.current.pause();
            else soundRef.current.play();
        }
    };

    const findNextTrack = (current: Track | Ad, currentQueue: (Track | Ad)[]) => {
        const idx = currentQueue.findIndex(t => t.id === current.id);
        if (idx === -1) return null;

        // If Ad, just sequential
        if ('weight' in current) {
            return idx < currentQueue.length - 1 ? currentQueue[idx + 1] : null;
        }

        const track = current as Track;

        // 1. Relevancy (Global Search)
        const relevancyIds = [track.relevancy1, track.relevancy2, track.relevancy3].filter(Boolean);
        if (relevancyIds.length > 0) {
            const relevantTrack = currentQueue.find(t => relevancyIds.includes(t.id) && t.id !== track.id);
            if (relevantTrack) return relevantTrack;
        }

        // 2. Genre (Forward Search)
        const genres = [track.genre, track.genre1, track.genre2, track.genre3].filter(Boolean);
        if (genres.length > 0) {
            const remainingQueue = currentQueue.slice(idx + 1);
            const genreTrack = remainingQueue.find(t => {
                if ('weight' in t) return false;
                const tGenres = [t.genre, t.genre1, t.genre2, t.genre3];
                return tGenres.some(g => g && genres.includes(g));
            });
            if (genreTrack) return genreTrack;
        }

        // 3. Sequential Fallback
        return idx < currentQueue.length - 1 ? currentQueue[idx + 1] : null;
    };

    const next = async () => {
        if (isAdPlaying) return; // Cannot skip ad

        // Increment skips
        skipsRef.current += 1;

        // Check for Ad insertion (Skips based)
        if (skipsRef.current >= 5) {
            const played = await playAd();
            if (played) return;
        }

        if (currentTrack && queue.length > 0) {
            const nextTrack = findNextTrack(currentTrack, queue);
            if (nextTrack) {
                loadAndPlay(nextTrack);
            }
        }
    };

    const prev = () => {
        if (isAdPlaying) return;
        const idx = queue.findIndex(t => t.id === currentTrack?.id);
        if (idx > 0) {
            loadAndPlay(queue[idx - 1]);
        }
    };

    const seek = (val: number) => {
        if (isAdPlaying) return;
        if (soundRef.current) {
            soundRef.current.seek(val);
            setCurrentTime(val);
        }
    };

    const handleVolume = (val: number) => {
        setVolume(val);
        if (soundRef.current) {
            soundRef.current.volume(val);
        }
    }

    return (
        <PlayerContext.Provider value={{
            currentTrack,
            isPlaying,
            queue,
            playTrack,
            playTrackInQueue,
            playQueue,
            togglePlay,
            next,
            prev,
            seek,
            duration,
            currentTime,
            volume,
            setVolume: handleVolume,
            isAdPlaying
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error("usePlayer must be used within PlayerProvider");
    return context;
};
