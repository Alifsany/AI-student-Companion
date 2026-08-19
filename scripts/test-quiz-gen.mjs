import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const QUESTION_TYPES = ["MCQ","SHORT_ANSWER","TRUE_FALSE","CONCEPTUAL","PROBLEM_SOLVING","CODING"];
const DIFFICULTIES = ["EASY","MEDIUM","HARD"];

const PracticeQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: z.enum(QUESTION_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  hint: z.string().optional(),
});

const PracticeSetSchema = z.object({
  questions: z.array(PracticeQuestionSchema).min(1).max(30),
});

console.log("API KEY set:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY, "| length:", process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length ?? 0);
console.log("Model: gemini-3.6-flash");

try {
  const result = await generateObject({
    model: google("gemini-3.6-flash"),
    schema: PracticeSetSchema,
    system: "You are an AI question generator.",
    prompt: "Generate 2 EASY MCQ questions about JavaScript.",
  });
  console.log("SUCCESS - questions:", result.object.questions.length);
  console.log(result.object.questions[0].text);
} catch(err) {
  console.error("ERROR name    :", err.name);
  console.error("ERROR message :", err.message);
  console.error("ERROR status  :", err.statusCode ?? err.status ?? "N/A");
  console.error("ERROR keys    :", Object.keys(err).join(", "));
  if (err.responseBody) console.error("responseBody  :", err.responseBody);
  if (err.cause) console.error("cause         :", String(err.cause));
}
