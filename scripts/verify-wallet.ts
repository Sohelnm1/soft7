import { WalletService } from "../src/services/wallet.service";
import { prisma } from "../src/lib/prisma";

async function verifyWalletSafety() {
    console.log("Test: Wallet Safety and Idempotency");

    // 1. Setup Test User
    const email = "test-worker@example.com";
    let user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                name: "Test Worker",
                email,
                password: "hashed_password",
                walletBalance: 100.0
            }
        });
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: { walletBalance: 100.0 }
        });
    }

    console.log(`Initial Balance: ${user.walletBalance}`);

    const testMessageId = `test_msg_${Date.now()}`;
    const deductionAmount = 10.0;

    console.log(`Running concurrent deductions for messageId: ${testMessageId}`);

    // 2. Simulate concurrent calls to WalletService.deductWallet
    const results = await Promise.allSettled([
        WalletService.deductWallet(user.id, deductionAmount, testMessageId),
        WalletService.deductWallet(user.id, deductionAmount, testMessageId),
        WalletService.deductWallet(user.id, deductionAmount, testMessageId)
    ]);

    results.forEach((res, i) => {
        if (res.status === "fulfilled") {
            console.log(`Attempt ${i + 1}: Fulfilled`);
        } else {
            console.log(`Attempt ${i + 1}: Rejected with: ${res.reason.message}`);
        }
    });

    // 3. Verify Final Balance
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`Final Balance: ${updatedUser?.walletBalance}`);

    if (updatedUser?.walletBalance === 90.0) {
        console.log("✅ SUCCESS: Only 10.0 was deducted exactly once.");
    } else {
        console.error("❌ FAILURE: Balance inconsistent!");
    }

    // 4. Verify Transaction Count
    const txCount = await prisma.walletTransaction.count({ where: { messageId: testMessageId } });
    console.log(`Transaction records found: ${txCount}`);

    if (txCount === 1) {
        console.log("✅ SUCCESS: Only one transaction record created.");
    } else {
        console.error("❌ FAILURE: Duplicate transaction records found!");
    }

    process.exit(0);
}

verifyWalletSafety().catch(err => {
    console.error(err);
    process.exit(1);
});
