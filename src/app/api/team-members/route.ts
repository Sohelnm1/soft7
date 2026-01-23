// app/api/team-members/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined.");

interface JwtPayload {
  id: number;
}

async function authenticate() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded.id;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await authenticate();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ data: teamMembers });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error fetching team members", message: err.message },
      { status: 500 }
    );
  }
}
