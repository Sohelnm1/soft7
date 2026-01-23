import { prisma } from "@/lib/prisma";

type ExecContext = {
  chatbotId: string;
  text: string;           // user message
  sessionKey: string;     // phone or userId
};

export async function runChatbot({ chatbotId, text, sessionKey }: ExecContext) {
  // Load flow
  const bot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    include: { nodes: true, edges: true },
  });
  if (!bot) return { reply: "Bot not found." };

  // Session memory (MVP: stored JSON blob)
  const session = await prisma.chatSession.upsert({
    where: { chatbotId_userKey: { chatbotId, userKey: sessionKey } } as any,
    update: {},
    create: { chatbotId, userKey: sessionKey, memory: {} },
  });

  // Index nodes & edges
  const nodes = new Map(bot.nodes.map((n) => [n.id, n]));
  const outEdges = new Map<string, any[]>();
  bot.edges.forEach((e) => {
    outEdges.set(e.source, [...(outEdges.get(e.source) || []), e]);
  });

  // Find entry: first trigger
  const entry = bot.nodes.find((n) => n.type === "trigger");
  if (!entry) return { reply: "No trigger node in this bot." };

  // Traverse
  let cursor = entry;
  let lastReply = "";

  // Prevent infinite loops
  const visited = new Set<string>();
  for (let i = 0; i < 20; i++) {
    if (!cursor || visited.has(cursor.id)) break;
    visited.add(cursor.id);

    if (cursor.type === "message") {
      lastReply = String(cursor.data?.text ?? "");
      cursor = nextOf(cursor.id, outEdges, nodes);
      continue;
    }

    if (cursor.type === "ai") {
      const prompt = String(cursor.data?.prompt ?? "Answer briefly.");
      const modelReply = await callAI(prompt, text);
      lastReply = modelReply;
      cursor = nextOf(cursor.id, outEdges, nodes);
      continue;
    }

    if (cursor.type === "condition") {
      const expr = String(cursor.data?.expr ?? "");
      const truthy = evalCondition(expr, text);
      const choices = outEdges.get(cursor.id) || [];
      const edge = choices.find((e) => e.source === cursor.id && (truthy ? e.sourceHandle === "true" : e.sourceHandle === "false"))
        || choices[0];
      cursor = edge ? nodes.get(edge.target) : undefined;
      continue;
    }

    if (cursor.type === "action") {
      try {
        await runAction(cursor.data);
      } catch { /* ignore */ }
      cursor = nextOf(cursor.id, outEdges, nodes);
      continue;
    }

    if (cursor.type === "trigger") {
      cursor = nextOf(cursor.id, outEdges, nodes);
      continue;
    }

    // Unknown node → stop
    break;
  }

  return { reply: lastReply || "…" };
}

function nextOf(nodeId: string, outEdges: Map<string, any[]>, nodes: Map<string, any>) {
  const e = (outEdges.get(nodeId) || [])[0];
  return e ? nodes.get(e.target) : undefined;
}

/** Very small evaluator for expressions like: includes(text,"hi") or regex(text,"\\d+") */
function evalCondition(expr: string, text: string): boolean {
  const s = expr.trim();
  try {
    if (s.startsWith("includes(")) {
      const m = s.match(/^includes\s*\(\s*text\s*,\s*"(.*)"\s*\)$/i);
      if (m) return text.toLowerCase().includes(m[1].toLowerCase());
    }
    if (s.startsWith("regex(")) {
      const m = s.match(/^regex\s*\(\s*text\s*,\s*"(.*)"\s*\)$/i);
      if (m) return new RegExp(m[1]).test(text);
    }
  } catch {}
  return false;
}

async function callAI(prompt: string, userText: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return `[AI disabled] ${prompt} | user: ${userText}`;
  // Minimal call (text completion via Responses API is fine if you’re using openai SDK v4+)
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userText },
        ],
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "[AI error]";
  } catch {
    return "[AI error]";
  }
}

async function runAction(data: any) {
  const url = String(data?.url || "");
  const method = String(data?.method || "POST").toUpperCase();
  const body = data?.body ? safeJson(data.body) : undefined;
  if (!url) return;
  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body || {}),
  });
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
