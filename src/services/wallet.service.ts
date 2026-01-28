import type { Prisma } from "@prisma/client";
const { prisma } = require("../lib/prisma.worker.cjs");

export class WalletService {
    /**
     * Deducts wallet balance for a user.
     * Implements strict idempotency and row-level locking.
     * @param userId The ID of the user
     * @param amount The amount to deduct
     * @param messageId The Meta message_id for idempotency
     */
    static async deductWallet(userId: number, amount: number, messageId: string) {
        if (!messageId) {
            console.warn("[WalletService] No messageId provided for deduction. Skipping safety checks.");
            return null;
        }

        try {
            return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // 1. Check for existing transaction (Idempotency)
                const existingTx = await tx.walletTransaction.findUnique({
                    where: { messageId }
                });

                if (existingTx) {
                    console.log(`[WalletService] Duplicate deduction attempt for message ${messageId}. Skipping.`);
                    return existingTx;
                }

                /**
                 * 2. Lock the user row and check balance (Row-level locking)
                 * Note: Tables are typically named as model name in PascalCase in Prisma unless @@map is used.
                 * We check the schema and it's "User".
                 */
                const userRows = await tx.$queryRaw<any[]>`
          SELECT id, "walletBalance" FROM "User" WHERE id = ${userId} FOR UPDATE
        `;

                if (!userRows || userRows.length === 0) {
                    throw new Error(`User ${userId} not found for wallet deduction`);
                }

                const user = userRows[0];
                const currentBalance = user.walletBalance;

                if (currentBalance < amount) {
                    throw new Error(`Insufficient wallet balance for User ${userId}. Current: ${currentBalance}, Required: ${amount}`);
                }

                // 3. Update User Balance
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        walletBalance: { decrement: amount }
                    }
                });

                // 4. Record Transaction
                const transaction = await tx.walletTransaction.create({
                    data: {
                        userId,
                        amount,
                        messageId,
                        type: "DEDUCTION"
                    }
                });

                console.log(`[WalletService] SUCCESS: Deducted ${amount} from User ${userId} for message ${messageId}. New Balance: ${currentBalance - amount}`);

                return transaction;
            }, {
                isolationLevel: "Serializable", // Extra safety
                timeout: 10000 // 10s timeout for high volume contention
            });
        } catch (error: any) {
            console.error(`[WalletService] ERROR: Failed to deduct wallet for User ${userId}:`, error.message);
            throw error;
        }
    }
}
