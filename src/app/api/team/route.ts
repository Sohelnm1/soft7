import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

/**
 *  GET: Fetch all team members for the logged-in admin
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };

    //  Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    //  Ensure ADMIN record exists for the logged-in user
    let adminRecord = await prisma.teamMember.findFirst({
      where: { userId: currentUser.id, role: "ADMIN" },
    });

    if (!adminRecord) {
      adminRecord = await prisma.teamMember.create({
        data: {
          userId: currentUser.id,
          ownerId: currentUser.id, // self-owned
          role: "ADMIN",
          email: currentUser.email,
          phone: currentUser.phone || "",
        },
      });
    }

    //  Fetch all team members under this admin
    const teamMembers = await prisma.teamMember.findMany({
      where: { ownerId: currentUser.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    //  Format clean response
    const formatted = teamMembers.map((m) => ({
      id: m.id, // TeamMember ID — used for deletion
      userId: m.user?.id,
      name: m.user?.name || m.email?.split("@")[0] || "Unknown",
      email: m.email || m.user?.email,
      phone: m.phone || m.user?.phone,
      image: m.user?.image,
      role: (m.role || "MEMBER").toUpperCase(),
    }));

    return NextResponse.json({
      admin: {
        ...currentUser,
        role: (currentUser.role || "ADMIN").toUpperCase(),
      },
      teamMembers: formatted,
    });
  } catch (err) {
    console.error("❌ GET /api/team error:", err);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}

/**
 *  POST: Invite/Add a new team member
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const { email, phone, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    //  Ensure inviter is ADMIN
    const admin = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!admin || admin.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
    }

    //  Check if user exists or create
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: email.split("@")[0],
          email,
          phone: phone || "",
          password: "temporary", // placeholder
          role: "MEMBER",
        },
      });
    }

    //  Prevent duplicate member under same owner
    const existingMember = await prisma.teamMember.findFirst({
      where: { userId: user.id, ownerId: admin.id },
    });
    if (existingMember) {
      return NextResponse.json({ message: "Member already exists" }, { status: 200 });
    }

    //  Create TeamMember entry
    const newMember = await prisma.teamMember.create({
      data: {
        userId: user.id,
        ownerId: admin.id,
        role: role.toUpperCase(),
        email,
        phone: phone || "",
      },
      include: { user: true },
    });

    return NextResponse.json({
      message: "Member invited successfully",
      member: {
        id: newMember.id, // TeamMember ID
        userId: newMember.user.id,
        name: newMember.user.name,
        email: newMember.email || newMember.user.email,
        phone: newMember.phone || newMember.user.phone,
        image: newMember.user.image,
        role: (newMember.role || "MEMBER").toUpperCase(),
      },
    });
  } catch (err) {
    console.error("❌ POST /api/team error:", err);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

/**
 *  DELETE: Remove a team member
 */
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const { id } = await req.json(); // this must be TeamMember.id

    if (!id) {
      return NextResponse.json({ error: "Missing member ID" }, { status: 400 });
    }

    //  Ensure current user is ADMIN
    const admin = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!admin || admin.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete members" }, { status: 403 });
    }

    //  Verify member exists under admin
    const member = await prisma.teamMember.findFirst({
      where: { id, ownerId: admin.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.role.toUpperCase() === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete ADMIN user" }, { status: 403 });
    }

    await prisma.teamMember.delete({ where: { id } });

    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /api/team error:", err);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
