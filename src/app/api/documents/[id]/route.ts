import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { readFile, unlink } from 'fs/promises';
import { del, get } from '@vercel/blob';
import path from 'path';

function getValidatedLocalPath(fileUrl: string, userId: string): string {
  if (!fileUrl.startsWith('file://')) throw new Error('Not a local file URL');
  let localPath = fileUrl.replace('file://', '');
  
  if (process.platform === 'win32' && localPath.match(/^\/[a-zA-Z]:\//)) {
    localPath = localPath.substring(1);
  }
  
  const normalizedPath = path.resolve(localPath);
  const expectedPrefix = path.resolve(process.cwd(), '.local-storage', 'documents', 'users', userId);
  
  if (!normalizedPath.startsWith(expectedPrefix)) {
    throw new Error('Path traversal detected or invalid directory');
  }
  
  return normalizedPath;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const document = await db.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (document.fileUrl.startsWith('http')) {
      try {
        const getBlobResult = await get(document.fileUrl, { 
          access: 'private'
        });
        
        if (getBlobResult && getBlobResult.stream) {
          return new NextResponse(getBlobResult.stream as unknown as ReadableStream, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${document.filename}"`,
            },
          });
        } else {
          return NextResponse.json({ error: 'Blob not found or could not be streamed.' }, { status: 404 });
        }
      } catch (blobError: any) {
        console.warn('[documents/[id]] Vercel Blob streaming failed. Error:', blobError.message);
        return NextResponse.json(
          { error: 'Failed to access document storage. Missing or invalid Blob credentials.' },
          { status: 500 }
        );
      }
    }

    const localPath = getValidatedLocalPath(document.fileUrl, session.userId);
    const fileBuffer = await readFile(localPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.filename}"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/documents/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const document = await db.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      if (document.fileUrl.startsWith('http')) {
        await del(document.fileUrl);
      } else {
        const localPath = getValidatedLocalPath(document.fileUrl, session.userId);
        await unlink(localPath);
      }
    } catch (fsError: any) {
      if (fsError.code !== 'ENOENT') {
        console.error('[DELETE /api/documents/[id]] File deletion error:', fsError);
      }
    }

    await db.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/documents/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
