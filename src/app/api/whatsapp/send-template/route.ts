import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTemplateVariables, formatTemplateParameters } from "@/lib/template-utils";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { contactId, templateId, variables } = await req.json();

        // Get template details
        const template = await prisma.whatsAppTemplate.findUnique({
            where: { id: templateId },
            include: { whatsappAccount: true },
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        if (template.whatsappAccount.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get contact details
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
        });

        if (!contact) {
            return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }

        const account = template.whatsappAccount;

        // Build template message payload
        const components: any[] = [];

        // Process each component and substitute variables
        const templateVars = getTemplateVariables(template.components as any || []);
        const { header, body, buttons } = formatTemplateParameters(templateVars, variables);

        if (header.length > 0) {
            components.push({ type: "header", parameters: header });
        }
        if (body.length > 0) {
            components.push({ type: "body", parameters: body });
        }
        if (buttons.length > 0) {
            components.push(...buttons);
        }

        // Send template message via Meta API
        const url = `https://graph.facebook.com/${account.apiVersion}/${account.phoneNumberId}/messages`;
        const payload = {
            messaging_product: "whatsapp",
            to: (contact.phone || "").replace(/\D/g, ""),
            type: "template",
            template: {
                name: template.name,
                language: {
                    code: template.language,
                },
                components: components.length > 0 ? components : undefined,
            },
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${account.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        // Determine if send was successful
        const sendSuccess = response.ok;
        const errorData = !sendSuccess ? data.error : null;

        // Log message in database (both success and failure)
        try {
            // Find or create conversation
            let conversationId = "temp_inbox_" + Date.now();
            if (contact.id) {
                const conv = await prisma.conversation.upsert({
                    where: {
                        userId_phone: {
                            userId: user.id,
                            phone: contact.phone!
                        }
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        phone: contact.phone!,
                        contactId: contact.id
                    }
                });
                conversationId = conv.id;
            }

            await prisma.message.create({
                data: {
                    conversationId,
                    contactId: contact.id,
                    userId: user.id,
                    messageType: "template",
                    whatsappMessageId: data.messages?.[0]?.id,
                    direction: "outgoing",
                    type: "template",
                    status: sendSuccess ? "sent" : "failed",
                    sentAt: sendSuccess ? new Date() : null,
                    failedAt: !sendSuccess ? new Date() : null,
                    text: `Template: ${template.name}`,
                    isTemplate: true,
                    templateName: template.name,
                    templateLanguage: template.language,
                    templateComponents: (template.components as any) || null,
                    sentBy: "me",
                    errorCode: errorData?.code?.toString(),
                    errorMessage: errorData?.message,
                    error: errorData ? JSON.stringify(errorData) : undefined
                }
            });
        } catch (logError) {
            console.error("Failed to log message to DB:", logError);
        }

        // Return error if send failed
        if (!sendSuccess) {
            console.error("Meta send template error:", data);
            return NextResponse.json(
                {
                    error: errorData?.message || "Failed to send template",
                },
                { status: 400 }
            );
        }



        return NextResponse.json({
            success: true,
            messageId: data.messages?.[0]?.id,
        });
    } catch (error) {
        console.error("Send template error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
