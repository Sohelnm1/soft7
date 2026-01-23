import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function GET(req: Request) {
  try {
    // 🍪 Extract token from cookie
    const token = req.headers
      .get("cookie")
      ?.split("token=")[1]
      ?.split(";")[0];

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    // 🔍 Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    // 🧠 Fetch full user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        plan: true,
        status: true,
        memberSince: true,
        image: true, // ✅ Make sure your Prisma model has this field
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Return structured user data
    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("❌ Error in /api/auth/me:", err.message);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
    
