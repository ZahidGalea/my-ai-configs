---
name: nextjs-i18n
description: >
  Internacionalización (i18n) para proyectos Next.js existentes con App Router. Úsala cuando el usuario quiera añadir soporte multilingüe, configurar traducciones, migrar rutas al segmento [locale], organizar archivos de traducción sin JSONs gigantes, manejar traducciones en Server Components o Client Components, configurar proxy.js para detección de locale, o preguntar sobre hreflang/SEO multilingüe. Aplica también cuando el usuario mencione next-intl, i18n, locale, traducciones, internacionalización, o multiidioma en el contexto de Next.js.
---

# Next.js i18n — App Router con next-intl

Stack opinionado: **next-intl** + **JSON por namespace** + **Server Components first** + **proxy.js** (Next.js 16+).

## Decisiones de diseño

| Decisión | Elección | Por qué |
|---|---|---|
| Librería | `next-intl` | Soporte nativo App Router, TSC, Server Components sin config extra |
| Archivos | JSON por namespace/sección | Sin JSONs monolíticos; un archivo por área de la UI |
| Routing | Segmento `[locale]` en URL | SEO, compartibilidad, estándar de facto |
| Proxy | `proxy.ts` (Next.js 16+) | Detección automática de locale en Edge |
| Types | TypeScript augmentation | Autocomplete de claves, sin errores en runtime |

---

## Instalación

```bash
npm install next-intl
```

---

## Estructura de archivos

La clave de la mantenibilidad: **un JSON por sección de la UI**, no por idioma.

```
├── proxy.ts                        # Next.js 16+ (era middleware.ts en ≤15)
├── next.config.ts
├── src/
│   ├── i18n/
│   │   ├── request.ts              # Carga de mensajes server-side
│   │   ├── routing.ts              # Definición de locales y defaultLocale
│   │   └── navigation.ts          # Link, redirect, useRouter type-safe
│   └── app/
│       └── [locale]/
│           ├── layout.tsx
│           └── page.tsx
└── messages/
    ├── en/
    │   ├── common.json             # Nav, botones, errores globales  (≤60 keys)
    │   ├── home.json               # Solo homepage                  (≤40 keys)
    │   ├── pricing.json            # Solo pricing                   (≤30 keys)
    │   └── dashboard/
    │       ├── sidebar.json        # Menú lateral                   (≤30 keys)
    │       └── settings.json       # Configuración                  (≤40 keys)
    └── es/
        ├── common.json
        ├── home.json
        ├── pricing.json
        └── dashboard/
            ├── sidebar.json
            └── settings.json
```

**Regla de oro**: Si un archivo supera ~60 keys, divídelo. Si la sección tiene sub-secciones (dashboard, checkout), crea subcarpetas.

---

## Configuración paso a paso

### 1. `src/i18n/routing.ts`

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'de'],
  defaultLocale: 'en',
  // El locale por defecto NO lleva prefijo en la URL (/about en vez de /en/about)
  localePrefix: 'as-needed'
});
```

### 2. `src/i18n/navigation.ts`

```typescript
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Reemplaza next/navigation con versiones type-safe y locale-aware
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### 3. `src/i18n/request.ts` — carga de mensajes

```typescript
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';  // ← v4: hasLocale en lugar de includes()
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // hasLocale hace el type narrowing correctamente (v4+)
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Spread simple por namespace — sin deepmerge, sin magia
  const messages = {
    ...(await import(`../../messages/${locale}/common.json`)).default,
    ...(await import(`../../messages/${locale}/home.json`)).default,
    ...(await import(`../../messages/${locale}/pricing.json`)).default,
    // añade aquí cada namespace que tengas
  };

  return { locale, messages };
  // locale es OBLIGATORIO devolver en next-intl v4 (era opcional en v3)
});
```

> Para carga dinámica por carpeta o lazy loading, ver `references/namespaces.md`.

### 4. `proxy.ts` — detección de locale (Next.js 16+)

```typescript
// proxy.ts — en la raíz del proyecto (o src/ si usas src dir)
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

// En Next.js 16+: export default (no named export)
// El contenido es idéntico al antiguo middleware.ts — solo cambia el nombre del archivo
export default createMiddleware(routing);

export const config = {
  matcher: [
    // Excluye api, trpc, rutas internas de Next.js y archivos estáticos
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ],
};
```

> ⚠️ **Runtime**: `proxy.ts` corre en **Node.js**, NO en Edge runtime. Si necesitas Edge, mantén `middleware.ts` (deprecated pero funcional).
>
> ⚠️ **Next.js ≤15**: renombra el archivo a `middleware.ts`. El contenido es igual.
>
> ℹ️ Si necesitas lógica adicional antes/después del routing (headers, flags, auth check previo), ver `references/namespaces.md` para el patrón con función `proxy` explícita.

### 5. `next.config.ts`

```typescript
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // tu config existente
};

export default withNextIntl(nextConfig);
```

### 6. `app/[locale]/layout.tsx`

```typescript
import { NextIntlClientProvider, hasLocale } from 'next-intl';  // hasLocale importado aquí
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Promise en Next.js 15+
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params; // ← await obligatorio en Next.js 15+

  // hasLocale hace type narrowing limpio sin "as any"
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>
        {/* En next-intl v4 no necesitas pasar messages como prop — 
            los recibe automáticamente del getRequestConfig */}
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## Uso en componentes

### Server Component (patrón preferido)

```typescript
// app/[locale]/pricing/page.tsx
import { useTranslations } from 'next-intl';

// ✅ useTranslations funciona en Server Components directamente
export default function PricingPage() {
  const t = useTranslations('pricing');  // namespace = nombre del JSON

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('cta.start_free')}</button>
    </div>
  );
}
```

### Client Component

```typescript
'use client';
import { useTranslations } from 'next-intl';

// ✅ También funciona en Client Components (recibe messages via Provider)
export function Navbar() {
  const t = useTranslations('common');

  return (
    <nav>
      <a href="/">{t('nav.home')}</a>
      <a href="/pricing">{t('nav.pricing')}</a>
    </nav>
  );
}
```

### Server Component async (para metadata, etc.)

```typescript
import { getTranslations } from 'next-intl/server';

// Para uso fuera de componentes React o en funciones async
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}
```

---

## Estructura de los JSON (con namespaces anidados)

```json
// messages/en/common.json
{
  "nav": {
    "home": "Home",
    "pricing": "Pricing",
    "about": "About",
    "contact": "Contact"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm"
  },
  "errors": {
    "generic": "Something went wrong",
    "not_found": "Page not found",
    "unauthorized": "You don't have permission"
  }
}
```

```json
// messages/en/dashboard/sidebar.json
{
  "sidebar": {
    "title": "Dashboard",
    "sections": {
      "overview": "Overview",
      "analytics": "Analytics",
      "users": "Users",
      "settings": "Settings"
    },
    "user_menu": {
      "profile": "My Profile",
      "billing": "Billing",
      "logout": "Log out"
    }
  }
}
```

**Convención de keys**: `section.subsection.key` en snake_case. Nunca keys planas sin jerarquía.

---

## TypeScript — Autocomplete de claves

Añade al final de `src/i18n/request.ts` o en un archivo `src/types/i18n.d.ts`:

```typescript
// src/types/i18n.d.ts
import en_common from '../../messages/en/common.json';
import en_home from '../../messages/en/home.json';
// importa todos los namespaces del locale base

type Messages = typeof en_common & typeof en_home; // & todos los demás

declare global {
  interface IntlMessages extends Messages {}
}
```

Esto activa el autocompletado de `t('nav.home')` con error en compilación si la key no existe.

---

## Migración de rutas existentes

Si el proyecto ya tiene rutas en `app/` sin `[locale]`:

```
# Antes
app/
  page.tsx
  about/page.tsx
  pricing/page.tsx

# Después
app/
  [locale]/
    page.tsx
    about/page.tsx
    pricing/page.tsx
```

Pasos:
1. Crear carpeta `app/[locale]/`
2. Mover todos los archivos (incluyendo `layout.tsx`)
3. Añadir el nuevo `layout.tsx` de locale (ver paso 6 arriba)
4. Crear `proxy.ts` en la raíz
5. Actualizar `next.config.ts`
6. Reemplazar todos los `import { Link } from 'next/link'` → `import { Link } from '@/i18n/navigation'`

---

## SEO — hreflang y metadata

```typescript
// app/[locale]/layout.tsx — añadir alternates
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;

  return {
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}`])
      ),
    },
  };
}
```

---

## Pitfalls frecuentes

| Error | Síntoma | Solución |
|---|---|---|
| `params` sin `await` | Error en runtime Next.js 15+ | `const { locale } = await params` siempre |
| `useTranslations` en async fn | Error de hooks | Usar `getTranslations()` en lugar de `useTranslations()` |
| Archivo llamado `middleware.ts` en Next.js 16 | Warning de deprecación + posible fallo de locale | Renombrar a `proxy.ts` |
| `locale` no retornado en `getRequestConfig` | Error "Unable to find locale" en next-intl v4 | Siempre devolver `locale` en el return de `getRequestConfig` |
| `routing.locales.includes(locale as any)` | Type unsafe, patrón v3 | Usar `hasLocale(routing.locales, locale)` de next-intl v4 |
| `proxy.ts` con Edge runtime config | Runtime error | `proxy.ts` solo corre en Node.js; si necesitas Edge usa `middleware.ts` |
| `Link` de `next/link` sin locale | URLs sin prefijo de locale | Usar siempre `Link` de `@/i18n/navigation` |
| JSON con 200+ keys | Imposible mantener | Dividir en namespace por sección |

---

## Referencias adicionales

Para casos avanzados, lee los archivos en `references/`:

- **`namespaces.md`** — cómo usar el sistema de namespaces nativo de next-intl (sin deepmerge)
- **`plurals-and-formats.md`** — plurales ICU, fechas, números, listas
- **`seo-routing.md`** — URLs traducidas por locale (`/en/about` → `/es/sobre-nosotros`)
- **`testing.md`** — cómo testear componentes con i18n

Consulta el archivo relevante cuando el usuario pregunte sobre esos temas específicos.
