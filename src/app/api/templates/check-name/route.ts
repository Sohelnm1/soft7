import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const name = searchParams.get("name");
        const accountId = searchParams.get("accountId");

        if (!name || !accountId) {
            return NextResponse.json({ error: "Name and Account ID are required" }, { status: 400 });
        }

        // First verify the account belongs to the user
        const account = await prisma.whatsAppAccount.findUnique({
            where: { id: Number(accountId) }
        });

        if (!account || account.userId !== user.id) {
            return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 403 });
        }

        // Check if template with this exact name exists for this account
        const existingTemplate = await prisma.whatsAppTemplate.findFirst({
            where: {
                name: name.toLowerCase(), // Exact match (Prisma uses exact match by default)
                whatsappAccountId: Number(accountId)
            }
        });

        return NextResponse.json({
            exists: !!existingTemplate,
            available: !existingTemplate
        });

    } catch (error: any) {
        console.error("Template name check error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
