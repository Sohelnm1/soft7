import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Build app base URL for redirects – use env or forwarded headers so live never redirects to localhost */
function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

/**
 * Callback endpoint for WhatsApp Embedded Signup
 * This is called by Meta after a customer completes the signup flow
 */
export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl(req);

  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const wabaId = searchParams.get("waba_id");
    const phoneNumberId = searchParams.get("phone_number_id");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/integrations/whatsapp/embedded-signup?error=missing_params",
          baseUrl,
        ),
      );
    }

    // Decode state to get user ID (if provided)
    // For new customers, we'll create a default user account
    let userId: number | null = null;
    try {
      if (state) {
        const decoded = Buffer.from(state, "base64").toString("utf-8");
        const parsedUserId = parseInt(decoded.split("-")[0]);
        if (!isNaN(parsedUserId)) {
          userId = parsedUserId;
        }
      }
    } catch {
      // State is optional for new customer signups
    }

    // If no user ID from state, use default user or create account for new customer
    if (!userId) {
      userId = Number(process.env.DEFAULT_USER_ID || 1);

      // Optionally create a new user account for the customer
      // You can customize this based on your business logic
      const createNewUser = process.env.EMBEDDED_SIGNUP_CREATE_USER === "true";
      if (createNewUser) {
        // Create a new user account (you might want to collect email/name first)
        // For now, we'll use the default user
      }
    }

    // Exchange code for access token
    const META_APP_ID = process.env.META_APP_ID;
    const META_APP_SECRET = process.env.META_APP_SECRET;

    if (!META_APP_ID || !META_APP_SECRET) {
      console.error("Meta App ID or Secret not configured");
      return NextResponse.redirect(
        new URL(
          "/integrations/whatsapp/embedded-signup?error=config_missing",
          baseUrl,
        ),
      );
    }

    const redirectUri = `${baseUrl}/api/whatsapp/embedded-signup/callback`;

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?` +
        `client_id=${META_APP_ID}&` +
        `client_secret=${META_APP_SECRET}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${code}`,
      { method: "GET" },
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Failed to exchange code for token:", tokenData);
      return NextResponse.redirect(
        new URL(
          `/integrations/whatsapp/embedded-signup?error=${encodeURIComponent(tokenData.error?.message || "token_exchange_failed")}`,
          baseUrl,
        ),
      );
    }

    const accessToken = tokenData.access_token;

    // Get phone number details if phoneNumberId is provided
    let phoneNumber = null;
    if (phoneNumberId) {
      try {
        const phoneResponse = await fetch(
          `https://graph.facebook.com/v22.0/${phoneNumberId}?access_token=${accessToken}`,
          { method: "GET" },
        );
        const phoneData = await phoneResponse.json();
        phoneNumber = phoneData.display_phone_number || phoneData.verified_name;
      } catch (error) {
        console.error("Failed to fetch phone number:", error);
      }
    }

    // Create or update WhatsApp account
    const account = await prisma.whatsAppAccount.upsert({
      where: {
        userId_phoneNumberId: {
          userId,
          phoneNumberId: phoneNumberId || `embedded_${Date.now()}`,
        },
      },
      update: {
        accessToken,
        wabaId: wabaId || undefined,
        phoneNumber: phoneNumber || undefined,
        isActive: true,
      },
      create: {
        userId,
        wabaId: wabaId || `embedded_${Date.now()}`,
        phoneNumberId: phoneNumberId || `embedded_${Date.now()}`,
        accessToken,
        phoneNumber: phoneNumber || undefined,
        apiVersion: "v22.0",
        isActive: true,
      },
    });

    // Allocate initial credits to the user
    const INITIAL_CREDITS = parseFloat(
      process.env.EMBEDDED_SIGNUP_INITIAL_CREDITS || "100",
    );
    if (INITIAL_CREDITS > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: INITIAL_CREDITS },
        },
      });

      // Record transaction
      await prisma.walletTransaction.create({
        data: {
          userId,
          amount: INITIAL_CREDITS,
          type: "TOPUP",
          messageId: `embedded_signup_${account.id}_${Date.now()}`,
        },
      });
    }

    // Redirect: back to Manage WhatsApp so user sees the new account
    const successUrl = `/integrations/whatsapp?success=true&account_id=${account.id}`;

    return NextResponse.redirect(new URL(successUrl, baseUrl));
  } catch (error: any) {
    console.error("Embedded Signup Callback Error:", error);
    return NextResponse.redirect(
      new URL(
        `/integrations/whatsapp/embedded-signup?error=${encodeURIComponent(error.message)}`,
        baseUrl,
      ),
    );
  }
}
