// app/api/flows/[id]/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { triggerFlow } from '@/lib/flow-executor';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Helper: extract user from token
function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { id: number };
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const decoded = getUserFromRequest(req);

    if (!decoded?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flowId = parseInt(params.id);
    const userId = decoded.id;

    // Get trigger data (optional)
    const body = await req.json().catch(() => ({}));
    const triggerData = body.triggerData || {};

    // Execute the flow
    const result = await triggerFlow(flowId, userId, triggerData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Flow executed successfully',
        context: result.context,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Flow execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute flow',
      },
      { status: 500 }
    );
  }
}
