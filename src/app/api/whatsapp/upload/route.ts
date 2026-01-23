import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const mediaId = formData.get("mediaId") as string | null;
        const accountId = formData.get("accountId") as string;

        if ((!file && !mediaId) || !accountId) {
            return NextResponse.json({ error: "File (or Media ID) and Account ID are required" }, { status: 400 });
        }

        const account = await prisma.whatsAppAccount.findUnique({
            where: { id: Number(accountId) }
        });

        if (!account || account.userId !== user.id) {
            return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 403 });
        }

        if (!account.appId) {
            return NextResponse.json({ error: "App ID is required for media uploads. Please update your account configuration." }, { status: 400 });
        }

        let fileBuffer: ArrayBuffer;
        let fileSize: number;
        let fileType: string;

        // Function to Upload to Meta (Resumable)
        const uploadToMeta = async (buffer: ArrayBuffer, type: string, size: number) => {
            // 1. Start Upload Session
            const startUrl = `https://graph.facebook.com/${account.apiVersion}/${account.appId}/uploads?file_length=${size}&file_type=${type}`;
            const startRes = await fetch(startUrl, {
                method: "POST",
                headers: { Authorization: `Bearer ${account.accessToken}` }
            });
            const startData = await startRes.json();
            if (!startRes.ok || !startData.id) {
                throw new Error("Failed to initiate upload with Meta: " + (startData.error?.message || JSON.stringify(startData)));
            }
            const uploadSessionId = startData.id;

            // 2. Upload Binary
            const uploadRes = await fetch(`https://graph.facebook.com/${account.apiVersion}/${uploadSessionId}`, {
                method: "POST",
                headers: {
                    Authorization: `OAuth ${account.accessToken}`,
                    "file_offset": "0"
                },
                body: buffer
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData.h) {
                throw new Error("Failed to upload file content to Meta: " + (uploadData.error?.message || JSON.stringify(uploadData)));
            }
            return uploadData.h;
        };

        // Case 1: Existing Media
        if (mediaId) {
            const media = await prisma.media.findUnique({
                where: { id: Number(mediaId) }
            });
            if (!media || media.userId !== user.id) {
                return NextResponse.json({ error: "Media not found" }, { status: 404 });
            }
            // Read file from disk
            const filePath = path.join(process.cwd(), "public", media.url); // Access using url since it's likely /uploads/filename
            // Note: media.url is "/uploads/filename", so we need to valid path.
            // If media.url starts with /uploads, we can just strip it or join properly.
            // Assuming stored as "/uploads/img.png"
            const localPath = path.join(process.cwd(), "public", ...media.url.split('/').filter(Boolean));

            if (!fs.existsSync(localPath)) {
                return NextResponse.json({ error: "File not found on server" }, { status: 404 });
            }

            const buffer = fs.readFileSync(localPath);
            fileBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            fileSize = buffer.byteLength;
            fileType = media.type;
        }
        // Case 2: New File Upload
        else if (file) {
            fileBuffer = await file.arrayBuffer();
            fileSize = file.size;
            fileType = file.type;

            // Save to Gallery
            const uploadsDir = path.join(process.cwd(), "public", "uploads");
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const buffer = Buffer.from(fileBuffer);
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`; // Unique name
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, buffer);

            // Create DB Entry
            await prisma.media.create({
                data: {
                    name: file.name,
                    fileName: fileName,
                    type: file.type,
                    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    url: `/uploads/${fileName}`,
                    userId: user.id,
                },
            });
        } else {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Upload to Meta
        const handle = await uploadToMeta(fileBuffer, fileType, fileSize);
        return NextResponse.json({ handle });

    } catch (error: any) {
        console.error("Upload (Gallery/Meta) Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    }
}
