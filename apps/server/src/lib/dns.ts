import { promises as dns } from "node:dns";
import { env } from "./env";

export async function verifyCnamePointsToUs(hostname: string): Promise<{
  valid: boolean;
  target: string | null;
}> {
  try {
    const records = await dns.resolveCname(hostname);
    const target = records[0]?.toLowerCase() || null;
    const valid = target === env.BASE_DOMAIN.toLowerCase();
    return { valid, target };
  } catch {
    return { valid: false, target: null };
  }
}
