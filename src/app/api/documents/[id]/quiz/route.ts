import { NextRequest, NextResponse } from 'next/server';
import { getValidatedDocumentContext, generateWithCache, standardErrorResponse } from '@/lib/ai/document-ai';
import db from '@/lib/db';
import { z } from 'zod';

const QuizSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.number().int().min(0).max(3),
    explanation: z.string()
  })).min(5).max(10)
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

    const systemPrompt = `You are an academic evaluator. Create a multiple-choice practice quiz based strictly on the provided document.
Rules:
- Generate 5 to 10 questions.
- Each question must have exactly 4 distinct options.
- Exactly one correct answer (provided as a 0-based index of the options array).
- Include an explanation for why the answer is correct.
- Do not invent facts outside the document.`;

    const result = await generateWithCache(
      validation.context!,
      'QUIZ',
      systemPrompt,
      QuizSchema,
      "Generate a practice quiz for this document.",
      forceNew
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[documents/quiz] Server Error:', error);
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
      where: { documentId_type: { documentId: id, type: 'QUIZ' } }
    });

    if (cached && cached.status === 'READY' && cached.result) {
      return NextResponse.json({ success: true, data: cached.result });
    }
    
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return standardErrorResponse({ status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' });
  }
}
