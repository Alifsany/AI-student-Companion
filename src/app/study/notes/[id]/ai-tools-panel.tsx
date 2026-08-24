"use client";

import { useState } from "react";
import { Sparkles, Calculator, List, CheckSquare, HelpCircle } from "lucide-react";
import { SummaryTab } from "./tabs/summary-tab";
import { FormulasTab } from "./tabs/formulas-tab";
import { KeyTopicsTab } from "./tabs/key-topics-tab";
import { ImportantPointsTab } from "./tabs/important-points-tab";
import { QuizTab } from "./tabs/quiz-tab";
import { cn } from "@/lib/utils";

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

type TabValue = "summary" | "formulas" | "topics" | "points" | "quiz";

export function AiToolsPanel({ document }: { document: DocumentData }) {
  const [activeTab, setActiveTab] = useState<TabValue>("summary");

  const tabs = [
    { id: "summary", label: "Summary", icon: Sparkles },
    { id: "formulas", label: "Formulas", icon: Calculator },
    { id: "topics", label: "Key Topics", icon: List },
    { id: "points", label: "Important Points", icon: CheckSquare },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b bg-muted/20 shrink-0">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Tools
        </h2>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-2 pt-3 shrink-0 overflow-x-auto pb-1">
          <div 
            className="inline-flex w-max min-w-full h-auto p-1 bg-muted/50 rounded-lg gap-1"
            role="tablist"
            aria-label="AI Tools Navigation"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`ai-tool-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`ai-tool-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative inline-flex flex-col flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-2 text-xs font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive 
                      ? "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30" 
                      : "text-foreground/60 hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div 
          className="flex-1 min-h-0 overflow-hidden relative mt-2" 
          role="tabpanel"
          id={`ai-tool-panel-${activeTab}`}
          aria-labelledby={`ai-tool-tab-${activeTab}`}
        >
          {activeTab === "summary" && <div className="h-full animate-in fade-in duration-200"><SummaryTab document={document} /></div>}
          {activeTab === "formulas" && <div className="h-full animate-in fade-in duration-200"><FormulasTab document={document} /></div>}
          {activeTab === "topics" && <div className="h-full animate-in fade-in duration-200"><KeyTopicsTab document={document} /></div>}
          {activeTab === "points" && <div className="h-full animate-in fade-in duration-200"><ImportantPointsTab document={document} /></div>}
          {activeTab === "quiz" && <div className="h-full animate-in fade-in duration-200"><QuizTab document={document} /></div>}
        </div>
      </div>
    </div>
  );
}