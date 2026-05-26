# Plurales, fechas, números y formatos ICU

## Plurales

```json
// messages/en/common.json
{
  "items": "{count, plural, =0 {No items} one {# item} other {# items}}",
  "notifications": "{count, plural, =0 {No notifications} one {One notification} other {# notifications}}"
}
```

```typescript
// Uso
const t = useTranslations('common');
t('items', { count: 0 });   // "No items"
t('items', { count: 1 });   // "1 item"
t('items', { count: 42 });  // "42 items"
```

## Variables de interpolación

```json
{
  "greeting": "Hello, {name}!",
  "welcome_back": "Welcome back, {name}. You have {count} messages.",
  "price": "Total: {price}"
}
```

```typescript
t('greeting', { name: 'María' });
t('price', { price: t.number(49.99, { style: 'currency', currency: 'USD' }) });
```

## Formato de fechas

```typescript
import { useFormatter } from 'next-intl';

function DateDisplay({ date }: { date: Date }) {
  const format = useFormatter();

  return (
    <div>
      {/* Fecha local según locale actual */}
      <span>{format.dateTime(date, { dateStyle: 'long' })}</span>
      {/* "January 16, 2025" en en-US, "16 de enero de 2025" en es */}

      {/* Fecha relativa */}
      <span>{format.relativeTime(date)}</span>
      {/* "5 minutes ago", "hace 5 minutos" */}
    </div>
  );
}
```

## Formato de números

```typescript
const format = useFormatter();

format.number(1234567.89, { style: 'currency', currency: 'EUR' });
// "€1,234,567.89" en en, "1.234.567,89 €" en de

format.number(0.752, { style: 'percent' });
// "75%" en en, "75 %" en fr

format.number(1500000, { notation: 'compact' });
// "1.5M" en en, "1,5 Mio." en de
```

## Rich text (HTML en traducciones)

Para casos donde la traducción necesita HTML (bold, links):

```json
{
  "terms": "I agree to the <terms>Terms of Service</terms> and <privacy>Privacy Policy</privacy>",
  "highlight": "This is <bold>important</bold> information"
}
```

```typescript
t.rich('terms', {
  terms: (chunks) => <a href="/terms">{chunks}</a>,
  privacy: (chunks) => <a href="/privacy">{chunks}</a>,
});

t.rich('highlight', {
  bold: (chunks) => <strong>{chunks}</strong>,
});
```

## Listas

```json
{
  "and_list": "{items, list, type: conjunction}",
  "or_list": "{items, list, type: disjunction}"
}
```

```typescript
// En Server Component con getFormatter
import { getFormatter } from 'next-intl/server';
const format = await getFormatter();
format.list(['React', 'Next.js', 'TypeScript'], { type: 'conjunction' });
// "React, Next.js, and TypeScript" en en
// "React, Next.js y TypeScript" en es
```

## Select (género, roles, estados)

```json
{
  "role_label": "{role, select, admin {Administrator} editor {Editor} viewer {Viewer} other {User}}"
}
```

```typescript
t('role_label', { role: 'admin' }); // "Administrator"
```
