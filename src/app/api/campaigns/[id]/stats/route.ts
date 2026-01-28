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

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized: Please log in first." },
                { status: 401 }
            );
        }

        const campaignId = params.id;
        const url = new URL(request.url);
        const statusFilter = url.searchParams.get("status") || "all";
        const searchQuery = url.searchParams.get("search") || "";

        // Fetch campaign
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, userId: currentUser.id },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        // Build message query
        const messageWhere: any = {
            campaignId: campaignId,
            userId: currentUser.id,
        };

        if (statusFilter !== "all") {
            if (statusFilter === "sent") {
                messageWhere.status = { in: ["sent", "delivered", "read"] };
            } else if (statusFilter === "delivered") {
                messageWhere.status = { in: ["delivered", "read"] };
            } else {
                messageWhere.status = statusFilter;
            }
        }

        if (searchQuery) {
            messageWhere.OR = [
                { contact: { name: { contains: searchQuery, mode: "insensitive" } } },
                { contact: { phone: { contains: searchQuery } } },
            ];
        }

        // Fetch messages with contact details
        const messages = await prisma.message.findMany({
            where: messageWhere,
            include: {
                contact: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Calculate stats
        const allMessages = await prisma.message.findMany({
            where: { campaignId: campaignId, userId: currentUser.id },
            select: { status: true },
        });

        const stats = {
            totalContacts: campaign.leadsCount,
            sentCount: allMessages.filter((m) => ["sent", "delivered", "read"].includes(m.status)).length,
            deliveredCount: allMessages.filter((m) => ["delivered", "read"].includes(m.status)).length,
            failedCount: allMessages.filter((m) => m.status === "failed").length,
            readCount: allMessages.filter((m) => m.status === "read").length,
        };

        // Format messages for response
        const formattedMessages = messages.map((msg) => ({
            id: msg.id,
            contactId: msg.contactId,
            contactName: msg.contact.name || "Unknown",
            contactPhone: msg.contact.phone,
            status: msg.status,
            createdAt: msg.createdAt,
            sentAt: (msg as any).sentAt,
            deliveredAt: (msg as any).deliveredAt,
            readAt: (msg as any).readAt,
            failedAt: (msg as any).failedAt,
            errorMessage: (msg as any).errorMessage,
            errorCode: (msg as any).errorCode,
            error: (msg as any).error,
            templateName: msg.templateName,
            conversationId: msg.conversationId,
            whatsappMessageId: msg.whatsappMessageId,
        }));

        return NextResponse.json({
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                type: campaign.type,
                startDate: campaign.startDate,
                createdAt: campaign.createdAt,
            },
            stats,
            messages: formattedMessages,
        });
    } catch (err: any) {
        console.error("Campaign stats error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to fetch campaign stats" },
            { status: 500 }
        );
    }
}
