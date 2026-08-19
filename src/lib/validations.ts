import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sign-up schema
// ---------------------------------------------------------------------------
export const SignUpSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters.' })
      .max(100, { message: 'Name must be under 100 characters.' })
      .trim(),
    email: z
      .string()
      .email({ message: 'Please enter a valid email address.' })
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .max(128, { message: 'Password must be under 128 characters.' })
      .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter.' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Password must contain at least one special character.',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

// ---------------------------------------------------------------------------
// Sign-in schema
// ---------------------------------------------------------------------------
export const SignInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }).trim().toLowerCase(),
  password: z.string().min(1, { message: 'Password is required.' }),
});

// ---------------------------------------------------------------------------
// Onboarding schema
// ---------------------------------------------------------------------------
export const OnboardingSchema = z.object({
  institution: z
    .string()
    .min(2, { message: 'Institution must be at least 2 characters.' })
    .max(100),
  gradeLevel: z.string().min(1, { message: 'Grade level is required.' }),
  major: z
    .string()
    .min(2, { message: 'Major/Field of study must be at least 2 characters.' })
    .max(100),
  targetGpa: z.coerce
    .number()
    .min(0, { message: 'GPA must be between 0 and 4.0' })
    .max(4.0, { message: 'GPA must be between 0 and 4.0' })
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, { message: 'Bio must be under 500 characters.' }).optional(),
});

// ---------------------------------------------------------------------------
// Profile Edit schema
// ---------------------------------------------------------------------------
export const EditProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(100, { message: 'Name must be under 100 characters.' })
    .trim(),
  institution: z
    .string()
    .min(2, { message: 'Institution must be at least 2 characters.' })
    .max(100),
  gradeLevel: z.string().min(1, { message: 'Grade level is required.' }),
  major: z
    .string()
    .min(2, { message: 'Major/Field of study must be at least 2 characters.' })
    .max(100),
  targetGpa: z.coerce
    .number()
    .min(0, { message: 'GPA must be between 0 and 4.0' })
    .max(4.0, { message: 'GPA must be between 0 and 4.0' })
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, { message: 'Bio must be under 500 characters.' }).optional(),
});

// ---------------------------------------------------------------------------
// Subject schema
// ---------------------------------------------------------------------------
export const SubjectSchema = z.object({
  name: z.string().min(1, { message: 'Subject name is required.' }).max(100).trim(),
  code: z
    .string()
    .max(20)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.trim() : val)),
  department: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.trim() : val)),
  semester: z
    .string()
    .max(50)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.trim() : val)),
  academicYear: z
    .string()
    .max(20)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.trim() : val)),
  creditHours: z.coerce.number().min(0).max(20).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  teacherName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.trim() : val)),
  description: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.trim() : val)),
  color: z.string().max(20).optional().or(z.literal('')),
  targetGoal: z.string().max(100).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Academic Task schema
// ---------------------------------------------------------------------------
export const TaskSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(150),
  description: z.string().max(2000).optional().or(z.literal('')),
  type: z
    .enum(['ASSIGNMENT', 'QUIZ', 'EXAM', 'PROJECT', 'PRESENTATION', 'STUDY', 'OTHER'])
    .default('ASSIGNMENT'),
  dueDate: z.string().optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).default('TODO'),
  subjectId: z.string().optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Academic Goal schema
// ---------------------------------------------------------------------------
export const GoalSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(150),
  description: z.string().max(2000).optional().or(z.literal('')),
  type: z
    .enum(['TARGET_GPA', 'ACADEMIC_PERFORMANCE', 'STUDY_CONSISTENCY', 'SKILL_DEVELOPMENT', 'OTHER'])
    .default('OTHER'),
  targetValue: z.string().max(100).optional().or(z.literal('')),
  deadline: z.string().optional().or(z.literal('')),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).default('NOT_STARTED'),
});

// ---------------------------------------------------------------------------
// Academic Record schema
// ---------------------------------------------------------------------------
export const AcademicRecordSchema = z.object({
  subjectId: z.string().min(1, { message: 'Subject is required.' }),
  semester: z.string().min(1, { message: 'Semester is required.' }).max(50),
  academicYear: z.string().min(1, { message: 'Academic Year is required.' }).max(20),
  creditHours: z.coerce.number().min(0.5, { message: 'Credit hours must be at least 0.5' }).max(20),
  grade: z.string().min(1, { message: 'Grade is required.' }).max(5),
});

// ---------------------------------------------------------------------------
// Study Session schema
// ---------------------------------------------------------------------------
export const StudySessionSchema = z.object({
  subjectId: z.string().optional().or(z.literal('')),
  taskId: z.string().optional().or(z.literal('')),
  type: z.enum(['POMODORO', 'CUSTOM']).default('POMODORO'),
  plannedDuration: z.coerce
    .number()
    .min(60, { message: 'Must be at least 1 minute' })
    .max(14400, { message: 'Must be under 4 hours' }),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Study Plan schema
// ---------------------------------------------------------------------------
export const StudyPlanSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(100),
  subjectId: z.string().optional().or(z.literal('')),
  taskId: z.string().optional().or(z.literal('')),
  goalId: z.string().optional().or(z.literal('')),
  plannedDate: z.string().min(1, { message: 'Date is required.' }),
  plannedDuration: z.coerce
    .number()
    .min(60, { message: 'Must be at least 1 minute' })
    .max(28800, { message: 'Must be under 8 hours' }),
  description: z.string().max(1000).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Shared FormState type used by useActionState hooks
// ---------------------------------------------------------------------------
export type FormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
        institution?: string[];
        gradeLevel?: string[];
        major?: string[];
        targetGpa?: string[];
        bio?: string[];
        code?: string[];
        department?: string[];
        semester?: string[];
        academicYear?: string[];
        creditHours?: string[];
        status?: string[];
        teacherName?: string[];
        description?: string[];
        color?: string[];
        targetGoal?: string[];
        // Assignment fields
        title?: string[];
        dueDate?: string[];
        priority?: string[];
        subjectId?: string[];
        // Goal fields
        type?: string[];
        targetValue?: string[];
        deadline?: string[];
        // Academic Record fields
        grade?: string[];
        // Study Session fields
        plannedDuration?: string[];
        notes?: string[];
        taskId?: string[];
        // Study Plan fields
        goalId?: string[];
        plannedDate?: string[];
      };
      message?: string;
    }
  | undefined;
