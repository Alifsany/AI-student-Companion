'use client';

import { useActionState } from 'react';
import { submitOnboarding } from '@/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FormState } from '@/lib/validations';

export default function OnboardingForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitOnboarding, undefined);

  return (
    <form action={action} noValidate className="space-y-6">
      {state?.message && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="institution">Institution (University / School)</Label>
        <Input
          id="institution"
          name="institution"
          placeholder="e.g., Stanford University"
          aria-describedby={state?.errors?.institution ? 'institution-error' : undefined}
          aria-invalid={!!state?.errors?.institution}
          required
        />
        {state?.errors?.institution && (
          <p id="institution-error" className="text-xs text-destructive" role="alert">
            {state.errors.institution[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="major">Major / Field of Study</Label>
          <Input
            id="major"
            name="major"
            placeholder="e.g., Computer Science"
            aria-describedby={state?.errors?.major ? 'major-error' : undefined}
            aria-invalid={!!state?.errors?.major}
            required
          />
          {state?.errors?.major && (
            <p id="major-error" className="text-xs text-destructive" role="alert">
              {state.errors.major[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gradeLevel">Grade / Academic Year</Label>
          <Input
            id="gradeLevel"
            name="gradeLevel"
            placeholder="e.g., Junior / Year 3"
            aria-describedby={state?.errors?.gradeLevel ? 'gradeLevel-error' : undefined}
            aria-invalid={!!state?.errors?.gradeLevel}
            required
          />
          {state?.errors?.gradeLevel && (
            <p id="gradeLevel-error" className="text-xs text-destructive" role="alert">
              {state.errors.gradeLevel[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="targetGpa">Target GPA (Optional)</Label>
        <Input
          id="targetGpa"
          name="targetGpa"
          type="number"
          step="0.1"
          min="0"
          max="4.0"
          placeholder="e.g., 3.8"
          aria-describedby={state?.errors?.targetGpa ? 'targetGpa-error' : undefined}
          aria-invalid={!!state?.errors?.targetGpa}
        />
        {state?.errors?.targetGpa && (
          <p id="targetGpa-error" className="text-xs text-destructive" role="alert">
            {state.errors.targetGpa[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio / Academic Goals (Optional)</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Tell us a bit about your academic journey and what you hope to achieve..."
          className="min-h-[100px]"
          aria-describedby={state?.errors?.bio ? 'bio-error' : undefined}
          aria-invalid={!!state?.errors?.bio}
        />
        {state?.errors?.bio && (
          <p id="bio-error" className="text-xs text-destructive" role="alert">
            {state.errors.bio[0]}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Saving profile...
          </span>
        ) : (
          'Complete Setup'
        )}
      </Button>
    </form>
  );
}
