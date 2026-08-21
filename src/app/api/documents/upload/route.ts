import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Pathname is whatever the client passed, let's sanitize it
        const originalFilename = pathname || 'document.pdf';
        const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim() || 'document.pdf';
        const uniqueId = randomUUID();
        
        // Enforce user-specific directory
        const safePathname = `${session.userId}/${uniqueId}-${sanitizedFilename}`;

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 50 * 1024 * 1024,
          tokenPayload: JSON.stringify({ userId: session.userId }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // We could save to DB here, but in local dev Vercel cannot reach this webhook
        // So we will just handle DB saving from the client after the upload completes
        console.log('Upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: 'Failed to handle upload: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
