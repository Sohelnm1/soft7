import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

/** Try to get current user from cookie (optional – used to link new account to logged-in user) */
async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch {
    return null;
  }
}

/**
 * Public endpoint to get app configuration for embedded signup widget.
 * If user is logged in, returns state so the new account is linked to them.
 */
export async function GET(req: NextRequest) {
  try {
    const account = await prisma.whatsAppAccount.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!account || !account.appId) {
      return NextResponse.json(
        { error: "App configuration not found" },
        { status: 404 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (req.headers.get("x-forwarded-proto") && req.headers.get("host")
        ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get("host")}`
        : "http://localhost:3000");

    const redirectUri = `${baseUrl}/api/whatsapp/embedded-signup/callback`;

    // If user is logged in, pass state so callback links the new account to this user
    const userId = await getCurrentUserId();
    const state = userId
      ? Buffer.from(`${userId}-${Date.now()}`).toString("base64")
      : undefined;

    return NextResponse.json({
      appId: account.appId,
      redirectUri,
      state: state ?? undefined,
    });
  } catch (error: any) {
    console.error("Public Config Error:", error);
    return NextResponse.json(
      { error: "Failed to load configuration" },
      { status: 500 },
    );
  }
}
