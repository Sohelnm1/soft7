import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchWabaAndPhoneFromToken } from "@/lib/whatsapp-meta";
import { startBackgroundResolution } from "@/lib/whatsapp-embedded-resolver";

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
 * 
 * Supports eventual consistency: if WABA/phone not immediately available,
 * creates a PENDING account and starts background resolution.
 */
export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl(req);

  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const metaError = searchParams.get("error");
    const wabaId = searchParams.get("waba_id");
    const phoneNumberId = searchParams.get("phone_number_id");

    // ============================================
    // EMBEDDED SIGNUP CALLBACK LOGGING
    // Log all incoming parameters from Meta
    // ============================================
    console.log("\n");
    console.log("#".repeat(80));
    console.log("[EMBEDDED SIGNUP CALLBACK RECEIVED]", new Date().toISOString());
    console.log("Full URL:", req.url);
    console.log("\n--- Query Parameters from Meta ---");
    console.log("code:", code ? `${code.substring(0, 20)}...` : "null");
    console.log("state:", state);
    console.log("error:", metaError);
    console.log("waba_id:", wabaId);
    console.log("phone_number_id:", phoneNumberId);

    // Log ALL query parameters to see everything Meta sends
    console.log("\n--- All Query Parameters ---");
    searchParams.forEach((value, key) => {
      if (key === "code" || key === "access_token") {
        console.log(`${key}:`, value ? `${value.substring(0, 20)}...` : "null");
      } else {
        console.log(`${key}:`, value);
      }
    });
    console.log("#".repeat(80));

    // User cancelled or Meta returned an error – show friendly message
    if (metaError) {
      const errorMsg = metaError === "access_denied" ? "cancelled" : metaError;
      return NextResponse.redirect(
        new URL(
          `/integrations/whatsapp/embedded-signup?error=${encodeURIComponent(errorMsg)}`,
          baseUrl,
        ),
      );
    }

    // Need at least code to proceed (state is optional – we use DEFAULT_USER_ID if missing)
    if (!code) {
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
        console.log("Decoded state:", decoded, "-> userId:", userId);
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

    // For FB.login with Embedded Signup popup flow, the redirect_uri handling is different:
    // - The popup returns the code directly to JavaScript (no redirect)
    // - When exchanging the code, we should try without redirect_uri first
    // - If that fails, try with the configured callback URL

    console.log("\n--- Token Exchange ---");
    console.log("Exchanging code for access token...");
    console.log("Trying without redirect_uri first (popup flow)...");

    // First try: Exchange without redirect_uri (popup flow doesn't use redirects)
    let tokenResponse = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?` +
      `client_id=${META_APP_ID}&` +
      `client_secret=${META_APP_SECRET}&` +
      `code=${code}`,
      { method: "GET" },
    );

    let tokenData = await tokenResponse.json();

    // If first attempt fails with redirect_uri error, try with the configured URI
    if (tokenData.error && tokenData.error.error_subcode === 36008) {
      console.log("First attempt failed, trying with configured redirect_uri...");

      const configuredRedirectUri = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/whatsapp/embedded-signup/callback`
        : `${baseUrl}/api/whatsapp/embedded-signup/callback`;

      console.log("Using redirect_uri:", configuredRedirectUri);

      tokenResponse = await fetch(
        `https://graph.facebook.com/v22.0/oauth/access_token?` +
        `client_id=${META_APP_ID}&` +
        `client_secret=${META_APP_SECRET}&` +
        `redirect_uri=${encodeURIComponent(configuredRedirectUri)}&` +
        `code=${code}`,
        { method: "GET" },
      );

      tokenData = await tokenResponse.json();
    }

    console.log("Token exchange response status:", tokenResponse.status);
    console.log("Token data keys:", Object.keys(tokenData));
    if (tokenData.access_token) {
      console.log("✅ Access token received");
    } else {
      console.log("❌ No access token in response");
      console.log("Token response:", JSON.stringify(tokenData, null, 2));
    }

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

    // Meta's redirect often doesn't include waba_id/phone_number_id – fetch from Graph API if missing
    let resolvedWabaId = wabaId;
    let resolvedPhoneNumberId = phoneNumberId;
    let phoneNumber: string | null = null;

    console.log("\n--- WABA/Phone Resolution ---");
    console.log("WABA ID from URL:", resolvedWabaId);
    console.log("Phone Number ID from URL:", resolvedPhoneNumberId);

    if (!resolvedWabaId || !resolvedPhoneNumberId) {
      console.log("Fetching WABA/Phone from Graph API...");
      const fromApi = await fetchWabaAndPhoneFromToken(accessToken);
      console.log("Graph API result:", JSON.stringify(fromApi, null, 2));
      if (fromApi) {
        resolvedWabaId = resolvedWabaId || fromApi.wabaId;
        resolvedPhoneNumberId = resolvedPhoneNumberId || fromApi.phoneNumberId;
        phoneNumber = fromApi.phoneNumber || phoneNumber;
      }
    }

    console.log("Resolved WABA ID:", resolvedWabaId);
    console.log("Resolved Phone Number ID:", resolvedPhoneNumberId);

    // Get phone display number if we have phoneNumberId
    if (resolvedPhoneNumberId && !phoneNumber) {
      try {
        const phoneResponse = await fetch(
          `https://graph.facebook.com/v22.0/${resolvedPhoneNumberId}?access_token=${encodeURIComponent(accessToken)}`,
          { method: "GET" },
        );
        const phoneData = await phoneResponse.json();
        console.log("Phone number API response:", JSON.stringify(phoneData, null, 2));
        phoneNumber =
          phoneData.display_phone_number || phoneData.verified_name || null;
      } catch (error) {
        console.error("Failed to fetch phone number:", error);
      }
    }

    // Handle eventual consistency: if WABA or phone number is still missing,
    // create a PENDING account and start background resolution
    if (!resolvedWabaId || !resolvedPhoneNumberId) {
      console.log(
        "WABA or Phone Number ID not immediately available, checking for existing pending account...",
      );

      // Check if user already has a pending account (to avoid duplicates)
      let pendingAccount = await prisma.whatsAppAccount.findFirst({
        where: {
          userId,
          status: "PENDING_EMBEDDED_SIGNUP",
        },
        orderBy: { createdAt: "desc" },
      });

      if (pendingAccount) {
        // Update existing pending account with new token
        console.log(`Found existing pending account ${pendingAccount.id}, updating...`);
        pendingAccount = await prisma.whatsAppAccount.update({
          where: { id: pendingAccount.id },
          data: {
            accessToken,
            wabaId: resolvedWabaId || pendingAccount.wabaId,
            phoneNumberId: resolvedPhoneNumberId || pendingAccount.phoneNumberId,
            phoneNumber: phoneNumber || pendingAccount.phoneNumber,
          },
        });
      } else {
        // Create new pending account
        console.log("No existing pending account, creating new one...");
        pendingAccount = await prisma.whatsAppAccount.create({
          data: {
            userId,
            accessToken,
            wabaId: resolvedWabaId || null,
            phoneNumberId: resolvedPhoneNumberId || null,
            phoneNumber: phoneNumber || null,
            apiVersion: "v22.0",
            isActive: false,
            status: "PENDING_EMBEDDED_SIGNUP",
          },
        });
        console.log(`Created pending account ${pendingAccount.id} for user ${userId}`);
      }

      // Start background resolution (non-blocking)
      startBackgroundResolution(pendingAccount.id, accessToken);

      // Redirect to pending status page
      return NextResponse.redirect(
        new URL(
          `/integrations/whatsapp?status=pending&account_id=${pendingAccount.id}`,
          baseUrl,
        ),
      );
    }

    // WABA and phone number available - create ACTIVE account
    const account = await prisma.whatsAppAccount.upsert({
      where: {
        userId_phoneNumberId: {
          userId,
          phoneNumberId: resolvedPhoneNumberId,
        },
      },
      update: {
        accessToken,
        wabaId: resolvedWabaId,
        phoneNumber: phoneNumber || undefined,
        isActive: true,
        status: "ACTIVE",
      },
      create: {
        userId,
        wabaId: resolvedWabaId,
        phoneNumberId: resolvedPhoneNumberId,
        accessToken,
        phoneNumber: phoneNumber || undefined,
        apiVersion: "v22.0",
        isActive: true,
        status: "ACTIVE",
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

    // ============================================
    // CRITICAL: Subscribe your app to webhooks on the customer's WABA
    // Per Meta docs: This is REQUIRED to receive messages and statuses!
    // https://developers.facebook.com/docs/whatsapp/embedded-signup
    // ============================================
    console.log("\n--- Subscribing to WABA Webhooks (REQUIRED per Meta docs) ---");
    try {
      const subscribeResponse = await fetch(
        `https://graph.facebook.com/v22.0/${resolvedWabaId}/subscribed_apps`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const subscribeData = await subscribeResponse.json();
      console.log("Webhook subscription response:", JSON.stringify(subscribeData, null, 2));

      if (subscribeData.success) {
        console.log(`✅ Successfully subscribed to webhooks for WABA ${resolvedWabaId}`);
      } else if (subscribeData.error) {
        console.error(`⚠️ Webhook subscription error:`, subscribeData.error);
      }
    } catch (subscribeError) {
      console.error("Failed to subscribe to webhooks:", subscribeError);
      // Don't fail the whole signup for this - can retry later
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
