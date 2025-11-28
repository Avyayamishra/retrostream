import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const { trackId, action } = await req.json(); // action: 'like' | 'unlike'

        if (!trackId) return NextResponse.json({ error: "Missing trackId" }, { status: 400 });

        const trackRef = adminDb.collection("tracks").doc(trackId);

        if (action === 'like') {
            await trackRef.update({ likes: FieldValue.increment(1) });
        } else {
            // Prevent negative likes
            // We can't easily check current value atomically without a transaction, 
            // but for now we'll just decrement.
            await trackRef.update({ likes: FieldValue.increment(-1) });
        }
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("Like error:", e);
        return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
    }
}
