// app/api/flows/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Read user from cookie
function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { id: number };
  } catch {
    return null;
  }
}

// ---------------------------------------------
// GET Single Flow
// ---------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flowId = parseInt(params.id);

    const flow = await prisma.flow.findFirst({
      where: { id: flowId, userId: user.id },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    return NextResponse.json(flow);
  } catch (error) {
    console.error("GET flow error:", error);
    return NextResponse.json(
      { error: "Failed to load flow" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// PATCH Update Flow (name, status, nodes, edges)
// ---------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flowId = parseInt(params.id);
    const body = await req.json();

    const { name, status, nodes, edges } = body;

    const flow = await prisma.flow.findFirst({
      where: { id: flowId, userId: user.id },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    const updated = await prisma.flow.update({
      where: { id: flowId },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(nodes && { nodes }),
        ...(edges && { edges }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH flow error:", error);
    return NextResponse.json(
      { error: "Failed to update flow" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// DELETE Flow
// ---------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flowId = parseInt(params.id);

    const flow = await prisma.flow.findFirst({
      where: { id: flowId, userId: user.id },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    await prisma.flow.delete({
      where: { id: flowId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE flow error:", error);
    return NextResponse.json(
      { error: "Failed to delete flow" },
      { status: 500 }
    );
  }
}
