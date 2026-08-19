import { getAiModel } from '@/lib/ai-model';
import { generateObject } from 'ai';
import { z } from 'zod';
import { verifySession, getCurrentUser } from '@/lib/dal';
import db from '@/lib/db';
import { calculateGPA } from '@/lib/grading';
import {
  encryptPracticeToken,
  practiceTokenExpiryTimestamp,
  type PracticeQuestionAnswer,
} from '@/lib/practice-token';

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------
const QUESTION_TYPES = [
  'MCQ',
  'SHORT_ANSWER',
  'TRUE_FALSE',
  'CONCEPTUAL',
  'PROBLEM_SOLVING',
  'CODING',
] as const;

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const PracticeQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: z.enum(QUESTION_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  hint: z.string().optional(),
});

const PracticeSetSchema = z.object({
  questions: z.array(PracticeQuestionSchema).min(1).max(30),
});

const RequestSchema = z.object({
  subjectId: z.string().optional(),
  documentId: z.string().optional(),
  topic: z.string().max(200).optional(),
  types: z.array(z.enum(QUESTION_TYPES)).min(1),
  difficulty: z.enum(DIFFICULTIES),
  count: z.number().int().min(1).max(30),
  mode: z.enum(['QUIZ', 'MOCK_EXAM']).default('QUIZ'),
  timeLimitSeconds: z.number().int().min(60).max(10800).optional(), // 1min–3hr
});

export async function POST(req: Request) {
  // 1. Auth
  const session = await verifySession();
  if (!session?.isAuth) {
    
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse & validate
  let body: z.infer<typeof RequestSchema>;
  try {
    
    const raw = await req.json();
    
    body = RequestSchema.parse(raw);
  } catch (e) { console.error('Zod Error:', e);
    return Response.json({ error: 'Invalid request parameters.' }, { status: 400 });
  }

  const { subjectId, documentId, topic, types, difficulty, count, mode, timeLimitSeconds } = body;

  // 3. Validate subject ownership
  let activeSubject = null;
  if (subjectId) {
    activeSubject = await db.subject.findFirst({
      where: { id: subjectId, userId: session.userId, status: 'ACTIVE' },
    });
    if (!activeSubject) {
      return Response.json({ error: 'Subject not found.' }, { status: 404 });
    }
  }

  // 3.5 Validate document ownership
  let activeDocument = null;
  if (documentId) {
    activeDocument = await db.document.findFirst({
      where: { extractedText: { not: null } },
    });
    
    if (!activeDocument) {
      return Response.json({ error: 'Document not found or unauthorized.' }, { status: 404 });
    }
    if (!activeDocument.extractedText) {
      return Response.json({ error: 'Document has no extracted text.' }, { status: 400 });
    }
  }

  // 4. Academic context
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'User not found.' }, { status: 404 });

  const academicRecords = await db.academicRecord.findMany({
    where: { userId: session.userId },
  });
  const gpa = calculateGPA(academicRecords);

  const upcomingTasks = await db.academicTask.findMany({
    where: {
      userId: session.userId,
      status: { not: 'COMPLETED' },
      ...(activeSubject ? { subjectId: activeSubject.id } : {}),
    },
    take: 3,
    orderBy: { dueDate: 'asc' },
    include: { subject: { select: { name: true } } },
  });

  // 5. Build generation prompt
  const taskCtx = upcomingTasks.length
    ? `Relevant upcoming tasks: ${upcomingTasks.map((t) => t.title).join(', ')}`
    : '';

  const subjectCtx = activeSubject
    ? `Subject: ${activeSubject.name} (${activeSubject.code || 'N/A'}).`
    : 'General Studies.';
  const topicCtx = topic ? `Focus specifically on: ${topic}.` : 'Focus on the subject matter generally.';
  
  const documentCtx = activeDocument
    ? `\n\nUSE ONLY THE FOLLOWING DOCUMENT CONTENT FOR QUESTIONS. DO NOT INVENT INFORMATION OUTSIDE THIS DOCUMENT:\n${activeDocument.extractedText!.slice(0, 100000)}`
    : '';

  const typesList = types.join(', ');
  const examLabel = mode === 'MOCK_EXAM' ? 'Formal Mock Exam' : 'Practice Quiz';

  // 5. Build system prompt
  const systemPrompt = `You are an expert academic evaluator generating a ${examLabel}.
Your goal is to create exactly ${count} highly effective practice questions.
The difficulty MUST be ${difficulty}.

STRICT RULES:
- Each question MUST have a unique string id ("q1", "q2", ...).
- MCQ questions: "options" array REQUIRED with exactly 4 distinct options. "correctAnswer" MUST exactly match one option string.
- TRUE_FALSE questions: "options" MUST be ["True", "False"]. "correctAnswer" must be "True" or "False".
- SHORT_ANSWER, CONCEPTUAL, PROBLEM_SOLVING, CODING: omit "options". "correctAnswer" is a rubric/model answer (2-4 sentences).
- CODING: evaluate algorithmically - never include executable code as correctAnswer.
- "explanation" must explain WHY the answer is correct (2-3 sentences).
- "hint" is a subtle nudge without revealing the answer (optional).
- Questions must be academically rigorous, clear, and unambiguous.
- NEVER reveal the answer within the question text.`;

  // 6. AI generation
  let practiceSet: z.infer<typeof PracticeSetSchema>;
  try {
    
    const result = await generateObject({
      model: getAiModel(),
      schema: PracticeSetSchema,
      system: systemPrompt,
      prompt: `Generate ${count} ${difficulty} questions (types: ${typesList}) for ${examLabel}: ${subjectCtx}. ${topicCtx}${documentCtx}`,
    });
    
    practiceSet = result.object;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (
      errMsg.includes('API_KEY') ||
      errMsg.includes('api_key') ||
      errMsg.includes('401') ||
      errMsg.includes('403') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('429')
    ) {
      console.error(
        '[quiz/generate] AI provider auth/quota error — check GOOGLE_GENERATIVE_AI_API_KEY in .env',
      );
    } else {
      console.error('[quiz/generate] AI generation error:', errMsg);
    }
    return Response.json(
      { error: 'Failed to generate questions. Please try again.' },
      { status: 500 },
    );
  }

  // 7. Post-validate and build server payload
  const validatedQuestions: PracticeQuestionAnswer[] = [];
  const seenIds = new Set<string>();

  for (const q of practiceSet.questions) {
    // Enforce unique IDs
    let qId = q.id;
    if (seenIds.has(qId)) qId = `${qId}_${seenIds.size}`;
    seenIds.add(qId);

    if (q.type === 'MCQ') {
      if (!q.options || q.options.length !== 4) {
        return Response.json(
          { error: 'AI generated malformed MCQ. Please try again.' },
          { status: 500 },
        );
      }
      if (!q.options.includes(q.correctAnswer)) {
        const match = q.options.find((o) => o.toLowerCase() === q.correctAnswer.toLowerCase());
        if (match) q.correctAnswer = match;
        else
          return Response.json(
            { error: 'MCQ answer not in options. Please try again.' },
            { status: 500 },
          );
      }
    }

    if (q.type === 'TRUE_FALSE') {
      q.options = ['True', 'False'];
      q.correctAnswer = q.correctAnswer.toLowerCase() === 'true' ? 'True' : 'False';
    }

    validatedQuestions.push({
      id: qId,
      type: q.type,
      text: q.text,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      hint: q.hint,
      options: q.options,
    });
  }

  // 8. Create a quiz title
  const quizTitle = activeSubject
    ? `${examLabel}: ${activeSubject.name}${topic ? ` — ${topic}` : ''}`
    : `${examLabel}${topic ? `: ${topic}` : ''}`;

  // 9. Encrypt into JWE — answers stay server-side
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    userId: session.userId,
    questions: validatedQuestions,
    exp: practiceTokenExpiryTimestamp(),
    quizMode: mode as 'QUIZ' | 'MOCK_EXAM',
    timeLimitSeconds,
    startedAt: now, // server-authoritative start time
    subjectId: activeSubject?.id,
    subjectName: activeSubject?.name,
    title: quizTitle,
  };
  const token = await encryptPracticeToken(tokenPayload);

  // 10. Build client-safe questions (NO answers, NO explanations)
  const clientQuestions = validatedQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    difficulty,
    options: q.options,
    hint: q.hint,
  }));

  return Response.json({
    token,
    questions: clientQuestions,
    title: quizTitle,
    mode,
    timeLimitSeconds: timeLimitSeconds ?? null,
  });
}
