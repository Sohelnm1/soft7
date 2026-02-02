import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import {
    uploadMediaToWhatsApp,
    getMediaTypeFromMime,
    validateMedia,
    sendWhatsAppMedia,
} from "@/lib/whatsapp";

async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        return decoded as { id: number; email: string };
    } catch {
        return null;
    }
}

/**
 * POST /api/messages/send-media
 * 
 * Upload media to WhatsApp and send to a contact.
 * Also saves the media to the local gallery.
 */
export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const contactId = formData.get("contactId") as string;
        const caption = formData.get("caption") as string | null;
        const galleryMediaId = formData.get("galleryMediaId") as string | null;

        if (!contactId) {
            return NextResponse.json({ error: "contactId is required" }, { status: 400 });
        }

        // Get contact info
        const contact = await prisma.contact.findFirst({
            where: { id: parseInt(contactId), userId: currentUser.id },
        });

        if (!contact || !contact.phone) {
            return NextResponse.json({ error: "Contact not found or has no phone" }, { status: 404 });
        }

        let mediaType: 'image' | 'video' | 'audio' | 'document';
        let mediaId: string;
        let fileName: string;
        let mimeType: string;
        let localMediaUrl: string | null = null;

        // Option 1: Use existing gallery media
        if (galleryMediaId) {
            const galleryMedia = await prisma.media.findFirst({
                where: { id: parseInt(galleryMediaId), userId: currentUser.id },
            });

            if (!galleryMedia) {
                return NextResponse.json({ error: "Gallery media not found" }, { status: 404 });
            }

            // Read the file from local storage
            const filePath = path.join(process.cwd(), "public", galleryMedia.url);
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: "Media file not found on disk" }, { status: 404 });
            }

            const fileBuffer = fs.readFileSync(filePath);
            mimeType = galleryMedia.type;
            fileName = galleryMedia.fileName;
            localMediaUrl = galleryMedia.url;

            const detectedType = getMediaTypeFromMime(mimeType);
            if (!detectedType) {
                return NextResponse.json({ error: `Unsupported media type: ${mimeType}` }, { status: 400 });
            }
            mediaType = detectedType;

            // Upload to WhatsApp
            mediaId = await uploadMediaToWhatsApp(fileBuffer, mimeType, fileName, currentUser.id);
        }
        // Option 2: Upload new file
        else if (file) {
            mimeType = file.type;
            fileName = file.name;

            // Validate media
            const validation = validateMedia(mimeType, file.size);
            if (!validation.valid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            const detectedType = getMediaTypeFromMime(mimeType);
            if (!detectedType) {
                return NextResponse.json({ error: `Unsupported media type: ${mimeType}` }, { status: 400 });
            }
            mediaType = detectedType;

            // Save to local gallery first
            const uploadsDir = path.join(process.cwd(), "public", "uploads");
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}_${fileName}`;
            const localFilePath = path.join(uploadsDir, uniqueFileName);

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(localFilePath, buffer);

            localMediaUrl = `/uploads/${uniqueFileName}`;

            // Save to gallery DB
            await prisma.media.create({
                data: {
                    name: fileName,
                    fileName: uniqueFileName,
                    type: mimeType,
                    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    url: localMediaUrl,
                    userId: currentUser.id,
                },
            });

            // Upload to WhatsApp
            mediaId = await uploadMediaToWhatsApp(buffer, mimeType, fileName, currentUser.id);
        } else {
            return NextResponse.json({ error: "Either file or galleryMediaId is required" }, { status: 400 });
        }

        // Send the media via WhatsApp
        const result = await sendWhatsAppMedia(
            contact.phone,
            mediaType,
            currentUser.id,
            {
                mediaId,
                caption: caption || undefined,
                filename: mediaType === 'document' ? fileName : undefined,
            }
        );

        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: { userId: currentUser.id, phone: contact.phone },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    phone: contact.phone,
                    name: contact.name,
                    userId: currentUser.id,
                    contactId: contact.id,
                },
            });
        }

        // Save message to DB
        const message = await prisma.message.create({
            data: {
                contactId: contact.id,
                conversationId: conversation.id,
                userId: currentUser.id,
                content: caption || `[${mediaType.toUpperCase()}]`,
                text: caption || `[${mediaType.toUpperCase()}]`,
                sentBy: "me",
                direction: "outgoing",
                status: "sent",
                messageType: mediaType,
                mediaUrl: localMediaUrl,
                mediaType: mimeType,
                whatsappMessageId: result.messages?.[0]?.id,
                sentAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message,
            whatsappMessageId: result.messages?.[0]?.id,
        });
    } catch (error: any) {
        console.error("Send media error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send media" },
            { status: 500 }
        );
    }
}
