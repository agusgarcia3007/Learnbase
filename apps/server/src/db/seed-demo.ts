import { db } from "./index"
import { tenantsTable, usersTable, categoriesTable, coursesTable, courseCategoriesTable, modulesTable, courseModulesTable } from "./schema"
import { eq } from "drizzle-orm"
import { s3 } from "../lib/s3"

const DEMO_TENANT_SLUG = "demo"
const DEMO_TENANT_NAME = "Marketing Academy"
const DEMO_OWNER_EMAIL = "demo@learnbase.io"
const DEMO_OWNER_PASSWORD = "demo123456"

const TENANT_CONFIG = {
  theme: "ocean" as const,
  mode: "auto" as const,
  description: "La academia online de marketing y negocios más completa de habla hispana. Aprende de expertos y transforma tu carrera.",
  heroTitle: "Domina el Marketing Digital",
  heroSubtitle: "Cursos prácticos creados por expertos de la industria. Aprende a tu ritmo y obtén certificaciones reconocidas.",
  heroCta: "Explorar Cursos",
  footerText: "Marketing Academy - Transformando profesionales desde 2024",
  contactEmail: "hola@marketingacademy.io",
  contactPhone: "+1 (555) 123-4567",
  seoTitle: "Marketing Academy | Cursos de Marketing Digital Online",
  seoDescription: "Aprende marketing digital, ventas, copywriting y growth hacking con cursos online prácticos. Certificaciones reconocidas y acceso de por vida.",
  seoKeywords: "marketing digital, cursos online, copywriting, growth hacking, ventas b2b, redes sociales",
  socialLinks: {
    twitter: "https://twitter.com/marketingacademy",
    instagram: "https://instagram.com/marketingacademy",
    linkedin: "https://linkedin.com/company/marketingacademy",
    youtube: "https://youtube.com/@marketingacademy",
  },
}

const LOGO_URL = "https://ui-avatars.com/api/?name=Marketing+Academy&size=512&background=0ea5e9&color=fff&bold=true&format=png"

const UNSPLASH_IMAGES = {
  marketing: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop",
  social: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=675&fit=crop",
  copywriting: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=675&fit=crop",
  sales: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&h=675&fit=crop",
  growth: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200&h=675&fit=crop",
  email: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=1200&h=675&fit=crop",
}

const CATEGORIES = [
  { name: "Marketing Digital", slug: "marketing-digital", description: "Estrategias y tácticas de marketing online" },
  { name: "Ventas", slug: "ventas", description: "Técnicas de venta y negociación" },
  { name: "Comunicación", slug: "comunicacion", description: "Copywriting, storytelling y comunicación efectiva" },
  { name: "Crecimiento", slug: "crecimiento", description: "Growth hacking y estrategias de escalamiento" },
]

const COURSES = [
  {
    title: "Marketing Digital: De Cero a Experto",
    slug: "marketing-digital-cero-experto",
    description: "Domina las estrategias de marketing digital más efectivas del mercado. Aprende SEO, SEM, analytics y automatización para llevar cualquier negocio al siguiente nivel.",
    shortDescription: "Aprende a crear campañas de marketing digital que conviertan y escalen tu negocio.",
    price: 9900,
    originalPrice: 14900,
    level: "beginner" as const,
    imageKey: "marketing",
    categorySlug: "marketing-digital",
    tags: ["SEO", "SEM", "Analytics", "Automatización"],
    features: ["Acceso de por vida", "Certificado digital", "Comunidad privada", "Actualizaciones gratuitas"],
    requirements: ["Computadora con internet", "Cuenta de Google"],
    objectives: ["Crear campañas publicitarias efectivas", "Analizar métricas y KPIs", "Automatizar procesos de marketing", "Optimizar para buscadores"],
    modules: [
      { title: "Fundamentos del Marketing Digital", description: "Conceptos básicos y ecosistema digital" },
      { title: "SEO y Posicionamiento Orgánico", description: "Optimización para motores de búsqueda" },
      { title: "Publicidad Pagada (SEM)", description: "Google Ads y Meta Ads" },
      { title: "Email Marketing y Automatización", description: "Nurturing y conversión" },
      { title: "Analytics y Métricas", description: "Medición y optimización de resultados" },
    ],
  },
  {
    title: "Redes Sociales para Negocios",
    slug: "redes-sociales-negocios",
    description: "Construye una presencia sólida en redes sociales que genere engagement y ventas. Estrategias probadas para Instagram, TikTok, LinkedIn y más.",
    shortDescription: "Transforma tus redes sociales en máquinas de generar leads y ventas.",
    price: 7900,
    originalPrice: 12900,
    level: "beginner" as const,
    imageKey: "social",
    categorySlug: "marketing-digital",
    tags: ["Instagram", "TikTok", "LinkedIn", "Content"],
    features: ["Templates de contenido", "Calendario editorial", "Casos de estudio", "Soporte en vivo"],
    requirements: ["Cuenta en al menos una red social", "Smartphone o cámara"],
    objectives: ["Crear contenido que viralice", "Construir una comunidad engaged", "Monetizar audiencias", "Gestionar crisis de reputación"],
    modules: [
      { title: "Estrategia de Contenidos", description: "Planificación y calendario editorial" },
      { title: "Instagram y Stories", description: "Domina el algoritmo de Instagram" },
      { title: "TikTok para Marcas", description: "Contenido viral y tendencias" },
      { title: "LinkedIn B2B", description: "Generación de leads profesionales" },
      { title: "Métricas y Reportes", description: "Análisis de performance" },
    ],
  },
  {
    title: "Copywriting Persuasivo",
    slug: "copywriting-persuasivo",
    description: "El arte de escribir textos que venden. Aprende las técnicas de los mejores copywriters del mundo para crear mensajes irresistibles.",
    shortDescription: "Escribe textos que conviertan visitantes en clientes fieles.",
    price: 8900,
    originalPrice: 13900,
    level: "intermediate" as const,
    imageKey: "copywriting",
    categorySlug: "comunicacion",
    tags: ["Copywriting", "Persuasión", "Ventas", "Storytelling"],
    features: ["Swipe files de alto rendimiento", "Ejercicios prácticos", "Feedback personalizado", "Plantillas listas para usar"],
    requirements: ["Dominio básico del español escrito", "Disposición a practicar"],
    objectives: ["Escribir headlines magnéticos", "Crear páginas de venta efectivas", "Dominar emails de conversión", "Aplicar gatillos mentales"],
    modules: [
      { title: "Psicología de la Persuasión", description: "Los principios que mueven a la acción" },
      { title: "Headlines y Ganchos", description: "Captura la atención en segundos" },
      { title: "Páginas de Venta", description: "Estructura y elementos clave" },
      { title: "Email Copywriting", description: "Secuencias que convierten" },
      { title: "Storytelling Comercial", description: "Historias que venden" },
    ],
  },
  {
    title: "Ventas B2B: Cierra Grandes Cuentas",
    slug: "ventas-b2b-grandes-cuentas",
    description: "Metodología completa para vender a empresas. Desde la prospección hasta el cierre, domina el ciclo de ventas corporativas.",
    shortDescription: "Aprende a vender soluciones de alto valor a empresas y corporaciones.",
    price: 14900,
    originalPrice: 24900,
    level: "advanced" as const,
    imageKey: "sales",
    categorySlug: "ventas",
    tags: ["B2B", "Enterprise", "Negociación", "CRM"],
    features: ["Scripts de llamadas", "Templates de propuestas", "Acceso a CRM demo", "Mentoría grupal"],
    requirements: ["Experiencia básica en ventas", "Producto o servicio B2B"],
    objectives: ["Identificar y cualificar prospectos", "Conducir reuniones de descubrimiento", "Presentar propuestas ganadoras", "Negociar y cerrar contratos"],
    modules: [
      { title: "Prospección Estratégica", description: "Encuentra a tus clientes ideales" },
      { title: "Discovery y Diagnóstico", description: "Entiende las necesidades del cliente" },
      { title: "Presentación de Soluciones", description: "Comunica valor, no características" },
      { title: "Manejo de Objeciones", description: "Convierte dudas en oportunidades" },
      { title: "Cierre y Negociación", description: "Técnicas para cerrar sin presionar" },
    ],
  },
  {
    title: "Growth Hacking: Crece Rápido",
    slug: "growth-hacking-crece-rapido",
    description: "Las tácticas de crecimiento que usaron las startups más exitosas. Experimenta, mide y escala como un growth hacker profesional.",
    shortDescription: "Acelera el crecimiento de tu negocio con tácticas probadas de growth.",
    price: 11900,
    originalPrice: 19900,
    level: "intermediate" as const,
    imageKey: "growth",
    categorySlug: "crecimiento",
    tags: ["Growth", "Startups", "Experimentación", "Viral"],
    features: ["Framework de experimentación", "50+ tácticas documentadas", "Herramientas gratuitas", "Comunidad de growthers"],
    requirements: ["Producto o servicio en el mercado", "Mentalidad de experimentación"],
    objectives: ["Implementar loops de crecimiento", "Diseñar experimentos válidos", "Optimizar conversiones", "Escalar canales ganadores"],
    modules: [
      { title: "Mindset de Growth", description: "Pensamiento de crecimiento exponencial" },
      { title: "Pirate Metrics (AARRR)", description: "El framework del growth hacking" },
      { title: "Experimentación Rápida", description: "Diseño y ejecución de tests" },
      { title: "Canales de Adquisición", description: "Encuentra tu canal estrella" },
      { title: "Retención y Viralidad", description: "Haz que los usuarios vuelvan y traigan más" },
    ],
  },
  {
    title: "Email Marketing que Convierte",
    slug: "email-marketing-convierte",
    description: "Construye listas de email rentables y crea secuencias automatizadas que generan ventas mientras duermes.",
    shortDescription: "Domina el canal con mayor ROI del marketing digital.",
    price: 6900,
    originalPrice: 9900,
    level: "beginner" as const,
    imageKey: "email",
    categorySlug: "marketing-digital",
    tags: ["Email", "Automatización", "Nurturing", "Conversión"],
    features: ["30 templates de emails", "Secuencias automatizadas", "Casos de éxito", "Herramientas recomendadas"],
    requirements: ["Lista de contactos (o ganas de crearla)", "Cuenta en herramienta de email"],
    objectives: ["Construir listas de calidad", "Diseñar secuencias de nurturing", "Escribir emails que abran", "Automatizar el proceso de ventas"],
    modules: [
      { title: "Construcción de Listas", description: "Lead magnets y captación" },
      { title: "Segmentación Inteligente", description: "El mensaje correcto a la persona correcta" },
      { title: "Secuencias de Bienvenida", description: "Primera impresión ganadora" },
      { title: "Campañas de Venta", description: "Lanzamientos y promociones" },
      { title: "Automatización Avanzada", description: "Flujos que trabajan por ti" },
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
        language: "es",
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
