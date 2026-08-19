"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, Loader2, MessageSquare } from "lucide-react";

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function AskAiTab({ document }: { document: DocumentData }) {
  const [inputValue, setInputValue] = useState("");
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/documents/${document.id}/ask`,
    }),
  });

  if (!document.extractedText) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground mb-2">No text available to ask questions about.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    // @ts-ignore - AI SDK v4 types for sendMessage
    sendMessage({ text: inputValue });
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full ">
      <div className="flex items-center p-2 border-b bg-muted/10">
        <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Ask AI about this document</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto opacity-70 pt-8">
            <MessageSquare className="w-12 h-12 mb-4 text-primary" />
            <p className="mb-4">Ask anything about this document...</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs bg-muted px-2 py-1 rounded-full border">What are the key points?</span>
              <span className="text-xs bg-muted px-2 py-1 rounded-full border">Explain chapter 2 simply.</span>
              <span className="text-xs bg-muted px-2 py-1 rounded-full border">Create 5 practice questions.</span>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-lg p-4 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border'}`}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {('content' in m ? m.content as string : '') ||
                    ('parts' in m && Array.isArray(m.parts)
                      ? (m as any).parts.map((p: { type: string; text?: string }) => p.text || '')
                          .join('')
                      : '') ||
                    ''}
                </div>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
        {status === 'streaming' && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted/50 border rounded-lg p-4 flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-muted/30 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder="Ask a question about the document..." 
            className="flex-1"
            disabled={status === 'streaming'}
          />
          <Button type="submit" size="icon" disabled={status === 'streaming' || !inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
