import { prisma } from "@/lib/prisma";
import { fetchWabaAndPhoneFromToken } from "@/lib/whatsapp-meta";

/**
 * WhatsApp Embedded Signup Resolver
 * 
 * Meta does not reliably return waba_id and phone_number_id during OAuth callback.
 * This resolver handles eventual consistency by retrying Graph API calls.
 */

const RETRY_DELAYS = [2000, 5000, 10000, 20000, 30000]; // 2s, 5s, 10s, 20s, 30s

/**
 * Resolve WABA ID and phone number ID for a pending WhatsApp account.
 * Retries up to 5 times with exponential backoff.
 * 
 * @param accountId - The WhatsApp account ID to resolve
 * @param accessToken - The access token to use for Graph API calls
 * @param attempt - Current attempt number (internal use)
 */
export async function resolveWabaAndPhoneLater(
    accountId: number,
    accessToken: string,
    attempt: number = 0
): Promise<boolean> {
    try {
        // Check if account still needs resolution
        const account = await prisma.whatsAppAccount.findUnique({
            where: { id: accountId },
        });

        if (!account) {
            console.log(`[EmbeddedResolver] Account ${accountId} not found, skipping`);
            return false;
        }

        // If account is already active with valid IDs, skip
        if (account.status === "ACTIVE" && account.wabaId && account.phoneNumberId) {
            console.log(`[EmbeddedResolver] Account ${accountId} already active, skipping`);
            return true;
        }

        // Try to fetch WABA and phone number from Graph API
        console.log(`[EmbeddedResolver] Attempt ${attempt + 1}/${RETRY_DELAYS.length + 1} for account ${accountId}`);

        const result = await fetchWabaAndPhoneFromToken(accessToken);

        if (result?.wabaId && result?.phoneNumberId) {
            // Success! Update the account
            await prisma.whatsAppAccount.update({
                where: { id: accountId },
                data: {
                    wabaId: result.wabaId,
                    phoneNumberId: result.phoneNumberId,
                    phoneNumber: result.phoneNumber || account.phoneNumber,
                    status: "ACTIVE",
                    isActive: true,
                },
            });

            console.log(`[EmbeddedResolver] Successfully resolved account ${accountId}: WABA=${result.wabaId}, Phone=${result.phoneNumberId}`);
            return true;
        }

        // If we still have retries left, schedule the next attempt
        if (attempt < RETRY_DELAYS.length) {
            const delay = RETRY_DELAYS[attempt];
            console.log(`[EmbeddedResolver] Account ${accountId} not ready, retrying in ${delay}ms...`);

            await sleep(delay);
            return resolveWabaAndPhoneLater(accountId, accessToken, attempt + 1);
        }

        // All retries exhausted, leave in pending state (webhook might update later)
        console.log(`[EmbeddedResolver] All retries exhausted for account ${accountId}, leaving in PENDING state`);
        return false;

    } catch (error) {
        console.error(`[EmbeddedResolver] Error resolving account ${accountId}:`, error);

        // Retry on error if attempts remain
        if (attempt < RETRY_DELAYS.length) {
            const delay = RETRY_DELAYS[attempt];
            console.log(`[EmbeddedResolver] Error occurred, retrying in ${delay}ms...`);

            await sleep(delay);
            return resolveWabaAndPhoneLater(accountId, accessToken, attempt + 1);
        }

        return false;
    }
}

/**
 * Start resolution in background (non-blocking)
 * This is called after the OAuth callback returns to not block the redirect.
 */
export function startBackgroundResolution(accountId: number, accessToken: string): void {
    // Fire and forget - don't await
    resolveWabaAndPhoneLater(accountId, accessToken).catch((error) => {
        console.error(`[EmbeddedResolver] Background resolution failed for account ${accountId}:`, error);
    });
}

/**
 * Helper to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Update a pending account with resolved WABA data
 * Used by webhook handler when Meta sends the completion event
 */
export async function updateAccountFromWebhook(params: {
    wabaId: string;
    phoneNumberId: string;
    accessToken?: string;
    userId?: number;
    phoneNumber?: string;
}): Promise<boolean> {
    const { wabaId, phoneNumberId, accessToken, userId, phoneNumber } = params;

    try {
        // Try to find existing account by various fields
        let account = null;

        // First, try by accessToken if provided
        if (accessToken) {
            account = await prisma.whatsAppAccount.findFirst({
                where: { accessToken },
            });
        }

        // If not found, try by phoneNumberId
        if (!account && phoneNumberId) {
            account = await prisma.whatsAppAccount.findFirst({
                where: { phoneNumberId },
            });
        }

        // If not found, try by userId with pending status
        if (!account && userId) {
            account = await prisma.whatsAppAccount.findFirst({
                where: {
                    userId,
                    status: "PENDING_EMBEDDED_SIGNUP",
                },
                orderBy: { createdAt: "desc" },
            });
        }

        if (!account) {
            console.log(`[EmbeddedResolver] No matching account found for webhook update`);
            return false;
        }

        // Update the account
        await prisma.whatsAppAccount.update({
            where: { id: account.id },
            data: {
                wabaId,
                phoneNumberId,
                phoneNumber: phoneNumber || account.phoneNumber,
                status: "ACTIVE",
                isActive: true,
            },
        });

        console.log(`[EmbeddedResolver] Webhook updated account ${account.id}: WABA=${wabaId}, Phone=${phoneNumberId}`);
        return true;

    } catch (error) {
        console.error(`[EmbeddedResolver] Error updating account from webhook:`, error);
        return false;
    }
}
