import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        id?: string;
        email?: string;
        [key: string]: any;
      };
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        isPremium: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    });

    if (!user || !user.isPremium) {
      return NextResponse.json(null);
    }

    // Format the subscription data for the panel
    return NextResponse.json({
      plan: user.subscriptionPlan || "Premium Plan",
      startDate: user.subscriptionStart
        ? new Date(user.subscriptionStart).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      endDate: user.subscriptionEnd
        ? new Date(user.subscriptionEnd).toISOString().split("T")[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
      status: user.isPremium ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
