import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessionStore.get(id);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(session);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessionStore.get(id);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { attributions, people } = body;

    const updatedSession = {
      ...session,
      updatedAt: Date.now(),
    };

    if (attributions !== undefined) {
      updatedSession.attributions = attributions;
    }

    if (people !== undefined) {
      updatedSession.people = people;
    }

    sessionStore.set(id, updatedSession);

    return NextResponse.json(updatedSession);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = sessionStore.delete(id);

  if (!deleted) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
