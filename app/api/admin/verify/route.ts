import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const cookieStore = cookies();
    const unlocked = cookieStore.get("admin_unlocked");

    if (unlocked?.value === "true") {
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false }, { status: 401 });
}
