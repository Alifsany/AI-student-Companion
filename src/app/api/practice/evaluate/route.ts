import { getAiModel } from '@/lib/ai-model';
import { generateObject } from 'ai';
import { z } from 'zod';
import { verifySession } from '@/lib/dal';
import { decryptPracticeToken, type PracticeQuestionAnswer } from '@/lib/practice-token';

// ---------------------------------------------------------------------------
// Zod schema for the request
// ---------------------------------------------------------------------------
const EvaluateRequestSchema = z.object({
  token: z.string().min(1),
  answers: z.record(z.string(), z.string()), // { questionId: studentAnswer }
});

// ---------------------------------------------------------------------------
// Subjective grading schema - defined inline below where used
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Objective question types — graded deterministically
// ---------------------------------------------------------------------------
const OBJECTIVE_TYPES = ['MCQ', 'TRUE_FALSE'] as const;
type ObjectiveType = (typeof OBJECTIVE_TYPES)[number];

function isObjectiveType(type: string): type is ObjectiveType {
  return (OBJECTIVE_TYPES as readonly string[]).includes(type);
}

function evaluateObjective(question: PracticeQuestionAnswer, studentAnswer: string): boolean {
  return question.correctAnswer.trim().toLowerCase() === studentAnswer.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// POST /api/practice/evaluate
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  // 1. Auth
  const session = await verifySession();
  if (!session?.isAuth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse request
  let body: z.infer<typeof EvaluateRequestSchema>;
  try {
    const raw = await req.json();
    body = EvaluateRequestSchema.parse(raw);
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // 3. Decrypt & verify token — answers are ONLY on the server
  let tokenPayload;
  try {
    tokenPayload = await decryptPracticeToken(body.token);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid practice session.';
    return Response.json({ error: message }, { status: 400 });
  }

  // 4. Bind to session.userId — prevent cross-user token submission
  if (tokenPayload.userId !== session.userId) {
    return Response.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const { questions } = tokenPayload;

  // 5. Separate objective from subjective questions
  const objectiveResults: Array<{
    id: string;
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
    feedback: string;
    type: string;
  }> = [];

  const subjectiveQuestions: Array<{
    question: PracticeQuestionAnswer;
    studentAnswer: string;
  }> = [];

  for (const question of questions) {
    const studentAnswer = (body.answers[question.id] ?? '').trim();

    if (isObjectiveType(question.type)) {
      const isCorrect = evaluateObjective(question, studentAnswer);
      objectiveResults.push({
        id: question.id,
        isCorrect,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        feedback: isCorrect
          ? 'Correct! Well done.'
          : `Incorrect. The correct answer is: ${question.correctAnswer}.`,
        type: question.type,
      });
    } else {
      subjectiveQuestions.push({ question, studentAnswer });
    }
  }

  // 6. Batch-grade all subjective questions in one Gemini call
  const subjectiveResults: Array<{
    id: string;
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
    feedback: string;
    type: string;
  }> = [];

  if (subjectiveQuestions.length > 0) {
    const GradingBatchSchema = z.object({
      grades: z.array(
        z.object({
          id: z.string(),
          isCorrect: z.boolean(),
          feedback: z.string(),
        }),
      ),
    });

    const gradingPrompt = subjectiveQuestions
      .map(
        ({ question, studentAnswer }) =>
          `Question ID: ${question.id}
Type: ${question.type}
Question: ${question.text}
Expected answer/rubric: ${question.correctAnswer}
Student's answer: ${studentAnswer || '(no answer provided)'}`,
      )
      .join('\n\n---\n\n');

    let gradingResult: z.infer<typeof GradingBatchSchema>;
    try {
      const result = await generateObject({
        model: getAiModel(),
        schema: GradingBatchSchema,
        system: `You are an academic grading assistant. For each question, evaluate the student's answer against the expected answer/rubric. 
Be fair and constructive. For CODING questions: do NOT execute code — evaluate conceptually/algorithmically.
Return isCorrect=true if the student's answer demonstrates correct understanding. 
Provide concise, constructive feedback (1–3 sentences). Explain the correct reasoning if wrong.
Do NOT say only "wrong" — explain WHY and what the correct approach should be.`,
        prompt: `Grade the following answers:\n\n${gradingPrompt}`,
      });
      gradingResult = result.object;
    } catch (error) {
      console.error('Subjective grading error:', error);
      return Response.json(
        { error: 'Failed to grade answers. Please try again.' },
        { status: 500 },
      );
    }

    // Merge grading results with question metadata
    for (const { question, studentAnswer } of subjectiveQuestions) {
      const grade = gradingResult.grades.find((g) => g.id === question.id);
      if (!grade) {
        // Fallback if AI did not return a grade for this question
        subjectiveResults.push({
          id: question.id,
          isCorrect: false,
          studentAnswer,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          feedback: 'Could not grade this answer automatically.',
          type: question.type,
        });
      } else {
        subjectiveResults.push({
          id: question.id,
          isCorrect: grade.isCorrect,
          studentAnswer,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          feedback: grade.feedback,
          type: question.type,
        });
      }
    }
  }

  // 7. Merge and sort results in original order
  const allResults = [...objectiveResults, ...subjectiveResults].sort((a, b) => {
    const aIdx = questions.findIndex((q) => q.id === a.id);
    const bIdx = questions.findIndex((q) => q.id === b.id);
    return aIdx - bIdx;
  });

  const correctCount = allResults.filter((r) => r.isCorrect).length;
  const total = allResults.length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return Response.json({
    results: allResults,
    summary: {
      total,
      correct: correctCount,
      incorrect: total - correctCount,
      accuracy,
    },
  });
}
