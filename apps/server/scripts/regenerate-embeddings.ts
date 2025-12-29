import { db } from "../src/db";
import {
  coursesTable,
  documentsTable,
  modulesTable,
  quizzesTable,
  videosTable,
} from "../src/db/schema";
import { generateEmbedding } from "../src/lib/ai/embeddings";
import { eq, isNull } from "drizzle-orm";

async function regenerateEmbeddings() {
  console.log("Starting embeddings regeneration (1536 dimensions)...\n");

  // Courses
  const courses = await db
    .select({ id: coursesTable.id, title: coursesTable.title, description: coursesTable.description })
    .from(coursesTable)
    .where(isNull(coursesTable.embedding));

  console.log(`Courses to process: ${courses.length}`);
  for (const course of courses) {
    const text = [course.title, course.description].filter(Boolean).join(" ");
    const embedding = await generateEmbedding(text);
    await db.update(coursesTable).set({ embedding }).where(eq(coursesTable.id, course.id));
    process.stdout.write(".");
  }
  if (courses.length > 0) console.log(" Done!");
  console.log("");

  // Modules
  const modules = await db
    .select({ id: modulesTable.id, title: modulesTable.title, description: modulesTable.description })
    .from(modulesTable)
    .where(isNull(modulesTable.embedding));

  console.log(`Modules to process: ${modules.length}`);
  for (const mod of modules) {
    const text = [mod.title, mod.description].filter(Boolean).join(" ");
    const embedding = await generateEmbedding(text);
    await db.update(modulesTable).set({ embedding }).where(eq(modulesTable.id, mod.id));
    process.stdout.write(".");
  }
  if (modules.length > 0) console.log(" Done!");
  console.log("");

  // Videos
  const videos = await db
    .select({ id: videosTable.id, title: videosTable.title, description: videosTable.description })
    .from(videosTable)
    .where(isNull(videosTable.embedding));

  console.log(`Videos to process: ${videos.length}`);
  for (const video of videos) {
    const text = [video.title, video.description].filter(Boolean).join(" ");
    const embedding = await generateEmbedding(text);
    await db.update(videosTable).set({ embedding }).where(eq(videosTable.id, video.id));
    process.stdout.write(".");
  }
  if (videos.length > 0) console.log(" Done!");
  console.log("");

  // Documents
  const documents = await db
    .select({ id: documentsTable.id, title: documentsTable.title, description: documentsTable.description })
    .from(documentsTable)
    .where(isNull(documentsTable.embedding));

  console.log(`Documents to process: ${documents.length}`);
  for (const doc of documents) {
    const text = [doc.title, doc.description].filter(Boolean).join(" ");
    const embedding = await generateEmbedding(text);
    await db.update(documentsTable).set({ embedding }).where(eq(documentsTable.id, doc.id));
    process.stdout.write(".");
  }
  if (documents.length > 0) console.log(" Done!");
  console.log("");

  // Quizzes
  const quizzes = await db
    .select({ id: quizzesTable.id, title: quizzesTable.title, description: quizzesTable.description })
    .from(quizzesTable)
    .where(isNull(quizzesTable.embedding));

  console.log(`Quizzes to process: ${quizzes.length}`);
  for (const quiz of quizzes) {
    const text = [quiz.title, quiz.description].filter(Boolean).join(" ");
    const embedding = await generateEmbedding(text);
    await db.update(quizzesTable).set({ embedding }).where(eq(quizzesTable.id, quiz.id));
    process.stdout.write(".");
  }
  if (quizzes.length > 0) console.log(" Done!");
  console.log("");

  console.log("All embeddings regenerated!");
  process.exit(0);
}

regenerateEmbeddings().catch((err) => {
  console.error("Error regenerating embeddings:", err);
  process.exit(1);
});
