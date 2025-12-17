# Learnbase - Features de IA y Novedosas

## Asistentes de IA

### AI Course Creator Chat

Crea cursos completos a través de conversación natural. El asistente puede:

- Buscar contenido semánticamente (videos, documentos, quizzes)
- Crear módulos agrupando contenido relacionado
- Generar metadata del curso (título, descripción, objetivos)
- Generar thumbnails con IA en diferentes estilos
- Publicar/despublicar cursos
- Generar quizzes desde videos o documentos
- Generar PDFs de estudio desde transcripciones

**Ubicación:** `apps/server/src/routes/ai/chat-creator.ts`, `apps/client/src/components/courses/ai-course-creator.tsx`

### AI Learning Assistant

Tutor personalizado para estudiantes mientras consumen contenido:

- Accede al frame actual del video para preguntas visuales
- Analiza documentos completos
- Explica por qué las respuestas de quizzes son correctas
- Busca en transcripciones con referencias de timestamps
- Soporte para LaTeX y fórmulas matemáticas
- Personalizable por tenant (nombre, tono, idioma, prompts custom)

**Ubicación:** `apps/server/src/routes/ai/chat-learn.ts`, `apps/client/src/components/learn/ai-chat-sidebar.tsx`

---

## Generación Automática de Contenido

### Video Analysis & Transcription

Procesamiento automático de videos con análisis de IA:

- **Transcripción:** Groq Whisper Large v3 Turbo
- **FFmpeg optimizado:** Audio 2x velocidad, eliminación de silencios, 16kHz mono 32kbps
- **Generación de metadata:** Llama 3.3 70B genera título y descripción desde transcripción
- **Embeddings automáticos:** Vectores de 384 dimensiones para búsqueda semántica

**Ubicación:** `apps/server/src/routes/ai/content-analysis.ts`, `apps/server/src/lib/ai/transcript.ts`

### Quiz Generation

Genera quizzes automáticamente desde videos o documentos:

- 1-10 preguntas por contenido
- Formatos: multiple choice, multiple select, true/false
- Incluye explicaciones para cada pregunta
- Prevención inteligente de duplicados

**Modelo:** Llama 3.1 8B Instant

**Ubicación:** `apps/server/src/lib/ai/quiz-generation.ts`

### PDF Study Materials

Genera materiales de estudio en PDF desde transcripciones:

- **Tipos:** Notas de estudio, resumen, transcripción formateada, outline, conceptos clave
- **Anti-hallucination:** Solo usa contenido explícito de la transcripción
- **Branding:** Logo y colores del tenant
- **Referencias:** Timestamps para volver al video

**Ubicación:** `apps/server/src/lib/ai/pdf-generation.ts`, `apps/server/src/lib/ai/tools/document-tools.ts`

### Subtitle Generation & Translation

Generación automática de subtítulos con traducción:

- Transcripción con timestamps precisos
- Traducción a EN, ES, PT
- Formato VTT
- Procesamiento en background

**Ubicación:** `apps/server/src/routes/ai/subtitles.ts`, `apps/server/src/lib/ai/subtitle-translation.ts`

### AI Thumbnails

Genera imágenes para cursos:

- **Estilos:** Abstract (default), Realistic, Minimal, Professional
- **Modelo:** Gemini 2.5 Flash Image Preview

---

## Personalización con IA

### AI Theme Generator

Generación de temas de color con IA:

- **11 estilos:** Retro, Vintage, Modern, Minimal, Corporate, Professional, Playful, Fun, Futuristic, Elegant, Luxury
- **Sistema OKLCH:** 70+ tokens de color para light + dark mode
- **Tipografía:** Recomendaciones de Google Fonts por estilo
- **Sombras:** Efectos apropiados por estilo (neon glow, warm tinted, crisp clean)
- **Accesibilidad:** Cumple WCAG AA

**Modelo:** Gemini 2.5 Flash

**Ubicación:** `apps/server/src/routes/ai/theme-generation.ts`

### Profile Learning

El sistema aprende preferencias del tenant:

- **Análisis automático** después de 2+ cursos publicados
- **Detecta:** Tono, estilo de títulos, longitud de descripciones, patrones de módulos
- **Feedback learning:** Thumbs up/down, extrae correcciones de ediciones del usuario
- **Aplica preferencias** a generaciones futuras

**Ubicación:** `apps/server/src/lib/ai/profile-analysis.ts`, `apps/server/src/routes/ai/feedback.ts`

---

## Búsqueda Inteligente

### Semantic Search con Vector Embeddings

- **Modelo:** Xenova/all-MiniLM-L6-v2 (384 dimensiones)
- **Ejecución local:** Hugging Face Transformers.js (sin costos de API)
- **Base de datos:** PostgreSQL con pgvector
- **Índice:** HNSW para búsqueda rápida por similitud
- **Contenido indexado:** Videos, Documentos, Quizzes, Módulos

**Ubicación:** `apps/server/src/lib/ai/embeddings.ts`

---

## Observabilidad de IA

### Langfuse Integration

- Trazabilidad completa de operaciones de IA
- Tracking de tokens y costos
- Atribución por usuario/tenant
- Métricas de performance
- Versionado de prompts

**Ubicación:** `apps/server/src/lib/ai/gateway.ts`, `apps/server/src/lib/ai/telemetry.ts`

---

## Modelos Utilizados

| Propósito | Modelo | Proveedor |
|-----------|--------|-----------|
| Transcripción | Whisper Large v3 Turbo | Groq |
| Generación de contenido | Llama 3.3 70B Versatile | Groq |
| Quizzes | Llama 3.1 8B Instant | Groq |
| Chat course creator | GPT-4o-mini | OpenAI |
| Imágenes | Gemini 2.5 Flash Image | Google AI |
| Themes | Gemini 2.5 Flash | Google AI |
| Embeddings | Xenova/all-MiniLM-L6-v2 | Local |

---

## Diferenciadores vs Otros LMS

1. **Automatización total:** Upload video → Transcripción → Análisis → Curso generado automáticamente
2. **Construcción conversacional:** Crear cursos completos a través de chat, no formularios
3. **IA que aprende:** Se adapta al estilo y preferencias de cada tenant
4. **Tutor contextual:** El asistente ve el frame actual del video que el estudiante está viendo
5. **Materiales de estudio automáticos:** PDFs generados desde transcripciones de videos
6. **Búsqueda semántica:** Encuentra contenido por significado, no solo keywords
7. **Temas científicos:** Sistema de colores OKLCH con 11 estilos predefinidos
8. **Anti-hallucination:** Restricciones estrictas para que la IA no invente información
9. **Embeddings locales:** Sin costos de API, privacy-first
10. **Multi-tenant con personalización:** Cada tenant puede customizar su asistente de IA
