import { NextRequest, NextResponse } from 'next/server';
import { AI_MODEL_NAME } from '@/lib/ai-model';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { readFile } from 'fs/promises';
import { GoogleGenerativeAI } from "@google/generative-ai";
import PDFParser from 'pdf2json';

function sanitizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1);
    
    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent().replace(/\r\n/g, '\n'));
    });
    
    pdfParser.parseBuffer(buffer);
  });
}

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
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ocrMode = req.nextUrl.searchParams.get('ocr') === 'true';

    let fileBuffer: Buffer;
    try {
      if (document.fileUrl.startsWith('http')) {
        const response = await fetch(document.fileUrl);
        if (!response.ok) throw new Error('Failed to fetch blob');
        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      } else {
        fileBuffer = await readFile(document.fileUrl);
      }
    } catch (e) {
      return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }

    let cleanText = "";

    if (!ocrMode) {
      // Step 1: Normal pdf2json extraction
      let rawText = "";
      try {
        rawText = await extractTextFromPDF(fileBuffer);
      } catch (parseError: any) {
        console.error(`[documents/extract] Parsing error for document ${id}:`, parseError);
        
        await db.document.update({
          where: { id },
          data: {
            status: 'FAILED',
            extractionError: 'Failed to parse PDF file. The file might be corrupted or malformed.',
          },
        });
        
        return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 400 });
      }

      cleanText = sanitizeExtractedText(rawText).trim();
      const actualText = cleanText.replace(/----------------Page \(\d+\) Break----------------/g, '').trim();
      
      if (!actualText || actualText.length < 10) {
        // Step 2: Signal frontend to run OCR fallback
                return NextResponse.json({ success: false, error: 'NEEDS_OCR', message: 'Scanned PDF detected. Running OCR...' });
      }
    } else {
      // Step 3: Run Professional AI OCR
      try {
                const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
          return NextResponse.json({ success: false, error: 'OCR_FAILED', message: 'AI service is not configured on this server.' }, { status: 500 });
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: AI_MODEL_NAME });
        const prompt = "Extract all readable text from this scanned PDF exactly as it appears. Maintain the exact page order. Do not summarize or add markdown formatting. If the document is totally empty or contains no readable text, return exactly 'NO_TEXT_FOUND'.";
        
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: fileBuffer.toString("base64"),
              mimeType: "application/pdf"
            }
          }
        ]);
        
        const ocrText = result.response.text().trim();
        if (ocrText.includes('NO_TEXT_FOUND') || ocrText.length < 10) {
          throw new Error("No readable text found via OCR.");
        }
        
        cleanText = sanitizeExtractedText(ocrText);
      } catch (ocrError: any) {
        console.error(`[documents/extract] OCR failed for document ${id}:`, ocrError);
        await db.document.update({
          where: { id },
          data: {
            status: 'FAILED',
            extractionError: "This PDF appears to be image-based and we couldn't extract readable text.",
          },
        });
        return NextResponse.json({ success: false, error: 'OCR_FAILED', message: "This PDF appears to be image-based and we couldn't extract readable text." });
      }
    }

    try {
      await db.document.update({
        where: { id },
        data: {
          extractedText: cleanText,
          extractedAt: new Date(),
          status: 'READY',
          extractionError: null,
        },
      });

            return NextResponse.json({
        success: true,
        documentId: id,
        textLength: cleanText.length,
        message: 'Text extracted successfully',
      });

    } catch (dbError: any) {
      console.error(`[documents/extract] Database/Save error for document ${id}:`, dbError);
      
      await db.document.update({
        where: { id },
        data: {
          status: 'FAILED',
          extractionError: 'Failed to save extracted text to the database due to an encoding error.',
        },
      }).catch(() => {});
      
      return NextResponse.json({ error: 'Failed to save extracted text' }, { status: 500 });
    }

  } catch (error) {
    console.error('[documents/extract] Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
