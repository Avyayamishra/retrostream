import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    const unlocked = cookieStore.get("admin_unlocked");

    if (unlocked?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();

        // Basic validation
        if (!data.title || !data.artist) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const docRef = await adminDb.collection("tracks").add({
            ...data,
            createdAt: Date.now(),
            plays: 0,
            explicit: false
        });

        // Update the doc with its own ID (optional but good for client consistency)
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ ok: true, id: docRef.id });
    } catch (e) {
        console.error("Track upload error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const cookieStore = cookies();
    const unlocked = cookieStore.get("admin_unlocked");

    if (unlocked?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await adminDb.collection("tracks").doc(id).delete();
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete track" }, { status: 500 });
    }
}
