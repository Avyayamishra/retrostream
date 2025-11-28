"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, startAt, endAt } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Track } from "@/lib/types";
import { TrackListItem } from "@/components/TrackComponents";
import { Search as SearchIcon } from "lucide-react";

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function SearchPage() {
    const [term, setTerm] = useState("");
    const debouncedTerm = useDebounce(term, 500);
    const [results, setResults] = useState<Track[]>([]);

    useEffect(() => {
        if (!debouncedTerm) {
            setResults([]);
            return;
        }

        const search = async () => {
            // Firestore doesn't support full text search natively without extensions (Algolia/Typesense).
            // We'll use a simple prefix match on title for this demo.
            // Requires index on 'title'.
            const q = query(
                collection(db, "tracks"),
                orderBy("title"),
                startAt(debouncedTerm),
                endAt(debouncedTerm + '\uf8ff')
            );

            const snap = await getDocs(q);
            setResults(snap.docs.map(d => d.data() as Track));
        };
        search();
    }, [debouncedTerm]);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                    type="text"
                    placeholder="Search for songs, artists..."
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg rounded-full bg-panel border-2 border-accent-2/10 focus:border-accent-1 outline-none shadow-inner"
                />
            </div>

            <div className="space-y-2">
                {results.map((track, i) => (
                    <TrackListItem key={track.id} track={track} index={i} />
                ))}
                {debouncedTerm && results.length === 0 && (
                    <p className="text-center text-muted py-10">No results found for &quot;{debouncedTerm}&quot;</p>
                )}
            </div>
        </div>
    );
}
