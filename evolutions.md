# Evoluciones Futuras

## Subtítulos Sincronizados para Videos

### Descripción
Generar subtítulos sincronizados automáticamente desde el audio del video, con opción de elegir idioma.

### Estado Actual
- Transcripción con Whisper funcionando (FFmpeg + Groq)
- Análisis de video genera título/descripción desde transcripts
- S3 para almacenamiento de archivos
- **Limitación**: El SDK actual (`experimental_transcribe` de Vercel AI) solo retorna texto plano, sin timestamps

### Desafío Técnico Principal
Para subtítulos sincronizados se necesita:
1. **Timestamps precisos** (cuándo empieza/termina cada frase)
2. **Segmentación** del texto en bloques de ~2-3 segundos
3. **Formato estándar** (WebVTT o SRT)

### Opciones de Implementación

| Opción | Complejidad | Precisión | Costo |
|--------|-------------|-----------|-------|
| Groq Whisper SDK directo con `response_format: "verbose_json"` | Media | Alta | Bajo (ya usamos Groq) |
| Servicio especializado (Deepgram, AssemblyAI) | Baja | Muy Alta | ~$0.01/min |
| OpenAI Whisper directo | Media | Alta | ~$0.006/min |

### Evaluación de Complejidad por Componente

| Aspecto | Complejidad | Notas |
|---------|-------------|-------|
| Obtener timestamps de Whisper | **Media** | Cambiar de Vercel AI SDK a Groq SDK directo |
| Generar formato VTT/SRT | **Baja** | Parsing y formateo de JSON |
| Nueva tabla en DB | **Baja** | Schema + migración |
| Traducción a otros idiomas | **Media-Alta** | Requiere LLM preservando timestamps |
| UI para seleccionar idioma | **Baja** | Dropdown + estado |
| Player con subtítulos | **Media** | Depende del player actual |

### Complejidad General
- **Media** si solo es transcripción con timestamps en idioma original
- **Media-Alta** si incluye traducción a múltiples idiomas

### Cambios Requeridos

#### Backend

**Nueva tabla `videoSubtitles`**:
```typescript
export const videoSubtitlesTable = pgTable("video_subtitles", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").references(() => videosTable.id, { onDelete: "cascade" }),
  language: text("language").notNull(), // "en", "es", "pt"
  subtitleKey: text("subtitle_key"), // S3 key para archivo VTT
  transcript: text("transcript"), // Texto plano completo
  status: subtitleStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("video_subtitles_video_id_idx").on(table.videoId),
  index("video_subtitles_language_idx").on(table.language),
]);
```

**Nuevos endpoints**:
- `POST /ai/videos/:id/generate-subtitles` - Generar subtítulos con timestamps
- `GET /videos/:id/subtitles` - Listar idiomas disponibles
- `GET /videos/:id/subtitles/:language` - Obtener archivo VTT/SRT

**Nueva función de transcripción**:
```typescript
// Usar Groq SDK directo para obtener timestamps
async function transcribeWithTimestamps(videoUrl: string): Promise<WhisperSegment[]>
```

#### Frontend

- Componente de selección de idioma en el player
- Integración de subtítulos VTT con el video player
- UI para iniciar generación de subtítulos

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `apps/server/src/db/schema.ts` | Nueva tabla `videoSubtitles` |
| `apps/server/src/lib/ai/transcript.ts` | Nueva función con timestamps |
| `apps/server/src/routes/ai.ts` | Endpoint de generación |
| `apps/server/src/routes/videos.ts` | Endpoints de subtítulos |
| `apps/client/src/components/` | Player con soporte VTT |

### Preguntas Pendientes

1. **Traducción**: ¿Subtítulos en idioma diferente al video? (ej: video español → subtítulos inglés)
2. **Formato**: ¿Solo overlay en player, descargable, o ambos?
3. **Edición**: ¿Usuarios pueden editar/corregir subtítulos generados?
4. **Múltiples idiomas**: ¿Un video puede tener subtítulos en varios idiomas?

### Estimación
- **Solo idioma original**: ~2-3 días de desarrollo
- **Con traducción multi-idioma**: ~4-5 días de desarrollo

---

## Selector de Fuentes para Tenants

### Descripcion
Permitir a los tenants elegir fuentes manualmente (sin depender de la generacion AI) para personalizar la tipografia de su plataforma.

### Estado Actual
- Fuentes se generan via AI theme generation (fontHeading, fontBody)
- Google Fonts se cargan dinamicamente en `use-custom-theme.ts`
- Las fuentes se guardan en `customTheme` del tenant
- Solo se pueden obtener al generar un theme completo con AI

### Funcionalidad Deseada
1. **Selector de fuentes independiente** en la configuracion de apariencia
2. **Lista curada de Google Fonts** organizadas por categoria (serif, sans-serif, display, monospace)
3. **Preview en vivo** de como se vera la fuente seleccionada
4. **Combinaciones sugeridas** de fuentes que funcionan bien juntas

### Cambios Requeridos

#### Frontend

**Nuevo componente `FontPicker`**:
```tsx
// Categorias de fuentes
const fontCategories = {
  sansSerif: ["Inter", "Open Sans", "Roboto", "Montserrat", "Lato", "Plus Jakarta Sans"],
  serif: ["Playfair Display", "Lora", "Merriweather", "Source Serif Pro", "Cormorant"],
  display: ["Fredoka", "Baloo 2", "Space Grotesk", "Bebas Neue"],
  monospace: ["JetBrains Mono", "Fira Code", "Source Code Pro"],
};
```

**Ubicacion**: Dentro del tab de Apariencia, seccion separada de "Tipografia"

#### Backend
- No requiere cambios - ya soporta fontHeading/fontBody en customTheme

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `apps/client/src/components/tenant-customization/tabs/appearance-tab.tsx` | Agregar seccion de tipografia |
| `apps/client/src/components/tenant-customization/font-picker.tsx` | Nuevo componente |
| Locales (en, es, pt) | Nuevas traducciones |

### Estimacion
- **~1 dia de desarrollo**
