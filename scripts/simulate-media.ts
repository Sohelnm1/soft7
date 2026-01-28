import { MessageService } from "../src/services/message.service";
import { prisma } from "../src/lib/prisma";

async function simulateMediaWebhook() {
    console.log("🚀 Simulating Incoming Media Webhook...");

    const payload = {
        contacts: [{
            wa_id: "917666113277",
            profile: { name: "shaikh sohel" }
        }],
        messages: [{
            id: "test_media_wamid_" + Date.now(),
            from: "917666113277",
            type: "image",
            image: {
                id: "2710933332574102",
                mime_type: "image/jpeg",
                sha256: "lxhTht4PoxZhQn6fkfjQ0aRHo0WAnHajDnkRiuDUQ7M=",
                caption: "This is a test image caption"
            },
            timestamp: Math.floor(Date.now() / 1000).toString()
        }],
        metadata: {
            phone_number_id: "233945809799030", // Replace with valid phone_number_id if needed
            display_phone_number: "15551339735"
        }
    };

    const message = payload.messages[0];
    const contact = payload.contacts[0];
    const metadata = payload.metadata;

    try {
        // Ensure the WA Account exists for the test
        const acc = await prisma.whatsAppAccount.findFirst({
            where: { phoneNumberId: metadata.phone_number_id }
        });

        if (!acc) {
            console.error("❌ Error: No WhatsApp Account found with phoneNumberId " + metadata.phone_number_id);
            console.log("Please ensure a WhatsAppAccount exists in your database for this test.");
            process.exit(1);
        }

        const savedMsg = await MessageService.handleInbound(message, contact, metadata);

        console.log("✅ Message processed!");
        console.log("Stored Content:", savedMsg.content);
        console.log("Media ID:", savedMsg.mediaUrl);
        console.log("Caption:", savedMsg.caption);
        console.log("Phone Number (Normalized):", savedMsg.whatsappMessageId); // Wait, phone is in contact

        const storedContact = await prisma.contact.findUnique({
            where: { id: savedMsg.contactId }
        });
        console.log("Contact Phone:", storedContact?.phone);

    } catch (error: any) {
        console.error("❌ Simulation failed:", error.message);
    } finally {
        process.exit(0);
    }
}

simulateMediaWebhook();
