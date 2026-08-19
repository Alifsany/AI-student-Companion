import db from './db';
import { calculateGPA } from './grading';
import { getAiModel } from './ai-model';
import { generateText } from 'ai';

export async function getProgressAnalytics(userId: string) {
  // 1. Fetch Academic Records -> CGPA
  const academicRecords = await db.academicRecord.findMany({
    where: { userId },
  });
  const cgpa = calculateGPA(academicRecords);

  // 2. Fetch Study Sessions -> Total Time
  const studySessions = await db.studySession.findMany({
    where: { userId, status: 'COMPLETED' },
    include: { subject: true },
  });
  const totalStudyTime = studySessions.reduce((acc, s) => acc + s.duration, 0);

  // 3. Fetch Quiz Attempts
  const quizAttempts = await db.quizAttempt.findMany({
    where: { userId },
    include: { questionResults: true },
    orderBy: { completedAt: 'desc' },
  });

  const totalQuizzes = quizAttempts.length;
  const averageQuizScore = totalQuizzes > 0 
    ? quizAttempts.reduce((acc, q) => acc + q.score, 0) / totalQuizzes 
    : 0;
  
  const highestScore = totalQuizzes > 0 ? Math.max(...quizAttempts.map(q => q.score)) : 0;
  const lowestScore = totalQuizzes > 0 ? Math.min(...quizAttempts.map(q => q.score)) : 0;

  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSkipped = 0;

  const typePerformance: Record<string, { correct: number; total: number }> = {};
  const subjectPerformance: Record<string, { 
    name: string; 
    attempts: number; 
    totalScore: number;
    bestScore: number;
  }> = {};

  const performanceOverTime = [...quizAttempts].reverse().map(q => ({
    date: q.completedAt.toLocaleDateString(),
    score: q.score,
    title: q.title
  }));

  quizAttempts.forEach(attempt => {
    totalCorrect += attempt.correctCount;
    totalIncorrect += attempt.incorrectCount;
    totalSkipped += attempt.skippedCount;

    if (attempt.subjectId) {
      if (!subjectPerformance[attempt.subjectId]) {
        subjectPerformance[attempt.subjectId] = {
          name: attempt.subjectName || 'Unknown Subject',
          attempts: 0,
          totalScore: 0,
          bestScore: 0
        };
      }
      const sp = subjectPerformance[attempt.subjectId];
      sp.attempts += 1;
      sp.totalScore += attempt.score;
      if (attempt.score > sp.bestScore) sp.bestScore = attempt.score;
    }

    attempt.questionResults.forEach(qr => {
      let category = qr.questionType;
      if (category === 'MCQ' || category === 'TRUE_FALSE') category = 'Objective Recall';
      else if (category === 'CONCEPTUAL' || category === 'SHORT_ANSWER') category = 'Conceptual Application';
      else if (category === 'PROBLEM_SOLVING') category = 'Problem Solving';
      else if (category === 'CODING') category = 'Programming';

      if (!typePerformance[category]) typePerformance[category] = { correct: 0, total: 0 };
      typePerformance[category].total += 1;
      if (qr.isCorrect) typePerformance[category].correct += 1;
    });
  });

  const subjectStats = Object.values(subjectPerformance).map(sp => ({
    name: sp.name,
    attempts: sp.attempts,
    averageScore: sp.attempts > 0 ? sp.totalScore / sp.attempts : 0,
    bestScore: sp.bestScore
  })).sort((a, b) => b.averageScore - a.averageScore);

  const areaStats = Object.entries(typePerformance).map(([name, stats]) => ({
    name,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    total: stats.total
  })).sort((a, b) => b.accuracy - a.accuracy);

  const strongAreas = areaStats.filter(a => a.accuracy >= 70 && a.total >= 2);
  const weakAreas = areaStats.filter(a => a.accuracy < 70 && a.total >= 2);

  return {
    overview: {
      cgpa,
      totalStudyTime,
      totalQuizzes,
      averageQuizScore,
      totalStudySessions: studySessions.length,
    },
    quizPerformance: {
      highestScore,
      lowestScore,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
    },
    performanceOverTime,
    subjectStats,
    strongAreas,
    weakAreas,
    recentAttempts: quizAttempts.slice(0, 5),
  };
}

export type ProgressStats = Awaited<ReturnType<typeof getProgressAnalytics>>;

export async function generateStudyInsight(stats: ProgressStats): Promise<string> {
  // Guard against unnecessary API calls for empty states
  if (stats.overview.totalQuizzes === 0) {
    return "Complete some quizzes and study sessions to unlock your personalized AI study insights.";
  }

  const prompt = `
You are an academic advisor AI. Give a concise (1-2 sentences), encouraging, and actionable study insight based on this data:
Average Quiz Score: ${stats.overview.averageQuizScore.toFixed(1)}%
Strong Areas: ${stats.strongAreas.map(a => a.name).join(', ') || 'None yet'}
Weak Areas: ${stats.weakAreas.map(a => a.name).join(', ') || 'None yet'}
Study Time: ${Math.floor(stats.overview.totalStudyTime / 3600)}h
  `;

  try {
    const { text } = await generateText({
      model: getAiModel(),
      system: "You are a helpful, professional student academic advisor. Keep it very concise. Do not use markdown.",
      prompt,
    });
    return text;
  } catch (error) {
    console.error('Failed to generate insight:', error);
    return "Keep up the hard work! Review your weak areas to improve your scores over time.";
  }
}
