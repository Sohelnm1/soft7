import { prisma } from "@/lib/prisma";

// Helper to ensure phone number only contains digits for Meta API
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function sendWhatsAppMessage(
  to: string,
  text: string,
  userId: number
) {
  const config = await prisma.whatsAppAccount.findFirst({
    where: { userId, isActive: true },
  });

  if (!config) {
    throw new Error(`No active WhatsApp account found for user ${userId}. Please configure WhatsApp settings first.`);
  }

  const phoneNumberId = config.phoneNumberId;
  const accessToken = config.accessToken;
  const apiVersion = config.apiVersion || "v22.0";

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhoneNumber(to),
    type: "text",
    text: { body: text }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API error:", data);
    throw new Error(`Failed to send WhatsApp message: ${JSON.stringify(data)}`);
  }

  console.log("WhatsApp message sent:", data);
  return data;
}