"use client";

import { usePlayer } from "@/context/PlayerProvider";
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Heart } from "lucide-react";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import clsx from "clsx";

export function BottomPlayer() {
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        next,
        prev,
        seek,
        duration,
        currentTime,
        volume,
        setVolume,
        isAdPlaying
    } = usePlayer();

    const progressRef = useRef<HTMLDivElement>(null);
    const [isLiked, setIsLiked] = useState(false);

    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        if (currentTrack) {
            const likedTracks = JSON.parse(localStorage.getItem("likedTracks") || "[]");
            setIsLiked(likedTracks.includes(currentTrack.id));
        }
    }, [currentTrack]);

    const handleLike = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!currentTrack) return;

        const newLikedState = !isLiked;
        setIsLiked(newLikedState);

        // Update Local Storage
        const likedTracks = JSON.parse(localStorage.getItem("likedTracks") || "[]");
        if (newLikedState) {
            localStorage.setItem("likedTracks", JSON.stringify([...likedTracks, currentTrack.id]));
        } else {
            localStorage.setItem("likedTracks", JSON.stringify(likedTracks.filter((id: string) => id !== currentTrack.id)));
        }

        // Update Server
        try {
            await fetch("/api/likes", {
                method: "POST",
                body: JSON.stringify({ trackId: currentTrack.id, action: newLikedState ? 'like' : 'unlike' }),
                headers: { "Content-Type": "application/json" }
            });
        } catch (e) {
            console.error("Failed to sync like", e);
        }
    };

    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (isAdPlaying || !progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    if (!currentTrack) return null;

    return (
        <>
            {/* Mobile Maximized Player Overlay */}
            {isMaximized && (
                <div className="fixed inset-0 z-[60] bg-bg flex flex-col p-6 md:hidden animate-in slide-in-from-bottom duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-8"></div> {/* Spacer */}
                        <h2 className="text-xl font-serif font-bold text-accent-2">Retro Stream</h2>
                        <button onClick={() => setIsMaximized(false)} className="text-white/60 hover:text-white">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </button>
                    </div>

                    {/* Big Cover */}
                    <div className="flex-1 flex items-center justify-center mb-8">
                        <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                            <Image
                                src={currentTrack.coverPath || "/vinyl-placeholder.png"}
                                alt="Cover"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Track Info & Like */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col">
                            <span className="text-2xl font-serif font-bold text-white truncate max-w-[250px]">
                                {currentTrack.title}
                            </span>
                            <span className="text-lg text-white/60 truncate max-w-[250px]">
                                {'artist' in currentTrack ? currentTrack.artist : 'Sponsored Ad'}
                            </span>
                        </div>
                        <button onClick={handleLike} className={clsx("transition-colors", isLiked ? "text-red-500" : "text-white/60")}>
                            <Heart size={32} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-8 mb-8">
                        <button onClick={prev} className="text-white hover:text-accent-1 disabled:opacity-30" disabled={isAdPlaying}>
                            <SkipBack size={32} fill="currentColor" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 rounded-full bg-accent-1 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        <button onClick={next} className="text-white hover:text-accent-1 disabled:opacity-30" disabled={isAdPlaying}>
                            <SkipForward size={32} fill="currentColor" />
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="w-full flex items-center gap-3 text-xs font-mono text-white/60 mb-4">
                        <span>{formatTime(currentTime)}</span>
                        <div
                            ref={progressRef}
                            onClick={handleSeek}
                            className={clsx("flex-1 h-1.5 relative cursor-pointer group", isAdPlaying && "cursor-not-allowed")}
                        >
                            <div className="absolute inset-0 bg-white/10 rounded-full" />
                            <div
                                className="absolute left-0 top-0 h-full bg-white rounded-full"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            />
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>

                    {/* Loop Button (Centered at bottom) */}
                    <div className="flex justify-center">
                        <button className="text-white/60 hover:text-white disabled:opacity-30 transition-colors" disabled={isAdPlaying}>
                            <Repeat size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Bar (Minimized / Desktop) */}
            <div
                onClick={() => window.innerWidth < 768 && setIsMaximized(true)}
                className="fixed bottom-0 left-0 right-0 h-20 md:h-24 glass z-50 px-4 md:px-8 flex items-center justify-between cursor-pointer md:cursor-default"
            >
                {/* Track Info */}
                <div className="flex items-center gap-3 md:gap-4 w-2/3 md:w-1/4">
                    <div className={clsx("relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0", isPlaying && "vinyl-spin")}>
                        <Image
                            src={currentTrack.coverPath || "/vinyl-placeholder.png"}
                            alt="Cover"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 m-auto w-3 h-3 md:w-4 md:h-4 bg-[#0f0f13] rounded-full border border-white/10 z-10" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-serif font-bold text-white truncate text-sm md:text-base">
                            {currentTrack.title}
                        </span>
                        <span className="text-xs font-sans text-white/60 truncate">
                            {'artist' in currentTrack ? currentTrack.artist : 'Sponsored Ad'}
                        </span>
                    </div>
                </div>

                {/* Mobile Controls (Right side) */}
                <div className="flex md:hidden items-center gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        className="w-8 h-8 rounded-full bg-accent-1 text-white flex items-center justify-center shadow-lg"
                    >
                        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); next(); }} className="text-white disabled:opacity-30" disabled={isAdPlaying}>
                        <SkipForward size={20} fill="currentColor" />
                    </button>
                </div>

                {/* Desktop Controls (Center) */}
                <div className="hidden md:flex flex-col items-center w-2/4 gap-2">
                    <div className="flex items-center gap-6">
                        {/* Shuffle Removed */}
                        <button onClick={prev} className="text-white hover:text-accent-1 disabled:opacity-30 transition-colors" disabled={isAdPlaying}>
                            <SkipBack size={24} fill="currentColor" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-accent-1 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform hover:shadow-accent-1/20"
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>
                        <button onClick={next} className="text-white hover:text-accent-1 disabled:opacity-30 transition-colors" disabled={isAdPlaying}>
                            <SkipForward size={24} fill="currentColor" />
                        </button>
                        <button className="text-white/60 hover:text-white disabled:opacity-30 transition-colors" disabled={isAdPlaying}>
                            <Repeat size={18} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full flex items-center gap-3 text-xs font-mono text-white/60">
                        <span>{formatTime(currentTime)}</span>
                        <div
                            ref={progressRef}
                            onClick={handleSeek}
                            className={clsx("flex-1 h-1.5 relative cursor-pointer group", isAdPlaying && "cursor-not-allowed")}
                        >
                            <div className="absolute inset-0 bg-white/10 rounded-full" />
                            <div
                                className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-100"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm scale-125" />
                            </div>
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Desktop Volume & Extra */}
                <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
                    {isAdPlaying && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded border border-yellow-500/30">
                            SPONSORED
                        </span>
                    )}

                    <button
                        onClick={handleLike}
                        className={clsx("transition-colors hover:scale-110 active:scale-95", isLiked ? "text-red-500" : "text-white/60 hover:text-white")}
                    >
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                    </button>

                    <Volume2 size={18} className="text-white/60" />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-24 accent-accent-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </>
    );
}
