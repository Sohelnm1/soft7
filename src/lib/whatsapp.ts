import { prisma } from "@/lib/prisma";

// Helper function to extract full template content from components
function extractTemplateContent(components: any, parameters?: any[]): string {
  if (!components || !Array.isArray(components)) return "";

  let content = "";

  components.forEach((component: any) => {
    if (component.type === "HEADER" && component.text) {
      content += `📌 ${component.text}\n\n`;
    }

    if (component.type === "BODY" && component.text) {
      let bodyText = component.text;
      if (parameters && parameters.length > 0) {
        bodyText = bodyText.replace(/\{\{(\d+)\}\}/g, (match: string, num: string) => {
          const index = parseInt(num) - 1;
          return parameters[index] || match;
        });
      }
      content += bodyText + "\n\n";
    }

    if (component.type === "FOOTER" && component.text) {
      content += `_${component.text}_\n\n`;
    }

    if (component.type === "BUTTONS" && component.buttons) {
      component.buttons.forEach((button: any) => {
        if (button.type === "QUICK_REPLY") {
          content += `[${button.text}]\n`;
        } else if (button.type === "URL") {
          content += `🔗 ${button.text}\n`;
        } else if (button.type === "PHONE_NUMBER") {
          content += `📞 ${button.text}\n`;
        }
      });
    }
  });

  return content.trim();
}

// Your existing function - KEEP THIS for replies within 24-hour window
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
    to,
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

// ADD THIS NEW FUNCTION for sending template messages to ANY number
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string = "en",
  userId: number,
  parameters?: any[],
  campaignId?: string,
  contactId?: number
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

  // Use provided contactId or attempt to find by phone
  let finalContactId = contactId;
  if (!finalContactId) {
    const contact = await prisma.contact.findFirst({
      where: { userId, phone: to }
    });
    if (contact) {
      finalContactId = contact.id;
    }
  }

  // Fetch template to get full content
  const template = await prisma.whatsAppTemplate.findFirst({
    where: {
      whatsappAccountId: config.id,
      name: templateName
    }
  });

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const payload: any = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      }
    }
  };

  // Add parameters if template has variables
  if (parameters && parameters.length > 0) {
    payload.template.components = [
      {
        type: "body",
        parameters: parameters.map(param => ({
          type: "text",
          text: param
        }))
      }
    ];
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  // Determine if send was successful
  const sendSuccess = response.ok;
  const errorData = !sendSuccess ? data.error : null;

  if (sendSuccess) {
    console.log("WhatsApp template sent:", data);
  } else {
    console.error("WhatsApp Template API error:", data);
  }

  // Log to Message table (both success and failure)
  try {
    console.log("[Campaign Message Logging] Starting for contact:", to, "contactId:", finalContactId, "success:", sendSuccess);

    // Extract full template content
    const templateContent = template?.components
      ? extractTemplateContent(template.components, parameters)
      : `Template: ${templateName}`;

    // We need a conversation ID. For now, create or find one.
    let conversationId = "temp_campaign_" + Date.now();
    if (finalContactId) {
      const conv = await prisma.conversation.upsert({
        where: {
          userId_phone: {
            userId,
            phone: to
          }
        },
        update: {},
        create: {
          userId,
          phone: to,
          contactId: finalContactId
        }
      });
      conversationId = conv.id;
      console.log("[Campaign Message Logging] Conversation created/found:", conversationId);
    } else {
      console.warn("[Campaign Message Logging] No contactId found, skipping message logging");
    }

    if (finalContactId && conversationId) {
      console.log("[Campaign Message Logging] Creating message record...");
      await prisma.message.create({
        data: {
          conversationId,
          contactId: finalContactId,
          userId,
          messageType: "template",
          whatsappMessageId: data.messages?.[0]?.id,
          direction: "outgoing",
          type: "template",
          status: sendSuccess ? "sent" : "failed",
          text: templateContent,
          isTemplate: true,
          templateName,
          templateLanguage: languageCode,
          templateParams: parameters ? JSON.stringify(parameters) : undefined,
          templateComponents: template?.components || null,
          campaignId: campaignId,
          sentBy: "campaign",
          // Store error details if failed
          errorCode: errorData?.code?.toString(),
          errorMessage: errorData?.message,
          error: errorData ? JSON.stringify(errorData) : undefined
        }
      });
      console.log("[Campaign Message Logging] ✅ Message created successfully with status:", sendSuccess ? "sent" : "failed");
    }

  } catch (logError) {
    console.error("[Campaign Message Logging] ❌ Failed to log campaign message to DB:", logError);
    // Don't fail the sending if logging fails
  }

  // Now throw error if send failed (after logging)
  if (!sendSuccess) {
    throw new Error(`Failed to send WhatsApp template: ${JSON.stringify(data)}`);
  }

  return data;
}