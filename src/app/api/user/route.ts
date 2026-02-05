import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function GET() {
  try {
    // 🍪 Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    // 🔍 Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 🧠 Fetch user from database (including optional fields like image & status)
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        image: true,
        walletBalance: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Return user info as JSON
    return NextResponse.json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
