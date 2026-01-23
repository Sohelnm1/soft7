import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTemplatesFromMeta } from "@/lib/whatsapp-templates";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { accountId } = await req.json();

        const account = await prisma.whatsAppAccount.findUnique({
            where: { id: Number(accountId) }
        });

        if (!account) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        if (account.userId !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!account.wabaId || !account.accessToken) {
            return NextResponse.json({ error: "Incomplete configuration" }, { status: 400 });
        }

        // Try to fetch templates as a test
        await fetchTemplatesFromMeta(account.wabaId, account.accessToken, account.apiVersion);

        return NextResponse.json({ success: true, message: "Connection successful!" });

    } catch (error: any) {
        console.error("Test connection failed:", error);
        return NextResponse.json({ error: error.message || "Connection failed" }, { status: 500 });
    }
}
