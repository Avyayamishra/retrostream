import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase() || "";

    if (!query) return NextResponse.json({ tracks: [] });

    try {
        const snapshot = await adminDb.collection("tracks").get();
        const tracks = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((track: any) =>
                track.title?.toLowerCase().includes(query) ||
                track.artist?.toLowerCase().includes(query)
            );

        return NextResponse.json({ tracks });
    } catch (e) {
        console.error("Search error:", e);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
