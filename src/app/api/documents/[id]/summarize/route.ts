import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { getAiModel } from '@/lib/ai-model';
import { generateText } from 'ai';

const MAX_CHUNK_LENGTH = 50000;

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

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!document.extractedText) {
      return NextResponse.json({ error: 'No extracted text found. Please extract text first.' }, { status: 400 });
    }

    
    try {
      const text = document.extractedText;
      let finalSummary = '';

      const systemPrompt = `You are an academic AI assistant. Your goal is to produce a concise but useful study-oriented summary of the provided text.
Preserve important technical terminology. Explain difficult concepts in simple language where appropriate. Avoid inventing information that is not present. Ignore irrelevant formatting artifacts.
Organize the result clearly with the following structure:
# Summary
A concise overview of the document.

# Key Concepts
- Concept 1
- Concept 2

# Important Details
- Important fact/definition

# Exam Focus
- Topics likely to be important for studying/revision.`;

      if (text.length <= MAX_CHUNK_LENGTH) {
        // Single chunk summarization
        const { text: generatedText } = await generateText({
          model: getAiModel(),
          system: systemPrompt,
          prompt: `Summarize the following academic text:\n\n${text}`,
        });
        finalSummary = generatedText;
      } else {
        // Multi-chunk summarization
                const chunks = [];
        for (let i = 0; i < text.length; i += MAX_CHUNK_LENGTH) {
          chunks.push(text.slice(i, i + MAX_CHUNK_LENGTH));
        }

        const chunkSummaries = [];
        for (let i = 0; i < chunks.length; i++) {
                    const { text: chunkSummary } = await generateText({
            model: getAiModel(),
            system: 'You are an academic AI assistant. Summarize the following section of an academic text concisely. Capture the key points and terminology.',
            prompt: `Section text:\n\n${chunks[i]}`,
          });
          chunkSummaries.push(`--- SECTION ${i + 1} SUMMARY ---\n${chunkSummary}`);
        }

                const { text: combinedText } = await generateText({
          model: getAiModel(),
          system: systemPrompt,
          prompt: `The following are sequential summaries of different sections of a large academic document. Combine them into a single, cohesive, and comprehensive final summary.\n\n${chunkSummaries.join('\n\n')}`,
        });
        finalSummary = combinedText;
      }

      await db.document.update({
        where: { id },
        data: {
          summaryText: finalSummary,
          summaryGeneratedAt: new Date(),
          summaryError: null,
        },
      });

            return NextResponse.json({ success: true, message: 'Summary generated successfully' });

    } catch (aiError: any) {
      console.error(`[documents/summarize] AI generation error for document ${id}:`, aiError);
      
      await db.document.update({
        where: { id },
        data: {
          summaryError: 'Failed to generate summary. The AI service might be unavailable or the document is too complex.',
        },
      });
      
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

  } catch (error) {
    console.error('[documents/summarize] Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
