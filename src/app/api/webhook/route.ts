import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import { initSocket } from "@/lib/socket";
export async function POST(req: Request) {
  const body = await req.json();

  const messageText =
    body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

  const from =
    body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

  if (!messageText || !from) {
    return NextResponse.json({ status: "ignored" });
  }

  // 🔹 Save message
  const savedMessage = await prisma.message.create({
    data: {
      text: messageText,
      from,
      sentBy: "contact",
      contact: {
        connect: { phone: from },
      },
    },
  });

  // 🔹 Emit realtime event
  const io = getIO();
  io.emit("new_message", savedMessage);

  return NextResponse.json({ status: "ok" });
}
