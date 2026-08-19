'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuizSession, type ClientQuestion } from './quiz-session';
import { Loader2 } from 'lucide-react';

type QuizData = {
  token: string;
  questions: ClientQuestion[];
  title: string;
  mode: 'QUIZ' | 'MOCK_EXAM';
  timeLimitSeconds: number | null;
};

export default function AttemptPage() {
  const router = useRouter();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
    try {
      const raw = sessionStorage.getItem('activeQuiz');
      if (!raw) {
        setError('No active quiz found. Please start a new quiz.');
        return;
      }
      const parsed = JSON.parse(raw) as QuizData;
      if (!parsed.token || !parsed.questions?.length) {
        setError('Quiz data is invalid. Please start a new quiz.');
        return;
      }
      setQuizData(parsed);
    } catch {
      setError('Failed to load quiz. Please start a new quiz.');
    }
    });
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-6 py-4 text-sm max-w-sm text-center">
          {error}
        </div>
        <button
          onClick={() => router.push('/quiz/new')}
          className="text-sm text-primary underline underline-offset-4"
        >
          Start a new quiz →
        </button>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <QuizSession quizData={quizData} />;
}
