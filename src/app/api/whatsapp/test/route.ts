import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchWabaAndPhoneFromToken,
  isPlaceholderMetaId,
} from "@/lib/whatsapp-meta";
import { fetchTemplatesFromMeta } from "@/lib/whatsapp-templates";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await req.json();

    let account = await prisma.whatsAppAccount.findUnique({
      where: { id: Number(accountId) },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (account.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If account is in PENDING state or has missing/placeholder WABA ID, try to repair
    const needsRepair =
      account.status === "PENDING_EMBEDDED_SIGNUP" ||
      !account.wabaId ||
      !account.phoneNumberId ||
      isPlaceholderMetaId(account.wabaId);

    if (needsRepair && account.accessToken) {
      console.log(`[Test Connection] Attempting to repair account ${account.id}`);

      const fromApi = await fetchWabaAndPhoneFromToken(account.accessToken);

      if (fromApi?.wabaId && fromApi?.phoneNumberId) {
        account = await prisma.whatsAppAccount.update({
          where: { id: account.id },
          data: {
            wabaId: fromApi.wabaId,
            phoneNumberId: fromApi.phoneNumberId,
            phoneNumber: fromApi.phoneNumber || account.phoneNumber,
            status: "ACTIVE",
            isActive: true,
          },
        });
        console.log(`[Test Connection] Successfully repaired account ${account.id}`);
      } else if (!account.wabaId || !account.phoneNumberId) {
        // Still can't get the IDs - return informative error
        return NextResponse.json(
          {
            error:
              "WhatsApp setup is still in progress. Please wait a moment and try again.",
            pending: true,
          },
          { status: 400 },
        );
      }
    }

    // Verify we have required fields
    if (!account.wabaId || !account.accessToken) {
      return NextResponse.json(
        { error: "Incomplete configuration" },
        { status: 400 },
      );
    }

    // Try to fetch templates as a test
    await fetchTemplatesFromMeta(
      account.wabaId,
      account.accessToken,
      account.apiVersion,
    );

    return NextResponse.json({
      success: true,
      message: "Connection successful!",
    });
  } catch (error: any) {
    console.error("Test connection failed:", error);
    return NextResponse.json(
      { error: error.message || "Connection failed" },
      { status: 500 },
    );
  }
}
