import { Elysia, t } from "elysia";
import { db } from "@/db";
import { waitlistTable } from "@/db/schema";
import { getWaitlistConfirmationEmailHtml } from "@/lib/email-templates";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/utils";

export const waitlistRoutes = new Elysia({ name: "waitlist" }).post(
  "/",
  async (ctx) => {
    const [entry] = await db
      .insert(waitlistTable)
      .values({ email: ctx.body.email })
      .onConflictDoNothing({ target: waitlistTable.email })
      .returning();

    if (entry) {
      try {
        await sendEmail({
          to: ctx.body.email,
          subject: "You're on the Learnbase waitlist!",
          html: getWaitlistConfirmationEmailHtml(),
        });
      } catch (error) {
        logger.error("Failed to send waitlist confirmation email", {
          email: ctx.body.email,
          error,
        });
      }
    }

    return { success: true, isNew: !!entry };
  },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
    }),
    detail: {
      tags: ["Waitlist"],
      summary: "Join the waitlist",
    },
  }
);
