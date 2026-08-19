import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { streamText, convertToModelMessages } from 'ai';
import { getAiModel } from '@/lib/ai-model';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const document = await db.document.findUnique({
      where: { id },
      select: { userId: true, extractedText: true }
    });

    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (document.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!document.extractedText) return NextResponse.json({ error: 'No extracted text found' }, { status: 400 });

    const { messages } = await req.json();

    const systemPrompt = `You are an academic study assistant.
Answer using ONLY the provided document content. Do not invent information.
If the answer cannot be found in the document, clearly say that the information is not available in the document.

DOCUMENT CONTENT:
${document.extractedText.slice(0, 100000)} // Truncate safely
`;

    const result = streamText({
      model: getAiModel(),
      system: systemPrompt,
      messages: await convertToModelMessages(messages.map((m: any) => ({ ...m, parts: m.parts || [{ type: 'text', text: m.content || '' }] }))),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[documents/ask] Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
