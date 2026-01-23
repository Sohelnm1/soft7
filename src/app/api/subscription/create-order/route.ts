import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes: {
    userId: string;
    planType: string;
  };
}

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

    const { planType } = await request.json();

    // Validate plan type and get pricing
    const plans: {
      [key: string]: { amount: number; validity: number };
    } = {
      starter: { amount: 99900, validity: 30 }, // 999 INR for 30 days
      professional: { amount: 299900, validity: 30 }, // 2999 INR for 30 days
      enterprise: { amount: 999900, validity: 30 }, // 9999 INR for 30 days
    };

    if (!plans[planType]) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    const plan = plans[planType];
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create Razorpay order
    const orderData: RazorpayOrderRequest = {
      amount: plan.amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}_${user?.id}`,
      notes: {
        userId: user?.id?.toString(),
        planType,
      },
    };

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error("Failed to create Razorpay order");
    }

    const razorpayOrder = await response.json();

    // Store subscription record in database
    const subscription = await prisma.subscription.create({
      data: {
        userId: user!.id,
        planType,
        amount: plan.amount / 100, // Convert to rupees
        currency: "INR",
        paymentMethod: "razorpay",
        razorpayOrderId: razorpayOrder.id,
        status: "pending",
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.validity * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      subscriptionId: subscription.id,
      keyId: RAZORPAY_KEY_ID,
      amount: plan.amount,
      currency: "INR",
      email: user.email,
      contact: user.phone,
      userDetails: {
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Subscription order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
