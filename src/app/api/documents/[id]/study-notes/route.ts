import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { generateText } from 'ai';
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

    const systemPrompt = `You are an academic study assistant.
Generate comprehensive, structured study notes from the provided document content.
Use the following format when appropriate:
- Topic
- Key Concepts
- Definitions
- Important Points
- Examples
- Exam Tips

Do not invent information. Rely strictly on the document text. Output perfectly formatted markdown.`;

    const { text } = await generateText({
      model: getAiModel(),
      system: systemPrompt,
      prompt: `DOCUMENT CONTENT:\n${document.extractedText.slice(0, 100000)}`,
    });

    return NextResponse.json({ success: true, notes: text });
  } catch (error) {
    console.error('[documents/study-notes] Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
