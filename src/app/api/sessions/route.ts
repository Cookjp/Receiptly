import { NextRequest, NextResponse } from 'next/server';
import { sessionStore, SharedSession } from '@/lib/sessionStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receipt, people } = body;

    if (!receipt || !people) {
      return NextResponse.json(
        { error: 'Missing required fields: receipt and people' },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();
    const now = Date.now();

    const session: SharedSession = {
      id: sessionId,
      receipt,
      people,
      attributions: [],
      createdAt: now,
      updatedAt: now,
    };

    sessionStore.set(sessionId, session);

    return NextResponse.json(
      {
        sessionId,
        shareUrl: `/split-receipt/items?session=${sessionId}`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
