import { NextRequest, NextResponse } from 'next/server';
import { getValidatedDocumentContext, generateWithCache, standardErrorResponse } from '@/lib/ai/document-ai';
import { z } from 'zod';
import db from '@/lib/db';

const FormulasSchema = z.object({
  formulas: z.array(z.object({
    name: z.string(),
    formula: z.string(),
    variables: z.array(z.object({
      symbol: z.string(),
      meaning: z.string()
    })).optional(),
    usage: z.string().optional()
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

    const systemPrompt = `You are an academic assistant. Use only the information contained in the provided document.
Identify and extract important mathematical, scientific, or logical formulas. If the document has no formulas, return an empty array. Do not invent formulas not present in the document.`;

    const result = await generateWithCache(
      validation.context!,
      'FORMULAS',
      systemPrompt,
      FormulasSchema,
      "Extract the important formulas from this document.",
      forceNew
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[documents/formulas] Server Error:', error);
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
      where: { documentId_type: { documentId: id, type: 'FORMULAS' } }
    });

    if (cached && cached.status === 'READY' && cached.result) {
      return NextResponse.json({ success: true, data: cached.result });
    }
    
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return standardErrorResponse({ status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' });
  }
}
