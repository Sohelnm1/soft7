import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function DELETE(req: Request) {
  try {
    // 1️⃣ Extract token from cookies
    const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    // 3️⃣ Update user record — remove avatar
    await prisma.user.update({
      where: { id: decoded.id },
      data: { image: "" }, // or `null` if your DB allows it
    });

    return NextResponse.json({ message: "Avatar removed successfully" });
  } catch (error) {
    console.error("Error in /api/remove-avatar:", error);
    return NextResponse.json(
      { error: "Failed to remove avatar" },
      { status: 500 }
    );
  }
}
