import { NextResponse } from "next/server";
import { triggerFlow } from "@/lib/flow-executor";

const VERIFY_TOKEN = "mytoken123";

// ===== WEBHOOK VERIFICATION (IMPORTANT) =====
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Verification failed", { status: 403 });
}

// ===== HANDLE INCOMING MESSAGES =====
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0]?.changes?.[0]?.value;

    if (!entry) return NextResponse.json({ received: true });

    const messages = entry.messages || [];

    for (const message of messages) {
      const triggerType = detectTriggerType(message);

      const flowId = 2;

      await triggerFlow(flowId, 0, {
        from: message.from,
        text: message.text?.body,
        type: triggerType,
        raw: message
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function detectTriggerType(msg: any) {
  if (msg.type === "text") return "text_message_received";
  if (msg.type === "interactive" && msg.interactive.type === "list_reply")
    return "list_reply";
  if (msg.type === "interactive" && msg.interactive.type === "button_reply")
    return "interactive_button_reply";
  if (msg.type === "button") return "template_button_reply";
  if (msg.type === "form") return "form_message_response";

  return "unknown";
}
