import { db } from "./index"
import { tenantsTable, usersTable, categoriesTable, coursesTable, courseCategoriesTable, modulesTable, courseModulesTable } from "./schema"
import { eq } from "drizzle-orm"
import { s3 } from "../lib/s3"

const DEMO_TENANT_SLUG = "demo"
const DEMO_TENANT_NAME = "Marketing Academy"
const DEMO_OWNER_EMAIL = "demo@learnbase.io"
const DEMO_OWNER_PASSWORD = "demo123456"

const THEME_COLORS = {
  default: "6366f1",
  slate: "64748b",
  rose: "f43f5e",
  emerald: "10b981",
  tangerine: "f97316",
  ocean: "0ea5e9",
}

const TENANT_CONFIG = {
  theme: "ocean" as const,
  mode: "auto" as const,
  heroPattern: "dots" as const,
  coursesPagePattern: "dots" as const,
  description: "The most comprehensive online marketing and business academy. Learn from experts and transform your career.",
  heroTitle: "Master Digital Marketing",
  heroSubtitle: "Practical courses created by industry experts. Learn at your own pace and earn recognized certifications.",
  heroCta: "Explore Courses",
  footerText: "Marketing Academy - Transforming professionals since 2024",
  contactEmail: "hello@marketingacademy.io",
  contactPhone: "+1 (555) 123-4567",
  seoTitle: "Marketing Academy | Online Digital Marketing Courses",
  seoDescription: "Learn digital marketing, sales, copywriting and growth hacking with practical online courses. Recognized certifications and lifetime access.",
  seoKeywords: "digital marketing, online courses, copywriting, growth hacking, b2b sales, social media",
  socialLinks: {
    twitter: "https://twitter.com/marketingacademy",
    instagram: "https://instagram.com/marketingacademy",
    linkedin: "https://linkedin.com/company/marketingacademy",
    youtube: "https://youtube.com/@marketingacademy",
  },
}

const LOGO_URL = `https://ui-avatars.com/api/?name=Marketing+Academy&size=512&background=${THEME_COLORS[TENANT_CONFIG.theme]}&color=fff&bold=true&format=png`

const UNSPLASH_IMAGES = {
  marketing: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop",
  social: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=675&fit=crop",
  copywriting: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=675&fit=crop",
  sales: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&h=675&fit=crop",
  growth: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200&h=675&fit=crop",
  email: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=1200&h=675&fit=crop",
}

const CATEGORIES = [
  { name: "Digital Marketing", slug: "digital-marketing", description: "Online marketing strategies and tactics" },
  { name: "Sales", slug: "sales", description: "Sales techniques and negotiation" },
  { name: "Communication", slug: "communication", description: "Copywriting, storytelling and effective communication" },
  { name: "Growth", slug: "growth", description: "Growth hacking and scaling strategies" },
]

const COURSES = [
  {
    title: "Digital Marketing: Zero to Expert",
    slug: "digital-marketing-zero-to-expert",
    description: "Master the most effective digital marketing strategies in the market. Learn SEO, SEM, analytics and automation to take any business to the next level.",
    shortDescription: "Learn to create digital marketing campaigns that convert and scale your business.",
    price: 9900,
    originalPrice: 14900,
    level: "beginner" as const,
    imageKey: "marketing",
    categorySlug: "digital-marketing",
    tags: ["SEO", "SEM", "Analytics", "Automation"],
    features: ["Lifetime access", "Digital certificate", "Private community", "Free updates"],
    requirements: ["Computer with internet", "Google account"],
    objectives: ["Create effective ad campaigns", "Analyze metrics and KPIs", "Automate marketing processes", "Optimize for search engines"],
    modules: [
      { title: "Digital Marketing Fundamentals", description: "Basic concepts and digital ecosystem" },
      { title: "SEO and Organic Positioning", description: "Search engine optimization" },
      { title: "Paid Advertising (SEM)", description: "Google Ads and Meta Ads" },
      { title: "Email Marketing and Automation", description: "Nurturing and conversion" },
      { title: "Analytics and Metrics", description: "Measuring and optimizing results" },
    ],
  },
  {
    title: "Social Media for Business",
    slug: "social-media-for-business",
    description: "Build a solid social media presence that generates engagement and sales. Proven strategies for Instagram, TikTok, LinkedIn and more.",
    shortDescription: "Transform your social media into lead and sales generating machines.",
    price: 7900,
    originalPrice: 12900,
    level: "beginner" as const,
    imageKey: "social",
    categorySlug: "digital-marketing",
    tags: ["Instagram", "TikTok", "LinkedIn", "Content"],
    features: ["Content templates", "Editorial calendar", "Case studies", "Live support"],
    requirements: ["Account on at least one social network", "Smartphone or camera"],
    objectives: ["Create viral content", "Build an engaged community", "Monetize audiences", "Manage reputation crises"],
    modules: [
      { title: "Content Strategy", description: "Planning and editorial calendar" },
      { title: "Instagram and Stories", description: "Master the Instagram algorithm" },
      { title: "TikTok for Brands", description: "Viral content and trends" },
      { title: "LinkedIn B2B", description: "Professional lead generation" },
      { title: "Metrics and Reports", description: "Performance analysis" },
    ],
  },
  {
    title: "Persuasive Copywriting",
    slug: "persuasive-copywriting",
    description: "The art of writing copy that sells. Learn techniques from the world's best copywriters to create irresistible messages.",
    shortDescription: "Write copy that converts visitors into loyal customers.",
    price: 8900,
    originalPrice: 13900,
    level: "intermediate" as const,
    imageKey: "copywriting",
    categorySlug: "communication",
    tags: ["Copywriting", "Persuasion", "Sales", "Storytelling"],
    features: ["High-performance swipe files", "Practical exercises", "Personalized feedback", "Ready-to-use templates"],
    requirements: ["Basic written English proficiency", "Willingness to practice"],
    objectives: ["Write magnetic headlines", "Create effective sales pages", "Master conversion emails", "Apply mental triggers"],
    modules: [
      { title: "Psychology of Persuasion", description: "Principles that drive action" },
      { title: "Headlines and Hooks", description: "Capture attention in seconds" },
      { title: "Sales Pages", description: "Structure and key elements" },
      { title: "Email Copywriting", description: "Sequences that convert" },
      { title: "Commercial Storytelling", description: "Stories that sell" },
    ],
  },
  {
    title: "B2B Sales: Close Big Accounts",
    slug: "b2b-sales-close-big-accounts",
    description: "Complete methodology for selling to businesses. From prospecting to closing, master the corporate sales cycle.",
    shortDescription: "Learn to sell high-value solutions to companies and corporations.",
    price: 14900,
    originalPrice: 24900,
    level: "advanced" as const,
    imageKey: "sales",
    categorySlug: "sales",
    tags: ["B2B", "Enterprise", "Negotiation", "CRM"],
    features: ["Call scripts", "Proposal templates", "CRM demo access", "Group mentoring"],
    requirements: ["Basic sales experience", "B2B product or service"],
    objectives: ["Identify and qualify prospects", "Conduct discovery meetings", "Present winning proposals", "Negotiate and close contracts"],
    modules: [
      { title: "Strategic Prospecting", description: "Find your ideal customers" },
      { title: "Discovery and Diagnosis", description: "Understand customer needs" },
      { title: "Solution Presentation", description: "Communicate value, not features" },
      { title: "Objection Handling", description: "Turn doubts into opportunities" },
      { title: "Closing and Negotiation", description: "Techniques to close without pressure" },
    ],
  },
  {
    title: "Growth Hacking: Scale Fast",
    slug: "growth-hacking-scale-fast",
    description: "The growth tactics used by the most successful startups. Experiment, measure and scale like a professional growth hacker.",
    shortDescription: "Accelerate your business growth with proven growth tactics.",
    price: 11900,
    originalPrice: 19900,
    level: "intermediate" as const,
    imageKey: "growth",
    categorySlug: "growth",
    tags: ["Growth", "Startups", "Experimentation", "Viral"],
    features: ["Experimentation framework", "50+ documented tactics", "Free tools", "Growth community"],
    requirements: ["Product or service in the market", "Experimentation mindset"],
    objectives: ["Implement growth loops", "Design valid experiments", "Optimize conversions", "Scale winning channels"],
    modules: [
      { title: "Growth Mindset", description: "Exponential growth thinking" },
      { title: "Pirate Metrics (AARRR)", description: "The growth hacking framework" },
      { title: "Rapid Experimentation", description: "Test design and execution" },
      { title: "Acquisition Channels", description: "Find your star channel" },
      { title: "Retention and Virality", description: "Make users return and bring more" },
    ],
  },
  {
    title: "Email Marketing that Converts",
    slug: "email-marketing-that-converts",
    description: "Build profitable email lists and create automated sequences that generate sales while you sleep.",
    shortDescription: "Master the channel with the highest ROI in digital marketing.",
    price: 6900,
    originalPrice: 9900,
    level: "beginner" as const,
    imageKey: "email",
    categorySlug: "digital-marketing",
    tags: ["Email", "Automation", "Nurturing", "Conversion"],
    features: ["30 email templates", "Automated sequences", "Success stories", "Recommended tools"],
    requirements: ["Contact list (or desire to create one)", "Email tool account"],
    objectives: ["Build quality lists", "Design nurturing sequences", "Write emails that get opened", "Automate the sales process"],
    modules: [
      { title: "List Building", description: "Lead magnets and capture" },
      { title: "Smart Segmentation", description: "The right message to the right person" },
      { title: "Welcome Sequences", description: "Winning first impression" },
      { title: "Sales Campaigns", description: "Launches and promotions" },
      { title: "Advanced Automation", description: "Flows that work for you" },
    ],
  },
]

async function downloadAndUploadImage(url: string, folder: string, userId: string): Promise<string> {
  console.log(`  Downloading image from ${url.substring(0, 50)}...`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const contentType = response.headers.get("content-type") || "image/jpeg"
  const extension = contentType.split("/")[1] || "jpg"
  const timestamp = Date.now()
  const key = `${folder}/${userId}/${timestamp}.${extension}`

  await s3.write(key, Buffer.from(arrayBuffer), { type: contentType })
  console.log(`  Uploaded to S3: ${key}`)

  return key
}

async function seedDemo() {
  console.log("Starting demo seed...")
  console.log("")

  const existingTenant = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.slug, DEMO_TENANT_SLUG))
    .limit(1)

  let tenant = existingTenant[0]

  console.log("Uploading logo...")
  const logoKey = await downloadAndUploadImage(LOGO_URL, "tenants", "system")
  console.log(`  Logo uploaded: ${logoKey}`)

  if (tenant) {
    console.log(`Tenant "${DEMO_TENANT_SLUG}" already exists, updating config...`);
    [tenant] = await db
      .update(tenantsTable)
      .set({
        name: DEMO_TENANT_NAME,
        logo: logoKey,
        ...TENANT_CONFIG,
      })
      .where(eq(tenantsTable.slug, DEMO_TENANT_SLUG))
      .returning()
    console.log(`Updated tenant: ${tenant.name}`)
  } else {
    console.log(`Creating tenant "${DEMO_TENANT_SLUG}"...`);
    [tenant] = await db
      .insert(tenantsTable)
      .values({
        slug: DEMO_TENANT_SLUG,
        name: DEMO_TENANT_NAME,
        status: "active",
        logo: logoKey,
        ...TENANT_CONFIG,
      })
      .returning()
    console.log(`Created tenant: ${tenant.name} (${tenant.id})`)
  }

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_OWNER_EMAIL))
    .limit(1)

  let owner = existingUser[0]

  if (owner) {
    console.log(`Owner "${DEMO_OWNER_EMAIL}" already exists`)
  } else {
    console.log(`Creating owner user...`)
    const hashedPassword = await Bun.password.hash(DEMO_OWNER_PASSWORD);
    [owner] = await db
      .insert(usersTable)
      .values({
        email: DEMO_OWNER_EMAIL,
        password: hashedPassword,
        name: "Demo Owner",
        role: "owner",
        tenantId: tenant.id,
      })
      .returning()
    console.log(`Created owner: ${owner.email} (${owner.id})`)
  }

  console.log("")
  console.log("Creating categories...")

  const categoryMap = new Map<string, string>()

  for (const cat of CATEGORIES) {
    const existing = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, cat.slug))
      .limit(1)

    if (existing[0]) {
      console.log(`  Category "${cat.name}" already exists`)
      categoryMap.set(cat.slug, existing[0].id)
    } else {
      const [category] = await db
        .insert(categoriesTable)
        .values({
          tenantId: tenant.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
        })
        .returning()
      console.log(`  Created category: ${category.name}`)
      categoryMap.set(cat.slug, category.id)
    }
  }

  console.log("")
  console.log("Creating courses with images...")

  for (const courseData of COURSES) {
    const existing = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.slug, courseData.slug))
      .limit(1)

    if (existing[0]) {
      console.log(`Course "${courseData.title}" already exists, skipping...`)
      continue
    }

    console.log(`Creating course: ${courseData.title}`)

    const thumbnailKey = await downloadAndUploadImage(
      UNSPLASH_IMAGES[courseData.imageKey as keyof typeof UNSPLASH_IMAGES],
      "courses",
      owner.id
    )

    const [course] = await db
      .insert(coursesTable)
      .values({
        tenantId: tenant.id,
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        shortDescription: courseData.shortDescription,
        thumbnail: thumbnailKey,
        price: courseData.price,
        originalPrice: courseData.originalPrice,
        level: courseData.level,
        language: "en",
        status: "published",
        tags: courseData.tags,
        features: courseData.features,
        requirements: courseData.requirements,
        objectives: courseData.objectives,
        includeCertificate: true,
      })
      .returning()

    const categoryId = categoryMap.get(courseData.categorySlug)
    if (categoryId) {
      await db.insert(courseCategoriesTable).values({
        courseId: course.id,
        categoryId: categoryId,
      })
    }

    console.log(`  Creating ${courseData.modules.length} modules...`)

    for (let i = 0; i < courseData.modules.length; i++) {
      const moduleData = courseData.modules[i]

      const [module] = await db
        .insert(modulesTable)
        .values({
          tenantId: tenant.id,
          title: moduleData.title,
          description: moduleData.description,
          status: "published",
          order: i,
        })
        .returning()

      await db.insert(courseModulesTable).values({
        courseId: course.id,
        moduleId: module.id,
        order: i,
      })
    }

    console.log(`  Course "${courseData.title}" created successfully`)
    console.log("")
  }

  console.log("")
  console.log("Demo seed completed!")
  console.log("")
  console.log("Access the demo tenant:")
  console.log(`  Subdomain: ${DEMO_TENANT_SLUG}.yourdomain.com`)
  console.log(`  Email: ${DEMO_OWNER_EMAIL}`)
  console.log(`  Password: ${DEMO_OWNER_PASSWORD}`)
}

seedDemo().catch(console.error)
