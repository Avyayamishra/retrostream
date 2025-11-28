"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, limit, orderBy, where, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Track, Ad, Section } from "@/lib/types";
import { TrackCard } from "@/components/TrackComponents";
import { SectionSlider } from "@/components/SectionSlider";

export default function HomePage() {
    const [sections, setSections] = useState<{ section: Section, tracks: Track[] }[]>([]);
    const [ads, setAds] = useState<Ad[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Sections
                const sectionsRes = await fetch('/api/sections');
                const sectionsData = await sectionsRes.json();
                const sectionsList: Section[] = sectionsData.sections || [];

                // Fetch all tracks needed
                // Optimization: Fetch all tracks once if library is small, or batch fetch.
                // For now, let's fetch all tracks to map them easily.
                const tracksQ = query(collection(db, "tracks"));
                const tracksSnap = await getDocs(tracksQ);
                const allTracks = tracksSnap.docs.map(d => d.data() as Track);
                const trackMap = new Map(allTracks.map(t => [t.id, t]));

                // Map sections to their tracks
                const populatedSections = sectionsList.map(section => ({
                    section,
                    tracks: section.trackIds.map(id => trackMap.get(id)).filter(Boolean) as Track[]
                }));

                setSections(populatedSections);

                // Fetch Banner Ads
                const res = await fetch('/api/ads?type=banner_only');
                const data = await res.json();
                setAds(data.ads || []);
            } catch (e) {
                console.error("Failed to fetch data", e);
            }
        };
        fetchData();
    }, []);

    // Construct Global Queue for Auto-Play across sections
    const globalQueue = sections.flatMap(s => s.tracks);

    return (
        <div className="flex gap-8 justify-center">
            {/* Left Ad Sidebar */}
            <aside className="hidden 2xl:block w-72 space-y-6 sticky top-24 h-fit">
                {ads.slice(0, 2).map(ad => (
                    <div key={ad.id} className="w-full relative rounded-xl overflow-hidden retro-shadow border border-accent-2/10 group">
                        <div className="aspect-[300/400] relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ad.coverPath} alt={ad.title} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                            <p className="text-white font-bold truncate">{ad.title}</p>
                            <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Ad</span>
                        </div>
                    </div>
                ))}
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-6xl space-y-12 min-w-0">
                {sections.map(({ section, tracks }) => (
                    <section key={section.id}>
                        <h2 className="text-3xl font-serif font-bold text-accent-2 mb-6 flex items-center gap-3">
                            <span className="w-8 h-1 bg-accent-1 block rounded-full"></span>
                            {section.title}
                        </h2>
                        <SectionSlider tracks={tracks} globalQueue={globalQueue} />
                    </section>
                ))}

                {sections.length === 0 && (
                    <div className="text-center py-20 text-muted">
                        <p>No sections found. Please configure them in the Admin Panel.</p>
                    </div>
                )}
            </div>

            {/* Right Ad Sidebar */}
            <aside className="hidden 2xl:block w-72 space-y-6 sticky top-24 h-fit">
                {ads.slice(2, 4).map(ad => (
                    <div key={ad.id} className="w-full relative rounded-xl overflow-hidden retro-shadow border border-accent-2/10 group">
                        <div className="aspect-[300/400] relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ad.coverPath} alt={ad.title} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                            <p className="text-white font-bold truncate">{ad.title}</p>
                            <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Ad</span>
                        </div>
                    </div>
                ))}
            </aside>
        </div>
    );
}
