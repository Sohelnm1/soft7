import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch a single template
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ templateId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { templateId } = await params;

        const template = await prisma.whatsAppTemplate.findUnique({
            where: { id: Number(templateId) },
            include: { whatsappAccount: true }
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        if (template.whatsappAccount.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Update a template using Meta's template ID endpoint
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ templateId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { templateId } = await params;
        const body = await req.json();
        const { components, category, parameter_format } = body;

        const template = await prisma.whatsAppTemplate.findUnique({
            where: { id: Number(templateId) },
            include: { whatsappAccount: true }
        });

        if (!template || template.whatsappAccount.userId !== user.id) {
            return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });
        }

        const account = template.whatsappAccount;

        // Use Meta's template ID endpoint for editing
        // POST /{template_id} is the proper way to edit templates
        let url: string;
        let payload: any;

        if (template.metaTemplateId) {
            // Use the template ID endpoint - this is the correct way to edit
            url = `https://graph.facebook.com/${account.apiVersion}/${template.metaTemplateId}`;
            payload = {
                category: category,
                components: components
            };
            if (parameter_format) {
                payload.parameter_format = parameter_format;
            }
        } else {
            // No Meta template ID - need to sync first
            return NextResponse.json({
                error: "Template needs to be synced from Meta first. Please click 'Sync from Meta' and try again."
            }, { status: 400 });
        }

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
            console.error("Meta template update error:", data);
            return NextResponse.json({
                error: data.error?.error_user_msg || data.error?.message || "Failed to update template"
            }, { status: 400 });
        }

        // Update local database
        const updated = await prisma.whatsAppTemplate.update({
            where: { id: Number(templateId) },
            data: {
                category,
                components,
                status: 'PENDING',
                qualityRating: 'UNKNOWN'
            }
        });

        return NextResponse.json({ success: true, template: updated });

    } catch (error) {
        console.error("Template update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Delete a template
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ templateId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { templateId } = await params;

        const template = await prisma.whatsAppTemplate.findUnique({
            where: { id: Number(templateId) },
            include: { whatsappAccount: true }
        });

        if (!template || template.whatsappAccount.userId !== user.id) {
            return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });
        }

        const account = template.whatsappAccount;
        const url = `https://graph.facebook.com/${account.apiVersion}/${account.wabaId}/message_templates?name=${template.name}`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${account.accessToken}` }
        });

        await prisma.whatsAppTemplate.delete({
            where: { id: Number(templateId) }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
