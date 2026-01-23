import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("Missing JWT_SECRET environment variable.");
}

interface JWTPayload {
  id: number;
  email?: string;
  name?: string;
}

/** Config */
const MAX_PER_MODEL = 5;
const MAX_TOTAL_RESULTS = 15;

/** How many DB queries to run concurrently (tune as needed) */
const CONCURRENCY = 4;

/** Pages / Routes */
const PAGES = [
  { name: "Dashboard", url: "/dashboard", keywords: ["dashboard", "home", "overview", "main", "analytics","Message Activity","activity","Breakdown","Recent Activity & Breakdown","Leads",] },
  { name: "Inbox", url: "/inbox", keywords: ["inbox", "messages", "chat", "conversation", "message"] },
  { name: "Contact", url: "/contact", keywords: ["contact", "contacts", "people", "customer", "client"] },
  { name: "Campaigns", url: "/campaigns", keywords: ["campaigns", "marketing", "broadcast", "campaign"] },
  { name: "Integrations", url: "/integrations", keywords: ["integrations", "connect", "api", "integration"] },
  { name: "Manage", url: "/manage", keywords: ["manage", "management", "admin"] },
  { name: "WhatsApp Templates", url: "/manage/templates", keywords: ["whatsapp", "templates", "template", "message templates"] },
  { name: "WhatsApp Forms", url: "/manage/whatsapp-flows", keywords: ["whatsapp", "forms", "form", "flow forms"] },
  { name: "Tags", url: "/manage/tags", keywords: ["tags", "tag", "labels", "categories"] },
  { name: "Columns", url: "/manage/columns", keywords: ["columns", "column", "fields", "custom fields"] },
  { name: "Opts Management", url: "/manage/opts-management", keywords: ["opts", "opt-in", "opt-out", "keywords", "subscription"] },
  { name: "Webhook Events", url: "/manage/webhooks", keywords: ["webhook", "events", "webhooks", "integrations", "api"] },
  { name: "Gallery", url: "/gallery", keywords: ["gallery", "media", "images", "files", "photos"] },
  { name: "FAQ Bot", url: "/faq-bot", keywords: ["faq", "bot", "frequently asked", "questions"] },
  { name: "Chatbot", url: "/chatbot", keywords: ["chatbot", "bot", "automation", "automated"] },
  { name: "AI Assistant", url: "/ai-assistant", keywords: ["ai", "assistant", "artificial intelligence", "smart"] },
  { name: "Flows", url: "/flows", keywords: ["flows", "workflow", "automation", "automate"] },
  { name: "Knowledge Base", url: "/knowledge-base", keywords: ["knowledge", "base", "docs", "documentation", "help"] },
  { name: "Developers", url: "/developers", keywords: ["developers", "dev", "api", "webhook", "development","whatsapp api"] },
  { name: "Reminder", url: "/reminder", keywords: ["reminder", "reminders", "remind", "alert", "notification"] },
  { name: "Settings", url: "/settings", keywords: ["settings", "preferences", "configuration", "options"] },
  { name: "Profile", url: "/settings/profile", keywords: ["profile", "account", "user", "personal", "my profile"] },
  { name: "Team", url: "/settings/team", keywords: ["team", "members", "team members", "users", "invite"] },
  { name: "Organization", url: "/settings/organization", keywords: ["organization", "org", "company", "business"] },
  { name: "Billing", url: "/settings/billing", keywords: ["billing", "payment", "subscription", "plan", "invoice"] },
];

type ResultType = 
  | "contact" | "page" | "campaign" | "tag" | "lead" | "media" | "flow" | "chatbot"
  | "ai-assistant" | "webhook" | "column" | "opt-keyword" | "whatsapp-flow" | "faq-bot"
  | "reminder" | "team-member";

interface SearchResult {
  id: string | number;
  type: ResultType;
  title: string;
  subtitle?: string;
  url: string;
}

/** Priority order for types  */
const typeOrder: Record<ResultType, number> = {
  page: 0,
  contact: 1,
  campaign: 2,
  lead: 3,
  tag: 4,
  media: 5,
  flow: 6,
  chatbot: 7,
  "ai-assistant": 8,
  webhook: 9,
  column: 10,
  "opt-keyword": 11,
  "whatsapp-flow": 12,
  "faq-bot": 13,
  reminder: 14,
  "team-member": 15,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q");
    const query = rawQuery?.toLowerCase().trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Get userId from JWT token in cookies
    const userId = await getUserId(request);
    if (!userId) {
      console.log("Unauthorized search attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Searching for: "${query}" by user ${userId}`);

    const results: SearchResult[] = [];

    /**
     * Build an array of named query functions (don't execute yet).
     * Each function returns the promise for that model's results.
     */
    const queries: { key: string; fn: () => Promise<any[]> }[] = [
      {
        key: "contacts",
        fn: () =>
          prisma.contact.findMany({
            where: {
              userId,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
                { email: { contains: query, mode: "insensitive" } },
                { source: { contains: query, mode: "insensitive" } },
              ],
            },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, phone: true, email: true, source: true },
          }),
      },

      {
        key: "campaigns",
        fn: () =>
          prisma.campaign.findMany({
            where: {
              userId,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { type: { contains: query, mode: "insensitive" } },
              ],
            },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, description: true, type: true, status: true },
          }),
      },

      {
        key: "tags",
        fn: () =>
          prisma.tag.findMany({
            where: { userId, name: { contains: query, mode: "insensitive" } },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, group: true },
          }),
      },

      {
        key: "leads",
        fn: () =>
          prisma.lead.findMany({
            where: { userId, OR: [{ name: { contains: query, mode: "insensitive" } }, { source: { contains: query, mode: "insensitive" } }] },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, source: true },
          }),
      },

      {
        key: "media",
        fn: () =>
          prisma.media.findMany({
            where: { userId, OR: [{ name: { contains: query, mode: "insensitive" } }, { fileName: { contains: query, mode: "insensitive" } }, { type: { contains: query, mode: "insensitive" } }] },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, fileName: true, type: true, size: true },
          }),
      },

      {
        key: "flows",
        fn: () =>
          prisma.flow.findMany({
            where: { userId, name: { contains: query, mode: "insensitive" } },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, status: true },
          }),
      },

      {
        key: "chatbots",
        fn: () =>
          prisma.chatbot.findMany({
            where: { userId, OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, description: true, status: true, published: true },
          }),
      },

      {
        key: "aiAssistants",
        fn: () =>
          prisma.aiAssistant.findMany({
            where: { userId, OR: [{ name: { contains: query, mode: "insensitive" } }, { role: { contains: query, mode: "insensitive" } }, { provider: { contains: query, mode: "insensitive" } }] },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, role: true, status: true, provider: true },
          }),
      },

      {
        key: "webhooks",
        fn: () =>
          prisma.webhookEndpoint.findMany({
            where: { userId, OR: [{ name: { contains: query, mode: "insensitive" } }, { url: { contains: query, mode: "insensitive" } }] },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, url: true, isActive: true },
          }),
      },

      {
        key: "columns",
        fn: () =>
          prisma.column.findMany({
            where: { userId, label: { contains: query, mode: "insensitive" } },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, label: true, type: true, visible: true },
          }),
      },

      {
        key: "optKeywords",
        fn: () =>
          prisma.optKeyword.findMany({
            where: { userId, OR: [{ keyword: { contains: query, mode: "insensitive" } }, { type: { contains: query, mode: "insensitive" } }] },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, keyword: true, type: true },
          }),
      },

      {
        key: "whatsappFlows",
        fn: () =>
          prisma.whatsappFlow.findMany({
            where: { userId, name: { contains: query, mode: "insensitive" } },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, status: true, flowId: true },
          }),
      },

      {
        key: "faqBots",
        fn: () =>
          prisma.chatbotFAQ.findMany({
            where: { userId, OR: [{ name: { contains: query, mode: "insensitive" } }, { phone: { contains: query } }] },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, phone: true, faqBotId: true },
          }),
      },

      {
        key: "reminders",
        fn: () =>
          prisma.reminder.findMany({
            where: { userId, note: { contains: query, mode: "insensitive" } },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, note: true, date: true, time: true, triggered: true },
          }),
      },

      {
        key: "teamMembers",
        fn: () =>
          prisma.teamMember.findMany({
            where: { ownerId: userId, OR: [{ email: { contains: query, mode: "insensitive" } }, { phone: { contains: query } }, { role: { contains: query, mode: "insensitive" } }] },
            take: MAX_PER_MODEL,
            orderBy: { createdAt: "desc" },
            select: { id: true, email: true, phone: true, role: true, user: { select: { name: true } } },
          }),
      },
    ];

    /**
     * Execute the queries in chunks (CONCURRENCY) to limit simultaneous DB connections.
     * Collect results into a map keyed by the query's key.
     */
    const resultsByKey: Record<string, any[]> = {};
    for (let i = 0; i < queries.length; i += CONCURRENCY) {
      const chunk = queries.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(chunk.map((q) => q.fn()));
      for (let j = 0; j < settled.length; j++) {
        const key = chunk[j].key;
        const res = settled[j];
        if (res.status === "fulfilled") {
          resultsByKey[key] = res.value ?? [];
        } else {
          console.error(`Error fetching ${key}:`, res.reason);
          resultsByKey[key] = [];
        }
      }
    }

    // Add results to the unified results array (mapping to SearchResult shape)
    (resultsByKey.contacts || []).forEach((contact) =>
      results.push({
        id: contact.id,
        type: "contact",
        title: contact.name || "Contact",
        subtitle: [contact.phone, contact.email, contact.source].filter(Boolean).join(" • ") || "Contact",
        url: `/inbox?contactId=${contact.id}`,
      })
    );

    (resultsByKey.campaigns || []).forEach((campaign) =>
      results.push({
        id: campaign.id,
        type: "campaign",
        title: campaign.name,
        subtitle: campaign.description || `${campaign.type} • ${campaign.status}`,
        url: `/campaigns`,
      })
    );

    (resultsByKey.tags || []).forEach((tag) =>
      results.push({
        id: tag.id,
        type: "tag",
        title: `#${tag.name}`,
        subtitle: tag.group || "Tag",
        url: `/manage/tags`,
      })
    );

    (resultsByKey.leads || []).forEach((lead) =>
      results.push({
        id: lead.id,
        type: "lead",
        title: lead.name,
        subtitle: lead.source || "Lead",
        url: `/leads?id=${lead.id}`,
      })
    );

    (resultsByKey.media || []).forEach((item) =>
      results.push({
        id: item.id,
        type: "media",
        title: item.name,
        subtitle: `${item.type} • ${item.size}`,
        url: `/gallery?mediaId=${item.id}`,
      })
    );

    (resultsByKey.flows || []).forEach((flow) =>
      results.push({
        id: flow.id,
        type: "flow",
        title: flow.name,
        subtitle: `Status: ${flow.status}`,
        url: `/flows/${flow.id}`,
      })
    );

    (resultsByKey.chatbots || []).forEach((chatbot) =>
      results.push({
        id: chatbot.id,
        type: "chatbot",
        title: chatbot.name,
        subtitle: chatbot.description || `${chatbot.status} • ${chatbot.published ? "Published" : "Draft"}`,
        url: `/chatbot`,
      })
    );

    (resultsByKey.aiAssistants || []).forEach((assistant) =>
      results.push({
        id: assistant.id,
        type: "ai-assistant",
        title: assistant.name,
        subtitle: `${assistant.role} • ${assistant.provider} • ${assistant.status}`,
        url: `/ai-assistant`,
      })
    );

    (resultsByKey.webhooks || []).forEach((webhook) =>
      results.push({
        id: webhook.id,
        type: "webhook",
        title: webhook.name,
        subtitle: `${webhook.url} • ${webhook.isActive ? "Active" : "Inactive"}`,
        url: `/manage/webhooks?id=${webhook.id}`,
      })
    );

    (resultsByKey.columns || []).forEach((column) =>
      results.push({
        id: column.id,
        type: "column",
        title: column.label,
        subtitle: `${column.type} • ${column.visible ? "Visible" : "Hidden"}`,
        url: `/manage/columns`,
      })
    );

    (resultsByKey.optKeywords || []).forEach((opt) =>
      results.push({
        id: opt.id,
        type: "opt-keyword",
        title: opt.keyword,
        subtitle: `Type: ${opt.type}`,
        url: `/manage/opts-management`,
      })
    );

    (resultsByKey.whatsappFlows || []).forEach((wf) =>
      results.push({
        id: wf.id,
        type: "whatsapp-flow",
        title: wf.name,
        subtitle: `Flow ID: ${wf.flowId} • ${wf.status}`,
        url: `/manage/whatsapp-flows/${wf.id}`,
      })
    );

    (resultsByKey.faqBots || []).forEach((bot) =>
      results.push({
        id: bot.id,
        type: "faq-bot",
        title: bot.name,
        subtitle: `Phone: ${bot.phone}`,
        url: `/faq-bot`,
      })
    );

    (resultsByKey.reminders || []).forEach((reminder) =>
      results.push({
        id: reminder.id,
        type: "reminder",
        title: reminder.note,
        subtitle: `${reminder.date} at ${reminder.time} • ${reminder.triggered ? "Triggered" : "Pending"}`,
        url: `/reminder?id=${reminder.id}`,
      })
    );

    (resultsByKey.teamMembers || []).forEach((member) =>
      results.push({
        id: member.id,
        type: "team-member",
        title: member.user?.name || member.email || "Team Member",
        subtitle: `${member.role} • ${member.email || member.phone || ""}`,
        url: `/settings/team?memberId=${member.id}`,
      })
    );

    // Add page routes that match
    const matchingPages = PAGES.filter((page) => {
      const pageName = page.name.toLowerCase();
      const keywords = page.keywords.join(" ").toLowerCase();
      return pageName.includes(query) || keywords.includes(query);
    });

    matchingPages.forEach((page) =>
      results.push({
        id: page.url,
        type: "page",
        title: page.name,
        subtitle: "Navigate to page",
        url: page.url,
      })
    );

    // Sort results by relevance 
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      // Exact match first
      const aExact = aTitle === query;
      const bExact = bTitle === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Starts with second
      const aStarts = aTitle.startsWith(query);
      const bStarts = bTitle.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Fallback to type priority
      return (typeOrder[a.type] ?? 999) - (typeOrder[b.type] ?? 999);
    });

    // Limit total number of results to MAX_TOTAL_RESULTS
    const limitedResults = results.slice(0, MAX_TOTAL_RESULTS);

    console.log(`Returning ${limitedResults.length} total results`);
    return NextResponse.json({ results: limitedResults });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : "Unknown",
      },
      { status: 500 }
    );
  }
}

/**
 * Extract user id from JWT stored in cookies
 */
async function getUserId(request: NextRequest): Promise<number | null> {
  try {
    // NextRequest.cookies is safe to use here (server-side)
    const token = request.cookies.get("token")?.value;
    if (!token) {
      console.log(" No token found in cookies");
      return null;
    }

    if (!JWT_SECRET) {
      console.error("Cannot verify token — JWT_SECRET missing");
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log("User authenticated:", decoded.id);
    return decoded.id;
  } catch (error) {
    console.error("Error getting userId:", error);
    return null;
  }
}
