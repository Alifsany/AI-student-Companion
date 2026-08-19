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
// Zod schemas
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
  questions: z.array(PracticeQuestionSchema).min(1).max(10),
});

// ---------------------------------------------------------------------------
// Request body validation
// ---------------------------------------------------------------------------
const RequestSchema = z.object({
  subjectId: z.string().optional(),
  topic: z.string().max(200).optional(),
  type: z.enum(QUESTION_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  count: z.number().int().min(1).max(10),
});

export async function POST(req: Request) {
  // 1. Auth
  const session = await verifySession();
  if (!session?.isAuth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse & validate request body
  let body: z.infer<typeof RequestSchema>;
  try {
    const raw = await req.json();
    body = RequestSchema.parse(raw);
  } catch {
    return Response.json({ error: 'Invalid request parameters.' }, { status: 400 });
  }

  const { subjectId, topic, type, difficulty, count } = body;

  // 3. Validate subjectId ownership if provided
  let activeSubject = null;
  if (subjectId) {
    activeSubject = await db.subject.findFirst({
      where: { id: subjectId, userId: session.userId, status: 'ACTIVE' },
    });
    if (!activeSubject) {
      return Response.json({ error: 'Subject not found.' }, { status: 404 });
    }
  }

  // 4. Build compact academic context
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'User not found.' }, { status: 404 });

  const academicRecords = await db.academicRecord.findMany({
    where: { userId: session.userId },
    include: { subject: { select: { name: true } } },
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
  const subjectContext = activeSubject
    ? `Subject: ${activeSubject.name} (Code: ${activeSubject.code ?? 'N/A'})`
    : 'General academic practice (no specific subject)';

  const topicContext = topic
    ? `Topic (focus area): "${topic.trim()}"`
    : 'No specific topic — choose relevant content.';

  const taskContext = upcomingTasks.length
    ? `Upcoming tasks for context: ${upcomingTasks.map((t) => `${t.title} (${t.subject?.name ?? 'General'})`).join(', ')}`
    : '';

  const systemPrompt = `You are an AI question generator for a student academic tool. 
Generate exactly ${count} practice questions of type "${type}" at "${difficulty}" difficulty.
Student profile: ${user.gradeLevel ?? 'Unknown'} level, majoring in ${user.major ?? 'Unknown'}. Current GPA: ${gpa}.
${subjectContext}
${topicContext}
${taskContext}

IMPORTANT RULES:
- Each question MUST have a unique string id (e.g. "q1", "q2", ...).
- For MCQ and TRUE_FALSE: "options" array is REQUIRED. MCQ must have exactly 4 options. TRUE_FALSE must have exactly 2 options: ["True", "False"].
- "correctAnswer" MUST exactly match one of the strings in "options" for MCQ/TRUE_FALSE questions.
- For SHORT_ANSWER, CONCEPTUAL, PROBLEM_SOLVING, CODING: "options" should be omitted. "correctAnswer" should be a model/rubric answer (1–3 sentences).
- For CODING questions: Do NOT include executable code in correctAnswer — provide a clear algorithmic description or pseudocode rubric.
- "explanation" should explain WHY the answer is correct and clarify common misconceptions.
- "hint" is optional — provide a subtle nudge without revealing the answer.
- NEVER reveal the answer within the question text or hint.
- Do NOT include anything that would allow a student reading only the question+options to trivially guess the answer from wording.`;

  // 6. Generate questions using structured output
  let practiceSet: z.infer<typeof PracticeSetSchema>;
  try {
    const result = await generateObject({
      model: getAiModel(),
      schema: PracticeSetSchema,
      system: systemPrompt,
      prompt: `Generate ${count} ${difficulty} ${type} questions for: ${subjectContext}. ${topicContext}`,
    });
    practiceSet = result.object;
  } catch (error) {
    console.error('Practice generation error:', error);
    return Response.json(
      { error: 'Failed to generate practice questions. Please try again.' },
      { status: 500 },
    );
  }

  // 7. Post-validate AI output
  const validatedQuestions: PracticeQuestionAnswer[] = [];
  const seenIds = new Set<string>();

  for (const q of practiceSet.questions) {
    // Unique IDs
    if (seenIds.has(q.id)) {
      q.id = `${q.id}_${seenIds.size}`;
    }
    seenIds.add(q.id);

    // MCQ/TRUE_FALSE must have options with correctAnswer in them
    if (q.type === 'MCQ') {
      if (!q.options || q.options.length !== 4) {
        return Response.json(
          { error: 'Generated MCQ question has invalid options. Please try again.' },
          { status: 500 },
        );
      }
      if (!q.options.includes(q.correctAnswer)) {
        // Attempt to match case-insensitively before failing
        const match = q.options.find((o) => o.toLowerCase() === q.correctAnswer.toLowerCase());
        if (match) {
          q.correctAnswer = match;
        } else {
          return Response.json(
            { error: 'Generated MCQ answer not in options. Please try again.' },
            { status: 500 },
          );
        }
      }
    }

    if (q.type === 'TRUE_FALSE') {
      if (!q.options || q.options.length !== 2) {
        q.options = ['True', 'False'];
      }
      // Normalize answer to "True" or "False"
      const normalizedAnswer =
        q.correctAnswer.toLowerCase() === 'true'
          ? 'True'
          : q.correctAnswer.toLowerCase() === 'false'
            ? 'False'
            : q.correctAnswer;
      q.correctAnswer = normalizedAnswer;
    }

    validatedQuestions.push({
      id: q.id,
      type: q.type,
      text: q.text,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      hint: q.hint,
      options: q.options,
    });
  }

  // 8. Encrypt answers into JWE token (server-only)
  const tokenPayload = {
    userId: session.userId,
    questions: validatedQuestions,
    exp: practiceTokenExpiryTimestamp(),
  };
  const token = await encryptPracticeToken(tokenPayload);

  // 9. Build client-safe question list (NO correctAnswer, NO explanation)
  const clientQuestions = validatedQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    difficulty: body.difficulty,
    options: q.options,
    // hint only — no answer or explanation
    hint: q.hint,
  }));

  return Response.json({ token, questions: clientQuestions });
}
