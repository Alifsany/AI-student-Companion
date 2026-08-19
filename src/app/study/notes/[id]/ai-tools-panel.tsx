"use client";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, MessageSquare, Calculator, List, CheckSquare, HelpCircle } from "lucide-react";
import { SummaryTab } from "./tabs/summary-tab";
import { AskAiTab } from "./tabs/ask-ai-tab";
import { FormulasTab } from "./tabs/formulas-tab";
import { KeyTopicsTab } from "./tabs/key-topics-tab";
import { ImportantPointsTab } from "./tabs/important-points-tab";
import { QuizTab } from "./tabs/quiz-tab";

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function AiToolsPanel({ document }: { document: DocumentData }) {
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b bg-muted/20 shrink-0">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Tools
        </h2>
      </div>

      <Tabs defaultValue="summary" className="flex-1 flex flex-col min-h-0">
        <div className="px-2 pt-3 shrink-0 overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full h-auto p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="summary" className="py-2 px-3 flex flex-col items-center gap-1.5 text-xs font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Summary</span>
            </TabsTrigger>
            <TabsTrigger value="ask" className="py-2 px-3 flex flex-col items-center gap-1.5 text-xs font-medium">
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI</span>
            </TabsTrigger>
            <TabsTrigger value="formulas" className="py-2 px-3 flex flex-col items-center gap-1.5 text-xs font-medium">
              <Calculator className="w-4 h-4" />
              <span>Formulas</span>
            </TabsTrigger>
            <TabsTrigger value="topics" className="py-2 px-3 flex flex-col items-center gap-1.5 text-xs font-medium">
              <List className="w-4 h-4" />
              <span>Key Topics</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="py-2 px-3 flex flex-col items-center gap-1.5 text-xs font-medium">
              <CheckSquare className="w-4 h-4" />
              <span>Points</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="py-2 px-3 flex flex-col items-center gap-1.5 text-xs font-medium">
              <HelpCircle className="w-4 h-4" />
              <span>Quiz</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden relative mt-2">
          <TabsContent value="summary" className="h-full">
            <SummaryTab document={document} />
          </TabsContent>
          <TabsContent value="ask" className="h-full">
            <AskAiTab document={document} />
          </TabsContent>
          <TabsContent value="formulas" className="h-full">
            <FormulasTab document={document} />
          </TabsContent>
          <TabsContent value="topics" className="h-full">
            <KeyTopicsTab document={document} />
          </TabsContent>
          <TabsContent value="points" className="h-full">
            <ImportantPointsTab document={document} />
          </TabsContent>
          <TabsContent value="quiz" className="h-full">
            <QuizTab document={document} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
