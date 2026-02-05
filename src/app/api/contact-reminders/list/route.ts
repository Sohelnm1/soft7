// app/api/contact-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use Prisma's type-safe query instead of raw SQL
    const reminders = await prisma.contactReminder.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match the expected format
    const formattedReminders = reminders.map((reminder: any) => ({
      id: reminder.id,
      templateName: reminder.templateName,
      language: reminder.language,
      variables: reminder.variables,
      message: reminder.message,
      scheduleType: reminder.scheduleType,
      onDate: reminder.onDate,
      fromTime: reminder.fromTime,
      toTime: reminder.toTime,
      allDay: reminder.allDay,
      repeatEvery: reminder.repeatEvery,
      repeatUnit: reminder.repeatUnit,
      selectedDays: reminder.selectedDays,
      createdAt: reminder.createdAt,
      delivered: reminder.delivered,
      triggered: reminder.triggered,
      contactId: reminder.contact?.id,
      contactName: reminder.contact?.name,
      contactPhone: reminder.contact?.phone,
    }));

    return NextResponse.json(formattedReminders);
  } catch (error) {
    console.error("Error fetching contact reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      recipients,
      templateName,
      language,
      variables,
      scheduleType,
      onDate,
      fromTime,
      toTime,
      allDay,
      repeatEvery,
      repeatUnit,
      selectedDays,
    } = body;

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    const createdReminders = [];

    for (const recipient of recipients) {
      if (recipient.type === "contact" || recipient.type === "one") {
        const reminder = await prisma.contactReminder.create({
          data: {
            userId: currentUser.id,
            contactId: recipient.id,
            templateName: templateName || null,
            language: language || null,
            variables: variables || null,
            scheduleType,
            onDate: onDate || null,
            fromTime: allDay ? null : fromTime || null,
            toTime: allDay ? null : toTime || null,
            allDay: allDay || false,
            repeatEvery: repeatEvery || null,
            repeatUnit: repeatUnit || null,
            selectedDays: selectedDays || null,
          },
        });

        createdReminders.push({
          id: reminder.id,
          contactId: recipient.id,
        });
      } else if (recipient.type === "tag") {
        const contactsWithTag = await prisma.contact.findMany({
          where: {
            userId: currentUser.id,
            tags: {
              some: {
                tag: {
                  id: recipient.id,
                },
              },
            },
          },
          select: {
            id: true,
          },
        });

        for (const contact of contactsWithTag) {
          const reminder = await prisma.contactReminder.create({
            data: {
              userId: currentUser.id,
              contactId: contact.id,
              templateName: templateName || null,
              language: language || null,
              variables: variables || null,
              scheduleType,
              onDate: onDate || null,
              fromTime: allDay ? null : fromTime || null,
              toTime: allDay ? null : toTime || null,
              allDay: allDay || false,
              repeatEvery: repeatEvery || null,
              repeatUnit: repeatUnit || null,
              selectedDays: selectedDays || null,
            },
          });

          createdReminders.push({
            id: reminder.id,
            contactId: contact.id,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: createdReminders.length,
      reminders: createdReminders,
    });
  } catch (error) {
    console.error("Error creating contact reminders:", error);
    return NextResponse.json(
      { error: "Failed to create reminders" },
      { status: 500 }
    );
  }
}