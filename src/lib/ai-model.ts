import { google } from '@ai-sdk/google';

// Centralize the AI model configuration to easily switch models
// Using gemini-3.6-flash which currently has available free-tier quota
export const AI_MODEL_NAME = 'gemini-3.6-flash';

export function getAiModel() {
  return google(AI_MODEL_NAME);
}
