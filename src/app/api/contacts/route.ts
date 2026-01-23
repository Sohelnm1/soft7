// app/api/contacts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { id: number; email: string };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const forReminder = url.searchParams.get("forReminder") === "true";
    const forCampaign = url.searchParams.get("forCampaign") === "true";

    // For Campaign Creation Page
    if (forCampaign) {
      const contacts = await prisma.contact.findMany({
        where: { userId: currentUser.id },
        select: {
          id: true,
          name: true,
          phone: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({
        items: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          tags: c.tags.map((t) => t.tag.name).join(","),
        })),
      });
    }

    // For Reminder Creation Page
    if (forReminder) {
      const [contacts, groups, tags] = await Promise.all([
        prisma.contact.findMany({
          where: { userId: currentUser.id },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
          orderBy: { name: "asc" },
        }),
        // TODO: Add groups query if you have a groups table
        Promise.resolve([]),
        prisma.tag.findMany({
          where: { userId: currentUser.id },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                contacts: true,
              },
            },
          },
          orderBy: { name: "asc" },
        }),
      ]);

      return NextResponse.json({
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          number: c.phone,
          email: c.email,
        })),
        groups: groups,
        tags: tags.map((t) => ({
          id: t.id,
          name: t.name,
          count: t._count.contacts,
        })),
      });
    }

    // Default: Full contact list with tags and last message data (for inbox)
    const contacts = await prisma.contact.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            text: true,
            createdAt: true,
            direction: true,
            status: true,
            isTemplate: true,
          },
        },
      },
    });

    const formatted = contacts.map((c) => {
      const lastMessage = c.messages[0];

      // Format last message preview
      let lastMessagePreview = null;
      if (lastMessage) {
        if (lastMessage.isTemplate) {
          lastMessagePreview = "📄 Template message";
        } else if (lastMessage.text) {
          lastMessagePreview =
            lastMessage.text.length > 40
              ? lastMessage.text.substring(0, 40) + "..."
              : lastMessage.text;
        }
      }

      // Format last message time
      let lastMessageTime = null;
      if (lastMessage) {
        const msgDate = new Date(lastMessage.createdAt);
        const now = new Date();

        // Check if message is from today
        const isToday = msgDate.toDateString() === now.toDateString();

        if (isToday) {
          // Show time only (e.g., "3:46 PM")
          lastMessageTime = msgDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        } else {
          // Show date and time (e.g., "Jan 21, 3:46 PM")
          lastMessageTime = msgDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }) + ", " + msgDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
      }

      return {
        ...c,
        tags: c.tags.map((t) => t.tag.name).join(","),
        lastMessagePreview,
        lastMessageTime,
        unreadCount: 0, // TODO: Calculate actual unread count
        messages: undefined, // Remove messages array from response
      };
    });

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { phone, countryCode, tags, ...rest } = data;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Phone must be exactly 10 digits." },
        { status: 400 }
      );
    }

    const fullPhone = `${countryCode}${cleanPhone}`;

    let tagNames: string[] = [];
    if (typeof tags === "string") {
      tagNames = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (Array.isArray(tags)) {
      tagNames = tags;
    }

    const existingTags =
      tagNames.length > 0
        ? await prisma.tag.findMany({
          where: {
            userId: currentUser.id,
            name: { in: tagNames },
          },
        })
        : [];

    const newContact = await prisma.contact.create({
      data: {
        phone: fullPhone,
        name: rest.name,
        source: rest.source,
        assignedTo: rest.assignedTo,
        email: rest.email,
        status: rest.status,
        wabaPhone: rest.wabaPhone,
        interiorDesign: rest.interiorDesign,
        name1: rest.name1,
        test: rest.test,
        allowDuplicate: rest.allowDuplicate || false,
        user: { connect: { id: currentUser.id } },
        tags:
          existingTags.length > 0
            ? {
              create: existingTags.map((tag) => ({
                tag: { connect: { id: tag.id } },
              })),
            }
            : undefined,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    const formatted = {
      ...newContact,
      tags: newContact.tags.map((ct) => ct.tag.name).join(","),
    };

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}