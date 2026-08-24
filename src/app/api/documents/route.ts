import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await db.document.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        fileType: true,
        size: true,
        status: true,
        createdAt: true, 
        extractionError: true, 
        summaryGeneratedAt: true, 
        summaryError: true,
      },
    });

    const serializedDocuments = documents.map(doc => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      summaryGeneratedAt: doc.summaryGeneratedAt ? doc.summaryGeneratedAt.toISOString() : null
    }));

    return NextResponse.json({ documents: serializedDocuments });
  } catch (error) {
    console.error('[GET /api/documents] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
