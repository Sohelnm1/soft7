import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Helper to verify user from cookie token
function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { id: number };
  } catch {
    return null;
  }
}

// GET all flows for authenticated user
export async function GET(req: NextRequest) {
  try {
    const decoded = getUserFromRequest(req);

    if (!decoded?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flows = await prisma.flow.findMany({
      where: { userId: decoded.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(flows);
  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flows' },
      { status: 500 }
    );
  }
}

// POST create a new flow
export async function POST(req: NextRequest) {
  try {
    const decoded = getUserFromRequest(req);

    if (!decoded?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, status = 'Inactive' } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Flow name is required' },
        { status: 400 }
      );
    }

    const flow = await prisma.flow.create({
      data: {
        name,
        status,
        userId: decoded.id,
        nodes: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              title: 'Select Trigger',
              configured: false,
              position: { x: 0, y: 0 },
              data: {},
            },
          ],
        },
        edges: {
          edges: [],
        },
      },
    });

    return NextResponse.json(flow, { status: 201 });
  } catch (error) {
    console.error('Error creating flow:', error);
    return NextResponse.json(
      { error: 'Failed to create flow' },
      { status: 500 }
    );
  }
}
