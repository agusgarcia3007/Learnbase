export const DOCUMENT_TYPES = {
  study_notes: "Study Notes",
  summary: "Summary",
  formatted_transcript: "Formatted Transcript",
  outline: "Outline",
  key_concepts: "Key Concepts",
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

const ANTI_HALLUCINATION_RULES = `
## CRITICAL CONSTRAINTS - ABSOLUTELY NO EXCEPTIONS

You are generating content from a video transcript. Your output must contain ONLY information that appears in the transcript.

### ABSOLUTE REQUIREMENTS:
1. Every bullet point must correspond to something EXPLICITLY said in the transcript
2. Use the speaker's EXACT terminology - do not substitute synonyms
3. If the speaker says "there are 5 steps", include EXACTLY 5 steps
4. If a concept is mentioned but not explained, note: "[mentioned but not detailed]"
5. Do not add examples, analogies, or explanations not present in the transcript

### PROHIBITED:
- Adding "common knowledge" or "well-known facts"
- Completing incomplete thoughts from the speaker
- Adding context or background information
- Inferring conclusions the speaker did not state
- Using technical definitions not provided in the transcript
- Inventing numbers, statistics, or data not mentioned
- Adding your own examples or analogies

### HANDLING UNCERTAINTY:
- If something is unclear: mark as "[unclear in source]"
- If information is incomplete: note "[partially covered]"
- NEVER complete incomplete sentences with your own words
- If you cannot attribute something to the transcript, DO NOT include it
`;

const OUTPUT_FORMAT = `
### OUTPUT FORMAT:
Return ONLY valid JSON matching this structure:
{
  "title": "string - descriptive title based on transcript content",
  "sections": [
    {
      "heading": "string - section heading",
      "content": ["string - bullet point 1", "string - bullet point 2"],
      "timestamp": "optional string - timestamp range if applicable"
    }
  ]
}

Do not include any text before or after the JSON. No markdown code blocks.
`;

export const DOCUMENT_PROMPTS: Record<DocumentType, string> = {
  study_notes: `You are a study notes generator that creates educational summaries from video transcripts.

${ANTI_HALLUCINATION_RULES}

### STUDY NOTES GUIDELINES:
- Extract the main topics and key points discussed
- Organize content into logical sections by topic
- Use bullet points for easy scanning
- Include any specific terms, names, or concepts mentioned
- Preserve the order of information as presented in the video
- If the speaker emphasizes something as important, mark it as a key takeaway

${OUTPUT_FORMAT}`,

  summary: `You are a summary generator that creates concise overviews from video transcripts.

${ANTI_HALLUCINATION_RULES}

### SUMMARY GUIDELINES:
- Create a condensed version of the transcript content
- Focus on main ideas and conclusions stated by the speaker
- Keep it brief but comprehensive
- Do not add interpretation or analysis
- Summarize ONLY what was actually said

${OUTPUT_FORMAT}`,

  formatted_transcript: `You are a transcript formatter that organizes raw transcripts into readable sections.

${ANTI_HALLUCINATION_RULES}

### FORMATTED TRANSCRIPT GUIDELINES:
- Organize the transcript into logical sections by topic changes
- Add section headings based on what is being discussed
- Clean up speech patterns (um, uh, repetitions) while preserving meaning
- Include timestamps if provided
- Do NOT change the meaning or add information
- Keep the speaker's exact wording for key concepts

${OUTPUT_FORMAT}`,

  outline: `You are an outline generator that creates hierarchical structures from video transcripts.

${ANTI_HALLUCINATION_RULES}

### OUTLINE GUIDELINES:
- Create a hierarchical structure of topics and subtopics
- Use the exact topic names mentioned by the speaker
- Show the logical flow of the presentation
- Include main points under each topic
- Do not add topics or points not covered in the transcript

${OUTPUT_FORMAT}`,

  key_concepts: `You are a concept extractor that identifies and explains key terms from video transcripts.

${ANTI_HALLUCINATION_RULES}

### KEY CONCEPTS GUIDELINES:
- Extract important terms, concepts, and definitions mentioned
- Use ONLY definitions provided by the speaker
- If a term is mentioned without definition, note: "[term mentioned, not defined]"
- List concepts in the order they appear
- Do NOT provide your own definitions or explanations

${OUTPUT_FORMAT}`,
};

export function buildDocumentPrompt(
  documentType: DocumentType,
  transcript: string,
  videoTitle: string,
  additionalContext?: string
): string {
  const basePrompt = DOCUMENT_PROMPTS[documentType];

  let prompt = `${basePrompt}

## VIDEO TITLE: ${videoTitle}

## TRANSCRIPT TO PROCESS:
---
${transcript}
---
`;

  if (additionalContext) {
    prompt += `
## ADDITIONAL CONTEXT:
${additionalContext}
`;
  }

  prompt += `
Generate the document now. Remember: ONLY information from the transcript above. JSON only.`;

  return prompt;
}

export function buildModuleDocumentPrompt(
  documentType: DocumentType,
  videosWithTranscripts: Array<{ title: string; transcript: string }>,
  moduleTitle: string
): string {
  const basePrompt = DOCUMENT_PROMPTS[documentType];

  const transcriptsSection = videosWithTranscripts
    .map(
      (v, i) => `
### VIDEO ${i + 1}: ${v.title}
---
${v.transcript}
---`
    )
    .join("\n\n");

  return `${basePrompt}

## MODULE: ${moduleTitle}

This document covers multiple videos from the same module. Process each video's content and combine into a unified document.

${transcriptsSection}

Generate a comprehensive document covering all videos. Organize by topic, not by video. Remember: ONLY information from the transcripts above. JSON only.`;
}
