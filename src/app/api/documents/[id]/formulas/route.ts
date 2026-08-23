import { NextRequest, NextResponse } from "next/server";
import { getAiModel } from '@/lib/ai-model';
import { verifySession } from "@/lib/dal";
import db from "@/lib/db";
import { generateObject } from "ai";
import { z } from "zod";

const FormulaSchema = z.object({
  formulas: z.array(z.object({
    formula: z.string(),
    name: z.string(),
    explanation: z.string(),
    variables: z.array(z.object({
      symbol: z.string(),
      meaning: z.string(),
      unit: z.string().optional()
    })),
    example: z.string().optional()
  }))
});

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
    
    if (!document.extractedText || document.extractedText.trim() === "") {
      return NextResponse.json({ error: "Your PDF does not contain enough readable text to extract formulas." }, { status: 400 });
    }

    if (document.formulas) {
      return NextResponse.json({ success: true, formulas: document.formulas });
    }

    const systemPrompt = `You are an academic assistant. Extract ONLY mathematical or scientific formulas from the provided document. Do not invent formulas. Preserve mathematical notation. Explain every variable. Include units and a short practical example when identifiable. If the document contains no meaningful formulas, return an empty formulas array.`;

    const { object } = await generateObject({
      model: getAiModel(),
      system: systemPrompt,
      prompt: `DOCUMENT CONTENT:\n${document.extractedText.slice(0, 100000)}`,
      schema: FormulaSchema,
    });

    await db.document.update({
      where: { id },
      data: { formulas: object as any },
    });

    return NextResponse.json({ success: true, formulas: object });
  } catch (error) {
    console.error("[API /formulas] Error:", error);
    return NextResponse.json({ error: "Unable to generate formulas right now. Please try again." }, { status: 500 });
  }
}
