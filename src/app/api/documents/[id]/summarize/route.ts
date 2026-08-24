import { NextRequest, NextResponse } from 'next/server';
import { getValidatedDocumentContext, generateWithCache, standardErrorResponse } from '@/lib/ai/document-ai';
import { z } from 'zod';
import db from '@/lib/db';

const SummarySchema = z.object({
  title: z.string(),
  overview: z.string(),
  mainPoints: z.array(z.string()),
  conclusion: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const validation = await getValidatedDocumentContext(id);
    if (validation.error) return standardErrorResponse(validation.error);

    const body = await req.json().catch(() => ({}));
    const forceNew = !!body.forceNew;

    const systemPrompt = `You are an academic AI assistant. Your goal is to produce a clear, concise, and structured study-oriented summary of the provided text.
Preserve important technical terminology. Explain difficult concepts simply. Do not invent information that is not present.`;

    const result = await generateWithCache(
      validation.context!,
      'SUMMARY',
      systemPrompt,
      SummarySchema,
      "Generate a structured summary of the above document.",
      forceNew
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[documents/summarize] Server Error:', error);
    return standardErrorResponse({ status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const validation = await getValidatedDocumentContext(id);
    if (validation.error) return standardErrorResponse(validation.error);

    const cached = await db.documentAIResult.findUnique({
      where: { documentId_type: { documentId: id, type: 'SUMMARY' } }
    });

    if (cached && cached.status === 'READY' && cached.result) {
      return NextResponse.json({ success: true, data: cached.result });
    }
    
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return standardErrorResponse({ status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' });
  }
}
