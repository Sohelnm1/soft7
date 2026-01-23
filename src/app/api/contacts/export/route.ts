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

export async function GET() {
  try {
    console.log("EXPORT API HIT");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1️⃣ Fetch contacts
    const contacts = await prisma.contact.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        tags: { include: { tag: true } },
      },
    });

    // 2️⃣ Define CSV headers (CONTROLLED & SAFE)
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Status",
      "Source",
      "Tags",
      "Created At",
    ];

    // 3️⃣ Convert rows
    const rows = contacts.map((c) => [
      c.name ?? "",
      c.phone ?? "",
      c.email ?? "",
      c.status ?? "",
      c.source ?? "",
      c.tags.map((t) => t.tag.name).join(", "),
      c.createdAt.toISOString(),
    ]);

    // 4️⃣ Build CSV content
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // 5️⃣ Return downloadable response
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="contacts_export.csv"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { error: "Failed to export contacts" },
      { status: 500 }
    );
  }
}
