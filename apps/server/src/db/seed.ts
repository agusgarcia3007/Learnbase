import { db } from "./index"
import { usersTable } from "./schema"
import { eq } from "drizzle-orm"

const SUPERADMIN_EMAIL = Bun.env.SUPERADMIN_EMAIL
const SUPERADMIN_PASSWORD = Bun.env.SUPERADMIN_PASSWORD

async function seed() {
  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    console.error("Missing SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD in .env")
    process.exit(1)
  }

  // Check if superadmin already exists
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, SUPERADMIN_EMAIL))
    .limit(1)

  if (existing.length > 0) {
    console.log("Superadmin already exists:", SUPERADMIN_EMAIL)
    process.exit(0)
  }

  // Hash password with Bun native function
  const hashedPassword = await Bun.password.hash(SUPERADMIN_PASSWORD)

  // Create superadmin (tenantId is null for global access)
  const [superadmin] = await db
    .insert(usersTable)
    .values({
      email: SUPERADMIN_EMAIL,
      password: hashedPassword,
      name: "Super Admin",
      role: "superadmin",
      tenantId: null,
    })
    .returning()

  console.log("Superadmin created:", superadmin.email)
}

seed().catch(console.error)
