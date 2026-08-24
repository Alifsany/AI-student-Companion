import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateWithCache } from '@/lib/ai/document-ai';
import { z } from 'zod';
import * as aiSdk from 'ai';

export async function GET() {
  console.log('--- STARTING CACHE VERIFICATION ---');
  let results = [];
  
  try {
    const user = await db.user.findFirst();
    if (!user) throw new Error("No user found in DB");

    const doc = await db.document.create({
      data: {
        fileUrl: 'file://fake', fileType: 'application/pdf',
        filename: 'fake.pdf', size: 100,
        userId: user.id, extractedText: 'This is a test document.', status: 'READY'
      }
    });
    
    results.push(`Created test document: ${doc.id}`);

    const context = { documentId: doc.id, extractedText: doc.extractedText! };
    const TestSchema = z.object({ result: z.string() });

    let geminiCallCount = 0;
    (aiSdk as any).generateObject = async () => {
      geminiCallCount++;
      return { object: { result: 'first-generation' } };
    };

    // Test 1
    const res1 = await generateWithCache(context as any, 'TEST', 'sys', TestSchema);
    if (!res1.success || res1.cached) throw new Error('Test 1 Failed');
    const cache1 = await db.documentAIResult.findUnique({ where: { documentId_type: { documentId: doc.id, type: 'TEST' } }});
    results.push(`Test 1 (First Request): Success=${res1.success}, Cached=${res1.cached}, DBStatus=${cache1?.status}`);

    // Test 2
    const res2 = await generateWithCache(context as any, 'TEST', 'sys', TestSchema);
    if (!res2.success || !res2.cached || geminiCallCount !== 1) throw new Error('Test 2 Failed');
    results.push(`Test 2 (Second Request): Success=${res2.success}, Cached=${res2.cached}, Calls=${geminiCallCount}`);

    // Test 3
    await db.documentAIResult.update({
      where: { documentId_type: { documentId: doc.id, type: 'TEST' } },
      data: { status: 'GENERATING' }
    });
    const res3 = await generateWithCache(context as any, 'TEST', 'sys', TestSchema);
    if (res3.success || res3.status !== 409) throw new Error('Test 3 Failed');
    results.push(`Test 3 (Duplicate Request): Success=${res3.success}, Status=${res3.status}`);

    // Test 4
    await db.documentAIResult.delete({ where: { documentId_type: { documentId: doc.id, type: 'TEST' } }});
    (aiSdk as any).generateObject = async () => { throw new Error('Fake quota error'); };
    const res4 = await generateWithCache(context as any, 'TEST', 'sys', TestSchema);
    if (res4.success) throw new Error('Test 4 Failed');
    const cache4 = await db.documentAIResult.findUnique({ where: { documentId_type: { documentId: doc.id, type: 'TEST' } }});
    results.push(`Test 4 (Failed Generation): Success=${res4.success}, DBStatus=${cache4?.status}`);

    // Cleanup
    await db.document.delete({ where: { id: doc.id } });
    results.push(`Cleanup successful. All logic verified locally!`);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, results });
  }
}
