import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getProfileCompletion } from '@/lib/dal';
import { calculateGPA } from '@/lib/grading';
import db from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  GraduationCap,
  BookOpen,
  Calendar,
  Target,
  Edit3,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'My Profile — AI Student Companion',
  description: 'View your academic profile',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  const completionPercent = getProfileCompletion(user);

  const activeSubjectsCount = await db.subject.count({
    where: { userId: user.id, status: 'ACTIVE' },
  });

  const academicRecords = await db.academicRecord.findMany({
    where: { userId: user.id },
  });
  const overallCgpa = calculateGPA(academicRecords);
  const overallCredits = academicRecords.reduce((sum, r) => sum + r.creditHours, 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="border-border/50 shadow-sm overflow-hidden relative">
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 w-full absolute top-0 left-0" />

          <CardHeader className="pt-20 pb-0 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <Link
                href="/profile/edit"
                className={buttonVariants({ variant: 'default', size: 'sm' })}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </div>

            <div className="space-y-1">
              <CardTitle className="font-heading text-2xl">
                {user.name || 'Student Name Not Set'}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </CardDescription>
            </div>

            {user.bio && (
              <p className="mt-4 text-sm text-foreground/80 italic max-w-2xl">
                &quot;{user.bio}&quot;
              </p>
            )}
          </CardHeader>

          <CardContent className="pt-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">Profile Completion</h3>
                <Badge
                  variant={completionPercent === 100 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {completionPercent}%
                </Badge>
              </div>
              <Progress value={completionPercent} className="h-2 mb-2" />
              {completionPercent < 100 ? (
                <p className="text-xs text-muted-foreground">
                  Your profile is incomplete. Add more details to get better AI recommendations.
                </p>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Your profile is fully complete!
                </p>
              )}
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <GraduationCap className="h-4 w-4" />
                  Institution
                </p>
                <p className="font-medium">
                  {user.institution || (
                    <span className="text-muted-foreground italic">Not provided</span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4" />
                  Major / Field of Study
                </p>
                <p className="font-medium">
                  {user.major || <span className="text-muted-foreground italic">Not provided</span>}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  Grade Level / Year
                </p>
                <p className="font-medium">
                  {user.gradeLevel || (
                    <span className="text-muted-foreground italic">Not provided</span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4" />
                  Target GPA
                </p>
                <p className="font-medium">
                  {user.targetGpa !== null ? (
                    user.targetGpa
                  ) : (
                    <span className="text-muted-foreground italic">Not provided</span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <User className="h-4 w-4" />
                  Account Role
                </p>
                <p className="font-medium capitalize">{user.role.toLowerCase()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4" />
                  Active Subjects
                </p>
                <p className="font-medium">{activeSubjectsCount} enrolled</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4" />
                  Overall CGPA
                </p>
                <p className="font-medium">
                  {overallCgpa.toFixed(2)}{' '}
                  <span className="text-muted-foreground text-xs font-normal">/ 4.0</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Total Credits
                </p>
                <p className="font-medium">{overallCredits} earned</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center sm:justify-start gap-4 border-t border-border/50 pt-6">
              <Link
                href="/academic-performance"
                className={buttonVariants({ variant: 'default', className: 'w-full sm:w-auto' })}
              >
                <Target className="mr-2 h-4 w-4" />
                Academic Performance
              </Link>
              <Link
                href="/subjects"
                className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Subjects
              </Link>
              <Link
                href="/goals"
                className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })}
              >
                <Target className="mr-2 h-4 w-4" />
                Manage Goals
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
