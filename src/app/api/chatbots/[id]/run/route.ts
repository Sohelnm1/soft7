import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { JsonValue, JsonObject } from "@prisma/client/runtime/library";

type ParamType = { id: string };

/* =========================================================
   Helper — Get Current User from JWT Cookie
========================================================= */
async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { id: number; email: string };
  } catch {
    return null;
  }
}

/* ------------------------------- Helpers ------------------------------- */

function jObj(v: JsonValue | null | undefined): JsonObject {
  return (v && typeof v === "object" && !Array.isArray(v) ? (v as JsonObject) : {}) as JsonObject;
}

function jArr(v: JsonValue | null | undefined): JsonValue[] {
  return Array.isArray(v) ? (v as JsonValue[]) : [];
}

function s(v: unknown, def = ""): string {
  return typeof v === "string" ? v : def;
}

function isDigitsOnly(x: string) {
  return /^[0-9]+$/.test((x || "").trim());
}

function includes(hay: string, needle: string) {
  return (hay || "").toLowerCase().includes((needle || "").toLowerCase());
}

function evalExpr(expr: string, text: string): boolean {
  const t = (text || "").trim();
  if (isDigitsOnly(expr)) return t === expr.trim();

  const api = {
    text: t,
    includes: (s2: string) => includes(t, s2),
    equals: (s2: string) => t.toLowerCase() === s2.toLowerCase(),
    startsWith: (s2: string) => t.toLowerCase().startsWith(s2.toLowerCase()),
    endsWith: (s2: string) => t.toLowerCase().endsWith(s2.toLowerCase()),
    length: t.length,
  };

  try {
    const fn = new Function("text", "includes", "equals", "startsWith", "endsWith", "length", `return (${expr});`);
    return !!fn(api.text, api.includes, api.equals, api.startsWith, api.endsWith, api.length);
  } catch (err) {
    console.error("Expression evaluation error:", err);
    return false;
  }
}

async function runAINode(prompt: string, userMessage: string): Promise<{ reply: string; route?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API key not configured");
    return { reply: `AI: ${userMessage}`, route: "" };
  }

  const sys = `You are a helpful assistant. You must respond ONLY with valid JSON in this exact format: {"reply":"your response here","route":"optional_route_label"}. The "route" field should match one of the outgoing edge labels if you want to direct the conversation flow, or leave it empty.`;

  const body = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `${prompt}\n\nUser message: ${userMessage}` }
    ],
    response_format: { type: "json_object" as const },
  };

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      console.error("OpenAI API error:", await resp.text());
      return { reply: "AI service unavailable.", route: "" };
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(raw);
      return { reply: s(parsed.reply, "Okay."), route: s(parsed.route, "").trim() };
    } catch {
      return { reply: raw || "Okay.", route: "" };
    }
  } catch (err) {
    console.error("AI API error:", err);
    return { reply: "AI error occurred.", route: "" };
  }
}

/* --------------------------- Main POST handler -------------------------- */

export async function POST(req: Request, ctx: { params: Promise<ParamType> }) {
  const { id: chatbotId } = await ctx.params;

  try {
    /* ---------------- USER AUTH ---------------- */
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    /* ---------------- INPUT ---------------- */
    const { message, sessionKey } = await req.json();
    const userMsg = s(message).trim();

    console.log("\n" + "=".repeat(60));
    console.log("🟣 NEW REQUEST");
    console.log("=".repeat(60));
    console.log("📨 User message:", userMsg);
    console.log("🔑 Session key:", sessionKey || "default");

    /* ---------------- LOAD BOT ---------------- */
    const bot = await prisma.chatbot.findFirst({
      where: { id: chatbotId, userId: currentUser.id },
      include: { nodes: true, edges: true },
    });

    if (!bot)
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

    console.log("🤖 Bot loaded:", bot.name);
    console.log("📊 Stats: Nodes =", bot.nodes.length, "| Edges =", bot.edges.length);

    /* ---------------- SESSION ---------------- */
    const sessionKeyValue = s(sessionKey, "web-session");
    let session = await prisma.chatSession.findFirst({
      where: { chatbotId, userKey: sessionKeyValue },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          chatbotId,
          userKey: sessionKeyValue,
          lastNodeId: null,
          lastMessage: null,
        },
      });
      console.log("✅ Created new session:", session.id);
    } else {
      console.log("📌 Existing session:", session.id);
    }

    console.log("💾 Session state:");
    console.log("   ├─ lastNodeId:", session.lastNodeId || "(none - new conversation)");
    console.log("   └─ lastMessage:", session.lastMessage || "(none)");

    /* ---------------- DETERMINE FLOW START ---------------- */
    let currentNodeId: string | null = null;
    const isNewConversation = !session.lastNodeId;
    const isReturningToWaitingNode = !!session.lastNodeId;

    if (isNewConversation) {
      // Brand new conversation - start from trigger
      const trigger = bot.nodes.find((n) => n.type === "trigger");
      if (!trigger) {
        console.error("❌ ERROR: No trigger node found in bot");
        return NextResponse.json({ reply: "Bot configuration error: Trigger node missing." });
      }
      currentNodeId = trigger.id;
      console.log("🚀 NEW CONVERSATION - Starting from trigger:", currentNodeId);
    } else {
      // Returning to a waiting node (button message that needs user response)
      currentNodeId = session.lastNodeId;
      console.log("🔄 CONTINUING - User responding to waiting node:", currentNodeId);
    }

    const messages: string[] = [];
    const imagePayloads: any[] = [];
    let buttonPayload: any = null;
    const MAX_STEPS = 50;

    /* ---------------- FLOW ENGINE ---------------- */
    console.log("\n" + "-".repeat(60));
    console.log("▶️  STARTING FLOW EXECUTION");
    console.log("-".repeat(60));

    for (let step = 0; step < MAX_STEPS; step++) {
      if (!currentNodeId) {
        console.log("\n⛔ Flow ended: No current node");
        break;
      }

      const node = bot.nodes.find((n) => n.id === currentNodeId);
      if (!node) {
        console.error(`\n❌ ERROR: Node ${currentNodeId} not found`);
        break;
      }

      console.log(`\n📍 STEP ${step + 1}: ${node.type.toUpperCase()}`);
      console.log(`   └─ Node ID: ${node.id}`);

      const dataObj = jObj(node.data);
      const outgoing = bot.edges.filter((e) => e.source === currentNodeId);
      console.log(`   └─ Outgoing edges: ${outgoing.length}`);

      /* ---------------- TRIGGER ---------------- */
      if (node.type === "trigger") {
        const triggerMsg = s(dataObj.text || dataObj.message || dataObj.label);
        
        if (triggerMsg) {
          console.log(`   └─ 💬 Trigger message: "${triggerMsg}"`);
          // Only show trigger message on new conversation
          if (isNewConversation) {
            messages.push(triggerMsg);
          }
        }

        if (outgoing.length === 0) {
          console.log("   └─ ⚠️  Terminal trigger (no edges)");
          break;
        }

        currentNodeId = outgoing[0].target;
        console.log(`   └─ ➡️  Next: ${currentNodeId}`);
        continue;
      }

      /* ---------------- MESSAGE NODE (with Images) ---------------- */
      if (node.type === "message") {
        const text = s(dataObj.text, "Hello");
        const images = jArr(dataObj.images);
        
        console.log(`   └─ 💬 Message: "${text}"`);
        
        if (images.length > 0) {
          console.log(`   └─ 🖼️  Images attached: ${images.length}`);
          
          // Add text message
          messages.push(text);
          
          // Process and add images
          images.forEach((img: any, idx: number) => {
            const imgObj = jObj(img);
            const url = s(imgObj.url);
            const caption = s(imgObj.caption);
            
            if (url) {
              console.log(`      ├─ Image ${idx + 1}: ${caption || '(no caption)'}`);
              imagePayloads.push({
                type: "image",
                url: url,
                caption: caption
              });
            }
          });
        } else {
          messages.push(text);
        }

        if (outgoing.length === 0) {
          console.log("   └─ ⚠️  Terminal message");
          await prisma.chatSession.update({
            where: { id: session.id },
            data: { lastNodeId: null, lastMessage: userMsg },
          });
          break;
        }

        currentNodeId = outgoing[0].target;
        console.log(`   └─ ➡️  Next: ${currentNodeId}`);
        continue;
      }

      /* ---------------- IMAGE NODE ---------------- */
      if (node.type === "image") {
        const images = jArr(dataObj.images);
        
        console.log(`   └─ 🖼️  Image Node: ${images.length} images`);
        
        images.forEach((img: any, idx: number) => {
          const imgObj = jObj(img);
          const url = s(imgObj.url);
          const caption = s(imgObj.caption);
          
          if (url) {
            console.log(`      ├─ Image ${idx + 1}: ${caption || '(no caption)'}`);
            imagePayloads.push({
              type: "image",
              url: url,
              caption: caption
            });
          }
        });

        if (outgoing.length === 0) {
          console.log("   └─ ⚠️  Terminal image node");
          await prisma.chatSession.update({
            where: { id: session.id },
            data: { lastNodeId: null, lastMessage: userMsg },
          });
          break;
        }

        currentNodeId = outgoing[0].target;
        console.log(`   └─ ➡️  Next: ${currentNodeId}`);
        continue;
      }

      /* ---------------- BUTTON MESSAGE ---------------- */
      if (node.type === "buttonMessage") {
        const text = s(dataObj.text, "Choose an option:");
        const buttons = jArr(dataObj.buttons).map((x) => s(x)).filter(Boolean);

        console.log(`   └─ 🔘 Button node`);
        console.log(`   └─ Text: "${text}"`);
        console.log(`   └─ Buttons: [${buttons.join(", ")}]`);

        // Check if we're at this node for the FIRST time in this request cycle
        if (isReturningToWaitingNode && session.lastNodeId === currentNodeId) {
          // User is responding to THIS button message
          console.log(`   └─ 👆 User responding with: "${userMsg}"`);

          // Find the edge that matches the user's button click
          let matchedEdge = null;
          
          for (const edge of outgoing) {
            const edgeLabel = s(edge.label).toLowerCase().trim();
            const userChoice = userMsg.toLowerCase().trim();
            console.log(`      ├─ Comparing: "${edgeLabel}" === "${userChoice}"`);
            
            if (edgeLabel === userChoice) {
              matchedEdge = edge;
              console.log(`      └─ ✅ MATCH FOUND!`);
              break;
            }
          }

          if (!matchedEdge) {
            console.log(`   └─ ❌ Invalid button selection`);
            messages.push("❌ Invalid selection. Please choose one of the available options.");
            buttonPayload = { type: "button", text, buttons };
            
            // Keep waiting at this same node
            await prisma.chatSession.update({
              where: { id: session.id },
              data: { lastNodeId: currentNodeId, lastMessage: userMsg },
            });
            break;
          }

          // Valid button clicked - move to next node
          console.log(`   └─ ➡️  Moving to: ${matchedEdge.target}`);
          currentNodeId = matchedEdge.target;
          
          // Continue flowing through the rest of the conversation
          continue;
        } else {
          // First time encountering this button node - show it to user
          console.log(`   └─ 🎯 First encounter - showing buttons to user`);
          buttonPayload = { type: "button", text, buttons };
          
          // Wait here for user response
          await prisma.chatSession.update({
            where: { id: session.id },
            data: { lastNodeId: currentNodeId, lastMessage: userMsg },
          });
          
          console.log(`   └─ ⏸️  Waiting for user to click button`);
          break;
        }
      }

      /* ---------------- CONDITION ---------------- */
      if (node.type === "condition") {
        const expr = s(dataObj.expr, "");
        console.log(`   └─ 🔀 Condition: "${expr}"`);
        console.log(`   └─ Testing against: "${userMsg}"`);
        
        const conditionResult = evalExpr(expr, userMsg);
        console.log(`   └─ Result: ${conditionResult ? "✅ TRUE" : "❌ FALSE"}`);

        const branch = conditionResult ? "true" : "false";

        let matchedEdge = outgoing.find((e) => {
          const edgeData = jObj(e.data);
          return s(edgeData.branch) === branch;
        });

        if (!matchedEdge && outgoing.length > 0) {
          console.log(`   └─ ⚠️  No branch match, using first edge`);
          matchedEdge = outgoing[0];
        }

        if (!matchedEdge) {
          console.log(`   └─ ❌ No outgoing edges`);
          break;
        }

        console.log(`   └─ ➡️  Following ${branch} branch to: ${matchedEdge.target}`);
        currentNodeId = matchedEdge.target;
        continue;
      }

      /* ---------------- AI NODE ---------------- */
      if (node.type === "ai") {
        const prompt = s(dataObj.prompt, "You are a helpful assistant.");
        console.log(`   └─ 🤖 AI Node`);
        console.log(`   └─ Prompt: ${prompt.substring(0, 60)}...`);
        
        const { reply, route } = await runAINode(prompt, userMsg);
        messages.push(reply);
        console.log(`   └─ 💬 AI Reply: ${reply.substring(0, 60)}...`);
        console.log(`   └─ 🛤️  Route: ${route || "(none)"}`);

        if (route && outgoing.length > 0) {
          const matchedEdge = outgoing.find((e) => {
            const edgeLabel = s(e.label).trim().toLowerCase();
            return edgeLabel === route.toLowerCase();
          });

          if (matchedEdge) {
            console.log(`   └─ ✅ Route matched: ${matchedEdge.target}`);
            currentNodeId = matchedEdge.target;
            continue;
          }
        }

        if (outgoing.length > 0) {
          currentNodeId = outgoing[0].target;
          console.log(`   └─ ➡️  Next: ${currentNodeId}`);
          continue;
        }

        console.log(`   └─ ⚠️  Terminal AI node`);
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { lastNodeId: null, lastMessage: userMsg },
        });
        break;
      }

      /* ---------------- ACTION NODE ---------------- */
      if (node.type === "action") {
        const method = s(dataObj.method, "POST");
        const url = s(dataObj.url, "");
        console.log(`   └─ 🌐 Action: ${method} ${url}`);
        
        messages.push(`✅ Action executed: ${method} ${url}`);

        if (outgoing.length > 0) {
          currentNodeId = outgoing[0].target;
          console.log(`   └─ ➡️  Next: ${currentNodeId}`);
          continue;
        }

        console.log(`   └─ ⚠️  Terminal action`);
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { lastNodeId: null, lastMessage: userMsg },
        });
        break;
      }

      console.log(`   └─ ⚠️  Unknown node type: ${node.type}`);
      break;
    }

    /* ---------------- FINAL RESPONSE ---------------- */
    console.log("\n" + "-".repeat(60));
    console.log("📤 PREPARING RESPONSE");
    console.log("-".repeat(60));

    let reply: string | object;

    if (buttonPayload) {
      reply = JSON.stringify(buttonPayload);
      console.log("✅ Response type: BUTTON PAYLOAD");
      console.log("   └─ Text:", buttonPayload.text);
      console.log("   └─ Buttons:", buttonPayload.buttons.join(", "));
    } else if (imagePayloads.length > 0) {
      // Return images with optional text
      reply = JSON.stringify({
        type: "media",
        text: messages.length > 0 ? messages.join("\n\n") : "",
        images: imagePayloads
      });
      console.log("✅ Response type: MEDIA (with images)");
      console.log("   └─ Images:", imagePayloads.length);
      console.log("   └─ Text:", messages.length > 0 ? "Yes" : "No");
    } else if (messages.length > 0) {
      reply = messages.join("\n\n");
      console.log("✅ Response type: TEXT MESSAGE");
      console.log("   └─ Messages:", messages.length);
      console.log("   └─ Content:", reply.substring(0, 100) + (reply.length > 100 ? "..." : ""));
    } else {
      reply = "No response configured.";
      console.log("⚠️  Response type: DEFAULT (empty)");
    }

    console.log("=".repeat(60));
    console.log("✅ REQUEST COMPLETE");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({ reply, sessionKey: sessionKeyValue });

  } catch (err) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ FATAL ERROR");
    console.error("=".repeat(60));
    console.error(err);
    console.error("=".repeat(60) + "\n");
    
    return NextResponse.json({ 
      reply: "Sorry, an error occurred while processing your message.",
      error: process.env.NODE_ENV === "development" ? String(err) : undefined
    }, { status: 500 });
  }
}