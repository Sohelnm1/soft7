import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  email: string;
}

async function getCurrentUser(): Promise<JwtPayload | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // 🔐 AUTH CHECK
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      contacts,
      allowDuplicate = false,
      countryCode = "+91",
    } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided" },
        { status: 400 }
      );
    }

    if (contacts.length > 5000) {
      return NextResponse.json(
        { error: "Maximum 5000 contacts allowed per import" },
        { status: 400 }
      );
    }

    const skipped: { row: any; reason: string }[] = [];
    const prepared: any[] = [];

    // 🔁 PROCESS CONTACTS (STRICT DB FIELDS ONLY)
    for (const row of contacts) {
      // Skip only if ALL DB-identifying fields are empty
      if (!row.name && !row.phone && !row.email) {
        skipped.push({ row, reason: "No usable DB fields" });
        continue;
      }

      let formattedPhone: string | null = null;

      if (row.phone) {
        const cleanPhone = String(row.phone).replace(/\D/g, "");
        if (cleanPhone.length >= 10) {
          formattedPhone = `${countryCode}${cleanPhone}`;
        }
      }

      prepared.push({
        userId: user.id,
        name: row.name ?? null,
        phone: formattedPhone,          // can be NULL
        email: row.email ?? null,
        source: row.source ?? "csv_import",
       
        status: row.status ?? null,
      });
    }

    // 🚫 NOTHING VALID
    if (prepared.length === 0) {
      return NextResponse.json(
        {
          error: "No valid contacts to import",
          skipped,
        },
        { status: 400 }
      );
    }

    // ✅ INSERT CONTACTS
    await prisma.contact.createMany({
      data: prepared,
      skipDuplicates: !allowDuplicate,
    });

    // ✅ FETCH IMPORTED CONTACTS FOR UI
    const importedContacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
        source: "csv_import",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: prepared.length,
    });

    return NextResponse.json({
      success: true,
      imported: importedContacts.length,
      contacts: importedContacts,
      skipped: skipped.length,
      skippedDetails: skipped,
    });

  } catch (error) {
    console.error("❌ Contact import failed:", error);
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
}
