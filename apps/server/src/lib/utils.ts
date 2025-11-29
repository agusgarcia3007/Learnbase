import { Resend } from "resend";
import { env } from "./env";
import { SITE_DATA } from "./constants";
import { logger } from "./logger";

export function parseDuration(durationMs: number) {
  if (isNaN(durationMs)) return null;
  if (durationMs >= 1000) {
    return `${(durationMs / 1000).toFixed(2)}s`;
  } else if (durationMs >= 1) {
    return `${durationMs.toFixed(2)}ms`;
  } else {
    return `${(durationMs * 1000).toFixed(2)}µs`;
  }
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = new Resend(env.RESEND_API_KEY!);
  const { data, error } = await resend.emails.send({
    from: `${SITE_DATA.NAME} <${SITE_DATA.EMAIL}>`,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error("Error sending email", { error: error.message });
  }
  return data;
}
