import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// GET USER
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
    };
  } catch {
    return null;
  }
}

// GET CONTACT
export async function GET(
  req: Request,
  ctx: { params: { id: string } }
) {
  const contactId = Number(ctx.params.id);
  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      tags: { include: { tag: true } },
      user: { select: { id: true, name: true, email: true } }
    }
  });

  if (!contact)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  if (contact.userId !== currentUser.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    ...contact,
    tags: contact.tags.map(t => t.tag.name).join(",")
  });
}

// UPDATE CONTACT
export async function PUT(
  req: Request,
  ctx: { params: { id: string } }
) {
  const contactId = Number(ctx.params.id);
  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contact = await prisma.contact.findUnique({
    where: { id: contactId }
  });

  if (!contact)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  if (contact.userId !== currentUser.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  let { tags, ...updateData } = data;

  // Remove unsafe fields
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.user;

  // Phone Format
  if (updateData.phone) {
    const clean = updateData.phone.replace(/\D/g, "");
    if (clean.length === 10) updateData.phone = "+91" + clean;
  }

  // Tags normalize
  const tagNames = typeof tags === "string" ? tags.split(",").map(t => t.trim()) : [];

  // Remove old tag relations
  await prisma.contactTag.deleteMany({ where: { contactId } });

  // Fetch valid tags belonging to user
  const validTags =
    tagNames.length > 0
      ? await prisma.tag.findMany({
          where: { userId: currentUser.id, name: { in: tagNames } }
        })
      : [];

  const updated = await prisma.contact.update({
    where: { id: contactId },
    data: {
      ...updateData,
      tags:
        validTags.length > 0
          ? {
              create: validTags.map(tag => ({
                tag: { connect: { id: tag.id } }
              }))
            }
          : undefined
    },
    include: { tags: { include: { tag: true } } }
  });

  return NextResponse.json({
    ...updated,
    tags: updated.tags.map(t => t.tag.name).join(",")
  });
}

// DELETE CONTACT
export async function DELETE(
  req: Request,
  ctx: { params: { id: string } }
) {
  const contactId = Number(ctx.params.id);
  const currentUser = await getCurrentUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contact = await prisma.contact.findUnique({
    where: { id: contactId }
  });

  if (!contact)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  if (contact.userId !== currentUser.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.contactTag.deleteMany({ where: { contactId } });
  await prisma.contact.delete({ where: { id: contactId } });

  return NextResponse.json({ success: true });
}
