"use client";

import { useState, useEffect } from "react";
import { Lock, Upload, Music, Image as ImageIcon, Trash2, BarChart3, Megaphone } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";
import { Ad, Track, Section } from "@/lib/types";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Layout } from "lucide-react";

export default function AdminPage() {
    const [unlocked, setUnlocked] = useState(false);
    const [pass, setPass] = useState("");
    const [activeTab, setActiveTab] = useState("upload");
    const { user } = useAuth();

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [cover, setCover] = useState<File | null>(null);
    const [meta, setMeta] = useState({
        title: "", artist: "", genre: "",
        genre1: "", genre2: "", genre3: "",
        relevancy1: "", relevancy2: "", relevancy3: ""
    });
    const [uploading, setUploading] = useState(false);
    const [tracks, setTracks] = useState<Track[]>([]);

    // Ad State
    const [ads, setAds] = useState<Ad[]>([]);
    const [adMeta, setAdMeta] = useState<{ title: string, weight: number, ctaUrl: string, duration: number, type: 'audio_banner' | 'banner_only' }>({
        title: "", weight: 5, ctaUrl: "", duration: 15, type: 'audio_banner'
    });
    const [adFile, setAdFile] = useState<File | null>(null);
    const [adCover, setAdCover] = useState<File | null>(null);

    // Section State
    const [sections, setSections] = useState<Section[]>([]);
    const [sectionForm, setSectionForm] = useState<{ id?: string, title: string, order: number, trackIds: string[] }>({
        title: "", order: 0, trackIds: []
    });
    const [isEditingSection, setIsEditingSection] = useState(false);
    const [trackSearchQuery, setTrackSearchQuery] = useState("");

    // Relevancy Search State
    const [relevancySearchQuery, setRelevancySearchQuery] = useState("");
    const [activeRelevancyField, setActiveRelevancyField] = useState<'relevancy1' | 'relevancy2' | 'relevancy3' | null>(null);

    useEffect(() => {
        // Check if already unlocked via cookie (simple check)
        fetch("/api/admin/verify").then(res => {
            if (res.ok) setUnlocked(true);
        });
    }, []);

    useEffect(() => {
        if (unlocked) {
            if (activeTab === 'ads') fetchAds();
            if (activeTab === 'upload') fetchTracks();
            if (activeTab === 'sections') { fetchSections(); fetchTracks(); }
        }
    }, [unlocked, activeTab]);

    const fetchSections = async () => {
        const res = await fetch("/api/sections");
        if (res.ok) {
            const data = await res.json();
            setSections(data.sections || []);
        }
    };

    const fetchTracks = async () => {
        const q = query(collection(db, "tracks"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setTracks(snap.docs.map(d => d.data() as Track));
    };

    const fetchAds = async () => {
        const res = await fetch("/api/admin/ads");
        if (res.ok) {
            const data = await res.json();
            setAds(data.ads || []);
        }
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/admin/unlock", {
            method: "POST",
            body: JSON.stringify({ pass }),
        });
        if (res.ok) {
            setUnlocked(true);
        } else {
            alert("Invalid password");
        }
    };

    const deleteTrack = async (id: string) => {
        if (!confirm("Delete this track?")) return;
        const res = await fetch(`/api/admin/tracks?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchTracks();
        } else {
            alert("Failed to delete track");
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData(e.target as HTMLFormElement);
        const audioUrlInput = formData.get('audioUrl') as string;
        const coverUrlInput = formData.get('coverUrl') as string;

        if ((!file && !audioUrlInput) || (!cover && !coverUrlInput)) {
            alert("Please provide Audio and Cover (either File or URL)");
            return;
        }

        setUploading(true);

        try {
            let finalAudioPath = "";
            let finalCoverPath = "";

            // Handle Audio File Upload (Local)
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", "song");

                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("Failed to upload audio file");
                const data = await uploadRes.json();
                finalAudioPath = data.url;
            } else {
                finalAudioPath = audioUrlInput;
            }

            // Handle Cover (Local)
            if (cover) {
                const formData = new FormData();
                formData.append("file", cover);
                formData.append("type", "cover");

                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("Failed to upload cover file");
                const data = await uploadRes.json();
                finalCoverPath = data.url;
            } else {
                finalCoverPath = coverUrlInput;
            }

            // Create Doc via Server API (Bypasses Firestore Rules)
            const res = await fetch("/api/admin/tracks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...meta,
                    duration: 0,
                    storagePath: finalAudioPath,
                    coverPath: finalCoverPath,
                    uploadedBy: user?.uid || "admin",
                })
            });

            if (!res.ok) throw new Error("Failed to save metadata");

            alert("Uploaded Successfully!");
            setFile(null);
            setCover(null);
            setMeta({
                title: "", artist: "", genre: "",
                genre1: "", genre2: "", genre3: "",
                relevancy1: "", relevancy2: "", relevancy3: ""
            });
            (e.target as HTMLFormElement).reset();
            fetchTracks();
        } catch (e: any) {
            console.error(e);
            alert("Error uploading: " + e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAdUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.target as HTMLFormElement);

        // Append meta manually if not in form (though they are inputs, so they should be)
        // Actually, we need to ensure the inputs have 'name' attributes matching what the API expects
        // The API expects: title, weight, duration, type, ctaUrl, audioFile, coverFile, audioUrl, coverUrl

        // We need to make sure our state 'adMeta' is reflected in the form data or appended manually.
        // Since we are using controlled inputs for meta, we should append them.
        formData.append('title', adMeta.title);
        formData.append('weight', adMeta.weight.toString());
        formData.append('duration', adMeta.duration.toString());
        formData.append('type', adMeta.type);
        formData.append('ctaUrl', adMeta.ctaUrl);

        // Handle Ad Audio (Local)
        if (adFile) {
            const fData = new FormData();
            fData.append("file", adFile);
            fData.append("type", "song"); // Reuse 'song' folder for audio
            const res = await fetch("/api/upload", { method: "POST", body: fData });
            if (res.ok) {
                const data = await res.json();
                formData.append("storagePath", data.url);
            }
        } else {
            // If URL provided manually
            const url = (e.target as HTMLFormElement)['audioUrl'].value;
            if (url) formData.append("storagePath", url);
        }

        // Handle Ad Cover (Local)
        if (adCover) {
            const fData = new FormData();
            fData.append("file", adCover);
            fData.append("type", "cover");
            const res = await fetch("/api/upload", { method: "POST", body: fData });
            if (res.ok) {
                const data = await res.json();
                formData.append("coverPath", data.url);
            }
        } else {
            const url = (e.target as HTMLFormElement)['coverUrl'].value;
            if (url) formData.append("coverPath", url);
        }

        try {
            const res = await fetch("/api/admin/ads", {
                method: "POST",
                body: formData, // Send FormData directly
            });

            if (!res.ok) throw new Error("Failed to create ad");

            alert("Ad Created!");
            fetchAds();
            setAdMeta({ title: "", weight: 5, ctaUrl: "", duration: 15, type: 'audio_banner' });
            setAdFile(null);
            setAdCover(null);
            (e.target as HTMLFormElement).reset();
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setUploading(false);
        }
    };

    const deleteAd = async (id: string) => {
        if (!confirm("Delete this ad?")) return;
        await fetch(`/api/admin/ads?id=${id}`, { method: "DELETE" });
        fetchAds();
    };

    // Analytics State
    const [analytics, setAnalytics] = useState<{ totalPlays: number, totalLikes: number, topTracks: Track[] } | null>(null);

    useEffect(() => {
        if (activeTab === 'analytics' && unlocked) {
            fetchAnalytics();
        }
    }, [activeTab, unlocked]);

    const fetchAnalytics = async () => {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
            const data = await res.json();
            setAnalytics(data);
        }
    };

    const handleSectionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = isEditingSection ? "PUT" : "POST";
        const body = JSON.stringify(sectionForm);

        try {
            const res = await fetch("/api/sections", {
                method,
                body,
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                alert(isEditingSection ? "Section Updated" : "Section Created");
                setSectionForm({ title: "", order: 0, trackIds: [] });
                setIsEditingSection(false);
                fetchSections();
            } else {
                alert("Failed to save section");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteSection = async (id: string) => {
        if (!confirm("Delete this section?")) return;
        await fetch(`/api/sections?id=${id}`, { method: "DELETE" });
        fetchSections();
    };

    const toggleTrackInSection = (trackId: string) => {
        setSectionForm(prev => {
            const exists = prev.trackIds.includes(trackId);
            if (exists) {
                return { ...prev, trackIds: prev.trackIds.filter(id => id !== trackId) };
            } else {
                return { ...prev, trackIds: [...prev.trackIds, trackId] };
            }
        });
    };

    if (!unlocked) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <form onSubmit={handleUnlock} className="bg-panel p-8 rounded-xl retro-shadow w-96 space-y-4 border border-accent-2/10">
                    <div className="flex justify-center mb-4 text-accent-1">
                        <Lock size={48} />
                    </div>
                    <h2 className="text-2xl font-serif text-center text-accent-2 font-bold">Manager Access</h2>
                    <input
                        type="password"
                        value={pass}
                        onChange={e => setPass(e.target.value)}
                        placeholder="Enter Passcode"
                        className="w-full p-3 rounded bg-bg border border-accent-2/20 focus:border-accent-1 outline-none font-mono"
                    />
                    <button type="submit" className="w-full py-3 bg-accent-1 text-white rounded font-bold hover:bg-accent-1/90">
                        Unlock
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-serif font-bold text-accent-2 mb-8">Studio Manager</h1>

            <div className="flex gap-6 mb-8 border-b border-accent-2/10 pb-1">
                {['upload', 'ads', 'sections', 'broadcasts', 'analytics'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-2 font-sans font-medium capitalize ${activeTab === tab ? 'text-accent-1 border-b-2 border-accent-1' : 'text-muted'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'upload' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10 h-fit">
                        <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                            <Upload size={24} /> Upload New Track
                        </h3>

                        <div className="flex gap-4 mb-6">
                            <button
                                type="button"
                                onClick={() => { setFile(null); setCover(null); }}
                                className={`text-sm font-bold px-3 py-1 rounded ${file !== undefined ? 'bg-accent-2 text-white' : 'bg-accent-2/10 text-muted'}`}
                            >
                                Reset Forms
                            </button>
                            <p className="text-xs text-muted italic flex items-center">
                                (Use either File Upload OR Paste URL below)
                            </p>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-6 max-w-xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-mono text-muted mb-2">Track Title</label>
                                    <input
                                        value={meta.title} onChange={e => setMeta({ ...meta, title: e.target.value })}
                                        className="w-full p-2 rounded bg-bg border border-accent-2/20" required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-mono text-muted mb-2">Artist</label>
                                    <input
                                        value={meta.artist} onChange={e => setMeta({ ...meta, artist: e.target.value })}
                                        className="w-full p-2 rounded bg-bg border border-accent-2/20" required
                                    />
                                </div>

                                {/* Genres */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-mono text-muted mb-2">Genre 1</label>
                                        <input
                                            value={meta.genre1} onChange={e => setMeta({ ...meta, genre1: e.target.value })}
                                            className="w-full p-2 rounded bg-bg border border-accent-2/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-mono text-muted mb-2">Genre 2</label>
                                        <input
                                            value={meta.genre2} onChange={e => setMeta({ ...meta, genre2: e.target.value })}
                                            className="w-full p-2 rounded bg-bg border border-accent-2/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-mono text-muted mb-2">Genre 3</label>
                                        <input
                                            value={meta.genre3} onChange={e => setMeta({ ...meta, genre3: e.target.value })}
                                            className="w-full p-2 rounded bg-bg border border-accent-2/20"
                                        />
                                    </div>
                                </div>

                                {/* Relevancy */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-mono text-muted">Relevancy (Link to other tracks)</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['relevancy1', 'relevancy2', 'relevancy3'].map((field, i) => (
                                            <div key={field} className="relative flex gap-2">
                                                <input
                                                    placeholder={`Relevancy ${i + 1} (Track ID)`}
                                                    value={(meta as any)[field]}
                                                    onChange={e => setMeta({ ...meta, [field]: e.target.value })}
                                                    className="flex-1 p-2 rounded bg-bg border border-accent-2/20 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => { setActiveRelevancyField(field as any); setRelevancySearchQuery(""); }}
                                                    className="px-3 py-1 bg-accent-2/10 text-accent-2 rounded text-xs font-bold hover:bg-accent-2/20"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Relevancy Search Modal/Dropdown */}
                                    {activeRelevancyField && (
                                        <div className="mt-2 p-4 bg-bg rounded border border-accent-2/20 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-accent-1">Select Track for {activeRelevancyField}</span>
                                                <button type="button" onClick={() => setActiveRelevancyField(null)} className="text-xs text-muted hover:text-white">Close</button>
                                            </div>
                                            <input
                                                autoFocus
                                                placeholder="Search by title or artist..."
                                                value={relevancySearchQuery}
                                                onChange={e => setRelevancySearchQuery(e.target.value)}
                                                className="w-full p-2 mb-2 rounded bg-black/20 border border-accent-2/10 text-sm"
                                            />
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {tracks
                                                    .filter(t => t.title.toLowerCase().includes(relevancySearchQuery.toLowerCase()) || t.artist.toLowerCase().includes(relevancySearchQuery.toLowerCase()))
                                                    .slice(0, 10)
                                                    .map(track => (
                                                        <div
                                                            key={track.id}
                                                            onClick={() => {
                                                                setMeta({ ...meta, [activeRelevancyField]: track.id });
                                                                setActiveRelevancyField(null);
                                                            }}
                                                            className="p-2 rounded hover:bg-accent-2/10 cursor-pointer flex justify-between items-center"
                                                        >
                                                            <span className="text-xs truncate">{track.title} - {track.artist}</span>
                                                            <span className="text-[10px] font-mono text-muted">ID: {track.id.slice(0, 4)}...</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Audio Input */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-mono text-muted">Audio Source</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="border-2 border-dashed border-accent-2/20 rounded-lg p-4 text-center hover:bg-bg/50 transition-colors">
                                            <input type="file" accept="audio/*" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="audio-upload" />
                                            <label htmlFor="audio-upload" className="cursor-pointer flex items-center justify-center gap-2">
                                                <Music className="text-accent-2" size={20} />
                                                <span className="text-muted text-sm">{file ? file.name : "Select MP3 File"}</span>
                                            </label>
                                        </div>
                                        <div className="text-center text-xs text-muted">- OR -</div>
                                        <input
                                            placeholder="Paste URL (e.g. https://...) OR Local Path (e.g. /songs/track.mp3)"
                                            className="w-full p-2 rounded bg-bg border border-accent-2/20 text-sm"
                                            name="audioUrl"
                                        />
                                    </div>
                                </div>

                                {/* Cover Input */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-mono text-muted">Cover Art</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="border-2 border-dashed border-accent-2/20 rounded-lg p-4 text-center hover:bg-bg/50 transition-colors">
                                            <input type="file" accept="image/*" onChange={e => setCover(e.target.files?.[0] || null)} className="hidden" id="cover-upload" />
                                            <label htmlFor="cover-upload" className="cursor-pointer flex items-center justify-center gap-2">
                                                <ImageIcon className="text-accent-2" size={20} />
                                                <span className="text-muted text-sm">{cover ? cover.name : "Select Cover Image"}</span>
                                            </label>
                                        </div>
                                        <div className="text-center text-xs text-muted">- OR -</div>
                                        <input
                                            placeholder="Paste URL (e.g. https://...) OR Local Path (e.g. /covers/art.jpg)"
                                            className="w-full p-2 rounded bg-bg border border-accent-2/20 text-sm"
                                            name="coverUrl"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button disabled={uploading} className="w-full py-3 bg-accent-1 text-white rounded font-bold hover:bg-accent-1/90 disabled:opacity-50">
                                {uploading ? "Publishing..." : "Publish Release"}
                            </button>
                        </form>
                    </div>

                    {/* Track List */}
                    <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10 h-fit max-h-[800px] overflow-y-auto">
                        <h3 className="text-xl font-serif font-bold mb-6">Manage Library</h3>
                        <div className="space-y-3">
                            {tracks.map(track => (
                                <div key={track.id} className="flex items-center gap-3 p-3 bg-bg rounded border border-accent-2/10 hover:border-accent-1/30 transition-colors">
                                    <div className="w-10 h-10 relative rounded overflow-hidden bg-accent-2/10 flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {track.coverPath && <img src={track.coverPath} alt="" className="object-cover w-full h-full" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-accent-2 truncate">{track.title}</div>
                                        <div className="text-xs text-muted truncate">{track.artist}</div>
                                    </div>
                                    <button
                                        onClick={() => deleteTrack(track.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded transition-colors"
                                        title="Delete Track"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {tracks.length === 0 && <p className="text-muted italic text-center py-8">No tracks found.</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ads' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ad Form */}
                    <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10">
                        <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                            <Megaphone size={24} /> Create Advertisement
                        </h3>
                        <form onSubmit={handleAdUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-mono text-muted mb-1">Ad Title</label>
                                <input
                                    value={adMeta.title} onChange={e => setAdMeta({ ...adMeta, title: e.target.value })}
                                    className="w-full p-2 rounded bg-bg border border-accent-2/20" required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-mono text-muted mb-1">Ad Type</label>
                                <select
                                    value={adMeta.type}
                                    onChange={e => setAdMeta({ ...adMeta, type: e.target.value as 'audio_banner' | 'banner_only' })}
                                    className="w-full p-2 rounded bg-bg border border-accent-2/20"
                                >
                                    <option value="audio_banner">Audio + Banner</option>
                                    <option value="banner_only">Banner Only</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-mono text-muted mb-1">Weight (1-10)</label>
                                    <input
                                        type="number" min="1" max="10"
                                        value={adMeta.weight} onChange={e => setAdMeta({ ...adMeta, weight: parseInt(e.target.value) })}
                                        className="w-full p-2 rounded bg-bg border border-accent-2/20" required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-mono text-muted mb-1">Duration (sec)</label>
                                    <input
                                        type="number"
                                        value={adMeta.duration} onChange={e => setAdMeta({ ...adMeta, duration: parseInt(e.target.value) })}
                                        className="w-full p-2 rounded bg-bg border border-accent-2/20" required
                                    />
                                </div>
                            </div>

                            {adMeta.type === 'audio_banner' && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-mono text-muted mb-1">Audio Source</label>
                                    <div className="border-2 border-dashed border-accent-2/20 rounded-lg p-3 text-center hover:bg-bg/50 transition-colors">
                                        <input type="file" accept="audio/*" onChange={e => setAdFile(e.target.files?.[0] || null)} className="hidden" id="ad-audio-upload" name="audioFile" />
                                        <label htmlFor="ad-audio-upload" className="cursor-pointer flex items-center justify-center gap-2">
                                            <Music className="text-accent-2" size={16} />
                                            <span className="text-muted text-xs">{adFile ? adFile.name : "Select MP3 File"}</span>
                                        </label>
                                    </div>
                                    <input name="audioUrl" placeholder="OR Paste URL" className="w-full p-2 rounded bg-bg border border-accent-2/20 text-sm" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-mono text-muted mb-1">Cover/Banner Source</label>
                                <div className="border-2 border-dashed border-accent-2/20 rounded-lg p-3 text-center hover:bg-bg/50 transition-colors">
                                    <input type="file" accept="image/*" onChange={e => setAdCover(e.target.files?.[0] || null)} className="hidden" id="ad-cover-upload" name="coverFile" />
                                    <label htmlFor="ad-cover-upload" className="cursor-pointer flex items-center justify-center gap-2">
                                        <ImageIcon className="text-accent-2" size={16} />
                                        <span className="text-muted text-xs">{adCover ? adCover.name : "Select Image File"}</span>
                                    </label>
                                </div>
                                <input name="coverUrl" placeholder="OR Paste URL" className="w-full p-2 rounded bg-bg border border-accent-2/20 text-sm" />
                            </div>

                            <button disabled={uploading} className="w-full py-3 bg-accent-1 text-white rounded font-bold hover:bg-accent-1/90 disabled:opacity-50">
                                {uploading ? "Creating Ad..." : "Create Ad"}
                            </button>
                        </form>
                    </div>

                    {/* Ad List */}
                    <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10">
                        <h3 className="text-xl font-serif font-bold mb-6">Active Campaigns</h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {ads.length === 0 && <p className="text-muted italic">No active ads.</p>}
                            {ads.map(ad => (
                                <div key={ad.id} className="flex items-center justify-between p-4 bg-bg rounded border border-accent-2/10">
                                    <div>
                                        <div className="font-bold text-accent-2">{ad.title}</div>
                                        <div className="text-xs text-muted">Weight: {ad.weight} | {ad.duration}s</div>
                                    </div>
                                    <button onClick={() => deleteAd(ad.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sections' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Section Form */}
                    <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10 h-fit">
                        <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                            <Layout size={24} /> {isEditingSection ? "Edit Section" : "Create Section"}
                        </h3>
                        <form onSubmit={handleSectionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-mono text-muted mb-1">Section Title</label>
                                <input
                                    value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
                                    className="w-full p-2 rounded bg-bg border border-accent-2/20" required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-mono text-muted mb-1">Order Index</label>
                                <input
                                    type="number"
                                    value={sectionForm.order} onChange={e => setSectionForm({ ...sectionForm, order: parseInt(e.target.value) })}
                                    className="w-full p-2 rounded bg-bg border border-accent-2/20" required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-mono text-muted mb-2">Select Tracks</label>
                                <input
                                    type="text"
                                    placeholder="Search tracks..."
                                    value={trackSearchQuery}
                                    onChange={e => setTrackSearchQuery(e.target.value)}
                                    className="w-full p-2 mb-2 rounded bg-bg border border-accent-2/20 text-sm"
                                />
                                <div className="max-h-60 overflow-y-auto border border-accent-2/20 rounded p-2 space-y-1">
                                    {tracks.filter(t => t.title.toLowerCase().includes(trackSearchQuery.toLowerCase()) || t.artist.toLowerCase().includes(trackSearchQuery.toLowerCase())).map(track => (
                                        <div key={track.id}
                                            onClick={() => toggleTrackInSection(track.id)}
                                            className={`p-2 rounded cursor-pointer flex items-center gap-2 ${sectionForm.trackIds.includes(track.id) ? 'bg-accent-1 text-white' : 'hover:bg-accent-2/10'}`}
                                        >
                                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${sectionForm.trackIds.includes(track.id) ? 'border-white bg-white text-accent-1' : 'border-muted'}`}>
                                                {sectionForm.trackIds.includes(track.id) && <div className="w-2 h-2 bg-current rounded-full" />}
                                            </div>
                                            <span className="text-sm truncate">{track.title} - {track.artist}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-3 bg-accent-1 text-white rounded font-bold hover:bg-accent-1/90">
                                    {isEditingSection ? "Update Section" : "Create Section"}
                                </button>
                                {isEditingSection && (
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditingSection(false); setSectionForm({ title: "", order: 0, trackIds: [] }); }}
                                        className="px-4 py-3 bg-red-500/10 text-red-400 rounded font-bold hover:bg-red-500/20"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Section List */}
                    <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10">
                        <h3 className="text-xl font-serif font-bold mb-6">Manage Sections</h3>
                        <div className="space-y-4">
                            {sections.map(section => (
                                <div key={section.id} className="p-4 bg-bg rounded border border-accent-2/10 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-accent-2">{section.title}</div>
                                        <div className="text-xs text-muted">Order: {section.order} | Tracks: {section.trackIds.length}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setIsEditingSection(true); setSectionForm(section); }}
                                            className="text-accent-1 hover:text-white text-sm font-bold"
                                        >
                                            Edit
                                        </button>
                                        <button onClick={() => deleteSection(section.id)} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {sections.length === 0 && <p className="text-muted italic">No sections found.</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'broadcasts' && (
                <BroadcastManager />
            )}

            {activeTab === 'analytics' && (
                <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10">
                    <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                        <BarChart3 size={24} /> Analytics Dashboard
                    </h3>

                    {analytics ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-bg p-6 rounded-lg border border-accent-2/10 text-center">
                                    <h4 className="text-muted font-mono text-sm uppercase tracking-widest mb-2">Total Plays</h4>
                                    <p className="text-4xl font-serif font-bold text-white">{analytics.totalPlays}</p>
                                </div>
                                <div className="bg-bg p-6 rounded-lg border border-accent-2/10 text-center">
                                    <h4 className="text-muted font-mono text-sm uppercase tracking-widest mb-2">Total Likes</h4>
                                    <p className="text-4xl font-serif font-bold text-accent-1">{analytics.totalLikes}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-serif font-bold text-accent-2 mb-4">Top Performing Tracks</h4>
                                <div className="space-y-2">
                                    {analytics.topTracks.map((track, i) => (
                                        <div key={track.id} className="flex items-center justify-between p-3 bg-bg rounded border border-accent-2/5">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-muted w-6 text-center">{i + 1}</span>
                                                <div>
                                                    <div className="font-bold text-white">{track.title}</div>
                                                    <div className="text-xs text-muted">{track.artist}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-mono text-accent-1">
                                                {track.plays || 0} plays
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted py-12">Loading analytics...</p>
                    )}
                </div>
            )}
        </div>
    );
}

function BroadcastManager() {
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        const res = await fetch("/api/broadcasts");
        const data = await res.json();
        if (data.broadcasts) setBroadcasts(data.broadcasts);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/broadcasts", {
                method: "POST",
                body: JSON.stringify({ message }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                setMessage("");
                fetchBroadcasts();
            } else {
                alert("Failed to create broadcast");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this broadcast?")) return;
        try {
            const res = await fetch("/api/broadcasts", {
                method: "DELETE",
                body: JSON.stringify({ id }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) fetchBroadcasts();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10">
                <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                    <Megaphone size={24} /> New Broadcast
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-mono text-muted mb-2">Message</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full p-3 rounded bg-bg border border-accent-2/20 h-32 resize-none"
                            placeholder="Type your announcement here..."
                            required
                        />
                    </div>
                    <button disabled={loading} className="w-full py-3 bg-accent-1 text-white rounded font-bold hover:bg-accent-1/90 disabled:opacity-50">
                        {loading ? "Broadcasting..." : "Send Broadcast"}
                    </button>
                </form>
            </div>

            <div className="bg-panel p-8 rounded-xl retro-shadow border border-accent-2/10">
                <h3 className="text-xl font-serif font-bold mb-6">Active Broadcasts</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {broadcasts.length === 0 && <p className="text-muted italic">No active broadcasts.</p>}
                    {broadcasts.map(b => (
                        <div key={b.id} className="p-4 bg-bg rounded border border-accent-2/10 relative group">
                            <p className="text-accent-2 mb-2">{b.message}</p>
                            <div className="flex items-center justify-between text-xs text-muted">
                                <span>{new Date(b.createdAt).toLocaleString()}</span>
                                <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
