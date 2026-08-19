'use client';

import Link from 'next/link';
import { usePathname,  } from 'next/navigation';
import { useState } from 'react';
import { MessageSquare, Trash2, Pencil, MoreVertical } from 'lucide-react';
import { deleteConversation, renameConversation } from '@/actions/study';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SidebarItem({ id, title }: { id: string; title: string }) {
  const pathname = usePathname();
  const isActive = pathname === `/study/${id}`;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    setIsSubmitting(true);
    await deleteConversation(id, isActive);
    setIsDeleting(false);
    setIsSubmitting(false);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || newTitle.trim() === title) {
      setIsRenaming(false);
      setNewTitle(title);
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', newTitle.trim());
    await renameConversation(id, formData);
    setIsRenaming(false);
    setIsSubmitting(false);
  }

  return (
    <>
      <div
        className={`group relative flex items-center rounded-md text-sm transition-colors ${
          isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-foreground'
        }`}
      >
        <Link href={`/study/${id}`} className="flex-1 flex items-center gap-2 px-3 py-2 min-w-0">
          <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate pr-6">{title}</span>
        </Link>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-7 w-7 items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open menu"
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={() => setIsDeleting(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={isRenaming}
        onOpenChange={(open) => {
          setIsRenaming(open);
          if (!open) setNewTitle(title); // reset on close
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4 mt-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Conversation title"
              maxLength={100}
              autoFocus
              disabled={isSubmitting}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenaming(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !newTitle.trim()}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
