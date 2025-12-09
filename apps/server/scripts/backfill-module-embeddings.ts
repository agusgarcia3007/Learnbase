import { db } from "../src/db";
import { modulesTable } from "../src/db/schema";
import { isNull } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { generateEmbedding } from "../src/lib/ai/embeddings";

async function backfillModuleEmbeddings() {
  console.log("Starting module embeddings backfill...");

  const modules = await db
    .select({
      id: modulesTable.id,
      title: modulesTable.title,
      description: modulesTable.description,
    })
    .from(modulesTable)
    .where(isNull(modulesTable.embedding));

  console.log(`Found ${modules.length} modules without embeddings`);

  let processed = 0;
  for (const mod of modules) {
    const text = `${mod.title} ${mod.description || ""}`.trim();
    const embedding = await generateEmbedding(text);
    await db
      .update(modulesTable)
      .set({ embedding })
      .where(eq(modulesTable.id, mod.id));
    processed++;
    console.log(`[${processed}/${modules.length}] Processed: ${mod.title}`);
  }

  console.log(`\nBackfill complete! Processed ${processed} modules.`);
  process.exit(0);
}

backfillModuleEmbeddings().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
