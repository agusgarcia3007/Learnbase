# LEARNBASE - Documentacion Completa

## 1. Que es Learnbase?

**Learnbase** es una plataforma Learning Management System (LMS) multi-tenant que permite a organizaciones crear, gestionar y entregar cursos online. Es una solucion SaaS white-label donde cada organizacion obtiene su propio campus con dominios personalizados, temas y configuraciones.

### Proposito
- Permitir a organizaciones lanzar sus propias plataformas de aprendizaje online
- Proveer un sistema completo de creacion y entrega de cursos
- Soportar arquitectura multi-tenant con datos aislados por organizacion
- Ofrecer funcionalidades potenciadas por IA para creacion de contenido y asistencia al aprendizaje

### Usuarios Objetivo
- **Superadmins**: Administradores de la plataforma gestionando todos los tenants
- **Owners**: Fundadores de organizaciones creando su instancia de LMS
- **Admins**: Gestores de la organizacion manejando operaciones diarias
- **Students**: Usuarios finales consumiendo contenido de cursos

---

## 2. Todas las Features y Modulos

### Sistema Multi-Tenant

Cada organizacion (tenant) esta aislada con:
- **Subdominio personalizado** (`tenant.uselearnbase.com`)
- **Dominio personalizado opcional** (`courses.company.com`)
- **Branding** (logo, favicon, colores, fuentes)
- **Usuarios, cursos y contenido aislados**

Ruteo basado en subdominios con resolucion automatica de tenant y soporte de dominios personalizados via Cloudflare + Railway.

### Gestion de Cursos

#### Course Builder
- Titulo, descripcion, thumbnail, video preview
- Precios (soporta multiples monedas)
- Niveles de dificultad (beginner, intermediate, advanced)
- Categorias y tags
- Features, requisitos, objetivos del curso
- Soporte de certificados
- Estructura basada en modulos

#### Modulos
Agrupaciones logicas de items de contenido.

#### Tipos de Contenido
| Tipo | Descripcion |
|------|-------------|
| **Videos** | MP4/WebM/MOV con tracking de duracion, transcripciones |
| **Documents** | PDF, DOCX con extraccion de texto |
| **Quizzes** | Multiple choice, multiple select, true/false |

### Enrollment y Tracking de Progreso

- Sistema de enrollment en cursos
- Tracking de progreso por item (not_started, in_progress, completed)
- Guardado de posicion de reproduccion de video
- Porcentaje de progreso general del curso
- Deteccion automatica de completion
- Recomendaciones de cursos relacionados

### Certificados

- Auto-generados al completar el curso
- Certificados PDF con firmas personalizadas
- Codigo QR para verificacion
- Codigos de verificacion unicos
- Endpoint publico de verificacion
- Entrega por email
- Soporte de regeneracion

### Carrito de Compras

- Agregar/remover cursos
- Checkout/enrollment en lote
- Compra de multiples cursos

### Gestion de Usuarios

- Autenticacion email/password
- Verificacion de email para owners
- Flujo de password reset
- Sistema JWT + refresh token
- Control de acceso basado en roles (superadmin, owner, admin, student)
- Perfiles de usuario con avatars
- Preferencias de locale (en, es, pt)

### Gestion de Contenido

| Recurso | Descripcion |
|---------|-------------|
| **Categories** | Organizar cursos por tema |
| **Instructors** | Perfiles de autores con bio, avatar, social links |
| **Videos** | Upload, transcode, transcripcion IA |
| **Documents** | Upload, extraccion de texto para IA |
| **Quizzes** | Banco de preguntas con explicaciones |

### Personalizacion de Tenant

#### Branding
- Logo y favicon upload
- Theme presets (default, slate, rose, emerald, tangerine, ocean)
- Esquemas de color personalizados (light/dark mode)
- Fuentes personalizadas (heading y body)
- Patrones de fondo (grid, dots, waves)

#### Configuracion SEO
- Meta title, description, keywords
- Hero section (titulo, subtitulo, CTA)
- Footer text
- Social links (Twitter, Facebook, Instagram, LinkedIn, YouTube)

#### Settings
- Informacion de contacto (email, telefono, direccion)
- Firma de certificado y mensaje personalizado
- Configuracion del asistente IA
- Limites del tenant (max usuarios, cursos, storage)
- Feature flags (analytics, certificates, custom domain, AI analysis, white label)

### Features de IA (Groq, Claude, Gemini)

#### 1. Video Analysis
- Transcripcion automatica (Groq Whisper)
- Generacion de titulo y descripcion desde contenido
- Almacenamiento de transcript para busqueda

#### 2. Quiz Generation
- Generar preguntas desde transcripts de video o documentos
- Soporte de multiples tipos de preguntas
- Generacion automatica de opciones con respuestas correctas
- Evita preguntas duplicadas

#### 3. Course Generation
- Analizar contenido de modulos para crear metadata del curso
- Auto-generar imagenes thumbnail (Gemini)
- Resumen inteligente de contenido

#### 4. Theme Generation
- Creacion de esquemas de color potenciada por IA
- Sugerencias de tema alineadas con la marca

#### 5. Learning Assistant (Chat)
- Chatbot context-aware para estudiantes enrolled
- Acceso a contenido del curso, transcripts y preguntas de quiz
- Soporte multi-modal (texto, imagenes, archivos)
- Awareness de timestamps de video
- Tool use para semantic search en materiales del curso
- Configurable por tenant (nombre, tono, idioma, prompt personalizado)

#### 6. Creator Assistant (Chat)
- Helper IA para creadores de contenido
- Asistencia en planificacion y estructuracion de cursos
- Sugerencias de mejora de contenido

### Backoffice (Superadmin)

- Gestion global de tenants
- Gestion de waitlist
- Vista general de enrollments de todos los tenants
- File browser para S3 storage
- Analytics y reportes

### Campus Publico (Student-Facing)

- Catalogo de cursos con filtrado (categoria, nivel, busqueda)
- Paginas de detalle de curso con modulos y contenido preview
- Flujo de enrollment
- Interfaz de aprendizaje con video player, document viewer, quiz taker
- Tracking de progreso y funcionalidad de resume
- Vista y compartir de certificados
- Sugerencias de cursos relacionados

### Internacionalizacion (i18n)

| Idioma | Codigo |
|--------|--------|
| English | `en` |
| Spanish | `es` |
| Portuguese | `pt` |

- Traduccion completa de UI
- Locale seleccionable por usuario
- Auto-detect de idioma del browser

---

## 3. Schema de Base de Datos y Entidades

### Tablas Principales

#### tenants
```
id, slug, name, logo, favicon, theme, mode, customDomain, customHostnameId,
railwayDomainId, description, contactEmail, contactPhone, contactAddress,
socialLinks (JSONB), seoTitle, seoDescription, seoKeywords, heroTitle,
heroSubtitle, heroCta, footerText, heroPattern, coursesPagePattern,
showHeaderName, customTheme (JSONB), certificateSettings (JSONB),
aiAssistantSettings (JSONB), maxUsers, maxCourses, maxStorageBytes,
features (JSONB), status, createdAt, updatedAt
```

#### users
```
id, email, password, name, avatar, locale, role, tenantId, emailVerified,
emailVerificationToken, emailVerificationTokenExpiresAt, createdAt, updatedAt
```

#### refresh_tokens
```
id, token, userId, expiresAt, createdAt
```

#### categories
```
id, tenantId, name, slug, description, order, createdAt, updatedAt
```

#### instructors
```
id, tenantId, name, avatar, bio, title, email, website, socialLinks (JSONB),
order, createdAt, updatedAt
```

#### courses
```
id, tenantId, instructorId, categoryId, slug, title, description,
shortDescription, thumbnail, previewVideoUrl, price, originalPrice, currency,
level, tags (array), language, status, order, features (array),
requirements (array), objectives (array), includeCertificate, createdAt, updatedAt
```

#### modules
```
id, tenantId, title, description, status, order, embedding (vector 384),
createdAt, updatedAt
```

#### videos
```
id, tenantId, title, description, videoKey, duration, transcript, status,
embedding (vector 384), createdAt, updatedAt
```

#### documents
```
id, tenantId, title, description, fileKey, fileName, fileSize, mimeType,
status, embedding (vector 384), createdAt, updatedAt
```

#### quizzes
```
id, tenantId, title, description, status, embedding (vector 384),
createdAt, updatedAt
```

#### quiz_questions
```
id, quizId, tenantId, type, questionText, explanation, order, createdAt, updatedAt
```

#### quiz_options
```
id, questionId, optionText, isCorrect, order, createdAt
```

#### module_items
```
id, moduleId, contentType, contentId, order, isPreview, createdAt
```

#### course_modules
```
id, courseId, moduleId, order, createdAt
```

#### course_categories
```
id, courseId, categoryId, createdAt
```

#### enrollments
```
id, userId, courseId, tenantId, status, progress, completedAt, createdAt, updatedAt
```

#### item_progress
```
id, enrollmentId, moduleItemId, status, videoProgress, completedAt, createdAt, updatedAt
```

#### cart_items
```
id, userId, tenantId, courseId, createdAt
```

#### certificates
```
id, enrollmentId, tenantId, userId, courseId, verificationCode, imageKey,
userName, courseName, issuedAt, createdAt, regenerationCount, lastRegeneratedAt
```

#### waitlist
```
id, email, createdAt
```

---

## 4. API Routes y Endpoints

### Autenticacion `/auth`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/signup` | Registrar nuevo usuario |
| POST | `/login` | Login con email/password |
| POST | `/refresh` | Refresh access token |
| POST | `/forgot-password` | Solicitar password reset |
| POST | `/reset-password` | Resetear password con token |
| POST | `/logout` | Revocar refresh token |
| POST | `/verify-email` | Verificar email con token |
| POST | `/resend-verification` | Reenviar email de verificacion |

### Tenants `/tenants`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/` | Crear tenant |
| GET | `/` | Listar tenants |
| GET | `/by-slug/:slug` | Obtener tenant por slug |
| GET | `/:id/stats` | Stats del dashboard |
| GET | `/:id/onboarding` | Estado del onboarding |
| GET | `/:id/stats/trends` | Tendencias enrollment/completion |
| GET | `/:id/stats/top-courses` | Top cursos por enrollment |
| GET | `/:id/stats/activity` | Feed de actividad reciente |
| PUT | `/:id` | Actualizar tenant settings |
| DELETE | `/:id` | Eliminar tenant |
| POST | `/:id/logo` | Upload logo/favicon |
| DELETE | `/:id/logo` | Remover logo/favicon |
| POST | `/:id/certificate-signature` | Upload firma de certificado |
| DELETE | `/:id/certificate-signature` | Remover firma |
| PUT | `/:id/domain` | Configurar custom domain |
| GET | `/:id/domain/verify` | Verificar configuracion DNS |
| DELETE | `/:id/domain` | Remover custom domain |

### Usuarios `/users`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar usuarios |
| GET | `/:id` | Obtener usuario por ID |
| POST | `/` | Crear usuario |
| PUT | `/:id` | Actualizar usuario |
| DELETE | `/:id` | Eliminar usuario |
| POST | `/:id/avatar` | Upload avatar |
| DELETE | `/:id/avatar` | Remover avatar |

### Perfil `/profile`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Obtener perfil actual |
| PUT | `/` | Actualizar perfil |
| POST | `/avatar` | Upload avatar |
| DELETE | `/avatar` | Remover avatar |

### Cursos `/courses`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar cursos |
| GET | `/:id` | Obtener curso con modulos |
| POST | `/` | Crear curso |
| PUT | `/:id` | Actualizar curso |
| DELETE | `/:id` | Eliminar curso |
| PUT | `/:id/modules` | Batch update modulos |
| POST | `/:id/thumbnail` | Upload thumbnail |
| DELETE | `/:id/thumbnail` | Remover thumbnail |
| POST | `/:id/video` | Upload preview video |
| DELETE | `/:id/video` | Remover preview video |

### Categorias `/categories`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar categorias |
| GET | `/:id` | Obtener categoria |
| POST | `/` | Crear categoria |
| PUT | `/:id` | Actualizar categoria |
| DELETE | `/:id` | Eliminar categoria |

### Instructores `/instructors`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar instructores |
| GET | `/:id` | Obtener instructor |
| POST | `/` | Crear instructor |
| PUT | `/:id` | Actualizar instructor |
| DELETE | `/:id` | Eliminar instructor |
| POST | `/:id/avatar` | Upload avatar |
| DELETE | `/:id/avatar` | Remover avatar |

### Modulos `/modules`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar modulos |
| GET | `/:id` | Obtener modulo con items |
| POST | `/` | Crear modulo |
| PUT | `/:id` | Actualizar modulo |
| DELETE | `/:id` | Eliminar modulo |
| PUT | `/:id/items` | Batch update items |
| POST | `/:id/items` | Agregar item al modulo |
| DELETE | `/:id/items/:itemId` | Remover item del modulo |

### Videos `/videos`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar videos |
| GET | `/:id` | Obtener video |
| POST | `/` | Crear video |
| PUT | `/:id` | Actualizar video |
| DELETE | `/:id` | Eliminar video |
| POST | `/:id/upload` | Upload archivo de video |
| DELETE | `/:id/video` | Remover archivo de video |

### Documentos `/documents`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar documentos |
| GET | `/:id` | Obtener documento |
| POST | `/` | Crear documento |
| PUT | `/:id` | Actualizar documento |
| DELETE | `/:id` | Eliminar documento |
| POST | `/:id/upload` | Upload archivo |
| DELETE | `/:id/file` | Remover archivo |

### Quizzes `/quizzes`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar quizzes |
| GET | `/:id` | Obtener quiz con preguntas |
| POST | `/` | Crear quiz |
| PUT | `/:id` | Actualizar quiz |
| DELETE | `/:id` | Eliminar quiz |
| POST | `/:id/questions` | Agregar pregunta |
| PUT | `/:id/questions/:questionId` | Actualizar pregunta |
| DELETE | `/:id/questions/:questionId` | Eliminar pregunta |
| POST | `/:id/questions/:questionId/options` | Agregar opcion |
| PUT | `/:id/questions/:questionId/options/:optionId` | Actualizar opcion |
| DELETE | `/:id/questions/:questionId/options/:optionId` | Eliminar opcion |

### Enrollments `/enrollments`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar enrollments del usuario |
| POST | `/` | Enrollar en curso |
| GET | `/:courseId` | Verificar estado de enrollment |
| POST | `/batch` | Batch enroll (desde carrito) |
| DELETE | `/:courseId` | Desenrollar |

### Admin Enrollments `/admin-enrollments`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar todos los enrollments |
| POST | `/` | Enrollar usuario manualmente |
| DELETE | `/:id` | Remover enrollment |

### Carrito `/cart`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Obtener items del carrito |
| POST | `/` | Agregar al carrito |
| DELETE | `/:courseId` | Remover del carrito |

### Learning `/learn`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/courses/:courseSlug/structure` | Estructura del curso con progreso |
| GET | `/courses/:courseSlug/progress` | Progreso detallado por modulo |
| GET | `/modules/:moduleId/items` | Items del modulo con progreso |
| GET | `/items/:moduleItemId/content` | Obtener contenido del item |
| PATCH | `/items/:moduleItemId/progress` | Actualizar progreso |
| POST | `/items/:moduleItemId/complete` | Marcar item completo |
| POST | `/items/:moduleItemId/toggle-complete` | Toggle completion |
| GET | `/courses/:courseSlug/related` | Cursos relacionados |

### Certificados `/certificates`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/` | Listar certificados del usuario |
| GET | `/:enrollmentId` | Obtener certificado por enrollment |
| POST | `/:enrollmentId/send` | Enviar certificado por email |
| POST | `/:enrollmentId/regenerate` | Regenerar certificado PDF |
| POST | `/preview` | Generar preview |

### Campus `/campus`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/resolve?hostname=...` | Resolver tenant por custom domain |
| GET | `/tenant` | Obtener info del tenant actual |
| GET | `/courses` | Listar cursos publicados |
| GET | `/courses/:slug` | Obtener detalle del curso |
| GET | `/categories` | Listar categorias con count |
| GET | `/instructors` | Listar instructores |

### SEO `/seo`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/sitemap.xml` | Generar sitemap |
| GET | `/robots.txt` | Archivo robots |

### AI `/ai`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/videos/analyze` | Transcribir video + generar titulo/descripcion |
| POST | `/quizzes/:quizId/generate` | Generar preguntas de quiz |
| POST | `/courses/generate` | Generar metadata de curso + thumbnail |
| POST | `/themes/generate` | Generar esquema de colores |
| POST | `/creator/chat` | Asistente de creador (streaming) |
| POST | `/learn/chat` | Asistente de aprendizaje (streaming) |

### Waitlist `/waitlist`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/` | Agregar email a waitlist |
| GET | `/` | Listar waitlist |
| DELETE | `/:id` | Remover de waitlist |

### Backoffice `/backoffice`
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/files` | Navegar archivos S3 |
| POST | `/files/upload` | Upload manual de archivo |
| DELETE | `/files` | Eliminar archivo S3 |

---

## 5. Paginas y Componentes del Frontend

### Rutas Publicas
| Ruta | Descripcion |
|------|-------------|
| `/` | Landing page (waitlist) |
| `/:tenantSlug` | Campus home (catalogo de cursos) |
| `/:tenantSlug/courses` | Listado de cursos |
| `/:tenantSlug/courses/:courseSlug` | Detalle de curso |
| `/:tenantSlug/verify/:code` | Verificacion de certificado |

### Autenticacion (`__auth`)
| Ruta | Descripcion |
|------|-------------|
| `/login` | Pagina de login |
| `/signup` | Pagina de signup |
| `/forgot-password` | Solicitud de password reset |
| `/reset-password` | Formulario de password reset |
| `/verify-email` | Verificacion de email |

### Gestion de Tenant (`/:tenantSlug`)
| Ruta | Descripcion |
|------|-------------|
| `/` | Dashboard (stats, onboarding, actividad) |

#### Content Management (`/:tenantSlug/content`)
| Ruta | Descripcion |
|------|-------------|
| `/categories` | Gestion de categorias |
| `/instructors` | Gestion de instructores |
| `/courses` | Lista de cursos y builder |
| `/modules` | Gestion de modulos |
| `/videos` | Libreria de videos |
| `/documents` | Libreria de documentos |
| `/quizzes` | Builder de quizzes |
| `/quizzes/:quizId` | Editor de quiz |

#### Site Configuration (`/:tenantSlug/site`)
| Ruta | Descripcion |
|------|-------------|
| `/configuration` | Settings del tenant (nombre, contacto, SEO) |
| `/customization` | Branding (logo, tema, patrones) |
| `/ai` | Configuracion del asistente IA |

#### User Management (`/:tenantSlug/management`)
| Ruta | Descripcion |
|------|-------------|
| `/users` | Gestion de usuarios |
| `/enrollments` | Gestion de enrollments |

### Rutas de Estudiante
| Ruta | Descripcion |
|------|-------------|
| `/courses` | Mis enrollments |
| `/courses/:slug/learn` | Course player |
| `/certificates` | Mis certificados |

### Backoffice (Superadmin)
| Ruta | Descripcion |
|------|-------------|
| `/backoffice` | Dashboard |
| `/backoffice/tenants` | Gestion de tenants |
| `/backoffice/waitlist` | Waitlist |
| `/backoffice/enrollments` | Enrollments globales |
| `/backoffice/files` | File browser |

### Librerias de Componentes Clave

- **File Uploads**: `ImageUpload`, `VideoUpload`, `AvatarUpload` (patron dropzone, upload base64)
- **Data Tables**: Tablas sortables, filtrables con paginacion, bulk actions, export CSV/Excel
- **Forms**: React Hook Form + Zod validation + shadcn/ui components
- **Video Player**: Player personalizado con tracking de progreso, subtitulos
- **Document Viewer**: Visor PDF/DOCX
- **Quiz Taker**: UI interactiva de quiz con explicaciones
- **Certificate Viewer**: Preview PDF con download/share
- **Theme Switcher**: Preview de tema en tiempo real
- **AI Chat**: UI de chat streaming con attachments
- **Rich Text Editor**: Para descripciones de cursos

---

## 6. Sistema de Autenticacion y Autorizacion

### Flujo de Autenticacion

#### Signup
- App padre (sin tenant): Crea owner, envia email de verificacion
- App de tenant: Crea student, sin verificacion requerida
- Passwords hasheados con crypto nativo de Bun

#### Login
- Validacion email + password
- Retorna `accessToken` (JWT, 15min) + `refreshToken` (7 dias)
- Refresh token almacenado en database para revocacion

#### Token Refresh
- Cliente envia `refreshToken`
- Server valida desde DB + expiry
- Retorna nuevo `accessToken`

#### Email Verification (solo owners)
- Token enviado via email (24h expiry)
- Owners deben verificar para acceder a features

#### Password Reset
- Request envia email con reset token (1h expiry)
- Token validado en pagina de reset
- Password actualizado + todas las sesiones invalidadas

### Autorizacion (RBAC)

#### Roles

| Rol | Permisos |
|-----|----------|
| **Superadmin** | Acceso global a todos los tenants, CRUD de tenants, acceso backoffice |
| **Owner** | Acceso completo a su tenant, crear/gestionar contenido, cursos, usuarios, configuracion de tenant |
| **Admin** | Gestionar contenido y enrollments, no puede modificar settings de tenant |
| **Student** | Enrollar en cursos, trackear progreso, ver certificados, sin acceso administrativo |

### Features de Seguridad

- Configuracion CORS por ambiente
- Soporte de rotacion de JWT secret
- Revocacion de refresh token en logout
- Prevencion de enumeracion de email (password reset)
- Rate limiting (via elysia-rate-limit)
- Prevencion de SQL injection (queries parametrizadas)
- Prevencion de XSS (React escaping)
- Proteccion CSRF (SameSite cookies)

---

## 7. Arquitectura Multi-Tenant

### Estrategia de Aislamiento de Tenant

**Aislamiento a Nivel de Fila**:
- Cada recurso tiene foreign key `tenantId`
- Todas las queries filtradas por tenant
- Database enforza integridad referencial
- Superadmins bypasean filtro de tenant

**Flujo de Request**:
```
1. Request -> subdominio extraido (tenant1.uselearnbase.com)
2. tenantPlugin -> lookup tenant por slug/dominio
3. Set ctx.tenant para el request
4. Todas las queries auto-filtran por ctx.tenant.id
```

### Gestion de Dominios

**Subdominio** (default):
- `{slug}.uselearnbase.com` (o custom BASE_DOMAIN)
- SSL automatico via Railway

**Custom Domain**:
1. Owner configura en settings
2. Backend crea Cloudflare Custom Hostname
3. Backend agrega dominio a Railway service
4. Verificacion DNS requerida (CNAME a domains.uselearnbase.com)
5. Auto SSL provisioning
6. Frontend resuelve tenant via `/campus/resolve?hostname=...`

### Flujo de Creacion de Tenant

1. Owner se registra (sin tenant aun)
2. Verificacion de email requerida
3. Owner crea tenant con slug unico
4. Sistema linkea usuario a tenant
5. Tenant obtiene configuracion default
6. Onboarding checklist guia setup

### Limites de Tenant

Configurables por tenant:
- `maxUsers`: Cap de usuarios
- `maxCourses`: Cap de cursos
- `maxStorageBytes`: Limite de storage S3
- `features`: Feature flags (certificates, AI, custom domain, etc.)
- `status`: active/suspended/cancelled

---

## 8. Sistema de Upload/Storage de Archivos

### Storage Backend

- **Provider**: S3-compatible (AWS S3 o servicios compatibles)
- **Configuracion**:
  - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
  - `S3_BUCKET_NAME`, `S3_ENDPOINT_URL`, `S3_REGION`
  - Opcional `CDN_BASE_URL` para entrega mas rapida

### Patron de Upload

**Client-Side**:
1. Usuario selecciona archivo via dropzone (`useFileUpload` hook)
2. Archivo convertido a base64 (para archivos pequenos) o upload directo
3. Base64 enviado a endpoint de upload dedicado

**Server-Side**:
```typescript
POST /:id/upload
{
  "thumbnail": "data:image/png;base64,iVBORw0KG..."
}

-> uploadBase64ToS3({ base64, folder, userId })
-> Retorna S3 key (ej. "logos/uuid.png")
-> Store key en database
```

**Retrieval**:
- Database almacena solo S3 keys
- Presigned URLs generadas on-demand (15min expiry)
- `getPresignedUrl(key)` retorna URL temporal
- CDN URLs usadas si configuradas

### Tipos de Archivo

| Tipo | Formatos |
|------|----------|
| **Images** | Logo, favicon, thumbnails, avatars, signatures (PNG, JPEG, WebP) |
| **Videos** | Contenido de curso, previews (MP4, WebM, MOV) |
| **Documents** | Materiales de curso (PDF, DOCX) |
| **Generated** | Certificados (PDF), OG images |

### Folders
```
logos/, favicons/, thumbnails/, avatars/, signatures/
courses/videos/, videos/, documents/
certificates/, learn-chat-images/
```

---

## 9. Features de IA

### Proveedores de IA

| Proveedor | Uso | Modelo |
|-----------|-----|--------|
| **Groq** | Fast inference | Whisper (whisper-large-v3-turbo), Llama (llama-3.3-70b-versatile, llama-3.1-8b-instant) |
| **AI Gateway** | Image/theme gen | Gemini (gemini-2.5-flash-image-preview, gemini-2.5-flash), GPT (gpt-4o-mini) |
| **Langfuse** | Observability | Prompt management, tracing, cost tracking |
| **HuggingFace** | Local embeddings | Xenova/all-MiniLM-L6-v2 (384 dimensions) |

### Capacidades de IA

#### Video Transcription
- FFmpeg extrae audio a 2x speed, mono, 16kHz
- Groq Whisper transcribe a texto
- Almacenado en `videos.transcript` para busqueda y chat

#### Content Generation
- Analiza transcript de video o texto de documento
- Genera titulo + descripcion usando Llama
- JSON response parsing

#### Quiz Generation
- Extrae contenido de video/documento
- Prompts Llama para crear preguntas
- Soporta multiple choice, multiple select, true/false
- Evita duplicados de quiz existente

#### Course Generation
- Analiza todo el contenido de modulos (videos, docs, quizzes)
- Genera titulo, descripcion, objetivos del curso
- Crea imagen thumbnail via Gemini

#### Theme Generation
- Toma descripcion de marca o prompt
- Genera esquema de color completo (light + dark mode)
- Retorna CSS variables para todos los elementos UI

#### Semantic Search
- Embeddings generados para modules, videos, documents, quizzes
- Almacenados en columnas pgvector de PostgreSQL
- HNSW indexes para busqueda rapida por similaridad
- Usado por learning assistant para encontrar contenido relevante

#### Learning Assistant
- Contexto: Curso actual, modulo, item (video/doc/quiz)
- Acceso: Todo el contenido del curso, transcripts, progreso
- Tools: Semantic search, navegacion de timestamps de video
- Streaming responses
- Multi-modal: Acepta texto, imagenes, archivos
- Personalizado: Tono, idioma, prompt personalizado configurado por tenant

#### Creator Assistant
- Ayuda con planificacion de cursos
- Sugerencias de mejora de contenido
- Interfaz de chat streaming

### Seguridad de IA

- **Prevencion de Prompt Injection**: Nunca inyectar user input directamente
- **Validacion de Enum**: Parametros de estilo/tipo usan valores whitelisted
- **Structured Data**: Variables pasadas separadamente de prompts
- **Rate Limiting**: Limites de API calls por usuario

---

## 10. Integraciones

### Email (Resend)
- **Proposito**: Emails transaccionales
- **Config**: `RESEND_API_KEY`
- **Casos de Uso**: Welcome + verificacion de email, password reset, entrega de certificado, emails con branding de tenant

### Custom Domains (Cloudflare)
- **Proposito**: SSL + gestion DNS para custom domains
- **Config**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_CNAME_TARGET`
- **Flujo**: Create Custom Hostname -> Tenant setea CNAME record -> Cloudflare verifica DNS + provisiona SSL

### Hosting (Railway)
- **Proposito**: Gestion dinamica de custom domains
- **Config**: `RAILWAY_TOKEN`, `RAILWAY_CLIENT_SERVICE_ID`
- **Flujo**: Agrega custom domain a Railway service, Railway provisiona SSL

### S3-Compatible Storage
- **Proposito**: Storage de archivos (imagenes, videos, documentos, PDFs)
- **Providers**: AWS S3, Cloudflare R2, MinIO, etc.
- **Features**: Presigned URLs, estructura de folders, cleanup automatico

### Database (PostgreSQL)
- **Extensions Requeridas**:
  - `pgvector`: Vector similarity search para IA
  - Native JSON support
- **Hosting**: Cualquier provider PostgreSQL (Railway, Supabase, Neon, etc.)

### FFmpeg (Server-side)
- **Proposito**: Procesamiento de video para transcripcion
- **Deployment**: Requiere binary `ffmpeg` (Railway: `RAILPACK_DEPLOY_APT_PACKAGES=ffmpeg`)

### Analytics (Futuro)
- Plausible Analytics client-side (`@plausible-analytics/tracker`)
- Aun no completamente integrado

### Payments (Planeado)
- Schema de database tiene placeholder para integracion con Stripe
- No implementado aun
- Fields: `billingEmail`, `stripeCustomerId`, `stripeSubscriptionId`, `trialEndsAt`

---

## 11. Stack Tecnologico

### Frontend
| Tecnologia | Version/Descripcion |
|------------|---------------------|
| **Framework** | React 19 + TanStack Router (file-based routing) |
| **Build** | Vite 7 + Bun |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **State** | TanStack Query (server state) + Zustand (client state) |
| **Forms** | React Hook Form + Zod |
| **i18n** | i18next |
| **HTTP** | Axios |
| **AI** | Vercel AI SDK (streaming chat) |

### Backend
| Tecnologia | Version/Descripcion |
|------------|---------------------|
| **Runtime** | Bun 1.3+ |
| **Framework** | Elysia (type-safe REST API) |
| **Database** | PostgreSQL + Drizzle ORM |
| **Auth** | JWT (@elysiajs/jwt) |
| **Validation** | Zod |
| **File Upload** | S3 SDK |
| **AI** | Groq SDK, Anthropic SDK, Vercel AI SDK |
| **Observability** | Langfuse + OpenTelemetry |

### Infrastructure
| Componente | Tecnologia |
|------------|------------|
| **Hosting** | Railway (client + server) |
| **Storage** | S3-compatible |
| **CDN** | Opcional (configurable) |
| **DNS** | Cloudflare |
| **Email** | Resend |

---

## 12. Variables de Entorno

### Server (`apps/server/.env`)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT Secrets (32+ chars)
JWT_SECRET=...
REFRESH_SECRET=...
RESET_SECRET=...

# Server
PORT=3000
CORS_ORIGIN=http://localhost:3001
BASE_DOMAIN=localhost
CLIENT_URL=http://localhost:3001

# Email
RESEND_API_KEY=re_...

# S3 Storage
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_ENDPOINT_URL=...
S3_REGION=us-east-1
CDN_BASE_URL=

# Custom Domains
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_CNAME_TARGET=domains.uselearnbase.com

# Railway
RAILWAY_TOKEN=...
RAILWAY_CLIENT_SERVICE_ID=...

# AI
GROQ_API_KEY=gsk_...
AI_GATEWAY_API_KEY=...

# Observability (optional)
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Client (`apps/client/.env`)
```bash
VITE_API_URL=http://localhost:3000
VITE_BASE_DOMAIN=localhost
```

---

## 13. Patrones de Diseno Clave

| Patron | Descripcion |
|--------|-------------|
| **Error Handling** | Global `withHandler` wrapper, typed `AppError` class |
| **File Uploads** | Base64 -> S3, presigned URLs on read |
| **Pagination** | `parseListParams` + `calculatePagination` helpers |
| **Filtering** | `buildWhereClause` para filtros SQL dinamicos |
| **Tenant Isolation** | Contexto de tenant inyectado via middleware |
| **AI Telemetry** | Langfuse tracing con contexto de usuario |
| **State Management** | React Query para server state, Zustand para UI state |
| **Code Organization** | Folders basados en feature (services, queries, mutations) |
| **Type Safety** | End-to-end TypeScript, Zod schemas, Drizzle types |

---

Esta documentacion provee una vision completa de Learnbase - un LMS multi-tenant sofisticado con features potenciadas por IA, gestion completa de cursos, y capacidades white-label. La plataforma esta disenada para escalabilidad, experiencia de desarrollador, y personalizacion del usuario final.
