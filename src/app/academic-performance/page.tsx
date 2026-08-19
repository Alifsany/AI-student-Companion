import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { calculateGPA } from '@/lib/grading';
import { AcademicRecordCard } from '@/components/academic-record-card';
import { TrendingUp, Plus, Award, BookOpen, GraduationCap, Clock } from 'lucide-react';

export const metadata = {
  title: 'Academic Performance — AI Student Companion',
  description: 'View your CGPA, grades, and academic progress',
};

export default async function AcademicPerformancePage() {
  const session = await verifySession();

  const records = await db.academicRecord.findMany({
    where: { userId: session.userId },
    include: {
      subject: {
        select: { name: true, code: true, color: true },
      },
    },
    orderBy: [{ academicYear: 'desc' }, { semester: 'desc' }, { subject: { name: 'asc' } }],
  });

  const cgpa = calculateGPA(records);
  const totalCredits = records.reduce((sum, r) => sum + r.creditHours, 0);

  // Group by semester and academic year
  const semestersMap = new Map<string, typeof records>();

  for (const r of records) {
    const key = `${r.semester} ${r.academicYear}`;
    if (!semestersMap.has(key)) {
      semestersMap.set(key, []);
    }
    semestersMap.get(key)!.push(r);
  }

  // Convert map to array and sort (descending visually via the existing order)
  // Since we already ordered by academicYear desc, semester desc, preserving the Map insertion order is mostly fine
  const semesterGroups = Array.from(semestersMap.entries()).map(([name, semRecords]) => {
    return {
      name,
      records: semRecords,
      gpa: calculateGPA(semRecords),
      credits: semRecords.reduce((sum, r) => sum + r.creditHours, 0),
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors mr-2 text-sm font-medium"
            >
              &larr; Dashboard
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <TrendingUp className="h-5 w-5 text-primary hidden sm:block" />
            <h1 className="font-heading font-semibold text-foreground text-lg hidden sm:block">
              Academic Performance
            </h1>
          </div>
          <Link
            href="/academic-performance/new"
            className={buttonVariants({ size: 'sm', className: 'gap-2' })}
          >
            <Plus className="h-4 w-4" />
            Add Result
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:hidden mb-2">
            Academic Performance
          </h2>
          <p className="text-muted-foreground">
            Track your grades, calculate your CGPA, and view your semester progress.
          </p>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <Award className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">No records found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mb-8">
              Start by recording your grades to see your CGPA and academic history.
            </p>
            <Link
              href="/academic-performance/new"
              className={buttonVariants({ size: 'lg', className: 'gap-2' })}
            >
              <Plus className="h-5 w-5" />
              Add your first result
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Overview Section */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm overflow-hidden relative">
                  <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
                    <GraduationCap className="w-32 h-32" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Overall CGPA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-primary font-heading tracking-tight">
                        {cgpa.toFixed(2)}
                      </span>
                      <span className="text-xl text-muted-foreground font-semibold">/ 4.00</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Total Credits Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <span className="text-4xl font-bold text-foreground font-heading">
                        {totalCredits}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Semester Breakdown */}
            <section>
              <h3 className="font-heading text-xl font-semibold mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
                <Clock className="h-5 w-5 text-primary" /> Semester History
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {semesterGroups.map((group) => (
                  <Card key={group.name} className="border-border/50 bg-card shadow-sm">
                    <CardContent className="p-5 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">{group.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {group.credits} Credits • {group.records.length}{' '}
                          {group.records.length === 1 ? 'Subject' : 'Subjects'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {group.gpa.toFixed(2)}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                          GPA
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Detailed Course Results */}
            <section>
              <h3 className="font-heading text-xl font-semibold mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
                <BookOpen className="h-5 w-5 text-primary" /> Course Results
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {records.map((record) => (
                  <AcademicRecordCard key={record.id} record={record} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
