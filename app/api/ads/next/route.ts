import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const cookieStore = cookies();
    const unlocked = cookieStore.get("admin_unlocked");

    if (!unlocked) {
        return NextResponse.json({ ad: null }, { status: 200 });
    }

    // Simple weighted random selection
    try {
        const adsSnap = await adminDb.collection("ads").where("active", "==", true).get();
        if (adsSnap.empty) return NextResponse.json({ ad: null });

        const ads = adsSnap.docs.map(d => d.data());
        // In a real app, implement weighted random here.
        // For now, pick random.
        const randomAd = ads[Math.floor(Math.random() * ads.length)];

        return NextResponse.json({ ad: randomAd });
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch ad" }, { status: 500 });
    }
}
