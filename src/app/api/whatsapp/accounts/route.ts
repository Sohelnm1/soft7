import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accounts = await prisma.whatsAppAccount.findMany({
            where: {
                userId: user.id,
                isActive: true
            },
            select: {
                id: true,
                phoneNumber: true,
                wabaId: true
            }
        });

        // Map to simpler object
        const safeAccounts = accounts.map(a => ({
            id: a.id,
            name: a.phoneNumber, // Use phone number as name since name field doesn't exist
            phoneNumber: a.phoneNumber,
            wabaId: a.wabaId
        }));

        return NextResponse.json(safeAccounts);
    } catch (error) {
        console.error("Failed to fetch accounts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
