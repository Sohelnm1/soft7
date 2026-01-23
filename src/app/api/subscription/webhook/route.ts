import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature")!;

    // Verify signature
    const hash = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const payload = JSON.parse(body);

    if (payload.event === "payment.authorized") {
      const {
        payload: { payment },
      } = payload;

      // Find subscription by order ID
      const subscription = await prisma.subscription.findUnique({
        where: { razorpayOrderId: payment.order_id },
        include: { user: true },
      });

      if (!subscription) {
        return NextResponse.json(
          { error: "Subscription not found" },
          { status: 404 }
        );
      }

      // Update subscription
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          razorpayPaymentId: payment.id,
          razorpaySignature: signature,
          status: "completed",
        },
      });

      // Update user to premium
      const endDate = new Date();
      const planValidity: { [key: string]: number } = {
        starter: 30,
        professional: 30,
        enterprise: 30,
      };

      endDate.setDate(
        endDate.getDate() +
          (planValidity[subscription.planType] || 30)
      );

      await prisma.user.update({
        where: { id: subscription.userId },
        data: {
          isPremium: true,
          subscriptionPlan: subscription.planType,
          subscriptionId: subscription.id,
          subscriptionStart: new Date(),
          subscriptionEnd: endDate,
          razorpayCustomerId: payment.customer_id,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
