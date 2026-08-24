import { verifySession } from "@/lib/dal";
import db from "@/lib/db";
import { getAiModel } from "../ai-model";
import { generateObject, generateText } from "ai";
import { z } from "zod";

export type ValidatedDocumentContext = {
  userId: string;
  documentId: string;
  extractedText: string;
  document: any;
};

/**
 * Validates session, document existence, ownership, and text extraction.
 * Returns standard error JSON responses if validation fails.
 */
export async function getValidatedDocumentContext(documentId: string) {
  const session = await verifySession();
  if (!session?.isAuth) {
    return { error: { status: 401, code: 'UNAUTHORIZED', message: 'Please sign in to use this feature.' } };
  }

  const document = await db.document.findUnique({
    where: { id: documentId },
    select: { 
      userId: true, 
      extractedText: true, 
      filename: true, 
      id: true, 
      status: true,
      formulas: true,
      importantPoints: true,
      keyTopics: true,
      summaryText: true
    }
  });

  if (!document) {
    return { error: { status: 404, code: 'NOT_FOUND', message: 'Document not found.' } };
  }

  if (document.userId !== session.userId) {
    return { error: { status: 403, code: 'FORBIDDEN', message: 'You do not have permission to access this document.' } };
  }

  if (!document.extractedText || document.status !== 'READY') {
    return { error: { status: 409, code: 'DOCUMENT_NOT_READY', message: 'Your PDF is still being prepared. Please try again in a moment.' } };
  }

  if (document.extractedText.trim().length === 0) {
    return { error: { status: 422, code: 'EMPTY_DOCUMENT', message: 'No readable text was found in this document.' } };
  }

  return {
    context: {
      userId: session.userId,
      documentId: document.id,
      extractedText: document.extractedText,
      document
    }
  };
}

export function isAIQuotaError(error: any): boolean {
  if (!error) return false;
  
  const msg = String(error?.message || error).toLowerCase();
  
  if (msg.includes('429')) return true;
  if (msg.includes('resource_exhausted')) return true;
  if (msg.includes('exceeded your current quota')) return true;
  if (msg.includes('quota exceeded')) return true;
  if (msg.includes('generate_content_free_tier_requests')) return true;
  if (msg.includes('rate limit')) return true;
  if (msg.includes('too many requests')) return true;
  
  const statusCode = error?.statusCode || error?.status;
  if (statusCode === 429) return true;
  
  return false;
}

/**
 * Common handler for AI generation to standardise error handling and API responses.
 */
export async function generateDocumentAI<T>(
  context: ValidatedDocumentContext,
  systemPrompt: string,
  schema: z.ZodType<T>,
  promptSuffix: string = ""
) {
  try {
    // Truncate text to a safe limit for standard models (e.g., 80k-100k chars)
    const safeText = context.extractedText.slice(0, 100000);
    
    const result = await generateObject({
      model: getAiModel(),
      schema,
      system: systemPrompt,
      prompt: `DOCUMENT CONTENT:\n${safeText}\n\n${promptSuffix}`,
    });

    return { success: true, data: result.object };
  } catch (error: any) {
    console.error(`[DocumentAI] Error generating AI content for doc ${context.documentId}:`, error);
    
    if (isAIQuotaError(error)) {
      return { 
        success: false, 
        error: { 
          code: 'AI_QUOTA_EXCEEDED', 
          message: 'AI usage limit reached. The AI service has temporarily reached its usage limit. Your PDF is safe. Please try again later or update the AI API billing/quota.' 
        } 
      };
    }
    
    const errMsg = String(error.message || error);
    
    if (errMsg.includes('API_KEY') || errMsg.includes('401') || errMsg.includes('403')) {
      return { success: false, error: { code: 'API_KEY_ERROR', message: 'AI service configuration error. Please try again later.' } };
    }
    
    if (errMsg.includes('timeout')) {
      return { success: false, error: { code: 'TIMEOUT', message: 'The AI request timed out. The document might be too complex.' } };
    }

    if (error.name === 'TypeValidationError' || error.name === 'JSONParseError') {
       return { success: false, error: { code: 'MALFORMED_RESPONSE', message: 'The AI produced an invalid response. Please try again.' } };
    }

    return { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing the document.' } };
  }
}

export function standardErrorResponse(errorInfo: { status: number, code: string, message: string }) {
  return Response.json(
    { success: false, error: { code: errorInfo.code, message: errorInfo.message } }, 
    { status: errorInfo.status }
  );
}

/**
 * Normalizes document text to compress whitespace and reduce token usage safely.
 */
export function normalizeDocumentContext(text: string): string {
  if (!text) return "";
  
  // Replace multiple newlines with a single newline
  let normalized = text.replace(/\n{3,}/g, '\n\n');
  
  // Replace multiple spaces/tabs with a single space
  normalized = normalized.replace(/[ \t]{2,}/g, ' ');
  
  // Enforce a maximum character limit (e.g., ~150k chars is well within flash limits)
  if (normalized.length > 150000) {
    normalized = normalized.substring(0, 150000) + "\n...[Content truncated for AI processing]...";
  }
  
  return normalized.trim();
}

/**
 * Cache-first wrapper for structured AI generation.
 * Prevents duplicate API calls and caches successful outputs.
 */
export async function generateWithCache<T>(
  context: ValidatedDocumentContext,
  type: string,
  systemPrompt: string,
  schema: z.ZodType<T>,
  promptSuffix: string = "",
  forceNew: boolean = false
) {
  // 1. Check cache unless forced to bypass
  if (!forceNew) {
    const cached = await db.documentAIResult.findUnique({
      where: {
        documentId_type: { documentId: context.documentId, type }
      }
    });

    if (cached) {
      if (cached.status === 'READY' && cached.result) {
        return { success: true, data: cached.result as T, cached: true };
      }
      
      // Prevent double requests if it's currently generating
      if (cached.status === 'GENERATING') {
        // If it's been generating for more than 5 minutes, consider it stale/crashed
        const isStale = (new Date().getTime() - cached.updatedAt.getTime()) > 5 * 60 * 1000;
        if (!isStale) {
          return { 
            success: false, 
            error: { 
              code: 'GENERATION_IN_PROGRESS', 
              message: 'This feature is currently being generated. Please wait a moment.' 
            },
            status: 409
          };
        }
      }
    }
  }

  // 2. Mark as GENERATING (Upsert to prevent race conditions)
  await db.documentAIResult.upsert({
    where: { documentId_type: { documentId: context.documentId, type } },
    update: { status: 'GENERATING', error: null },
    create: {
      documentId: context.documentId,
      type,
      status: 'GENERATING'
    }
  });

  // 3. Call AI
  try {
    const safeText = normalizeDocumentContext(context.extractedText);
    
    const result = await generateObject({
      model: getAiModel(),
      schema,
      system: systemPrompt,
      prompt: `DOCUMENT CONTENT:\n${safeText}\n\n${promptSuffix}`,
    });

    // 4. Update cache with success
    await db.documentAIResult.update({
      where: { documentId_type: { documentId: context.documentId, type } },
      data: { status: 'READY', result: result.object as any }
    });

    return { success: true, data: result.object, cached: false };
    
  } catch (error: any) {
    console.error(`[DocumentAI] Error generating AI content for doc ${context.documentId} (Type: ${type}):`, error);
    
    let errorObj = { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing the document.' };
    
    if (isAIQuotaError(error)) {
      errorObj = { code: 'AI_QUOTA_EXCEEDED', message: 'AI usage limit reached. The AI service has temporarily reached its usage limit. Your PDF is safe. Please try again later or update the AI API billing/quota.' };
    } else {
      const errMsg = String(error.message || error);
      if (errMsg.includes('API_KEY') || errMsg.includes('401') || errMsg.includes('403')) {
        errorObj = { code: 'API_KEY_ERROR', message: 'AI service configuration error. Please try again later.' };
      } else if (errMsg.includes('timeout')) {
        errorObj = { code: 'TIMEOUT', message: 'The AI request timed out. The document might be too complex.' };
      } else if (error.name === 'TypeValidationError' || error.name === 'JSONParseError') {
        errorObj = { code: 'MALFORMED_RESPONSE', message: 'The AI produced an invalid response. Please try again.' };
      }
    }

    // 5. Mark cache as FAILED
    await db.documentAIResult.update({
      where: { documentId_type: { documentId: context.documentId, type } },
      data: { status: 'FAILED', error: errorObj.message }
    });

    return { 
      success: false, 
      error: errorObj,
      status: errorObj.code === 'AI_QUOTA_EXCEEDED' ? 429 : 500
    };
  }
}

