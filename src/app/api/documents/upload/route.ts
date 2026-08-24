import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession();
        if (!session?.userId) {
          throw new Error('Unauthorized: Please sign in to upload documents.');
        }
        
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: MAX_SIZE,
          tokenPayload: JSON.stringify({ userId: session.userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log(`[Upload API] Client upload completed directly to Blob storage: ${blob.url}`);
        // Note: We create the database record synchronously from the client immediately 
        // after `upload()` resolves, rather than asynchronously here, so the user 
        // UI navigation can wait for the actual DB ID.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('[Upload API] Vercel Blob token error:', error);
    return NextResponse.json(
      { error: 'Upload failed', message: error.message || 'An error occurred during upload initialization.' },
      { status: 400 }
    );
  }
}
