import { NextRequest, NextResponse } from 'next/server';
import { getValidatedDocumentContext, generateWithCache, standardErrorResponse } from '@/lib/ai/document-ai';
import { z } from 'zod';
import db from '@/lib/db';

const ImportantPointsSchema = z.object({
  points: z.array(z.object({
    point: z.string(),
    whyImportant: z.string()
  }))
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

    const systemPrompt = `You are an academic assistant. Extract 5-15 concise important points from the document, highly relevant for exam preparation.
Prefer definitions, core concepts, rules, relationships, and important distinctions. Do not invent facts outside the document.`;

    const result = await generateWithCache(
      validation.context!,
      'IMPORTANT_POINTS',
      systemPrompt,
      ImportantPointsSchema,
      "Extract the most important points from this document.",
      forceNew
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[documents/important_points] Server Error:', error);
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
      where: { documentId_type: { documentId: id, type: 'IMPORTANT_POINTS' } }
    });

    if (cached && cached.status === 'READY' && cached.result) {
      return NextResponse.json({ success: true, data: cached.result });
    }
    
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return standardErrorResponse({ status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' });
  }
}
