import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin.server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    const unlocked = cookieStore.get("admin_unlocked");

    if (!unlocked) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { idToken } = await req.json();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        await adminDb.collection("users").doc(uid).set({
            isAdmin: true
        }, { merge: true });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to associate" }, { status: 500 });
    }
}
