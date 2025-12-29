export const AI_MODELS = {
  TRANSCRIPTION: "whisper-large-v3-turbo",
  CONTENT_GENERATION: "llama-3.3-70b-versatile",
  CONTENT_ANALYSIS: "llama-3.3-70b-versatile",
  QUIZ_GENERATION: "llama-3.1-8b-instant",
  COURSE_GENERATION: "llama-3.3-70b-versatile",
  IMAGE_GENERATION: "gemini-2.5-flash-image-preview",
  THEME_GENERATION: "gemini-2.5-flash",
  COURSE_CHAT: "gpt-4o-mini",
  EMBEDDING: "openai/text-embedding-3-small",
} as const;

export const EMBEDDING_DIMENSIONS = 1536;
