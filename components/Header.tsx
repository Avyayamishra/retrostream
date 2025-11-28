"use client";

import { Search, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { BroadcastModal } from "./BroadcastModal";

export function Header() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [hasNewBroadcast, setHasNewBroadcast] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check for new broadcasts periodically
        const checkBroadcasts = async () => {
            try {
                const res = await fetch("/api/broadcasts");
                const data = await res.json();
                if (data.broadcasts && data.broadcasts.length > 0) {
                    setHasNewBroadcast(true);
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkBroadcasts();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 h-20 z-50 px-8 flex items-center justify-between glass">
                {/* Logo */}
                <div className="flex items-center">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <h1 className="font-serif text-2xl font-bold text-accent-1 tracking-wide">
                            RetroStream
                        </h1>
                    </Link>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8 relative">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search for music..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-accent-1/50 transition-all"
                        />
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-1 transition-colors"
                        />
                    </div>
                </form>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setIsBroadcastOpen(true);
                            setHasNewBroadcast(false);
                        }}
                        className="relative p-2.5 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                        aria-label="Broadcasts"
                    >
                        <Bell size={20} />
                        {hasNewBroadcast && (
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent-1 rounded-full border-2 border-[#0f0f13]" />
                        )}
                    </button>
                </div>
            </header>

            <BroadcastModal isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />
        </>
    );
}
