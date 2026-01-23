import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const body = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        name: body.name,
        phone: body.phone,
        plan: body.plan,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
