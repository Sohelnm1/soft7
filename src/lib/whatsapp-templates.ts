import { prisma } from "@/lib/prisma";

export interface MetaTemplate {
    name: string;
    components: any[];
    language: string;
    status: string;
    category: string;
    id: string;
}

export async function fetchTemplatesFromMeta(wabaId: string, accessToken: string, apiVersion: string = "v22.0"): Promise<MetaTemplate[]> {
    const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`;

    // Pagination handling might be needed for large numbers of templates, 
    // but for now we'll fetch the first page. Meta usually returns a decent amount.
    // To be robust we should handle 'next' paging.

    let allTemplates: MetaTemplate[] = [];
    let nextUrl = url;

    try {
        while (nextUrl) {
            const response = await fetch(nextUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error fetching templates from Meta:", errorData);
                throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            allTemplates = [...allTemplates, ...data.data];

            // Check for pagination
            nextUrl = data.paging?.next || null;

            // Safety break to prevent infinite loops if something goes wrong with nextUrl
            if (allTemplates.length > 500) break;
        }
    } catch (error) {
        console.error("Failed to fetch templates:", error);
        throw error;
    }

    return allTemplates;
}

export async function syncTemplatesForUser(userId: number) {
    // 1. Get Active WhatsApp Accounts
    const accounts = await prisma.whatsAppAccount.findMany({
        where: {
            userId: userId,
            isActive: true,
        },
    });

    if (accounts.length === 0) {
        throw new Error("No active WhatsApp accounts found for this user.");
    }

    const results = [];

    for (const account of accounts) {
        try {
            if (!account.wabaId) {
                console.warn(`Account ${account.id} missing WABA ID, skipping.`);
                continue;
            }

            const metaTemplates = await fetchTemplatesFromMeta(account.wabaId, account.accessToken, account.apiVersion);

            // 2. Sync to DB
            // We will process each template.
            // The schema has a unique constraint on [whatsappAccountId, name].
            // Meta templates have a unique name per WABA mostly, but language is also a factor.
            // Wait, the schema `@@unique([whatsappAccountId, name])` assumes name is unique per account.
            // WhatsApp templates ARE unique by name within a WABA. Language is a variation of the same template name?
            // Actually, in Meta, "name" is the key. You can have multiple languages for the same "name".
            // If the schema constraint is (whatsappAccountId, name), then we store one row per *name*? 
            // But the schema has a `language` string field.
            // If I have template "hello_world" in "en" and "es", I can only store one if the constraint is just on name.
            // Let's check the schema again.
            // `  @@unique([whatsappAccountId, name])` -> Yes.
            // This implies the current data model might not support multiple languages for the same template name properly if we want to store them as separate rows.
            // OR we just store the "default" one, or the first one we find.
            // For now, I will abide by the schema. I will update the existing record if it matches the name.

            let syncedCount = 0;

            for (const t of metaTemplates) {
                // Mapping Meta status to our status

                await prisma.whatsAppTemplate.upsert({
                    where: {
                        whatsappAccountId_name: {
                            whatsappAccountId: account.id,
                            name: t.name,
                        }
                    },
                    update: {
                        metaTemplateId: t.id,
                        status: t.status,
                        category: t.category,
                        language: t.language,
                        components: t.components || [],
                        qualityRating: (t as any).quality_score?.score || 'UNKNOWN',
                    },
                    create: {
                        whatsappAccountId: account.id,
                        metaTemplateId: t.id,
                        name: t.name,
                        status: t.status,
                        category: t.category,
                        language: t.language,
                        isDefault: false,
                        components: t.components || [],
                        qualityRating: (t as any).quality_score?.score || 'UNKNOWN',
                    }
                });
                syncedCount++;
            }
            results.push({ accountId: account.id, synced: syncedCount });

        } catch (e) {
            console.error(`Error syncing for account ${account.id}:`, e);
            results.push({ accountId: account.id, error: e instanceof Error ? e.message : "Unknown error" });
        }
    }

    return results;
}
