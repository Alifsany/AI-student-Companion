import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { head } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_OIDC_TOKEN) {
      return NextResponse.json(
        { error: 'Vercel Blob is not configured. Missing BLOB_READ_WRITE_TOKEN or VERCEL_OIDC_TOKEN.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { url, pathname, filename, size } = body;

    if (!url || !pathname || !filename || typeof size !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit.' }, { status: 400 });
    }

    // MANDATORY SECURITY VERIFICATION: Do not trust browser inputs blindly.
    // Ensure the blob actually exists in our Vercel Blob store and belongs to this user.
    try {
      const blobMetadata = await head(url);

      if (blobMetadata.size > 50 * 1024 * 1024) {
         return NextResponse.json({ error: 'Verified file size exceeds 50MB limit.' }, { status: 400 });
      }

      // Also ensure the pathname contains the correct userId to prevent IDOR via malicious URL reuse
      if (!blobMetadata.pathname.startsWith(`users/${session.userId}/`)) {
         return NextResponse.json({ error: 'Blob does not belong to the authenticated user.' }, { status: 403 });
      }
    } catch (headError) {
      console.error('Failed to verify blob via head():', headError);
      return NextResponse.json({ error: 'Failed to verify uploaded blob.' }, { status: 400 });
    }

    let document;
    try {
      document = await db.document.create({
        data: {
          userId: session.userId,
          filename: filename,
          fileUrl: url,
          fileType: 'application/pdf',
          size: size,
          status: 'PROCESSING',
        },
      });
    } catch (dbError) {
      console.error('[POST /api/documents] Error creating document record:', dbError);
      
      // Attempt to clean up the orphaned blob since the DB record failed
      try {
        if (url.startsWith('http')) {
           const { del } = await import('@vercel/blob');
           await del(url);
        }
      } catch (cleanupError) {
        console.error('Failed to clean up orphaned blob:', cleanupError);
      }
      
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      fileType: document.fileType,
      size: document.size,
      status: document.status,
      createdAt: document.createdAt.toISOString(),
      extractionError: document.extractionError,
      summaryGeneratedAt: document.summaryGeneratedAt ? document.summaryGeneratedAt.toISOString() : null,
      summaryError: document.summaryError,
    });
  } catch (error) {
    console.error('[POST /api/documents] Error creating document record:', error);
    return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
  }
}

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
        createdAt: true, extractionError: true, summaryGeneratedAt: true, summaryError: true,
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
