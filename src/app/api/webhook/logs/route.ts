import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        // const user = await getCurrentUser();
        // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const logs = await prisma.incomingWebhook.findMany({
            take: 50,
            orderBy: { createdAt: "desc" }
        });

        console.log(`🔍 Fetched ${logs.length} webhook logs`);

        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
