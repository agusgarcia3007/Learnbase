import { db } from "../src/db";
import { quizzesTable } from "../src/db/schema";
import { isNull, eq } from "drizzle-orm";
import { generateEmbedding } from "../src/lib/ai/embeddings";

async function backfillQuizEmbeddings() {
  console.log("Starting quiz embeddings backfill...");

  const quizzes = await db
    .select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      description: quizzesTable.description,
    })
    .from(quizzesTable)
    .where(isNull(quizzesTable.embedding));

  console.log(`Found ${quizzes.length} quizzes without embeddings`);

  let processed = 0;
  for (const quiz of quizzes) {
    const text = `${quiz.title} ${quiz.description || ""}`.trim();
    const embedding = await generateEmbedding(text);
    await db
      .update(quizzesTable)
      .set({ embedding })
      .where(eq(quizzesTable.id, quiz.id));
    processed++;
    console.log(`[${processed}/${quizzes.length}] Processed: ${quiz.title}`);
  }

  console.log(`\nBackfill complete! Processed ${processed} quizzes.`);
  process.exit(0);
}

backfillQuizEmbeddings().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
