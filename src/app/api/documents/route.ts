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

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Please sign in' }, { status: 401 });
    }

    const { fileUrl, filename, size } = await req.json();

    if (!fileUrl || !filename || typeof size !== 'number') {
      return NextResponse.json({ error: 'Bad Request', message: 'Missing required metadata' }, { status: 400 });
    }
    
    // Server-side size validation
    if (size > 20 * 1024 * 1024) {
       return NextResponse.json({ error: 'File too large', message: 'PDF must be 20MB or smaller.' }, { status: 400 });
    }

    // Verify it is a Vercel Blob URL to prevent SSRF or arbitrary URL injection
    if (!fileUrl.startsWith('https://') || (!fileUrl.includes('public.blob.vercel-storage.com') && !fileUrl.includes('vercel-storage.com'))) {
       return NextResponse.json({ error: 'Bad Request', message: 'Invalid file URL' }, { status: 400 });
    }

    const document = await db.document.create({
      data: {
        userId: session.userId,
        filename,
        fileUrl,
        fileType: 'application/pdf',
        size,
        status: 'PROCESSING',
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        fileType: document.fileType,
        size: document.size,
        status: document.status,
        createdAt: document.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('[POST /api/documents] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: 'Failed to save document metadata' }, { status: 500 });
  }
}
