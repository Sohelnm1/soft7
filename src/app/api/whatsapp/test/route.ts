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

    if (!account.wabaId || !account.accessToken) {
      return NextResponse.json(
        { error: "Incomplete configuration" },
        { status: 400 },
      );
    }

    // If account has placeholder WABA ID (e.g. embedded_... from old callback), repair from token so Test Connection works
    if (isPlaceholderMetaId(account.wabaId)) {
      const fromApi = await fetchWabaAndPhoneFromToken(account.accessToken);
      if (fromApi?.wabaId) {
        account = await prisma.whatsAppAccount.update({
          where: { id: account.id },
          data: {
            wabaId: fromApi.wabaId,
            ...(fromApi.phoneNumber
              ? { phoneNumber: fromApi.phoneNumber }
              : {}),
            ...(fromApi.phoneNumberId &&
            isPlaceholderMetaId(account.phoneNumberId)
              ? { phoneNumberId: fromApi.phoneNumberId }
              : {}),
          },
        });
      }
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
