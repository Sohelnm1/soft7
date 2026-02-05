import { prisma } from "@/lib/prisma";
import { getTemplateVariables, formatTemplateParameters } from "@/lib/template-utils";
import { WalletService } from "./wallet.service";

export interface SendTemplateOptions {
    userId: number;
    contactId: number;
    templateName: string;
    language: string;
    variables: Record<string, string>;
    reminderId?: number;
}

export class TemplateService {
    /**
     * Sends a WhatsApp template message and records it in the unified Message table.
     */
    static async sendTemplate(options: SendTemplateOptions) {
        const { userId, contactId, templateName, language, variables, reminderId } = options;

        // 1. Get template and account details
        const template = await prisma.whatsAppTemplate.findFirst({
            where: {
                name: templateName,
                language: language,
                whatsappAccount: {
                    userId: userId,
                    isActive: true
                }
            },
            include: { whatsappAccount: true },
        });

        if (!template) {
            throw new Error(`Template "${templateName}" (${language}) not found or account is inactive.`);
        }

        const account = template.whatsappAccount;

        // 2. Get contact details
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
        });

        if (!contact) {
            throw new Error("Contact not found.");
        }

        // 3. Build template message payload
        const components: any[] = [];
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

        // 4. Send to Meta Graph API
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${account.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        const sendSuccess = response.ok;
        const errorData = !sendSuccess ? data.error : null;
        const whatsappMessageId = data.messages?.[0]?.id;

        // 5. Create Unified Message Record
        let conversationId = `conv_${userId}_${contact.id}`;
        try {
            await (prisma.conversation as any).upsert({
                where: {
                    userId_phone: {
                        userId: userId,
                        phone: contact.phone!
                    }
                },
                update: {
                    lastMessage: `Template: ${template.name}`,
                    lastMessageAt: new Date()
                },
                create: {
                    userId: userId,
                    phone: contact.phone!,
                    contactId: contact.id,
                    lastMessage: `Template: ${template.name}`,
                    lastMessageAt: new Date()
                }
            });
        } catch (convErr) {
            console.error("[TemplateService] Conversation upsert failed:", convErr);
        }

        const messageRecord = await prisma.message.create({
            data: {
                conversationId,
                contactId: contact.id,
                userId: userId,
                messageType: "template",
                whatsappMessageId: whatsappMessageId,
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
                templateParams: variables,
                sentBy: "me",
                errorCode: errorData?.code?.toString(),
                errorMessage: errorData?.message,
                error: errorData ? JSON.stringify(errorData) : undefined,
                reminderId: reminderId
            } as any
        });

        // 6. Wallet Deduction
        if (sendSuccess && whatsappMessageId) {
            const COST = 1.0;
            try {
                await WalletService.deductWallet(userId, COST, whatsappMessageId);
            } catch (walletErr: any) {
                console.error(`[TemplateService] Wallet deduction failed for message ${whatsappMessageId}:`, walletErr.message);
            }
        }

        if (!sendSuccess) {
            throw new Error(errorData?.message || "Failed to send template message via Meta.");
        }

        return messageRecord;
    }
}
