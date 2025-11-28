import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // 'audio_banner' | 'banner_only'

        let query = adminDb.collection("ads").where("active", "==", true);

        if (type) {
            query = query.where("type", "==", type);
        }

        const snapshot = await query.get();
        const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ ads });
    } catch (e) {
        console.error("Ad fetch error:", e);
        return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
    }
}
