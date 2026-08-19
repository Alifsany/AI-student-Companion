import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground font-heading">
          Loading...
        </p>
        <p className="text-sm text-muted-foreground">
          Getting things ready for you.
        </p>
      </div>
    </div>
  );
}
