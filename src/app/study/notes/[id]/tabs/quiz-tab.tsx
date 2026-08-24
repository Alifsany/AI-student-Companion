"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, HelpCircle, AlertCircle, Play, CheckCircle2, XCircle, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type QuizData = {
  questions: Question[];
};

export function QuizTab({ document }: { document: any }) {
  const initialResult = document.aiResults?.find((r: any) => r.type === 'QUIZ');
  const [isGenerating, setIsGenerating] = useState(initialResult?.status === 'GENERATING');
  const [quiz, setQuiz] = useState<QuizData | null>(initialResult?.status === 'READY' ? initialResult.result : null);
  const [error, setError] = useState<string | null>(null);

  // Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const generateQuiz = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setQuiz(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);

    try {
      const res = await fetch(`/api/documents/${document.id}/quiz`, { method: "POST" });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setQuiz(result.data);
      } else {
        setError(result.error?.message || 'We couldn\'t generate a quiz right now.');
      }
    } catch (err) {
      setError('Something went wrong while connecting to the server. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (quiz && currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setCurrentIndex(0); // Go back to first question to review
  };

  if (!document.extractedText || document.status !== 'READY') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
        <p>Your PDF is still being prepared. Please wait...</p>
      </div>
    );
  }

  if (!quiz && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <HelpCircle className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium mb-2">Generate Practice Quiz</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
          Test your knowledge with a custom multiple-choice quiz based strictly on this document.
        </p>
        <Button onClick={generateQuiz}>
          <Play className="w-4 h-4 mr-2 fill-current" />
          Start Quiz
        </Button>
      </div>
    );
  }

  // Render score if submitted
  let score = 0;
  if (quiz && isSubmitted) {
    quiz.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctAnswer) score++;
    });
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-3 border-b bg-muted/10 shrink-0">
        <span className="text-sm font-medium text-foreground flex items-center">
          <HelpCircle className="w-4 h-4 mr-2 text-blue-500" />
          Practice Quiz
        </span>
        {quiz && (
          <Button variant="ghost" size="sm" onClick={generateQuiz} disabled={isGenerating} className="h-8 text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Quiz
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 bg-muted/5 relative">
        <div className="max-w-xl mx-auto pb-8 h-full flex flex-col">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 m-auto">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse text-sm">Generating your quiz...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3 my-auto mx-auto max-w-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error.includes('limit reached') || error.includes('AI_QUOTA') ? 'AI usage limit reached' : 'Something went wrong'}</p>
                <p className="text-sm opacity-90 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={generateQuiz} className="mt-3 bg-background">
                  Try again
                </Button>
              </div>
            </div>
          ) : quiz ? (
            <div className="flex flex-col h-full">
              {isSubmitted && currentIndex === 0 && (
                <Card className="mb-6 border-primary/20 bg-primary/5">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-2xl font-bold mb-2">
                      Score: {score} / {quiz.questions.length}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {score === quiz.questions.length ? "Perfect score! Great job." : "Good effort. Review your answers below."}
                    </p>
                    <Button onClick={() => generateQuiz()} variant="outline">
                      <RotateCcw className="w-4 h-4 mr-2" /> Take Another Quiz
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {currentIndex + 1} of {quiz.questions.length}
                </span>
                <div className="flex gap-1">
                  {quiz.questions.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-2 w-2 rounded-full ${
                        i === currentIndex ? 'bg-primary' : 
                        selectedAnswers[i] !== undefined ? 'bg-primary/40' : 'bg-muted'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium leading-snug">
                  {quiz.questions[currentIndex].question}
                </h3>
              </div>

              <div className="space-y-3 flex-1">
                {quiz.questions[currentIndex].options.map((option, i) => {
                  const isSelected = selectedAnswers[currentIndex] === i;
                  const isCorrect = quiz.questions[currentIndex].correctAnswer === i;
                  
                  let optionClass = "border-2 border-muted bg-background hover:border-primary/50 cursor-pointer";
                  
                  if (isSelected && !isSubmitted) {
                    optionClass = "border-2 border-primary bg-primary/5";
                  } else if (isSubmitted) {
                    optionClass = "border-2 opacity-70 pointer-events-none"; // default state for submitted
                    if (isCorrect) {
                      optionClass = "border-2 border-green-500 bg-green-500/10 font-medium";
                    } else if (isSelected && !isCorrect) {
                      optionClass = "border-2 border-destructive bg-destructive/10";
                    }
                  }

                  return (
                    <div 
                      key={i}
                      onClick={() => handleSelectOption(i)}
                      className={`p-4 rounded-xl transition-all ${optionClass} flex items-center justify-between group`}
                    >
                      <span className="text-sm md:text-base leading-snug">{option}</span>
                      {isSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-2" />}
                      {isSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="mt-6 p-4 bg-muted/30 border rounded-xl animate-in slide-in-from-bottom-2">
                  <h4 className="font-semibold text-sm mb-1 uppercase tracking-wider text-muted-foreground">Explanation</h4>
                  <p className="text-sm leading-relaxed">{quiz.questions[currentIndex].explanation}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-4 border-t shrink-0">
                <Button 
                  variant="outline" 
                  onClick={handlePrev} 
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                
                {!isSubmitted && currentIndex === quiz.questions.length - 1 ? (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNext} 
                    disabled={currentIndex === quiz.questions.length - 1}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
