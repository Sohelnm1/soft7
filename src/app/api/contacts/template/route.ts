import { NextResponse } from "next/server";

export async function GET() {
  // DB-driven CSV template
  const headers = [
    "name",
    "phone",
    "email",
    "source",
    "tags",
    "status",
  ];

  const csv = `${headers.join(",")}\n`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition":
        "attachment; filename=contacts_template.csv",
    },
  });
}
