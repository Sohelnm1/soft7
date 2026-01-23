import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const whereClause: any = {
            whatsappAccount: {
                userId: user.id
            }
        };

        if (status) {
            whereClause.status = status;
        }

        // Fetch templates for all accounts belonging to this user
        const templates = await prisma.whatsAppTemplate.findMany({
            where: whereClause,
            include: {
                whatsappAccount: {
                    select: {
                        phoneNumber: true,
                        wabaId: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}
