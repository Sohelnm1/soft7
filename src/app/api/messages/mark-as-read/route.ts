// src/app/api/messages/mark-as-read/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { contactId } = await req.json();
        if (!contactId) {
            return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
        }

        // Mark all incoming messages from this contact as read
        await prisma.message.updateMany({
            where: {
                contactId,
                userId: user.id,
                direction: "incoming",
                readAt: null,
            },
            data: {
                readAt: new Date(),
                status: "read", // Also update status for UI consistency
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("mark-as-read error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
