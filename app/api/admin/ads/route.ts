import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin.server";
import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import path from "path";

// GET: List all ads
export async function GET(req: NextRequest) {
    const cookieStore = cookies();
    const unlocked = cookieStore.get("admin_unlocked");

    if (unlocked?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const snap = await adminDb.collection("ads").orderBy("createdAt", "desc").get();
        const ads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ ads });
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
    }
}

// POST: Create a new ad (Handles FormData for file uploads)
export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    const unlocked = cookieStore.get("admin_unlocked");

    if (unlocked?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const title = formData.get("title") as string;
        const weight = parseInt(formData.get("weight") as string);
        const duration = parseInt(formData.get("duration") as string);
        const type = formData.get("type") as string;
        const ctaUrl = formData.get("ctaUrl") as string || "";

        const audioFile = formData.get("audioFile") as File | null;
        const coverFile = formData.get("coverFile") as File | null;
        const audioUrl = formData.get("audioUrl") as string;
        const coverUrl = formData.get("coverUrl") as string;

        let finalAudioPath = audioUrl;
        let finalCoverPath = coverUrl;

        // Handle Audio File
        if (audioFile && audioFile.size > 0) {
            const buffer = Buffer.from(await audioFile.arrayBuffer());
            const filename = `${Date.now()}_${audioFile.name.replace(/\s/g, '_')}`;
            const relativePath = `/ads/audio/${filename}`;
            const absolutePath = path.join(process.cwd(), "public", "ads", "audio", filename);
            await writeFile(absolutePath, buffer);
            finalAudioPath = relativePath;
        }

        // Handle Cover File
        if (coverFile && coverFile.size > 0) {
            const buffer = Buffer.from(await coverFile.arrayBuffer());
            const filename = `${Date.now()}_${coverFile.name.replace(/\s/g, '_')}`;
            const relativePath = `/ads/banner/${filename}`;
            const absolutePath = path.join(process.cwd(), "public", "ads", "banner", filename);
            await writeFile(absolutePath, buffer);
            finalCoverPath = relativePath;
        }

        const newAd = {
            title,
            weight,
            duration,
            type,
            ctaUrl,
            storagePath: finalAudioPath,
            coverPath: finalCoverPath,
            active: true,
            createdAt: Date.now()
        };

        const docRef = await adminDb.collection("ads").add(newAd);
        await docRef.update({ id: docRef.id });

        return NextResponse.json({ ok: true, id: docRef.id });
    } catch (e) {
        console.error("Ad creation error:", e);
        return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });
    }
}

// DELETE: Remove an ad
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

        await adminDb.collection("ads").doc(id).delete();
        // Note: We are not deleting the local files here to keep it simple, 
        // but in a real app we should.
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete ad" }, { status: 500 });
    }
}
