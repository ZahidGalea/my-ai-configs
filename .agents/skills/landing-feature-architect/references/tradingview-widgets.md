# TradingView Widgets in `@leadgen/ui`

Use these widgets when real market context increases trust, seriousness, or product tangibility.

Source files:

- `packages/ui/src/TradingViewHorizontal.tsx`
- `packages/ui/src/TradingViewWidget.tsx`
- `packages/ui/src/TradingViewHeatMap.tsx`
- exports in `packages/ui/src/index.ts`

TradingView's own docs describe widgets as ready-to-use tools for embedding market data, including charts, live tickers, calendars, watchlists, and more. Treat them as market context modules, not as conversion gimmicks.

## Components

### `TradingViewHorizontal`

Ticker tape for compact live market context.

Props:

- `symbols?: { description: string; proName: string }[]`
- `colorTheme?: 'light' | 'dark'`
- `isTransparent?: boolean`
- `locale?: string`
- `className?: string`

Default symbols include BTC, ETH, gold, oil, and EUR/USD.

### `TradingViewWidget`

Symbol overview chart.

Props:

- `symbol?: string`
- `label?: string`
- `width?: string | number`
- `height?: string | number`
- `colorTheme?: 'light' | 'dark'`
- `isTransparent?: boolean`
- `chartOnly?: boolean`
- `className?: string`
- `locale: string`

Use a fixed-height parent such as `h-[360px]` or `h-[430px]` so the widget cannot collapse.

### `TradingViewHeatMap`

Crypto heatmap.

Props:

- `colorTheme?: 'light' | 'dark'`
- `dataSource?: 'CRYPTO'`
- `height?: number`
- `locale?: string`
- `className?: string`

Use only when crypto or broad market scanning fits the brand.

## Usage Example

```tsx
'use client'

import { TradingViewHorizontal, TradingViewWidget } from '@leadgen/ui'
import { useLocale } from 'next-intl'

export function MarketContextPanel() {
  const locale = useLocale()

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <TradingViewHorizontal
          colorTheme="light"
          locale={locale}
          symbols={[
            { description: 'S&P 500', proName: 'SP:SPX' },
            { description: 'Gold', proName: 'TVC:GOLD' },
            { description: 'EUR/USD', proName: 'FX:EURUSD' },
          ]}
        />
      </div>

      <div className="h-[380px]">
        <TradingViewWidget
          chartOnly
          colorTheme="light"
          isTransparent
          label="S&P 500"
          locale={locale}
          symbol="SP:SPX"
        />
      </div>

      <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
        Market data is shown as educational context and does not constitute investment advice.
      </p>
    </section>
  )
}
```

## Selection Rules

- Use `TradingViewHorizontal` in heroes or cockpit headers for quick credibility.
- Use `TradingViewWidget` when one asset or market is central to the angle.
- Use `TradingViewHeatMap` for crypto or market-breadth experiences, not calm savings pages.
- Use light theme for educational/mentor brands; dark theme for trading-desk or high-intensity brands.
- Always pass the current `locale` when the page uses `next-intl`.
- Give widgets a stable fixed-height container and verify they do not collapse on mobile.
- Consider lazy placement below the hero if a widget slows or distracts from the primary CTA.
- If a future repo update adds TradingView Web Components, prefer them for modern multi-widget pages when they fit the project constraints.

## Copy Guardrails

Acceptable labels:

- "Market context"
- "Educational example"
- "Relative movement"
- "Live data snapshot"
- "Explore before deciding"

Avoid labels:

- "Buy signal"
- "Guaranteed setup"
- "Profit opportunity"
- "Copy this trade"
- "Best investment now"

If the brand is educational or beginner-focused, pair charts with explanatory copy and a disclaimer. If the brand is about savings or planning, prefer a calculator/map unless live data directly strengthens the promise.
