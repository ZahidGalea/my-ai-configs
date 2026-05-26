# SEO y routing avanzado

## URLs traducidas por locale

Si quieres `/en/about` → `/es/sobre-nosotros` (slugs diferentes por locale):

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'de'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/about': {
      en: '/about',
      es: '/sobre-nosotros',
      de: '/ueber-uns',
    },
    '/pricing': {
      en: '/pricing',
      es: '/precios',
      de: '/preise',
    },
    // Rutas dinámicas
    '/blog/[slug]': {
      en: '/blog/[slug]',
      es: '/blog/[slug]',
    },
  },
});
```

> Si las URLs son iguales en todos los locales (solo cambia el contenido), no hace falta `pathnames`. Úsalo solo cuando los slugs difieren.

---

## hreflang en el `<head>`

```typescript
// app/[locale]/layout.tsx
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Genera alternates para todos los locales
  const languages = Object.fromEntries(
    routing.locales.map((l) => [
      l,
      // Si usas pathnames traducidos, getPathname resuelve el path correcto
      `/${l}`,
    ])
  );

  return {
    alternates: {
      canonical: `https://example.com/${locale}`,
      languages,
    },
  };
}
```

Resultado en `<head>`:
```html
<link rel="alternate" hreflang="en" href="https://example.com/en" />
<link rel="alternate" hreflang="es" href="https://example.com/es" />
<link rel="alternate" hreflang="de" href="https://example.com/de" />
```

---

## generateStaticParams para SSG

```typescript
// app/[locale]/page.tsx
import { routing } from '@/i18n/routing';

// Genera rutas estáticas para todos los locales en build time
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

Para rutas dinámicas:
```typescript
// app/[locale]/products/[id]/page.tsx
export async function generateStaticParams() {
  const products = await fetchProducts(); // tu fetcher

  return routing.locales.flatMap((locale) =>
    products.map((product) => ({ locale, id: product.id }))
  );
}
```

---

## Sitemap multilingüe

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const baseUrl = 'https://example.com';

const staticPaths = ['/', '/about', '/pricing', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${baseUrl}/${locale}${path === '/' ? '' : path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [`${l}`, `${baseUrl}/${l}${path === '/' ? '' : path}`])
        ),
      },
    }))
  );
}
```

---

## Selector de idioma (locale switcher)

```typescript
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(newLocale: string) {
    // router.replace de next-intl mantiene el pathname correcto con el nuevo locale
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l] ?? l}
        </option>
      ))}
    </select>
  );
}
```

---

## Redirección de la raíz `/`

El `proxy.ts` ya redirige automáticamente `/` → `/{defaultLocale}` (o al locale del navegador). No hace falta un `app/page.tsx` de redirección manual.

Si quieres forzar siempre el locale en la URL (incluso el por defecto):

```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always', // /en/about en vez de /about
});
```
