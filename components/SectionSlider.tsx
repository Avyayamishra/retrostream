"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Track } from "@/lib/types";
import { TrackCard } from "./TrackComponents";

interface SectionSliderProps {
    tracks: Track[];
    globalQueue: Track[];
}

export function SectionSlider({ tracks, globalQueue }: SectionSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeft(scrollLeft > 0);
            setShowRight(scrollLeft < scrollWidth - clientWidth - 10); // Tolerance
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [tracks]);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
            setTimeout(checkScroll, 300);
        }
    };

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 2; // Scroll-fast
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollLeft - walk;
            checkScroll();
        }
    };

    return (
        <div className="relative group/slider">
            {showLeft && (
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-accent-1 transition-colors backdrop-blur-sm -ml-4 opacity-0 group-hover/slider:opacity-100"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing snap-x select-none"
                onScroll={checkScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
            >
                {tracks.map(track => (
                    <div
                        key={track.id}
                        className="min-w-[200px] w-[200px] snap-start"
                        onDragStart={(e) => e.preventDefault()}
                    >
                        <TrackCard track={track} queue={globalQueue} />
                    </div>
                ))}
            </div>

            {showRight && (
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-accent-1 transition-colors backdrop-blur-sm -mr-4 opacity-0 group-hover/slider:opacity-100"
                >
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    );
}
