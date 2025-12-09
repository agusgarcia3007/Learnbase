import { COURSE_GENERATION_PROMPT, THUMBNAIL_GENERATION_PROMPT } from "./prompts";

export type CourseContentItem = {
  type: "video" | "document" | "quiz";
  title: string;
  description: string | null;
};

export type GeneratedCourseContent = {
  title: string;
  shortDescription: string;
  description: string;
  objectives: string[];
  requirements: string[];
  features: string[];
};

export function buildCoursePrompt(items: CourseContentItem[]): string {
  const contentList = items
    .map((item, i) => {
      const desc = item.description ? `: ${item.description}` : "";
      return `${i + 1}. [${item.type.toUpperCase()}] ${item.title}${desc}`;
    })
    .join("\n");

  return COURSE_GENERATION_PROMPT.replace("{{content}}", contentList);
}

export function buildThumbnailPrompt(
  title: string,
  description: string,
  topics: string[]
): string {
  return THUMBNAIL_GENERATION_PROMPT.replace("{{title}}", title)
    .replace("{{description}}", description)
    .replace("{{topics}}", topics.join(", "));
}

export function parseGeneratedCourse(response: string): GeneratedCourseContent {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response: no JSON object found");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedCourseContent;

  if (
    !parsed.title ||
    !parsed.description ||
    !parsed.objectives ||
    !Array.isArray(parsed.objectives)
  ) {
    throw new Error("Invalid course format in AI response");
  }

  return {
    title: parsed.title,
    shortDescription: parsed.shortDescription || "",
    description: parsed.description,
    objectives: parsed.objectives || [],
    requirements: parsed.requirements || [],
    features: parsed.features || [],
  };
}
