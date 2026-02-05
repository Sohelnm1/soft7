import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TemplateService } from "@/services/template.service";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { contactId, templateId, variables } = await req.json();

        // Template lookup for name/language since TemplateService needs those
        const { prisma } = require("@/lib/prisma");
        const template = await prisma.whatsAppTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        const messageRecord = await TemplateService.sendTemplate({
            userId: user.id,
            contactId,
            templateName: template.name,
            language: template.language,
            variables
        });

        return NextResponse.json({
            success: true,
            messageId: messageRecord.whatsappMessageId,
        });
    } catch (error: any) {
        console.error("Send template API error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
