'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { type FormState } from '@/lib/validations';
import { AlertCircle, ArrowLeft } from 'lucide-react';

type ProfileFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialData: {
    name?: string | null;
    institution?: string | null;
    major?: string | null;
    gradeLevel?: string | null;
    targetGpa?: number | null;
    bio?: string | null;
  };
};

export function ProfileForm({ action, initialData }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Edit Profile</CardTitle>
          <CardDescription>
            Update your academic information. This helps AI Student Companion personalize your
            experience.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            {state?.message && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{state.message}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Jane Doe"
                  defaultValue={initialData?.name || ''}
                  aria-describedby="name-error"
                  required
                />
                {state?.errors?.name && (
                  <p id="name-error" className="text-xs font-medium text-destructive">
                    {state.errors.name[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">
                  Institution / School <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="institution"
                  name="institution"
                  placeholder="e.g. Stanford University"
                  defaultValue={initialData?.institution || ''}
                  aria-describedby="institution-error"
                  required
                />
                {state?.errors?.institution && (
                  <p id="institution-error" className="text-xs font-medium text-destructive">
                    {state.errors.institution[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">
                    Major / Field of Study <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="major"
                    name="major"
                    placeholder="e.g. Computer Science"
                    defaultValue={initialData?.major || ''}
                    aria-describedby="major-error"
                    required
                  />
                  {state?.errors?.major && (
                    <p id="major-error" className="text-xs font-medium text-destructive">
                      {state.errors.major[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">
                    Year / Grade Level <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="gradeLevel"
                    name="gradeLevel"
                    defaultValue={initialData?.gradeLevel || ''}
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>
                      Select Year
                    </option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                    <option value="High School">High School</option>
                    <option value="Other">Other</option>
                  </select>
                  {state?.errors?.gradeLevel && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.gradeLevel[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetGpa">Target GPA (Optional)</Label>
                <Input
                  id="targetGpa"
                  name="targetGpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  placeholder="e.g. 3.8"
                  defaultValue={initialData?.targetGpa?.toString() || ''}
                  aria-describedby="gpa-error"
                />
                {state?.errors?.targetGpa && (
                  <p id="gpa-error" className="text-xs font-medium text-destructive">
                    {state.errors.targetGpa[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us a bit about your academic goals..."
                  defaultValue={initialData?.bio || ''}
                  className="min-h-[120px] resize-y"
                  aria-describedby="bio-error"
                />
                {state?.errors?.bio && (
                  <p id="bio-error" className="text-xs font-medium text-destructive">
                    {state.errors.bio[0]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 py-4 flex justify-end gap-3">
            <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className={buttonVariants({ variant: 'default' })}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
