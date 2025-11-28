import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
    try {
        const { pass } = await req.json();

        if (pass === process.env.ADMIN_UNLOCK_PASS) {
            const cookie = serialize("admin_unlocked", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 12, // 12 hours
                path: "/",
            });

            return new NextResponse(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Set-Cookie": cookie },
            });
        }

        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
