import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { put } from '@vercel/blob';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB


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

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must have a .pdf extension.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    const originalFilename = file.name;
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim() || 'document.pdf';
    const uniqueId = randomUUID();
    const storedFileName = `${uniqueId}.pdf`;

    const isVercel = process.env.VERCEL === '1';
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env['BLOB_READ_WRITE_TOKEN'];
    let fileUrl = '';

    if (isVercel || blobToken) {
      if (!blobToken && isVercel) {
        console.warn('Vercel environment detected but BLOB_READ_WRITE_TOKEN might be hidden during build. @vercel/blob will attempt to read it at runtime.');
      }
      try {
        const blob = await put(storedFileName, file, { access: 'public' });
        fileUrl = blob.url;
      } catch (err: any) {
        console.error('Blob upload error:', err);
        return NextResponse.json({ error: 'Failed to upload to cloud storage: ' + (err.message || 'Unknown error') }, { status: 500 });
      }
    } else {
      const STORAGE_DIR = join(process.cwd(), 'storage', 'documents');
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }

      const storedFilePath = join(STORAGE_DIR, storedFileName);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(storedFilePath, buffer);
      fileUrl = storedFilePath;
    }

    const document = await db.document.create({
      data: {
        userId: session.userId,
        filename: sanitizedFilename,
        fileUrl: fileUrl,
        fileType: file.type,
        size: file.size,
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
    console.error('[POST /api/documents] Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
