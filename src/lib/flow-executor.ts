// lib/flow-executor.ts

import { prisma } from "@/lib/prisma";
import { sendGmailEmail } from "./integrations/gmail";
import { sendWhatsAppMessage } from "./integrations/whatsapp";

interface FlowNode {
  id: string;
  type: "trigger" | "action";
  title: string;
  configured: boolean;
  appId?: string;
  actionId?: string;
  config?: Record<string, any>;
  position?: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export class FlowExecutor {
  private flowId: number;
  private userId: number;
  private nodes: FlowNode[] = [];
  private edges: FlowEdge[] = [];
  private context: Record<string, any> = {};

  constructor(flowId: number, userId: number) {
    this.flowId = flowId;
    this.userId = userId;
  }

  async loadFlow() {
    const flow = await prisma.flow.findFirst({
      where: { id: this.flowId },
    });


    if (!flow) throw new Error("Flow not found");

    const rawNodes = flow.nodes ?? [];
    const rawEdges = flow.edges ?? [];

    this.nodes = Array.isArray(rawNodes)
      ? (rawNodes as unknown as FlowNode[])
      : [];

    this.edges = Array.isArray(rawEdges)
      ? (rawEdges as unknown as FlowEdge[])
      : [];

    return flow;
  }

  async execute(triggerData?: any) {
    try {
      console.log("🚀 Executing flow:", this.flowId);

      await this.loadFlow();

      // Load trigger data into context
      if (triggerData) this.context = { ...triggerData };

      // Find trigger node
      const triggerNode = this.nodes.find((n) => n.type === "trigger");
      if (!triggerNode) throw new Error("No trigger node found");

      // Begin execution chain
      await this.executeNode(triggerNode);

      return { success: true, context: this.context };
    } catch (error: any) {
      console.error("❌ Flow execution failed:", error);
      return { success: false, error: error.message };
    }
  }

  private async executeNode(node: FlowNode): Promise<void> {
    console.log(`📍 Executing node: ${node.id} (${node.type})`);

    // TRIGGER → go to next node(s)
    if (node.type === "trigger") {
      const nextNodes = this.getNextNodes(node.id);
      for (const next of nextNodes) await this.executeNode(next);
      return;
    }

    // ACTION
    if (node.type === "action") {
      if (!node.configured || !node.appId || !node.actionId) {
        console.log(`⏭️  Skipping unconfigured node: ${node.id}`);
        const next = this.getNextNodes(node.id);
        for (const n of next) await this.executeNode(n);
        return;
      }

      const result = await this.executeAction(node);

      // Store execution result
      this.context[`node_${node.id}`] = result;

      // Continue chain
      const nextNodes = this.getNextNodes(node.id);
      for (const next of nextNodes) await this.executeNode(next);
    }
  }

  private async executeAction(node: FlowNode): Promise<any> {
    const appId = node.appId!;
    const actionId = node.actionId!;
    const config = node.config!;

    console.log(`⚡ Running action: ${appId}.${actionId}`);

    const processed = this.interpolateVariables(config);

    switch (appId) {
      // -------------------------------------------------------------
      // GMAIL
      // -------------------------------------------------------------
      case "gmail":
        return await sendGmailEmail(processed as {
          to: string;
          subject: string;
          message: string;
        });

      // -------------------------------------------------------------
      // WHATSAPP
      // -------------------------------------------------------------
      case "whatsapp":
        if (actionId === "send_message") {
          // ✅ FIXED: Use correct field names from your config
          return await sendWhatsAppMessage(
            processed.phone || this.context.from,   // Auto-reply fallback
            processed.message,
            this.userId
          );
        }

        if (actionId === "send_template") {
          // TODO: Implement send_template
          return {
            success: false,
            error: "send_template not yet implemented"
          };
        }

        if (actionId === "send_media") {
          // TODO: Implement send_media
          return {
            success: false,
            error: "send_media not yet implemented"
          };
        }

        return { success: false, error: "Unknown WhatsApp action" };

      // -------------------------------------------------------------
      // GOOGLE SHEETS
      // -------------------------------------------------------------
      case "google_sheets":
        console.log("📊 Google Sheets action (not yet implemented)");
        return {
          success: true,
          message: "Google Sheets integration coming soon",
          data: processed
        };

      // -------------------------------------------------------------
      // WEBHOOK
      // -------------------------------------------------------------
      case "webhook":
        if (actionId === "send_request") {
          try {
            const response = await fetch(processed.url, {
              method: processed.method || 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: processed.body ? JSON.stringify(processed.body) : undefined,
            });

            const data = await response.json().catch(() => ({}));

            return {
              success: response.ok,
              data,
              statusCode: response.status
            };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: "Unknown webhook action" };

      // -------------------------------------------------------------
      // UNSUPPORTED APP
      // -------------------------------------------------------------
      default:
        console.warn("⚠️  Unsupported integration:", appId);
        return { success: false, error: "Unsupported integration" };
    }
  }

  private getNextNodes(nodeId: string): FlowNode[] {
    const edges = this.edges.filter((e) => e.source === nodeId);

    return edges
      .map((e) => this.nodes.find((n) => n.id === e.target))
      .filter(Boolean) as FlowNode[];
  }

  private interpolateVariables(config: Record<string, any>) {
    const out: Record<string, any> = {};

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === "string") {
        out[key] = value.replace(/\{\{([^}]+)\}\}/g, (_, varName) => {
          return this.context[varName.trim()] ?? "";
        });
      } else {
        out[key] = value;
      }
    }

    return out;
  }
}

export async function triggerFlow(
  flowId: number,
  userId: number,
  triggerData?: any
) {
  const executor = new FlowExecutor(flowId, userId);
  return executor.execute(triggerData);
}