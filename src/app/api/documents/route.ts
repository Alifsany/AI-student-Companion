import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { head } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, pathname, filename, size } = body;

    if (!url || !pathname || !filename || typeof size !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit.' }, { status: 400 });
    }

    // Optional: verify the blob exists in our store and size matches (security check)
    try {
      const blobMetadata = await head(url);
      if (blobMetadata.size !== size) {
         console.warn(`Blob size mismatch: expected ${size}, got ${blobMetadata.size}`);
      }
    } catch (headError) {
      console.warn('Failed to verify blob via head():', headError);
      // Could fail if token is missing locally, we'll continue anyway to allow local dev if needed
    }

    const document = await db.document.create({
      data: {
        userId: session.userId,
        filename: filename,
        fileUrl: url,
        fileType: 'application/pdf',
        size: size,
        status: 'PROCESSING',
      },
    });

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      size: document.size,
      status: document.status,
    });
  } catch (error) {
    console.error('[POST /api/documents] Error creating document record:', error);
    return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.isAuth) {
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
        createdAt: true, extractionError: true, summaryGeneratedAt: true, summaryError: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('[GET /api/documents] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
