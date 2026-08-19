import { getAiModel } from '@/lib/ai-model';
import { generateObject } from 'ai';
import { z } from 'zod';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { decryptPracticeToken, type PracticeQuestionAnswer } from '@/lib/practice-token';

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------
const SubmitSchema = z.object({
  token: z.string().min(1),
  answers: z.record(z.string(), z.string()), // { questionId: studentAnswer }
  markedForReview: z.array(z.string()).optional(), // question IDs marked for review
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const OBJECTIVE_TYPES = ['MCQ', 'TRUE_FALSE'] as const;

function isObjective(type: string): boolean {
  return (OBJECTIVE_TYPES as readonly string[]).includes(type);
}

function evaluateObjective(question: PracticeQuestionAnswer, studentAnswer: string): boolean {
  return question.correctAnswer.trim().toLowerCase() === studentAnswer.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// POST /api/quiz/submit
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  // 1. Auth
  const session = await verifySession();
  if (!session?.isAuth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse request
  let body: z.infer<typeof SubmitSchema>;
  try {
    const raw = await req.json();
    body = SubmitSchema.parse(raw);
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // 3. Decrypt JWE token - server-authoritative answers
  let tokenPayload;
  try {
    tokenPayload = await decryptPracticeToken(body.token);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid quiz session.';
    return Response.json({ error: message }, { status: 400 });
  }

  // 4. User binding - prevent cross-user token submission
  if (tokenPayload.userId !== session.userId) {
    return Response.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const { questions, quizMode, timeLimitSeconds, startedAt, subjectId, subjectName, title } =
    tokenPayload;

  // 5. Evaluate answers
  const markedForReview = new Set(body.markedForReview || []);
  const allResults: QuizResultEntry[] = [];
  const subjectiveEvaluations: { id: string; studentAnswer: string; correctAnswer: string }[] = [];

  for (const q of questions) {
    const studentAnswer = body.answers[q.id];
    const skipped = !studentAnswer || studentAnswer.trim() === '';

    if (skipped) {
      allResults.push({
        id: q.id,
        questionText: q.text,
        questionType: q.type,
        questionDifficulty: 'MEDIUM',
        studentAnswer: '',
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        feedback: 'Question skipped.',
        explanation: q.explanation,
        markedForReview: markedForReview.has(q.id),
        skipped: true,
      });
      continue;
    }

    if (isObjective(q.type)) {
      const isCorrect = evaluateObjective(q, studentAnswer);
      allResults.push({
        id: q.id,
        questionText: q.text,
        questionType: q.type,
        questionDifficulty: 'MEDIUM',
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        feedback: isCorrect ? 'Correct.' : 'Incorrect.',
        explanation: q.explanation,
        markedForReview: markedForReview.has(q.id),
        skipped: false,
      });
    } else {
      subjectiveEvaluations.push({
        id: q.id,
        studentAnswer,
        correctAnswer: q.correctAnswer,
      });
    }
  }

  // 6. Bulk AI Evaluation for Subjective answers
  if (subjectiveEvaluations.length > 0) {
    const aiSystemPrompt = `You are an expert academic grader.
Evaluate the student answers against the correct answers.
Return a JSON array of evaluations corresponding to the input list.
For each, determine if the student answer captures the core concept (isCorrect: true/false).
Provide a brief, constructive feedback string explaining why.`;

    const aiPrompt = JSON.stringify(subjectiveEvaluations, null, 2);

    try {
      const result = await generateObject({
        model: getAiModel(),
        system: aiSystemPrompt,
        prompt: aiPrompt,
        schema: z.object({
          evaluations: z.array(
            z.object({
              id: z.string(),
              isCorrect: z.boolean(),
              feedback: z.string(),
            })
          ),
        }),
      });

      const evalMap = new Map(result.object.evaluations.map((e) => [e.id, e]));

      for (const reqObj of subjectiveEvaluations) {
        const q = questions.find((x) => x.id === reqObj.id)!;
        const evaluation = evalMap.get(reqObj.id);

        allResults.push({
          id: q.id,
          questionText: q.text,
          questionType: q.type,
          questionDifficulty: 'MEDIUM',
          studentAnswer: reqObj.studentAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: evaluation?.isCorrect ?? false,
          feedback: evaluation?.feedback ?? 'Could not evaluate response.',
          explanation: q.explanation,
          markedForReview: markedForReview.has(q.id),
          skipped: false,
        });
      }
    } catch (error) {
      console.error('[quiz/submit] Subjective AI evaluation failed:', error);
      for (const reqObj of subjectiveEvaluations) {
        const q = questions.find((x) => x.id === reqObj.id)!;
        allResults.push({
          id: q.id,
          questionText: q.text,
          questionType: q.type,
          questionDifficulty: 'MEDIUM',
          studentAnswer: reqObj.studentAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: false,
          feedback: 'Auto-evaluation failed due to system error. Marked incorrect.',
          explanation: q.explanation,
          markedForReview: markedForReview.has(q.id),
          skipped: false,
        });
      }
    }
  }

  // 7. Calculate final score
  const total = allResults.length;
  const correct = allResults.filter((r) => r.isCorrect).length;
  const skipped = allResults.filter((r) => r.skipped).length;
  const incorrect = total - correct - skipped;
  const score = total > 0 ? (correct / total) * 100 : 0;

  // 8. Time calculation
  const completedAtUnix = Math.floor(Date.now() / 1000);
  const timeUsedSeconds = startedAt ? Math.max(0, completedAtUnix - startedAt) : 0;

  // 9. Determine weak areas
  const weakAreas: string[] = [];
  const mcqIncorrect = allResults.filter((r) => isObjective(r.questionType) && !r.isCorrect);
  if (mcqIncorrect.length > 0) weakAreas.push('Objective Recall');

  const subjIncorrect = allResults.filter((r) => !isObjective(r.questionType) && !r.isCorrect);
  if (subjIncorrect.length > 0) weakAreas.push('Conceptual Application');

  // 10. Persist to database
  const quizAttempt = await db.quizAttempt.create({
    data: {
      userId: session.userId,
      subjectId: subjectId ?? null,
      subjectName: subjectName ?? null,
      title: title ?? 'Quiz',
      mode: (quizMode ?? 'QUIZ') as 'QUIZ' | 'MOCK_EXAM',
      totalQuestions: total,
      correctCount: correct,
      incorrectCount: incorrect,
      skippedCount: skipped,
      score,
      timeLimitSeconds: timeLimitSeconds ?? null,
      timeUsedSeconds,
      completedAt: new Date(),
      questionResults: {
        create: allResults.map((r) => ({
          questionId: r.id,
          questionText: r.questionText,
          questionType: r.questionType,
          questionDifficulty: r.questionDifficulty,
          studentAnswer: r.studentAnswer,
          correctAnswer: r.correctAnswer,
          isCorrect: r.isCorrect,
          feedback: r.feedback,
          explanation: r.explanation,
          markedForReview: r.markedForReview,
        })),
      },
    },
  });

  return Response.json({
    attemptId: quizAttempt.id,
    summary: { total, correct, incorrect, skipped, score, timeUsedSeconds, weakAreas },
  });
}

// Local type for results before DB save
type QuizResultEntry = {
  id: string;
  questionText: string;
  questionType: string;
  questionDifficulty: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  markedForReview: boolean;
  skipped: boolean;
};
