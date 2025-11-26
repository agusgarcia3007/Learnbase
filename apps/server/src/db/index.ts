import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";
import { env } from "../lib/env";

const client = new SQL(env.DATABASE_URL);
export const db = drizzle({ client });
