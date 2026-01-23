import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, category, language, components, whatsappAccountId } = body;

        if (!name || !category || !language || !components || !whatsappAccountId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const account = await prisma.whatsAppAccount.findUnique({
            where: { id: whatsappAccountId },
        });

        if (!account || account.userId !== user.id) {
            return NextResponse.json({ error: "Invalid WhatsApp Account" }, { status: 403 });
        }

        // 1. Submit to Meta
        const url = `https://graph.facebook.com/${account.apiVersion}/${account.wabaId}/message_templates`;

        const payload = {
            name,
            category,
            language,
            components
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${account.accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Meta Template Creation Error:", data);
            return NextResponse.json({ error: data.error?.message || "Failed to create template on Meta" }, { status: 400 });
        }

        // 2. Save to DB with Meta's template ID
        const newTemplate = await prisma.whatsAppTemplate.create({
            data: {
                whatsappAccountId: account.id,
                metaTemplateId: data.id, // Store Meta's template ID
                name: name,
                category: category,
                language: language,
                status: "PENDING", // Valid initial status
                components: components,
                qualityRating: "UNKNOWN"
            }
        });

        return NextResponse.json({ success: true, template: newTemplate });

    } catch (error) {
        console.error("Create Template API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
