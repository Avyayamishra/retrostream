"use client";

import { Play, Heart, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { Track } from "@/lib/types";
import { usePlayer } from "@/context/PlayerProvider";

export function TrackCard({ track, queue = [] }: { track: Track, queue?: Track[] }) {
    const { playTrack, playTrackInQueue } = usePlayer();

    return (
        <div className="group relative bg-panel p-4 rounded-xl retro-shadow hover:-translate-y-1 transition-all duration-300">
            <div className="relative aspect-square w-full mb-4 rounded-lg overflow-hidden shadow-inner">
                <Image
                    src={track.coverPath || "/vinyl-placeholder.png"}
                    alt={track.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                    onClick={() => queue.length > 0 ? playTrackInQueue(track, queue) : playTrack(track)}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-accent-1 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                >
                    <Play size={20} fill="currentColor" className="ml-1" />
                </button>
            </div>

            <h3 className="font-serif font-bold text-lg text-accent-2 truncate">{track.title}</h3>
            <p className="text-sm text-muted font-sans truncate">{track.artist}</p>
        </div>
    );
}

export function TrackListItem({ track, index }: { track: Track; index: number }) {
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const isCurrent = currentTrack?.id === track.id;

    return (
        <div
            className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/40 transition-colors cursor-pointer border border-transparent hover:border-accent-2/5"
            onClick={() => playTrack(track)}
        >
            <span className="w-6 text-center font-mono text-muted group-hover:hidden">{index + 1}</span>
            <button className="w-6 hidden group-hover:block text-accent-1">
                <Play size={16} fill="currentColor" />
            </button>

            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <Image src={track.coverPath} alt={track.title} fill className="object-cover" />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className={`font-serif font-bold truncate ${isCurrent ? 'text-accent-1' : 'text-accent-2'}`}>
                    {track.title}
                </h4>
                <p className="text-xs text-muted truncate">{track.artist}</p>
            </div>

            <div className="hidden md:block text-xs text-muted font-mono">
                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:text-accent-1 text-muted"><Heart size={16} /></button>
                <button className="p-2 hover:text-accent-1 text-muted"><MoreHorizontal size={16} /></button>
            </div>
        </div>
    );
}
