"use client";

import { X, Radio } from "lucide-react";
import { useEffect, useState } from "react";

interface Broadcast {
    id: string;
    message: string;
    createdAt: number;
}

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchBroadcasts();
        }
    }, [isOpen]);

    const fetchBroadcasts = async () => {
        try {
            const res = await fetch("/api/broadcasts");
            const data = await res.json();
            if (data.broadcasts) {
                setBroadcasts(data.broadcasts);
            }
        } catch (error) {
            console.error("Failed to fetch broadcasts", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#1a1814] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-1/20 rounded-full text-accent-1 animate-pulse">
                            <Radio size={20} />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-white">Live Broadcasts</h2>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-white/40">Loading updates...</div>
                    ) : broadcasts.length === 0 ? (
                        <div className="text-center py-8 text-white/40">
                            <p>No active broadcasts right now.</p>
                            <p className="text-xs mt-2">Tune in later for updates!</p>
                        </div>
                    ) : (
                        broadcasts.map((broadcast) => (
                            <div key={broadcast.id} className="bg-white/5 border border-white/5 rounded-xl p-4 relative overflow-hidden group hover:border-accent-1/30 transition-colors">
                                <div className="absolute top-0 left-0 w-1 h-full bg-accent-1" />
                                <p className="text-white/90 leading-relaxed">{broadcast.message}</p>
                                <span className="text-xs text-white/30 mt-3 block font-mono">
                                    {new Date(broadcast.createdAt).toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
