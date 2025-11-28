import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // 'song' or 'cover'

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine directory
        const dir = type === 'song' ? 'songs' : 'covers';
        const uploadDir = path.join(process.cwd(), "public", dir);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Create unique filename to prevent overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.name);
        const filename = `${file.name.replace(ext, '')}-${uniqueSuffix}${ext}`;
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Return public URL
        const publicUrl = `/${dir}/${filename}`;

        return NextResponse.json({ url: publicUrl });
    } catch (e) {
        console.error("Upload error:", e);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
