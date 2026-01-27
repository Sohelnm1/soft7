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

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "5");
    const sortParam = url.searchParams.get("sort") || "createdAt:desc";

    // Parse multi-column sort
    const orderBy: any[] = sortParam.split(",").map((s) => {
      const [field, order] = s.split(":");
      return { [field]: order?.toLowerCase() === "asc" ? "asc" : "desc" };
    });

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Filter by userId
    const where = {
      userId: currentUser.id,
      name: { contains: search, mode: "insensitive" as const },
    };

    const total = await prisma.campaign.count({ where });

    const items = await prisma.campaign.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    return NextResponse.json({ items, total });
  } catch (err) {
    console.error(err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    // Helper to combine date string (YYYY-MM-DD) and time string (HH:MM)
    const combineDateTime = (dateStr?: string, timeStr?: string) => {
      if (!dateStr) return null;
      if (!timeStr) return new Date(dateStr); // Default to just date if no time
      try {
        return new Date(`${dateStr}T${timeStr}:00`);
      } catch (e) {
        return new Date(dateStr);
      }
    };

    const startDate = combineDateTime(body.startDate, body.startTime);
    const endDate = combineDateTime(body.endDate, body.endTime);

    // Prepare the campaign data
    const campaignData: any = {
      name: body.name,
      description: body.description ?? null,
      type: body.type ?? "General",
      status: body.status ?? "draft",
      startDate: startDate,
      endDate: endDate,
      leadsCount: body.audience?.contacts?.length ?? 0,
      userId: currentUser.id,
      messageTemplate: body.messageTemplate,
      selectedTemplate: body.selectedTemplate ? String(body.selectedTemplate) : null,
      variableMapping: body.variableMapping || null,
      audienceData: body.audience ? {
        selectAll: body.audience.selectAll || false,
        contacts: body.audience.contacts || [],
        groups: body.audience.groups || [],
        tags: body.audience.tags || [],
      } : {},
    };

    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: campaignData,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err: any) {
    console.error("Campaign creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return new NextResponse("Campaign id required", { status: 400 });

    // Verify ownership
    const existing = await prisma.campaign.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!existing) {
      return new NextResponse("Campaign not found or access denied", {
        status: 404,
      });
    }

    const body = await request.json();

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.messageTemplate !== undefined) updateData.messageTemplate = body.messageTemplate;
    if (body.selectedTemplate !== undefined) updateData.selectedTemplate = body.selectedTemplate;
    if (body.audience?.contacts !== undefined) updateData.leadsCount = body.audience.contacts.length;

    if (body.audience) {
      updateData.audienceData = JSON.stringify({
        selectAll: body.audience.selectAll || false,
        contacts: body.audience.contacts || [],
        groups: body.audience.groups || [],
        tags: body.audience.tags || [],
      });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Campaign update error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return new NextResponse("Campaign id required", { status: 400 });

    // Verify ownership
    const existing = await prisma.campaign.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!existing) {
      return new NextResponse("Campaign not found or access denied", {
        status: 404,
      });
    }

    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ message: "Campaign deleted successfully" });
  } catch (err: any) {
    console.error("Campaign deletion error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete campaign" },
      { status: 500 }
    );
  }
}