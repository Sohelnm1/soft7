import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getTemplateVariables } from "@/lib/template-utils";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { campaignId } = await req.json();

        if (!campaignId) {
            return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
        }

        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                userId: user.id,
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.status === "processing" || campaign.status === "completed") {
            return NextResponse.json({ message: "Campaign already run or running" });
        }

        // Update status to processing
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: "processing" }
        });

        // Parse audience data
        // Assuming audienceData is stored as a JSON string in the database
        // Structure: { contacts: number[], groups: string[], ... }
        let contactIds: number[] = [];
        if (campaign.audienceData) {
            const audience = campaign.audienceData as any;
            contactIds = audience.contacts || [];
            // TODO: Handle groups and tags logic here to fetch more contact IDs if needed
            // For MVP we rely on the implementation where 'contacts' array is populated
        }

        if (contactIds.length === 0) {
            // No contacts to send to?
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: { status: "completed" }
            });
            return NextResponse.json({ message: "No contacts in audience", count: 0 });
        }

        // Fetch template details to get name and language
        // In our create form we saved 'selectedTemplate' which is the UUID
        const template = await prisma.whatsAppTemplate.findUnique({
            where: { id: parseInt(campaign.selectedTemplate as string) }
        });

        if (!template) {
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: { status: "failed", description: "Template not found during execution" }
            });
            return NextResponse.json({ error: "Template not found" }, { status: 400 });
        }

        // Fetch actual contact objects for phone numbers
        const contacts = await prisma.contact.findMany({
            where: {
                id: { in: contactIds }
            }
        });

        let sentCount = 0;
        let failedCount = 0;

        // Pre-parse variable discovery
        const templateVariables = getTemplateVariables(template.components as any[] || []);
        const variableMapping = (campaign as any).variableMapping as Record<string, { type: "field" | "static", value: string }> || {};

        // Iterate and send
        for (const contact of contacts) {
            try {
                // Resolve variables for this contact
                const parameters: string[] = templateVariables.map((v) => {
                    const mapping = variableMapping[v.name];
                    if (!mapping) return "";

                    if (mapping.type === "static") {
                        return mapping.value || "";
                    }

                    if (mapping.type === "field") {
                        // Resolve from contact field
                        return String((contact as any)[mapping.value] || "");
                    }

                    return "";
                });

                if (!contact.phone) {
                    console.warn(`Skipping contact ${contact.id} because phone is null`);
                    failedCount++;
                    continue;
                }

                await sendWhatsAppTemplate(
                    contact.phone,
                    template.name,
                    template.language,
                    user.id,
                    parameters, // resolved variables
                    campaign.id, // Pass campaignId for tracking
                    contact.id // Pass contactId for message logging
                );
                sentCount++;
            } catch (err) {
                console.error(`Failed to send to ${contact.phone}`, err);
                failedCount++;
            }
        }

        // Update campaign status and stats
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                status: "completed",
                sentCount,
                failedCount,
                // deliveredCount will be updated via webhooks later
            }
        });

        return NextResponse.json({
            success: true,
            sent: sentCount,
            failed: failedCount
        });

    } catch (err: any) {
        console.error("Campaign execution error:", err);
        return NextResponse.json(
            { error: err.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
