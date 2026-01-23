import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { id: number; email: string };
  } catch {
    return null;
  }
}

async function getParams<T>(p: Promise<T>): Promise<T> {
  return await p;
}

/* ✅ GET SINGLE CHATBOT - Verify Ownership */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await getParams(context.params);

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    // ✅ Verify the chatbot belongs to this user
    const bot = await prisma.chatbot.findFirst({
      where: { 
        id, 
        userId: currentUser.id 
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "Chatbot not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(bot);
  } catch (err) {
    console.error("GET chatbot error:", err);
    return NextResponse.json(
      { error: "Failed to load chatbot" },
      { status: 500 }
    );
  }
}

/* ✅ UPDATE CHATBOT - Verify Ownership & Handle Images */
export async function PUT(
  req: Request, 
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await getParams(context.params);

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    // ✅ Verify the chatbot belongs to this user
    const existingBot = await prisma.chatbot.findFirst({
      where: { 
        id, 
        userId: currentUser.id 
      },
    });

    if (!existingBot) {
      return NextResponse.json(
        { error: "Chatbot not found or access denied" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      nodes = [],
      edges = [],
      name = "",
      description = "",
      status = "draft",
      published = false,
    } = body;

    console.log("📝 Updating chatbot:", name);
    console.log("📊 Nodes:", nodes.length);
    console.log("🔗 Edges:", edges.length);

    // Process nodes and handle images
    const processedNodes = nodes.map((n: any) => {
      const nodeData = { ...n.data };

      // Handle Message Node with images
      if (n.type === "message" && nodeData.images) {
        console.log(`💬 Message node ${n.id} has ${nodeData.images.length} images`);
        nodeData.images = nodeData.images.map((img: any, idx: number) => {
          if (img.url && img.url.startsWith('data:image')) {
            console.log(`  └─ Image ${idx + 1}: Base64 (${Math.round(img.url.length / 1024)}KB)`);
          }
          return {
            url: img.url || "",
            caption: img.caption || "",
            fileName: img.fileName || "",
            isUploaded: img.isUploaded || false
          };
        });
      }

      // Handle Image Node with images
      if (n.type === "image" && nodeData.images) {
        console.log(`🖼️  Image node ${n.id} has ${nodeData.images.length} images`);
        nodeData.images = nodeData.images.map((img: any, idx: number) => {
          if (img.url && img.url.startsWith('data:image')) {
            console.log(`  └─ Image ${idx + 1}: Base64 (${Math.round(img.url.length / 1024)}KB)`);
          }
          return {
            url: img.url || "",
            caption: img.caption || "",
            fileName: img.fileName || "",
            isUploaded: img.isUploaded || false
          };
        });
      }

      return {
        id: n.id,
        chatbotId: id,
        type: n.type,
        data: nodeData,
        position: n.position ?? { x: 0, y: 0 },
      };
    });

    // Save to database
    await prisma.$transaction([
      // Update chatbot metadata
      prisma.chatbot.update({
        where: { id },
        data: {
          name,
          description,
          status,
          published,
        },
      }),

      // Delete old nodes and edges
      prisma.chatbotNode.deleteMany({ where: { chatbotId: id } }),
      prisma.chatbotEdge.deleteMany({ where: { chatbotId: id } }),

      // Create new nodes with images
      ...processedNodes.map((nodeData: any) =>
        prisma.chatbotNode.create({
          data: nodeData,
        })
      ),

      // Create new edges
      ...edges.map((e: any) =>
        prisma.chatbotEdge.create({
          data: {
            id: e.id,
            chatbotId: id,
            source: e.source,
            target: e.target,
            label: e.label ?? null,
            data: e.data ?? {},
          },
        })
      ),
    ]);

    console.log("✅ Chatbot updated successfully");
    
    return NextResponse.json({ 
      ok: true,
      message: "Chatbot saved successfully with images" 
    });
  } catch (error) {
    console.error("PUT chatbot update error:", error);
    return NextResponse.json(
      { error: "Failed to update chatbot" },
      { status: 500 }
    );
  }
}

/* ✅ DELETE CHATBOT - Verify Ownership */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await getParams(context.params);

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    // ✅ Verify the chatbot belongs to this user
    const existingBot = await prisma.chatbot.findFirst({
      where: { 
        id, 
        userId: currentUser.id 
      },
    });

    if (!existingBot) {
      return NextResponse.json(
        { error: "Chatbot not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.chatbotNode.deleteMany({ where: { chatbotId: id } }),
      prisma.chatbotEdge.deleteMany({ where: { chatbotId: id } }),
      prisma.chatSession.deleteMany({ where: { chatbotId: id } }),
      prisma.chatbot.delete({ where: { id } }),
    ]);

    console.log("🗑️  Chatbot deleted:", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE chatbot error:", err);
    return NextResponse.json(
      { error: "Failed to delete chatbot" },
      { status: 500 }
    );
  }
}