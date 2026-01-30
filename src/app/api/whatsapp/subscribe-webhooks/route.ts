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

/**
 * POST: Subscribe a WABA to webhooks
 * 
 * Per Meta Embedded Signup docs:
 * "subscribe your app to webhooks on the customer's WABA"
 * This is REQUIRED to receive incoming messages and status updates!
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { accountId } = body;

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
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!account.wabaId || !account.accessToken) {
            return NextResponse.json({
                error: "Account is missing WABA ID or access token"
            }, { status: 400 });
        }

        // Subscribe to webhooks for this WABA
        console.log(`[WebhookSubscribe] Subscribing WABA ${account.wabaId} to webhooks...`);

        const subscribeResponse = await fetch(
            `https://graph.facebook.com/v22.0/${account.wabaId}/subscribed_apps`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${account.accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const subscribeData = await subscribeResponse.json();
        console.log("[WebhookSubscribe] Response:", JSON.stringify(subscribeData, null, 2));

        if (subscribeData.success) {
            return NextResponse.json({
                success: true,
                message: `Successfully subscribed WABA ${account.wabaId} to webhooks`
            });
        } else if (subscribeData.error) {
            return NextResponse.json({
                error: subscribeData.error.message || "Failed to subscribe to webhooks",
                details: subscribeData.error
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: subscribeData });
    } catch (error: any) {
        console.error("[WebhookSubscribe] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET: Check if a WABA is subscribed to webhooks
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const accountId = url.searchParams.get("accountId");

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
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!account.wabaId || !account.accessToken) {
            return NextResponse.json({
                error: "Account is missing WABA ID or access token"
            }, { status: 400 });
        }

        // Get subscribed apps for this WABA
        const response = await fetch(
            `https://graph.facebook.com/v22.0/${account.wabaId}/subscribed_apps`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${account.accessToken}`,
                },
            }
        );

        const data = await response.json();
        console.log("[WebhookSubscribe] GET Response:", JSON.stringify(data, null, 2));

        return NextResponse.json({
            subscribed: (data.data && data.data.length > 0),
            apps: data.data || []
        });
    } catch (error: any) {
        console.error("[WebhookSubscribe] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
