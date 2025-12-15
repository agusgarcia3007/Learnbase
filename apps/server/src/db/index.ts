import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";
import { env } from "@/lib/env";
import * as schema from "./schema";

const client = new SQL(env.DATABASE_URL, {
  max: 20,
  idleTimeout: 30,
  connectionTimeout: 10,
});
export const db = drizzle({ client, schema });
