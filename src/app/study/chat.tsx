'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, Send, Bot, Loader2, Settings2, FlaskConical, MessageSquare, Square } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PracticeSetup, type ClientQuestion } from './practice-setup';
import { PracticeSession } from './practice-session';
import { PracticeResults } from './practice-results';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
};

type EvalResult = {
  id: string;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  feedback: string;
  type: string;
};

type Summary = {
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
};

type PracticePhase = 'setup' | 'session' | 'results';

type ChatProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMessages?: any[];
  conversationId?: string;
  userName?: string;
  userImage?: string | null;
  subjects?: { id: string; name: string }[];
};

export function Chat({
  initialMessages = [],
  conversationId,
  userName,
  userImage,
  subjects = [],
}: ChatProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [explanationMode, setExplanationMode] = useState<string>('NORMAL');
  const [subjectId, setSubjectId] = useState<string>('ALL');

  // Practice mode state
  const [activeTab, setActiveTab] = useState<'chat' | 'practice'>('chat');
  const [practicePhase, setPracticePhase] = useState<PracticePhase>('setup');
  const [practiceToken, setPracticeToken] = useState<string | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<ClientQuestion[]>([]);
  const [practiceResults, setPracticeResults] = useState<EvalResult[]>([]);
  const [practiceSummary, setPracticeSummary] = useState<Summary | null>(null);

  const { messages, status, error, sendMessage, stop } = useChat({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: initialMessages as any,
    // In AI SDK v4, body/api/headers move into `transport`
    transport: new DefaultChatTransport({
      body: {
        conversationId,
        explanationMode,
        subjectId: subjectId === 'ALL' ? undefined : subjectId,
      },
    }),
    onFinish: () => {
      router.refresh();
    },
  });

  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // sendMessage accepts { text } per AI SDK v4 — cast needed due to overloaded generic signature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendMessage({ text: input } as any);
    setInput('');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Practice callbacks
  function handleGenerated(token: string, questions: ClientQuestion[]) {
    setPracticeToken(token);
    setPracticeQuestions(questions);
    setPracticePhase('session');
  }

  function handlePracticeFinish(results: EvalResult[], summary: Summary) {
    setPracticeResults(results);
    setPracticeSummary(summary);
    setPracticePhase('results');
  }

  function handlePracticeAgain() {
    setPracticeToken(null);
    setPracticeQuestions([]);
    setPracticeResults([]);
    setPracticeSummary(null);
    setPracticePhase('setup');
  }

  function handleBackToChat() {
    setActiveTab('chat');
    setPracticePhase('setup');
    setPracticeToken(null);
    setPracticeQuestions([]);
    setPracticeResults([]);
    setPracticeSummary(null);
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-card/50 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">AI Study Assistant</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Powered by Gemini 2.5 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Tab toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5 gap-0.5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">Tutor</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('practice');
                if (practicePhase !== 'session') setPracticePhase('setup');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'practice'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FlaskConical className="h-3 w-3" />
              <span className="hidden sm:inline">Practice</span>
            </button>
          </div>

          {/* Chat-only controls */}
          {activeTab === 'chat' && (
            <>
              {subjects.length > 0 && (
                <Select
                  value={subjectId}
                  onValueChange={(val) => {
                    if (val) setSubjectId(val);
                  }}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Subjects</SelectItem>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Settings2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Select
                value={explanationMode}
                onValueChange={(val) => {
                  if (val) setExplanationMode(val);
                }}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="DETAILED">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {activeTab === 'practice' ? (
        <div className="flex-1 overflow-y-auto">
          {practicePhase === 'setup' && (
            <PracticeSetup subjects={subjects} onGenerate={handleGenerated} />
          )}
          {practicePhase === 'session' && practiceToken && (
            <PracticeSession
              token={practiceToken}
              questions={practiceQuestions}
              onFinish={handlePracticeFinish}
              onBack={() => setPracticePhase('setup')}
            />
          )}
          {practicePhase === 'results' && practiceSummary && (
            <PracticeResults
              results={practiceResults}
              summary={practiceSummary}
              onPracticeAgain={handlePracticeAgain}
              onBackToChat={handleBackToChat}
            />
          )}
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
                  <Sparkles className="h-8 w-8 text-primary/50" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-lg font-medium text-foreground">How can I help you study?</h3>
                  <p className="mt-2 text-sm">
                    I can help explain complex topics, test your knowledge, or help you prepare for
                    upcoming assignments and exams. Use the <strong>Practice</strong> tab to
                    generate personalized practice questions.
                  </p>
                </div>
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              messages.map((m: any) => (
                <div
                  key={m.id}
                  className={`flex gap-4 max-w-3xl mx-auto ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role !== 'user' && (
                    <Avatar className="h-8 w-8 border border-border bg-primary/10">
                      <AvatarFallback>
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {m.content ||
                        (m.parts && Array.isArray(m.parts)
                          ? m.parts
                              .map((p: { type: string; text?: string }) => p.text || '')
                              .join('')
                          : '') ||
                        m.text ||
                        ''}
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <Avatar className="h-8 w-8 border border-border">
                      {userImage ? (
                        <AvatarImage src={userImage} />
                      ) : (
                        <AvatarFallback>{initials}</AvatarFallback>
                      )}
                    </Avatar>
                  )}
                </div>
              ))
            )}

            {status === 'submitted' && (
              <div className="flex gap-4 max-w-3xl mx-auto justify-start">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 text-sm bg-muted text-foreground rounded-tl-sm flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-destructive/15 text-destructive text-sm px-4 py-2 rounded-lg">
                  An error occurred while generating the response. Please try again.
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border">
            <form
              onSubmit={handleSubmit}
              className="relative max-w-3xl mx-auto flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question about your studies..."
                className="flex-1 pr-12 rounded-full bg-background"
              />
              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={stop}
                  className="absolute right-1 h-8 w-8 rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span className="sr-only">Stop generating</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="absolute right-1 h-8 w-8 rounded-full"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              )}
            </form>
            <p className="text-center text-[10px] text-muted-foreground mt-3">
              AI Study Assistant may produce inaccurate information about people, places, or facts.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
