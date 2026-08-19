"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Menu, X,  } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SidebarItem } from "./sidebar-item";

export function MobileStudySidebar({
  conversations,
}: {
  conversations: { id: string; title: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm border shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-card border-r shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b space-y-2 mt-12">
            <Link
              href="/study"
              onClick={() => setIsOpen(false)}
              className={buttonVariants({
                variant: "default",
                className: "w-full flex items-center justify-start gap-2",
              })}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Link>
            <Link
              href="/study/notes"
              onClick={() => setIsOpen(false)}
              className={buttonVariants({
                variant: "outline",
                className: "w-full flex items-center justify-start gap-2",
              })}
            >
              <span className="font-semibold px-1">Notes & PDFs</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Chats
            </h3>
            {conversations.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                No recent chats
              </p>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id} onClick={() => setIsOpen(false)}>
                  <SidebarItem id={conv.id} title={conv.title} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
