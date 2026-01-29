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

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's first WhatsApp account to extract appId and businessId
        const account = await prisma.whatsAppAccount.findFirst({
            where: { userId: user.id, isActive: true },
        });

        if (!account || !account.appId) {
            return NextResponse.json(null);
        }

        // Generate redirect URI
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/embedded-signup/callback`;
        
        // Generate state for CSRF protection
        const state = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');

        return NextResponse.json({
            appId: account.appId,
            businessId: account.wabaId, // Using WABA ID as business ID
            redirectUri,
            state,
        });
    } catch (error: any) {
        console.error("Embedded Signup Config Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
