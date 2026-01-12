# CLAUDE.md

Este documento proporciona una visión general de la configuración y estructura del proyecto **Presales Agent (ACIDPRE)**.

## 🚨 Reglas Importantes

* **NUNCA ejecutes scripts directos a la base de datos ni migraciones manuales** - El usuario ejecuta las migraciones, tú solo modificas el schema en `lib/db/schema.ts`
* **Evitar pasar datos innecesarios entre componentes** - Mantener props mínimos
* **Nunca mantener backwards compatibility** - Remover código que no se use
* **Trabajas con un developer** - Déjale las decisiones técnicas o pregunta antes de actuar
* **IMPORTANTE: evita workarounds** - Nada de crear scripts paralelos si algo no funciona
* **IMPORTANTE: en Next.js 16** - `middleware.ts` fue reemplazado por `proxy.ts`
* **Usar BUN para manejar packages** - `bun install`, `bun add`, `bun run`
* **Siempre usar el tema default de ShadCN** - Evitar colores hardcodeados, usar clases de tema
* **No hace falta testear componentes ni levantar el devserver** - Enfocarse en escribir código funcional
* **Mantener desarrollo simple** - Reducir carga cognitiva, preferir contenido estático sobre loops/maps innecesarios
* **Usar Suspense correctamente** - Al pasar parámetros dinámicos o promises en Server Components o use(promise) en Client components.
* **CRÍTICO: Cookies centralizadas** - SIEMPRE usar las funciones de `app/actions/cookies.ts` para leer/escribir cookies. NUNCA usar `cookies()` directamente en componentes o páginas. Usar `getAppOptionsCookies()`, `getWorkspaceCookie()`, `getOpportunityCookie()`, `getActiveToolCookie()` según corresponda

## ⚙️ Stack Tecnológico

### Frontend
* **Next.js 16.0.1** con React 19 y React Compiler activado
* **TailwindCSS v4** + **ShadCN UI** para estilos y componentes
* **TypeScript** estricto con validación de env vars
* **Lucide React** para iconografía
* **React Hook Form** + **Zod** para validación de formularios
* **Sonner** para notificaciones toast
* **usehooks-ts** para hooks útiles (useLocalStorage, etc.)

### Backend / Database
* **Drizzle ORM** - ORM type-safe con PostgreSQL
* **Neon PostgreSQL** - Base de datos serverless
* **Server Actions** - Mutaciones de datos en Next.js 16
* **Next.js 16 Cache System** - `"use cache"`, `cacheTag()`, `updateTag()`

### Desarrollo
* **BUN** - Package manager y runtime
* **ESLint** para linting
* **Drizzle Kit** - Migraciones y gestión de schema

## 🎨 Patrones de Desarrollo

### Componentes
* **Componentes tipados** - Usar interfaces de `lib/types.ts`
* **Organización** - Todos los componentes en carpeta `components/` en la raíz
* **Props drilling mínimo** - Usar Context API cuando sea apropiado
* **Client Components** - Siempre usar `"use client"` cuando se necesite interactividad
* **ShadCN UI obligatorio** - NUNCA crear componentes UI desde cero, usar componentes de ShadCN

### Estilos
* **TailwindCSS v4** - Aprovechar las nuevas características
* **Mobile first** - Diseñar responsive desde móvil con breakpoints `sm:`, `md:`, `lg:`
* **Clases de tema** - Usar `bg-card`, `text-foreground`, `border-border`, etc.
* **NO hardcodear colores** - Excepto cuando el usuario lo especifique (ej: `workspaceColor`)

### Navegación
* **Rutas tipadas** - Usar `lib/routes.tsx`
* **Links optimizados** - Usar Next.js Link con prefetch
* **NUNCA hardcodear URLs** - Siempre usar constantes de rutas

### Base de Datos y Server Actions

#### Estructura de carpetas
```
lib/
├── db/
│   ├── index.ts          # Cliente de Drizzle
│   ├── schema.ts         # Definición de tablas (snake_case)
│   └── queries.ts        # Queries CRUD (NO DELETE en este proyecto)
├── cache-keys.ts         # Tags de caché centralizadas
└── types.ts         # Re-exporta tipos de schema
```

#### Patrón de Base de Datos
* **Schema** - Definir en `lib/db/schema.ts` con naming convention `snake_case`
* **Client** - Exportado desde `lib/db/index.ts` (usa `@neondatabase/serverless`)
* **Queries** - Todas en `lib/db/queries.ts` con manejo de errores usando `ChatSDKError`
* **NO DELETE** - Este proyecto NO implementa operaciones DELETE (solo CREATE, READ, UPDATE)
* **Tipos** - Re-exportar desde `lib/types.ts` usando `InferSelectModel` y `InferInsertModel`

Ejemplo de query:
```typescript
// lib/db/queries.ts
export async function getWorkspaceById(id: string) {
  try {
    const result = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    if (result.length === 0) {
      throw new ChatSDKError("not_found:database", `Workspace with id "${id}" not found`);
    }
    return result[0];
  } catch (error) {
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError("bad_request:database", "Failed to fetch workspace");
  }
}
```

#### Patrón de Server Actions (Next.js 16 Cache)
* **Ubicación** - `app/actions/` (workspace.ts, opportunity.ts, etc.)
* **Cache Pattern** - Usar `"use cache"`, `cacheLife()`, `cacheTag()` para GET
* **Invalidación** - Usar `updateTag()` después de CREATE/UPDATE
* **Cache Tags** - Centralizadas en `lib/cache-keys.ts`

Ejemplo de server action:
```typescript
// app/actions/workspace.ts
"use server";

import { cacheLife, cacheTag, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-keys";
import * as queries from "@/lib/db/queries";

// GET con cache
export async function getWorkspaceData(workspaceId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.ACCOUNT.BY_WORKSPACE(workspaceId));

  return await queries.getWorkspaceById(workspaceId);
}

// CREATE/UPDATE con invalidación
export async function createWorkspaceAction(data: NewWorkspace) {
  const result = await queries.createWorkspace(data);
  updateTag(CACHE_TAGS.ACCOUNT.ALL);
  return result;
}
```

### Context Providers
* **Ubicación** - `contexts/` en la raíz
* **Persistencia** - Usar `useLocalStorage` de `usehooks-ts` para selecciones del usuario
* **Patrón establecido** - Ver `workspace-context.tsx` y `opportunity-context.tsx`

Ejemplo:
```typescript
// contexts/workspace-context.tsx
"use client";

import { useLocalStorage } from "usehooks-ts";

export function WorkspaceProvider({ children }) {
  const [activeWorkspace, setActiveWorkspace] = useLocalStorage<string>(
    "active-workspace-id",
    "latam" // default value
  );

  // ... fetch data based on activeWorkspace
}
```

### Constantes y Assets
* **Logos disponibles** - Definidos en `lib/available-logos.ts`
* **NO hay upload de archivos** - Los usuarios seleccionan de logos predefinidos
* **Enums** - Definir en `lib/types.ts` (ej: `IndustryOptions`, `BussinessUnitOptions`)


### Creación/Edición de Entidades
1. Usuario abre drawer de creación/edición
2. Formulario con React Hook Form + Zod valida datos
3. Al submit, se ejecuta server action (createWorkspaceAction, updateOpportunityAction, etc.)
4. Server action ejecuta query en `lib/db/queries.ts`
5. Server action invalida cache con `updateTag()`
6. Toast de éxito/error con `sonner`
7. Drawer se cierra y lista se recarga automáticamente

## 🚀 Comandos Útiles

```bash
# Instalar dependencias
bun install

# Desarrollo
bun run dev

# Build
bun run build

# Linting
bun run lint

# Base de datos
bun run db:generate   # Generar migraciones (después de modificar schema)
bun run db:migrate    # Aplicar migraciones
bun run db:push       # Push directo a DB (desarrollo)
bun run db:studio     # Abrir Drizzle Studio
```

## 💡 Tips para Developers

1. **Siempre lee el schema primero** - Antes de modificar queries, revisa `lib/db/schema.ts`
2. **Usa los patrones establecidos** - Copia componentes existentes como referencia
3. **NO elimines código usado** - Busca referencias antes de remover
4. **Cache invalidation** - Siempre invalida cache después de mutaciones
5. **Tipos primero** - Deja que TypeScript te guíe, NO uses `any`
6. **Mobile first** - Prueba diseños en móvil primero
7. **Toast feedback** - Siempre notifica al usuario sobre éxito/error de operaciones
8. **LocalStorage** - Las selecciones de usuario persisten en localStorage (workspace, opportunity)
9. **NO DELETE operations** - Este proyecto no implementa eliminación de registros
