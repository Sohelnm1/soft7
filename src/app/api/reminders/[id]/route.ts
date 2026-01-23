import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) throw new Error(
    "JWT_SECRET is missing"
)


interface JwtPayload {
    id : number
}

async function authenticate(): Promise<number | NextResponse> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json(
            { error: "Unauthorized no token" },
            {status : 401}
        )
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as JwtPayload;
        return Number(decoded.id);
    } catch (err) {
        return NextResponse.json(
            { error: "Invalid token." },
            {status: 401}
        )
    }
}

export async function PUT(
    request: Request,
    {params} : {params : {id : string}}
) {
    
    const auth = await authenticate();
    if (auth instanceof NextResponse) return auth;

    const userId = Number(auth);
    const reminderId = params.id;

    const body = await request.json();
    const { note, date, time, triggered } = body;

    const reminder = await prisma.reminder.findUnique({
        where: { id: reminderId },
        select : { creatorId: true, assignedTo: true}
    })

    if (!reminder) {
        return NextResponse.json(
            { error: "Reminder not found" },
            { status : 404}
        )
    }
    const isOwner = reminder.creatorId === userId;
    const isAssignee = reminder.assignedTo?.toString() === userId.toString();

    if (!isOwner && !isAssignee) {
        return NextResponse.json(
                { error: "You cannot modify this reminder" },
                {status: 403}
        )
    }

    if (triggered === true) {
        try {
            await prisma.reminder.delete({
                where: { id: reminderId },
            });
            return NextResponse.json(
                { success: true, message: "Reminder deleted" },
                { status: 200 }
            );
        } catch (err: any) {
            console.error("[DELETE /api/reminders/[id]]", err);
            return NextResponse.json(
                { error: "Failed to delete reminder", details: err.message },
                { status: 500 }
            );
        }
    }

    const updateData: {
        note?: string;
        date?: string;
        time?: string;
        triggered?: boolean;
    } = {};

    if (note) updateData.note = note;
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (typeof triggered === 'boolean') updateData.triggered = triggered;

try {
    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: updateData,
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: updated },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[PUT /api/reminders/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update reminder", details: err.message },
      { status: 500 }
    );
  }
}
 



