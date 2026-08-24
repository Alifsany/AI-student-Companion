"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, BookOpen, BrainCircuit, Calculator, FileText, Calendar, HardDrive } from "lucide-react";
import { formatBytes } from "@/lib/utils";

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function OverviewTab({ document, onNavigate }: { document: DocumentData, onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Document Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <HardDrive className="w-5 h-5 text-muted-foreground" />
              {formatBytes(document.size)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upload Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : ''}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Text Extracted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <FileText className="w-5 h-5 text-muted-foreground" />
              {document.extractedText ? `${(document.extractedText.length / 1000).toFixed(1)}k chars` : "None"}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold pt-4 border-t">AI Study Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate("summary")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Summarize
            </CardTitle>
            <CardDescription>Generate an intelligent summary of the core concepts and key points.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate("study-notes")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-purple-500" />
              Create Study Notes
            </CardTitle>
            <CardDescription>Extract perfectly formatted academic notes and definitions.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate("quiz")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BrainCircuit className="w-5 h-5 text-amber-500" />
              Generate Quiz
            </CardTitle>
            <CardDescription>Test your knowledge with multiple-choice questions from the text.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
