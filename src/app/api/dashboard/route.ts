import { NextRequest, NextResponse } from "next/server";
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
 
// Helper function to calculate percentage change
function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}
 
// Helper function to determine trend
function getTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
  if (current > previous) return 'increasing';
  if (current < previous) return 'decreasing';
  return 'stable';
}
 
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }
 
    // Date ranges for comparison (today vs yesterday)
    const now = new Date();
   
    // Today (current day from 00:00:00 to now)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
   
    // Yesterday (previous day 00:00:00 to 23:59:59)
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(now.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
   
    const yesterdayEnd = new Date(now);
    yesterdayEnd.setDate(now.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);
 
    // Today's messages sent (outgoing messages from the user)
    const todayMessagesSent = await prisma.message.count({
      where: {
        userId: currentUser.id,
        OR: [
          { sentBy: "me" },
          { direction: "outgoing" }
        ],
        createdAt: { gte: todayStart },
      },
    });
 
    // Yesterday's messages sent
    const yesterdayMessagesSent = await prisma.message.count({
      where: {
        userId: currentUser.id,
        OR: [
          { sentBy: "me" },
          { direction: "outgoing" }
        ],
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
    });
 
    // Total messages sent (all time)
    const totalMessagesSent = await prisma.message.count({
      where: {
        userId: currentUser.id,
        OR: [
          { sentBy: "me" },
          { direction: "outgoing" }
        ],
      },
    });
 
    // Today's messages received (inbound messages)
    const todayMessagesReceived = await prisma.message.count({
      where: {
        userId: currentUser.id,
        OR: [
          { sentBy: { in: ["them", "contact", "bot", "customer"] } },
          { direction: "inbound" }
        ],
        createdAt: { gte: todayStart },
      },
    });
 
    // Yesterday's messages received
    const yesterdayMessagesReceived = await prisma.message.count({
      where: {
        userId: currentUser.id,
        OR: [
          { sentBy: { in: ["them", "contact", "bot", "customer"] } },
          { direction: "inbound" }
        ],
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
    });
 
    // Total messages received (all time)
    const totalMessagesReceived = await prisma.message.count({
      where: {
        userId: currentUser.id,
        OR: [
          { sentBy: { in: ["them", "contact", "bot", "customer"] } },
          { direction: "inbound" }
        ],
      },
    });
 
    // Today's contacts
    const todayContacts = await prisma.contact.count({
      where: {
        userId: currentUser.id,
        createdAt: { gte: todayStart },
      },
    });
 
    // Yesterday's contacts
    const yesterdayContacts = await prisma.contact.count({
      where: {
        userId: currentUser.id,
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
    });
 
    // Total active contacts (all time)
    const totalContacts = await prisma.contact.count({
      where: { userId: currentUser.id },
    });
 
    // Today's team agents
    const todayTeamAgents = await prisma.teamMember.count({
      where: {
        ownerId: currentUser.id,
        createdAt: { gte: todayStart },
      },
    });
 
    // Yesterday's team agents
    const yesterdayTeamAgents = await prisma.teamMember.count({
      where: {
        ownerId: currentUser.id,
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
    });
 
    // Total team agents (all time)
    const teamAgents = await prisma.teamMember.count({
      where: { ownerId: currentUser.id },
    });
 
    // Calculate percentage changes (today vs yesterday)
    const messagesSentChange = calculatePercentageChange(
      todayMessagesSent,
      yesterdayMessagesSent
    );
    const messagesReceivedChange = calculatePercentageChange(
      todayMessagesReceived,
      yesterdayMessagesReceived
    );
    const contactsChange = calculatePercentageChange(
      todayContacts,
      yesterdayContacts
    );
    const teamAgentsChange = calculatePercentageChange(
      todayTeamAgents,
      yesterdayTeamAgents
    );
 
    // Calculate trends (today vs yesterday)
    const messagesSentTrend = getTrend(todayMessagesSent, yesterdayMessagesSent);
    const messagesReceivedTrend = getTrend(todayMessagesReceived, yesterdayMessagesReceived);
    const contactsTrend = getTrend(todayContacts, yesterdayContacts);
    const teamAgentsTrend = getTrend(todayTeamAgents, yesterdayTeamAgents);
 
    // Get leads grouped by creation date (for line chart)
    const leads = await prisma.lead.groupBy({
      by: ["createdAt"],
      where: { userId: currentUser.id },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });
 
    // Get contacts grouped by source (for pie chart)
    const contactsBySource = await prisma.contact.groupBy({
      by: ["source"],
      where: { userId: currentUser.id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
 
    // Get leads grouped by source (for breakdown)
    const sources = await prisma.lead.groupBy({
      by: ["source"],
      where: { userId: currentUser.id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
 
    // Get contact status breakdown
    const contactStatusBreakdown = await prisma.contact.groupBy({
      by: ["status"],
      where: { userId: currentUser.id },
      _count: { id: true },
    });
 
    // Get recent messages for activity feed
    const recentMessages = await prisma.message.findMany({
      where: { userId: currentUser.id },
      include: {
        contact: {
          select: { id: true, name: true, source: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
 
    // Get contacts by source with status breakdown
    const contactsBySourceAndStatus = await prisma.contact.groupBy({
      by: ["source", "status"],
      where: { userId: currentUser.id },
      _count: { id: true },
    });
 
    // Get ALL messages for aggregation
    const allMessages = await prisma.message.findMany({
      where: { userId: currentUser.id },
      select: {
        createdAt: true,
        sentBy: true,
        direction: true,
      },
    });
 
    // Process messages by DAY (last 7 days)
    const dailyData: Record<string, { sent: number; received: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
      dailyData[dayKey] = { sent: 0, received: 0 };
    }
 
    allMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const daysDiff = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
     
      if (daysDiff >= 0 && daysDiff <= 6) {
        const dayKey = msgDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (dailyData[dayKey]) {
          // Check if message is sent or received
          const isSent = msg.sentBy === "me" || msg.direction === "outgoing";
          const isReceived = ["them", "contact", "bot", "customer"].includes(msg.sentBy || "") || msg.direction === "inbound";
         
          if (isSent) {
            dailyData[dayKey].sent++;
          } else if (isReceived) {
            dailyData[dayKey].received++;
          }
        }
      }
    });
 
    // Process messages by MONTH (last 6 months)
    const monthlyData: Record<string, { sent: number; received: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString("en-US", { month: "short" });
      monthlyData[monthKey] = { sent: 0, received: 0 };
    }
 
    allMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const monthKey = msgDate.toLocaleString("en-US", { month: "short" });
     
      if (monthlyData[monthKey]) {
        const isSent = msg.sentBy === "me" || msg.direction === "outgoing";
        const isReceived = ["them", "contact", "bot", "customer"].includes(msg.sentBy || "") || msg.direction === "inbound";
       
        if (isSent) {
          monthlyData[monthKey].sent++;
        } else if (isReceived) {
          monthlyData[monthKey].received++;
        }
      }
    });
 
    // Process messages by YEAR (last 5 years)
    const yearlyData: Record<string, { sent: number; received: number }> = {};
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      yearlyData[year.toString()] = { sent: 0, received: 0 };
    }
 
    allMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const yearKey = msgDate.getFullYear().toString();
     
      if (yearlyData[yearKey]) {
        const isSent = msg.sentBy === "me" || msg.direction === "outgoing";
        const isReceived = ["them", "contact", "bot", "customer"].includes(msg.sentBy || "") || msg.direction === "inbound";
       
        if (isSent) {
          yearlyData[yearKey].sent++;
        } else if (isReceived) {
          yearlyData[yearKey].received++;
        }
      }
    });
 
    return NextResponse.json({
      totalMessagesSent,
      totalMessagesReceived,
      totalContacts,
      teamAgents,
      messagesSentChange,
      messagesReceivedChange,
      contactsChange,
      teamAgentsChange,
      messagesSentTrend,
      messagesReceivedTrend,
      contactsTrend,
      teamAgentsTrend,
      leads,
      sources,
      contactsBySource,
      contactStatusBreakdown,
      recentMessages,
      contactsBySourceAndStatus,
      dailyMessageData: dailyData,
      monthlyMessageData: monthlyData,
      yearlyMessageData: yearlyData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Server error: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}