import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const document = await db.document.findUnique({
      where: { id },
      select: { userId: true, extractedText: true, status: true, extractionError: true }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      extractedText: document.extractedText,
      status: document.status,
      error: document.extractionError
    });
  } catch (error) {
    console.error('[GET /api/documents/[id]/text] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
