import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { appId, businessId } = body;

        // Get or create WhatsApp account with appId
        const account = await prisma.whatsAppAccount.findFirst({
            where: { userId: user.id, isActive: true },
        });

        if (!account) {
            return NextResponse.json(
                { error: "No active WhatsApp account found. Please configure WhatsApp first." },
                { status: 400 }
            );
        }

        // Update account with appId if provided
        if (appId) {
            await prisma.whatsAppAccount.update({
                where: { id: account.id },
                data: { appId },
            });
        }

        // Generate redirect URI
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/embedded-signup/callback`;
        
        // Generate state for CSRF protection
        const state = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');

        return NextResponse.json({
            appId: appId || account.appId || '',
            businessId: businessId || account.wabaId,
            redirectUri,
            state,
        });
    } catch (error: any) {
        console.error("Embedded Signup Init Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
