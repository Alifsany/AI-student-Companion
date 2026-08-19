import 'server-only';

import { CompactEncrypt, compactDecrypt } from 'jose';

// ---------------------------------------------------------------------------
// Practice token uses AES-256-GCM (JWE) via jose.
// The payload is fully encrypted — never just signed.
// Correct answers embedded here are never readable by the client.
// ---------------------------------------------------------------------------

const PRACTICE_TOKEN_TTL_SECONDS = 90 * 60; // 90 minutes

export type PracticeQuestionAnswer = {
  id: string;
  type: 'MCQ' | 'SHORT_ANSWER' | 'TRUE_FALSE' | 'CONCEPTUAL' | 'PROBLEM_SOLVING' | 'CODING';
  text: string;
  correctAnswer: string;
  explanation: string;
  hint?: string;
  options?: string[];
};

export type PracticeTokenPayload = {
  userId: string;
  questions: PracticeQuestionAnswer[];
  exp: number; // Unix timestamp seconds
  // Quiz/exam metadata (optional — not present for 6.2 practice tokens)
  quizMode?: 'QUIZ' | 'MOCK_EXAM';
  timeLimitSeconds?: number; // undefined = untimed
  startedAt?: number; // Unix timestamp — set when quiz starts, for server-side time tracking
  subjectId?: string;
  subjectName?: string;
  title?: string;
};

function getEncryptionKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set.');
  }
  // Derive a 32-byte key from AUTH_SECRET using a simple SHA-256-like approach.
  // We need exactly 32 bytes for AES-256-GCM.
  // We use the first 32 bytes of the UTF-8 encoded secret, zero-padded if shorter.
  const encoder = new TextEncoder();
  const raw = encoder.encode(secret);
  const key = new Uint8Array(32);
  key.set(raw.subarray(0, Math.min(32, raw.length)));
  return key;
}

export async function encryptPracticeToken(payload: PracticeTokenPayload): Promise<string> {
  const key = getEncryptionKey();
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(payload));

  const jwe = await new CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(key);

  return jwe;
}

export async function decryptPracticeToken(token: string): Promise<PracticeTokenPayload> {
  const key = getEncryptionKey();

  let plaintext: Uint8Array;
  try {
    const result = await compactDecrypt(token, key);
    plaintext = result.plaintext;
  } catch {
    throw new Error('Invalid or tampered practice token.');
  }

  let payload: PracticeTokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(plaintext)) as PracticeTokenPayload;
  } catch {
    throw new Error('Malformed practice token payload.');
  }

  // Enforce expiry
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < nowSeconds) {
    throw new Error('Practice session has expired. Please generate a new set of questions.');
  }

  return payload;
}

export function practiceTokenExpiryTimestamp(): number {
  return Math.floor(Date.now() / 1000) + PRACTICE_TOKEN_TTL_SECONDS;
}
