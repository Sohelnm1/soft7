import { NextRequest, NextResponse } from "next/server";
import { processWebhookQueue } from "@/lib/webhook-processor";

export async function GET(req: NextRequest) {
    // Optional: Add simple security check
    const authHeader = req.headers.get("authorization");
    if (process.env.INTERNAL_JOB_TOKEN && authHeader !== `Bearer ${process.env.INTERNAL_JOB_TOKEN}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await processWebhookQueue(500);
        return NextResponse.json({
            success: true,
            processed: result.processed,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
