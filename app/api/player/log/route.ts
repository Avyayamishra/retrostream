import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { trackId, startedAt, endedAt, secondsPlayed } = await req.json();

        // Log play history
        // We don't have user ID easily here without verifying token, 
        // but for this demo we'll skip strict auth check on log or assume it's passed.
        // In prod: verify Firebase ID token from header.

        await adminDb.collection('play_history').add({
            trackId,
            startedAt,
            endedAt,
            secondsPlayed,
            loggedAt: Date.now()
        });

        // Increment play count
        await adminDb.collection('tracks').doc(trackId).update({
            plays: admin.firestore.FieldValue.increment(1)
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to log" }, { status: 500 });
    }
}
