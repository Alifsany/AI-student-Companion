import { NextRequest, NextResponse } from 'next/server';
import { getValidatedDocumentContext, generateWithCache, standardErrorResponse } from '@/lib/ai/document-ai';
import { z } from 'zod';
import db from '@/lib/db';

const StudyNotesSchema = z.object({
  studyNotes: z.array(z.object({
    title: z.string(),
    content: z.string()
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

    const systemPrompt = `You are an academic assistant. Generate structured study notes from the provided document.
Use clear headings, bullet points, concise explanations, and important terms. Do not invent information.`;

    const result = await generateWithCache(
      validation.context!,
      'STUDY_NOTES',
      systemPrompt,
      StudyNotesSchema,
      "Generate comprehensive study notes for this document.",
      forceNew
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[documents/study_notes] Server Error:', error);
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
      where: { documentId_type: { documentId: id, type: 'STUDY_NOTES' } }
    });

    if (cached && cached.status === 'READY' && cached.result) {
      return NextResponse.json({ success: true, data: cached.result });
    }
    
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return standardErrorResponse({ status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' });
  }
}
