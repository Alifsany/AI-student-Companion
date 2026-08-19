import { NextRequest, NextResponse } from "next/server";
import { getAiModel } from '@/lib/ai-model';
import { verifySession } from "@/lib/dal";
import db from "@/lib/db";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session?.isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const document = await db.document.findUnique({
      where: { id },
      select: { userId: true, extractedText: true, formulas: true },
    });

    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    if (document.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!document.extractedText) return NextResponse.json({ error: "No text" }, { status: 400 });

    if (document.formulas) {
      return NextResponse.json({ success: true, formulas: document.formulas });
    }

    const systemPrompt = `You are an academic assistant. Use only the information contained in the provided document. Do not invent facts, formulas, definitions, or conclusions. If the requested information is not present, say so.
Extract any mathematical or scientific formulas from the document content.
If there are no formulas: output exactly "No formulas were found in this document."`;

    const { text } = await generateText({
      model: getAiModel(),
      system: systemPrompt,
      prompt: `DOCUMENT CONTENT:\n${document.extractedText.slice(0, 100000)}`,
    });

    await db.document.update({
      where: { id },
      data: { formulas: text },
    });

    return NextResponse.json({ success: true, formulas: text });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
