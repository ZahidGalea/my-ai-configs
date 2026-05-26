# Landing Repo Patterns

Use this reference after the skill triggers and before editing a landing.

## Source of Truth

- Brand inputs live in `brands/<brand-id>/`.
- Read these files before designing:
  - `brands/<brand-id>/brand.md` — persona, positioning, voice, vocabulary, compliance
  - `brands/<brand-id>/visual-system.md` — palette, typography, logo system, visual cues
  - `brands/<brand-id>/angles.md` — index of angles with routes and short descriptions
  - `brands/<brand-id>/angles/<angulo-id>-<slug>-landing.md` — for the target angle: landing copy, landing experience mode, primary UI, lead moment, creative-landing match, above-the-fold rules
- The sections `Landing Experience`, `Creative-Landing Match`, and `Above the Fold Rule` in the angle's landing file are the decision source for the first screen, signature feature, lead moment, and ad-message match.
- Treat `pages/goldentraderpro` as the current working app template, not as visual direction for every brand.

## App Creation

- New app path: `pages/<brand-id>`.
- Copy from `pages/goldentraderpro` only when the target app does not already exist.
- Rename the copied `package.json` `name` to the brand id.
- Update favicon/icon assets from the brand folder.
- Replace hardcoded `goldentraderpro`, `GoldenTraderPro`, domains, metadata, logos, colors, and route names.
- Exclude generated output from copies: `.next`, `node_modules`, `playwright-report`, `test-results`, `coverage`, and caches.

## Logos and Assets

- Required brand files: `logo.svg`, `logo-light.svg`, `logo-icon.svg`, `logo-wordmark.svg`, and `favicon.svg`.
- Prefer copying SVGs into `pages/<brand-id>/public/brand/` and rendering the copied files with `img` or `Image`.
- Inline SVG in `BrandLogo` only when color tokens or responsive SVG composition are needed.
- Do not redraw the logo from scratch when a brand SVG already exists.

## Routes and Sections

- Home route: `src/app/(frontend)/[locale]/page.tsx`.
- Angle route: derive from `landing_asignada` path when present; otherwise slugify `angulo_nombre`.
- Home must include the logo, main lead form or a clear path into a lead-capturing experience, brand promise, route cards/links to angles, and required disclaimer.
- Each angle page must be built from `landing_copy`, `promesa_central`, `dolor_principal`, `deseo_principal`, `mechanism`, value props, CTA, and compliance rules.
- Use the route model from `landing_experience.mode` before building: `interactive`, `editorial`, or `hybrid`. Do not apply one route's mode to the whole brand; different routes in the same brand may use different experiences.
- Sequential value exchange pages may replace most traditional sections with a guided calculator, diagnostic, quiz, simulator, or form flow. Keep the first screen focused on the first useful input, not a long sales hero.
- Signature-feature pages should still make the feature explicit above the fold, then support it with concise sections below.
- Keep pages thin. Put reusable or route-specific sections under `src/components/<route-slug>/`.
- For sequential pages, split route components into shell/progress, step controls, result view, and final lead form. Keep answers in local state until the final submit.
- Do not create login, signup, dashboard, account, or CMS-facing features unless the user explicitly asks.

## Lead Tags

- `packages/lead-tags/src/index.ts` is the only source for `formId`, `source`, and `crmTag`.
- Do not hardcode lead hidden fields directly in page components.
- For each form, add a clearly named entry for landing, page, and placement.
- Sequential flows should pass wizard answers/results as `hidden.qualificationContext` on the final `LeadForm`. Use a compact JSON string with buckets, selected options, profile/result labels, and educational scenario values.
- Do not persist partial answers, write step-by-step CRM rows, use localStorage, or set cookies unless the user explicitly asks.
- For brand ids with hyphens, use a TypeScript-friendly object key such as `novaTradingIa`; keep the original slug in `formId` and `source`.
- Recommended values:
  - `formId`: `<brand-id>-<route-slug>-<placement>-lead-form`
  - `source`: `<brand_id_with_underscores>_<route_slug_with_underscores>_<placement>_form`
  - `crmTag`: `angle_<angle-or-brand-slug>_<short-purpose>`

## i18n

- Messages live under `messages/{locale}`.
- Keep `common.json` for shared labels and one JSON file per route/page, such as `home.json` or `crypto-auto.json`.
- Add each new namespace import to `src/i18n/request.ts`.
- Generate messages for every locale listed in `src/i18n/routing.ts`.
- If source copy is Spanish, translate intentionally for the other configured locales; do not permanently import Spanish as a fallback for other locales.

## Compliance

- Always include `brand.compliance.required_disclaimer` or a stricter equivalent.
- Check `brand.vocabulary.avoid`, `brand.compliance.forbidden_terms`, and `brand.visual_system.avoid_visual_cues` before finalizing.
- Avoid guaranteed returns, protected capital claims, "sin riesgo", "invierte ahora", fake urgency, profit screenshots, and individual gain testimonials.
- Use educational, conditional, orientative language unless the user provides a different approved compliance model.
- For calculators, diagnostics, quizzes, and simulators, label outputs as scenarios, ranges, profiles, or educational potential. Do not call them personalized financial advice or expected profit.

## Validation

- Run `bun install` from the repo root after creating a new workspace app or changing dependencies.
- Run package checks from the root with Bun filters where possible:
  - `bun --filter <brand-id> run lint`
  - `bun --filter <brand-id> run typecheck` when the script exists
  - `bun --filter <brand-id> run build`
- For frontend changes, start the dev server and inspect desktop and mobile viewports in the browser.
- Verify that every form submits through `submitLead`, every form uses `@leadgen/lead-tags`, and every route has metadata.
- For sequential pages, verify progress/back behavior, final result, disclaimer visibility, final lead form, and `qualificationContext` submission shape.
