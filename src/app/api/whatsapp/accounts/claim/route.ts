import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
const DEFAULT_USER_ID = Number(process.env.DEFAULT_USER_ID || 1);

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
  } catch {
    return null;
  }
}

/**
 * Assign an embedded-signup account to the current user if it was created under DEFAULT_USER_ID.
 * Call this when landing on /integrations/whatsapp?success=true&account_id=X so the list shows the account.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const accountId = Number(body.accountId ?? body.account_id);

    if (!accountId || isNaN(accountId)) {
      return NextResponse.json(
        { error: "Missing or invalid accountId" },
        { status: 400 },
      );
    }

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Only reassign if the account is under the default user (e.g. embedded signup without state)
    if (account.userId !== DEFAULT_USER_ID) {
      return NextResponse.json({
        success: true,
        claimed: false,
        message: "Account already belongs to a user",
      });
    }

    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      claimed: true,
      message: "Account assigned to you",
    });
  } catch (error: any) {
    console.error("Claim account error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to claim account" },
      { status: 500 },
    );
  }
}
