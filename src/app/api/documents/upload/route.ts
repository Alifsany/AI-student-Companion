import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Please sign in to upload study materials.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid Content-Type', message: 'Expected multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file', message: 'No file provided in the request.' }, { status: 400 });
    }

    // Type validation
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Invalid file type', message: 'Only PDF files are supported.' }, { status: 400 });
    }

    // Size validation
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large', message: 'This PDF is larger than 20 MB. Please choose a smaller file.' }, { status: 400 });
    }

    // Generate safe unique pathname
    const uniqueId = crypto.randomUUID();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim() || 'document.pdf';
    const clientPathname = `users/${session.userId}/${uniqueId}-${sanitizedFilename}`;

    // Upload to Vercel Blob (Server-Side)
    let blobResult;
    try {
      blobResult = await put(clientPathname, file, {
        access: 'private',
        contentType: 'application/pdf',
      });
    } catch (uploadError: any) {
      console.error('[Upload API] Vercel Blob put() error:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', message: 'We couldn\'t upload your PDF right now. Please try again.' },
        { status: 500 }
      );
    }

    // Create Document record
    let document;
    try {
      document = await db.document.create({
        data: {
          userId: session.userId,
          filename: file.name,
          fileUrl: blobResult.url,
          fileType: 'application/pdf',
          size: file.size,
          status: 'PROCESSING',
        },
      });
    } catch (dbError) {
      console.error('[Upload API] DB create error:', dbError);
      // Clean up orphaned blob if DB creation fails
      try {
        const { del } = await import('@vercel/blob');
        await del(blobResult.url);
      } catch (cleanupError) {
        console.error('[Upload API] Failed to clean up orphaned blob:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to save the document record. Please try again.' },
        { status: 500 }
      );
    }

    // Return the created document info
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
  } catch (error: any) {
    console.error('[Upload API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
