# Namespaces en next-intl — sistema nativo

## proxy.ts con lógica adicional (patrón función explícita)

Si necesitas hacer algo antes o después del routing de locale (headers custom, feature flags, etc.):

```typescript
// proxy.ts
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './src/i18n/routing';

const intlProxy = createMiddleware(routing);

// Patrón con función explícita — úsalo solo si necesitas lógica extra
export function proxy(request: NextRequest) {
  // lógica previa (ej: leer cookie de feature flag)
  const response = intlProxy(request);
  // lógica posterior (ej: añadir header)
  response.headers.set('x-locale', request.nextUrl.locale ?? 'en');
  return response;
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)',],
};
```

Para el caso simple sin lógica extra, usa siempre el `export default createMiddleware(routing)` del `SKILL.md` principal.

## Cuándo usar namespaces nativos vs deepmerge

| Enfoque | Cuándo usarlo |
|---|---|
| `deepmerge` (SKILL.md principal) | Quieres un objeto plano de mensajes; tienes muchos namespaces |
| **Namespaces nativos** (este archivo) | Quieres carga lazy por página; proyectos muy grandes con 10+ secciones |

---

## Configuración con namespaces nativos

### `src/i18n/request.ts` — carga por namespace

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { glob } from 'glob'; // npm install glob
import path from 'path';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Carga automática de todos los JSON bajo messages/{locale}/**/*.json
  const messages = await loadAllNamespaces(locale);

  return { locale, messages };
});

async function loadAllNamespaces(locale: string): Promise<Record<string, unknown>> {
  const pattern = path.join(process.cwd(), `messages/${locale}/**/*.json`);
  const files = await glob(pattern);

  const messages: Record<string, unknown> = {};

  await Promise.all(
    files.map(async (file) => {
      // Deriva el namespace del path relativo
      // messages/en/dashboard/sidebar.json → "dashboard.sidebar"
      const relative = path.relative(
        path.join(process.cwd(), `messages/${locale}`),
        file
      );
      const namespace = relative
        .replace(/\.json$/, '')
        .split(path.sep)
        .join('.');

      const content = (await import(file)).default;
      setNestedKey(messages, namespace, content);
    })
  );

  return messages;
}

function setNestedKey(obj: Record<string, unknown>, keyPath: string, value: unknown) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
```

### Uso en componentes con namespace automático

```typescript
// Con la estructura messages/en/dashboard/sidebar.json
// El namespace es "dashboard.sidebar"

export function Sidebar() {
  const t = useTranslations('dashboard.sidebar');
  return <nav>{t('sections.overview')}</nav>;
}
```

---

## Carga lazy por página (proyectos grandes)

Si la web tiene 20+ secciones y no quieres cargar todos los JSON en cada request:

### `src/i18n/request.ts` — carga selectiva

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { headers } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Siempre carga common (nav, errores, etc.)
  const common = (await import(`../../messages/${locale}/common.json`)).default;

  // Detecta la sección desde la URL para carga adicional
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/';
  const section = detectSection(pathname);

  let sectionMessages = {};
  if (section) {
    try {
      sectionMessages = (await import(`../../messages/${locale}/${section}.json`)).default;
    } catch {
      // El namespace no existe para esta sección, continúa con common
    }
  }

  return {
    locale,
    messages: { ...common, [section]: sectionMessages },
  };
});

function detectSection(pathname: string): string {
  // /pricing → 'pricing', /dashboard/settings → 'dashboard/settings'
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment ?? 'home';
}
```

---

## Patrón recomendado para menús complejos

Para webs con muchos menús (sidebar, navbar, tabs, breadcrumbs), agrupa por **componente UI**, no por página:

```
messages/en/
  common.json           # Strings verdaderamente globales
  nav/
    top.json            # Navbar superior
    sidebar.json        # Sidebar / drawer
    mobile.json         # Menú móvil si es diferente
    breadcrumbs.json    # Breadcrumbs
  sections/
    home.json
    pricing.json
    about.json
    contact.json
  forms/
    auth.json           # Login, registro, recuperar password
    checkout.json       # Formulario de pago
    profile.json        # Formulario de perfil
  feedback/
    errors.json         # Mensajes de error
    success.json        # Mensajes de éxito
    empty.json          # Estados vacíos
```

Así `Navbar` siempre carga `nav/top`, `Sidebar` carga `nav/sidebar`, y cada página carga su propio `sections/X` — sin colisiones y sin duplicados.

---

## TypeScript augmentation para múltiples namespaces

```typescript
// src/types/i18n.d.ts
import common from '../../messages/en/common.json';
import nav_top from '../../messages/en/nav/top.json';
import nav_sidebar from '../../messages/en/nav/sidebar.json';
import sections_home from '../../messages/en/sections/home.json';
import sections_pricing from '../../messages/en/sections/pricing.json';
import forms_auth from '../../messages/en/forms/auth.json';
import feedback_errors from '../../messages/en/feedback/errors.json';

type Messages =
  typeof common &
  { nav: { top: typeof nav_top; sidebar: typeof nav_sidebar } } &
  { sections: { home: typeof sections_home; pricing: typeof sections_pricing } } &
  { forms: { auth: typeof forms_auth } } &
  { feedback: { errors: typeof feedback_errors } };

declare global {
  interface IntlMessages extends Messages {}
}
```

Esto activa autocompletado completo: `t('nav.sidebar.sections.overview')` con error en compilación si la key no existe.
