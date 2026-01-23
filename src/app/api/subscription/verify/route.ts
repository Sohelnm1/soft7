import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id?: string; email?: string; [key: string]: any };
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = await request.json();

    // Verify signature
    const shasum = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Find and update subscription
    const subscription = await prisma.subscription.findUnique({
      where: { razorpayOrderId },
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
        razorpayPaymentId,
        razorpaySignature,
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
      endDate.getDate() + (planValidity[subscription.planType] || 30)
    );

    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isPremium: true,
        subscriptionPlan: subscription.planType,
        subscriptionId: subscription.id,
        subscriptionStart: new Date(),
        subscriptionEnd: endDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      isPremium: true,
      subscriptionPlan: subscription.planType,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
