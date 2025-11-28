import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";
import { cookies } from "next/headers";

// GET: Fetch active broadcasts (last 24h)
export async function GET() {
    try {
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const snapshot = await adminDb.collection("broadcasts")
            .where("createdAt", ">", twentyFourHoursAgo)
            .orderBy("createdAt", "desc")
            .get();

        const broadcasts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ broadcasts });
    } catch (error) {
        console.error("Error fetching broadcasts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new broadcast (Admin only)
export async function POST(req: Request) {
    try {
        // Verify Admin
        const cookieStore = cookies();
        const unlocked = cookieStore.get("admin_unlocked");

        if (unlocked?.value !== "true") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message } = await req.json();
        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const newBroadcast = {
            message,
            createdAt: Date.now(),
            createdBy: "admin"
        };

        const docRef = await adminDb.collection("broadcasts").add(newBroadcast);

        return NextResponse.json({ id: docRef.id, ...newBroadcast });
    } catch (error) {
        console.error("Error creating broadcast:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Delete a broadcast (Admin only)
export async function DELETE(req: Request) {
    try {
        // Verify Admin
        const cookieStore = cookies();
        const unlocked = cookieStore.get("admin_unlocked");

        if (unlocked?.value !== "true") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await adminDb.collection("broadcasts").doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting broadcast:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
