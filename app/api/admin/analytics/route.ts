import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";
import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = cookies();
    const unlocked = cookieStore.get("admin_unlocked");

    if (unlocked?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const snapshot = await adminDb.collection("tracks").get();
        let totalPlays = 0;
        let totalLikes = 0;
        const tracks: any[] = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            totalPlays += data.plays || 0;
            totalLikes += data.likes || 0;
            tracks.push({ id: doc.id, ...data });
        });

        // Sort by plays for top tracks
        const topTracks = tracks.sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5);

        return NextResponse.json({
            totalPlays,
            totalLikes,
            topTracks
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
