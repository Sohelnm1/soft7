import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { id: number; email: string };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    // ✅ Filter by userId
    const totalLeads = await prisma.contact.count({
      where: { userId: currentUser.id },
    });

    const pendingLeads = await prisma.contact.count({
      where: {
        userId: currentUser.id,
        status: "pending",
      },
    });

    const assignedLeads = await prisma.contact.count({
      where: {
        userId: currentUser.id,
        status: "assigned",
      },
    });

    const data = [
      { name: "Total lead", value: totalLeads },
      { name: "Pending lead", value: pendingLeads },
      { name: "Assign lead", value: assignedLeads },
    ];

    return NextResponse.json(data);
  } catch (error) {
    console.error("Pie Chart API Error:", error);
    return NextResponse.json(
      [
        { name: "Total lead", value: 0 },
        { name: "Pending lead", value: 0 },
        { name: "Assign lead", value: 0 },
      ],
      { status: 500 }
    );
  }
}