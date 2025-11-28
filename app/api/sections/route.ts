import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc } from "firebase/firestore";
import { Section } from "@/lib/types";

export async function GET() {
    try {
        const q = query(collection(db, "sections"), orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        const sections = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Section));
        return NextResponse.json({ sections });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, order, trackIds } = body;

        const docRef = await addDoc(collection(db, "sections"), {
            title,
            order: Number(order),
            trackIds: trackIds || []
        });

        return NextResponse.json({ id: docRef.id, message: "Section created" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, title, order, trackIds } = body;

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const docRef = doc(db, "sections", id);
        await updateDoc(docRef, {
            title,
            order: Number(order),
            trackIds
        });

        return NextResponse.json({ message: "Section updated" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await deleteDoc(doc(db, "sections", id));
        return NextResponse.json({ message: "Section deleted" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
