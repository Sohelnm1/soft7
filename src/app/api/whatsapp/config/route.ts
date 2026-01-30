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

        const accounts = await prisma.whatsAppAccount.findMany({
            where: { userId: user.id },
            include: {
                templates: true
            }
        });

        return NextResponse.json(accounts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            wabaId,
            phoneNumberId,
            accessToken,
            verifyToken,
            phoneNumber,
            appId,
            appSecret,
            apiVersion
        } = body;

        if (!wabaId || !phoneNumberId || !accessToken || !phoneNumber) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate Credentials by fetching templates (lightweight verification)
        try {
            // Dynamic import to avoid circular dependency issues if any, though standard import is fine usually.
            const { fetchTemplatesFromMeta } = await import("@/lib/whatsapp-templates");
            await fetchTemplatesFromMeta(wabaId, accessToken, apiVersion || "v22.0");
        } catch (validationError: any) {
            console.error("Credential Validation Failed:", validationError);
            return NextResponse.json({
                error: "Invalid Credentials or Permissions. Please check your WABA ID and Access Token. " + (validationError.message || "")
            }, { status: 400 });
        }

        const account = await prisma.whatsAppAccount.upsert({
            where: {
                userId_phoneNumberId: {
                    userId: user.id,
                    phoneNumberId
                }
            },
            update: {
                wabaId,
                accessToken,
                verifyToken,
                phoneNumber,
                appId,
                appSecret,
                apiVersion: apiVersion || "v22.0",
                isActive: true
            },
            create: {
                userId: user.id,
                wabaId,
                phoneNumberId,
                accessToken,
                verifyToken,
                phoneNumber,
                appId,
                appSecret,
                apiVersion: apiVersion || "v22.0",
                isActive: true
            }
        });

        return NextResponse.json(account);
    } catch (error: any) {
        console.error("WhatsApp Config Save Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const accountId = url.searchParams.get("id");

        if (!accountId) {
            return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
        }

        // Find the account and verify ownership
        const account = await prisma.whatsAppAccount.findUnique({
            where: { id: parseInt(accountId) }
        });

        if (!account) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        if (account.userId !== user.id) {
            return NextResponse.json({ error: "Unauthorized to delete this account" }, { status: 403 });
        }

        // Delete the account and related data
        await prisma.whatsAppAccount.delete({
            where: { id: parseInt(accountId) }
        });

        return NextResponse.json({ success: true, message: "Account deleted successfully" });
    } catch (error: any) {
        console.error("WhatsApp Config Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
