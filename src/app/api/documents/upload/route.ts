import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as HandleUploadPresignedBody;

    const jsonResponse = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname, clientPayload, multipart) => {
        try {
          const session = await getSession();
          if (!session?.userId) {
            throw new Error('Unauthorized: No valid session found');
          }

          if (!pathname.startsWith(`users/${session.userId}/`)) {
            throw new Error(`Unauthorized pathname prefix. Expected: users/${session.userId}/`);
          }
          
          if (pathname.includes('../')) {
            throw new Error('Invalid pathname');
          }

          const token = await issueSignedToken({
  allowedContentTypes: ['application/pdf'],
  maximumSizeInBytes: 50 * 1024 * 1024,
  pathname,
  validUntil: Date.now() + 60 * 60 * 1000,
  operations: ['put'],
});

          return {
            token,
            urlOptions: {
              tokenPayload: JSON.stringify({ userId: session.userId })
            }
          };
        } catch (innerError: any) {
          console.error('[getSignedToken error]:', innerError);
          throw innerError;
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          if (!tokenPayload) throw new Error('Missing tokenPayload');
          const { userId } = JSON.parse(tokenPayload);
          console.log(`[Vercel Blob] Upload completed securely for user ${userId}: ${blob.url}`);
        } catch (err) {
          console.error('[Vercel Blob] Webhook error:', err);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('[Upload API] Error handling upload:', error.message || String(error));
    return NextResponse.json(
      { 
        error: 'Failed to handle upload.', 
        message: error.message || String(error)
      }, 
      { status: 400 }
    );
  }
}
