import { generateText } from "ai";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  coursesTable,
  courseModulesTable,
  moduleItemsTable,
  tenantAiProfilesTable,
  aiFeedbackTable,
  type TitleStyle,
  type DescriptionStyle,
  type ModulePatterns,
  type AiTone,
} from "@/db/schema";
import { groq } from "./groq";
import { AI_MODELS } from "./models";
import { logger } from "../logger";

const MIN_COURSES_FOR_ANALYSIS = 2;

export async function analyzeTenantCourses(tenantId: string): Promise<void> {
  logger.info("Starting tenant course analysis", { tenantId });

  const courses = await db
    .select({
      id: coursesTable.id,
      title: coursesTable.title,
      shortDescription: coursesTable.shortDescription,
      description: coursesTable.description,
    })
    .from(coursesTable)
    .where(
      and(eq(coursesTable.tenantId, tenantId), eq(coursesTable.status, "published"))
    );

  if (courses.length < MIN_COURSES_FOR_ANALYSIS) {
    logger.info("Not enough courses for analysis", {
      tenantId,
      courseCount: courses.length,
      minRequired: MIN_COURSES_FOR_ANALYSIS,
    });
    return;
  }

  const courseIds = courses.map((c) => c.id);
  const moduleData = await db
    .select({
      courseId: courseModulesTable.courseId,
      moduleId: courseModulesTable.moduleId,
    })
    .from(courseModulesTable)
    .where(sql`${courseModulesTable.courseId} IN ${courseIds}`);

  const moduleIds = [...new Set(moduleData.map((m) => m.moduleId))];

  let itemCounts: { moduleId: string; count: number }[] = [];
  if (moduleIds.length > 0) {
    itemCounts = await db
      .select({
        moduleId: moduleItemsTable.moduleId,
        count: sql<number>`count(*)::int`,
      })
      .from(moduleItemsTable)
      .where(sql`${moduleItemsTable.moduleId} IN ${moduleIds}`)
      .groupBy(moduleItemsTable.moduleId);
  }

  const titles = courses.map((c) => c.title);
  const descriptions = courses
    .map((c) => c.description)
    .filter((d): d is string => !!d);
  const shortDescriptions = courses
    .map((c) => c.shortDescription)
    .filter((d): d is string => !!d);

  const titleStyle = analyzeTitles(titles);
  const descriptionStyle = analyzeDescriptions(descriptions);
  const modulePatterns = analyzeModulePatterns(moduleData, itemCounts);

  let inferredTone: AiTone | null = null;
  const textsForToneAnalysis = [...shortDescriptions.slice(0, 3), ...descriptions.slice(0, 2)];
  if (textsForToneAnalysis.length >= 2) {
    inferredTone = await inferToneWithLLM(textsForToneAnalysis);
  }

  await db
    .insert(tenantAiProfilesTable)
    .values({
      tenantId,
      inferredTone,
      titleStyle,
      descriptionStyle,
      modulePatterns,
      coursesAnalyzed: courses.length,
      lastAnalyzedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: tenantAiProfilesTable.tenantId,
      set: {
        inferredTone,
        titleStyle,
        descriptionStyle,
        modulePatterns,
        coursesAnalyzed: courses.length,
        lastAnalyzedAt: new Date(),
        profileVersion: sql`${tenantAiProfilesTable.profileVersion} + 1`,
        updatedAt: new Date(),
      },
    });

  logger.info("Tenant course analysis completed", {
    tenantId,
    coursesAnalyzed: courses.length,
    inferredTone,
  });
}

function analyzeTitles(titles: string[]): TitleStyle {
  const lengths = titles.map((t) => t.length);
  const averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  const capitalizationStyle = detectCapitalizationStyle(titles);
  const commonPrefixes = extractCommonPrefixes(titles);

  return {
    averageLength,
    capitalizationStyle,
    commonPrefixes,
  };
}

function detectCapitalizationStyle(
  titles: string[]
): "title" | "sentence" | "lowercase" {
  let titleCaseCount = 0;
  let sentenceCaseCount = 0;
  let lowercaseCount = 0;

  for (const title of titles) {
    const words = title.split(/\s+/);
    if (words.length === 0) continue;

    const allLowercase = words.every((w) => w === w.toLowerCase());
    if (allLowercase) {
      lowercaseCount++;
      continue;
    }

    const firstWordCapitalized =
      words[0].charAt(0) === words[0].charAt(0).toUpperCase();
    const otherWordsCapitalized = words.slice(1).filter((w) => {
      const firstChar = w.charAt(0);
      return firstChar === firstChar.toUpperCase() && /[a-zA-Z]/.test(firstChar);
    });

    const capitalizationRatio =
      words.length > 1 ? otherWordsCapitalized.length / (words.length - 1) : 0;

    if (firstWordCapitalized && capitalizationRatio > 0.5) {
      titleCaseCount++;
    } else if (firstWordCapitalized) {
      sentenceCaseCount++;
    } else {
      lowercaseCount++;
    }
  }

  if (titleCaseCount >= sentenceCaseCount && titleCaseCount >= lowercaseCount) {
    return "title";
  }
  if (sentenceCaseCount >= lowercaseCount) {
    return "sentence";
  }
  return "lowercase";
}

function extractCommonPrefixes(titles: string[]): string[] {
  const prefixCounts = new Map<string, number>();

  for (const title of titles) {
    const match = title.match(/^([\w\s]+)[:|-]/);
    if (match) {
      const prefix = match[1].trim();
      prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
    }

    const numberedMatch = title.match(/^(Modulo|Module|Leccion|Lesson|Parte|Part)\s*\d/i);
    if (numberedMatch) {
      const pattern = numberedMatch[1];
      prefixCounts.set(`${pattern} N:`, (prefixCounts.get(`${pattern} N:`) || 0) + 1);
    }
  }

  return Array.from(prefixCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([prefix]) => prefix);
}

function analyzeDescriptions(descriptions: string[]): DescriptionStyle {
  if (descriptions.length === 0) {
    return {
      averageLength: 200,
      formalityScore: 0.5,
      usesEmoji: false,
    };
  }

  const lengths = descriptions.map((d) => d.length);
  const averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const descriptionsWithEmoji = descriptions.filter((d) => emojiRegex.test(d));
  const usesEmoji = descriptionsWithEmoji.length > descriptions.length / 2;

  const formalityScore = calculateFormalityScore(descriptions);

  return {
    averageLength,
    formalityScore,
    usesEmoji,
  };
}

function calculateFormalityScore(descriptions: string[]): number {
  const formalIndicators = [
    /\busted\b/gi,
    /\bestimado\b/gi,
    /\bpermitir[áa]\b/gi,
    /\bproceder\b/gi,
    /\bmediante\b/gi,
    /\basimismo\b/gi,
    /\bno obstante\b/gi,
    /\bpor consiguiente\b/gi,
  ];

  const casualIndicators = [
    /\btu\b/gi,
    /\bvas a\b/gi,
    /\b(super|mega|genial)\b/gi,
    /!/g,
    /\.\.\./g,
  ];

  let formalCount = 0;
  let casualCount = 0;

  for (const desc of descriptions) {
    for (const pattern of formalIndicators) {
      const matches = desc.match(pattern);
      if (matches) formalCount += matches.length;
    }
    for (const pattern of casualIndicators) {
      const matches = desc.match(pattern);
      if (matches) casualCount += matches.length;
    }
  }

  const total = formalCount + casualCount;
  if (total === 0) return 0.5;

  return Math.min(1, Math.max(0, 0.5 + (formalCount - casualCount) / (total * 2)));
}

function analyzeModulePatterns(
  moduleData: { courseId: string; moduleId: string }[],
  itemCounts: { moduleId: string; count: number }[]
): ModulePatterns {
  const courseModuleCounts = new Map<string, number>();
  for (const m of moduleData) {
    courseModuleCounts.set(m.courseId, (courseModuleCounts.get(m.courseId) || 0) + 1);
  }

  const itemCountMap = new Map(itemCounts.map((ic) => [ic.moduleId, ic.count]));
  const itemCountsArray = moduleData.map((m) => itemCountMap.get(m.moduleId) || 0);

  const averageItemsPerModule =
    itemCountsArray.length > 0
      ? itemCountsArray.reduce((a, b) => a + b, 0) / itemCountsArray.length
      : 3;

  return {
    averageItemsPerModule,
    namingPattern: "Topic-based",
    preferredContentOrder: ["video", "document", "quiz"],
  };
}

async function inferToneWithLLM(texts: string[]): Promise<AiTone | null> {
  const sampleText = texts.slice(0, 5).join("\n---\n");

  const prompt = `Analyze these course descriptions and determine the predominant tone.

DESCRIPTIONS:
${sampleText}

OPTIONS (choose exactly one):
- formal: Uses formal language, "usted" form, professional vocabulary
- casual: Uses informal language, "tu" form, conversational style
- professional: Business-oriented, clear and direct
- academic: Scholarly, technical terminology, precise
- friendly: Warm and approachable while professional

Respond with ONLY one word from the options above, nothing else.`;

  try {
    const { text } = await generateText({
      model: groq(AI_MODELS.CONTENT_GENERATION),
      prompt,
      maxOutputTokens: 10,
    });

    const tone = text.trim().toLowerCase() as AiTone;
    const validTones: AiTone[] = ["formal", "casual", "professional", "academic", "friendly"];

    if (validTones.includes(tone)) {
      return tone;
    }

    logger.warn("Invalid tone from LLM", { response: text });
    return "professional";
  } catch (error) {
    logger.error("Failed to infer tone with LLM", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

export async function extractPreferenceFromCorrection(
  feedbackId: string
): Promise<void> {
  const [feedback] = await db
    .select()
    .from(aiFeedbackTable)
    .where(eq(aiFeedbackTable.id, feedbackId));

  if (!feedback) {
    logger.warn("Feedback not found for preference extraction", { feedbackId });
    return;
  }

  if (!feedback.originalContent || !feedback.correctedContent) {
    logger.info("Feedback missing content for preference extraction", { feedbackId });
    await db
      .update(aiFeedbackTable)
      .set({ processedForProfile: true })
      .where(eq(aiFeedbackTable.id, feedbackId));
    return;
  }

  const prompt = `You are a preference extraction assistant.
Given an original AI-generated text and a user's correction, identify the style preference the user has.

Original text:
"${feedback.originalContent}"

User's corrected version:
"${feedback.correctedContent}"

${feedback.userInstruction ? `User instruction: "${feedback.userInstruction}"` : ""}

Extract ONE concise preference rule that explains what the user prefers.
Examples of good rules:
- "Use formal 'usted' instead of informal 'tu'"
- "Keep descriptions under 100 characters"
- "Always start titles with action verbs"
- "Avoid using emojis"
- "Use 'capacitacion' instead of 'entrenamiento'"

If no clear preference can be extracted, respond with exactly "NONE".
Respond with only the rule or "NONE", nothing else.`;

  try {
    const { text } = await generateText({
      model: groq(AI_MODELS.CONTENT_GENERATION),
      prompt,
      maxOutputTokens: 100,
    });

    const extractedRule = text.trim();

    if (extractedRule && extractedRule !== "NONE") {
      await db
        .update(aiFeedbackTable)
        .set({
          extractedPreference: extractedRule,
          preferenceConfidence: 70,
          processedForProfile: true,
        })
        .where(eq(aiFeedbackTable.id, feedbackId));

      await addPreferenceToProfile(
        feedback.tenantId,
        extractedRule,
        "feedback_derived",
        70
      );

      logger.info("Preference extracted from feedback", {
        feedbackId,
        tenantId: feedback.tenantId,
        rule: extractedRule,
      });
    } else {
      await db
        .update(aiFeedbackTable)
        .set({ processedForProfile: true })
        .where(eq(aiFeedbackTable.id, feedbackId));

      logger.info("No preference extracted from feedback", { feedbackId });
    }
  } catch (error) {
    logger.error("Failed to extract preference from correction", {
      feedbackId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function addPreferenceToProfile(
  tenantId: string,
  rule: string,
  source: "user_stated" | "feedback_derived",
  confidence: number
): Promise<void> {
  const [existingProfile] = await db
    .select()
    .from(tenantAiProfilesTable)
    .where(eq(tenantAiProfilesTable.tenantId, tenantId));

  const newPreference = {
    rule,
    source,
    confidence,
    createdAt: new Date().toISOString(),
  };

  if (existingProfile) {
    const currentRules = existingProfile.explicitPreferences?.rules || [];

    const isDuplicate = currentRules.some(
      (r) => r.rule.toLowerCase() === rule.toLowerCase()
    );

    if (isDuplicate) {
      logger.info("Duplicate preference rule, skipping", { tenantId, rule });
      return;
    }

    const updatedRules = [...currentRules, newPreference].slice(-10);

    await db
      .update(tenantAiProfilesTable)
      .set({
        explicitPreferences: { rules: updatedRules },
        feedbackCount: sql`${tenantAiProfilesTable.feedbackCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tenantAiProfilesTable.tenantId, tenantId));
  } else {
    await db.insert(tenantAiProfilesTable).values({
      tenantId,
      explicitPreferences: { rules: [newPreference] },
      feedbackCount: 1,
      coursesAnalyzed: 0,
    });
  }

  logger.info("Preference added to profile", { tenantId, rule, source });
}
