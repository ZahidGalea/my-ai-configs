# Testing de componentes con i18n

## Setup con Vitest / Jest

```typescript
// src/test-utils/i18n.tsx
import { NextIntlClientProvider } from 'next-intl';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';

// Importa los mensajes del locale base para tests
import messages from '../../messages/en/common.json';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithI18n(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Wrapper, ...options });
}
```

## Test de un Client Component

```typescript
// components/Navbar.test.tsx
import { screen } from '@testing-library/react';
import { renderWithI18n } from '@/test-utils/i18n';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('renders nav links', () => {
    renderWithI18n(<Navbar />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });
});
```

## Test de Server Component

Para Server Components, usa el patrón de extract logic:

```typescript
// Extrae la lógica del Server Component en una función pura
// que puedas testear sin el contexto de next-intl.
// El Server Component solo compone UI; la lógica es testeable.

// lib/pricing.ts (lógica pura)
export function getPricingTiers(t: (key: string) => string) {
  return [
    { name: t('pricing.tiers.free.name'), price: 0 },
    { name: t('pricing.tiers.pro.name'), price: 29 },
  ];
}

// app/[locale]/pricing/page.tsx (Server Component)
import { useTranslations } from 'next-intl';
import { getPricingTiers } from '@/lib/pricing';

export default function PricingPage() {
  const t = useTranslations();
  const tiers = getPricingTiers(t);
  // ...
}

// lib/pricing.test.ts
import { getPricingTiers } from './pricing';

it('returns correct tiers', () => {
  const mockT = (key: string) => key; // devuelve la key como string
  const tiers = getPricingTiers(mockT);
  expect(tiers).toHaveLength(2);
  expect(tiers[0].price).toBe(0);
});
```

## Mock de next-intl en Jest/Vitest

```typescript
// vitest.setup.ts o jest.setup.ts
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
    useLocale: () => 'en',
    useFormatter: () => ({
      dateTime: (date: Date) => date.toISOString(),
      number: (n: number) => String(n),
    }),
  };
});
```

## Verificar keys faltantes en CI

Añade un script para detectar keys que existen en el locale base pero faltan en otros:

```typescript
// scripts/check-i18n.ts
import { glob } from 'glob';
import path from 'path';

const baseLocale = 'en';
const messagesDir = path.join(process.cwd(), 'messages');

async function checkMissingKeys() {
  const baseFiles = await glob(`${messagesDir}/${baseLocale}/**/*.json`);
  let hasErrors = false;

  for (const baseFile of baseFiles) {
    const baseMessages = await import(baseFile);
    const relativePath = path.relative(`${messagesDir}/${baseLocale}`, baseFile);

    // Comprueba cada locale configurado
    for (const locale of ['es', 'de']) {
      const localeFile = path.join(messagesDir, locale, relativePath);
      try {
        const localeMessages = await import(localeFile);
        const missing = findMissingKeys(baseMessages.default, localeMessages.default);
        if (missing.length > 0) {
          console.error(`[${locale}] ${relativePath}: missing keys: ${missing.join(', ')}`);
          hasErrors = true;
        }
      } catch {
        console.error(`[${locale}] Missing file: ${relativePath}`);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) process.exit(1);
  console.log('✓ All i18n keys are present');
}

function findMissingKeys(base: Record<string, unknown>, target: Record<string, unknown>, prefix = ''): string[] {
  const missing: string[] = [];
  for (const key of Object.keys(base)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!(key in target)) {
      missing.push(fullKey);
    } else if (typeof base[key] === 'object' && base[key] !== null) {
      missing.push(...findMissingKeys(
        base[key] as Record<string, unknown>,
        (target[key] ?? {}) as Record<string, unknown>,
        fullKey
      ));
    }
  }
  return missing;
}

checkMissingKeys();
```

```json
// package.json
{
  "scripts": {
    "i18n:check": "tsx scripts/check-i18n.ts"
  }
}
```
