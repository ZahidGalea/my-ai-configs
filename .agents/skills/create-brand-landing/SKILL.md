---
name: create-brand-landing
description: Create or adapt landing pages in this monorepo from a brand folder under brands, using its MD brand files, SVG logos, visual system, angles, lead capture requirements, i18n files, and compliance guardrails. Use when Codex is asked to scaffold, build, clone, redesign, or accelerate a page in pages for a lead-generation brand.
---

# Create Brand Landing

## Overview

Build brand-specific lead-generation landings from `brands/*` into `pages/*`. Use the brand Markdown files as the source of truth, keep the existing monorepo contracts intact, and produce real Next.js pages rather than generic marketing mockups.

Landings can be traditional pages, pages with one interactive signature feature, or full sequential value-exchange experiences. For some angles, the best landing is a guided calculator, diagnostic, quiz, or form flow that teaches something before asking for contact details.

## Brand File Structure

Each brand lives in `brands/<brand-id>/` with these files:

- `brand.md` — persona objetivo, positioning, voice, vocabulary, compliance
- `visual-system.md` — palette, typography, logo system, landing templates, iconography
- `angles.md` — index of all angles with short description and links to detail files
- `angles/<angulo-id>-<slug>-landing.md` — landing copy, landing experience, creative-landing match, above-the-fold rules for each angle
- `angles/<angulo-id>-<slug>-creatives.md` — Meta ad packs (image, video, carousel, copy) for each angle
- `logo.svg`, `logo-light.svg`, `logo-icon.svg`, `logo-wordmark.svg`, `favicon.svg` — brand SVG assets

## Workflow

1. Ground the task in the repo before editing.
   - Identify the target brand folder and requested angle if any.
   - Read `brands/<brand-id>/brand.md` and `brands/<brand-id>/visual-system.md` for brand identity, persona, palette, and compliance.
   - Read `brands/<brand-id>/angles.md` to find all angles and their routes.
   - For the specific angle, read `brands/<brand-id>/angles/<angulo-id>-<slug>-landing.md` to get landing experience mode, primary UI, lead moment, creative-landing match, and above-the-fold rules.
   - Read `references/landing-repo-patterns.md` before changing files.

2. Create or reuse the landing app.
   - If `pages/<brand-id>` does not exist, copy `pages/goldentraderpro` as the base app and immediately rename package/app identity.
   - If `pages/<brand-id>` exists, edit in place and preserve unrelated local changes.
   - Do not copy generated folders such as `.next`, `node_modules`, Playwright reports, coverage, or caches.

3. Replace the brand, do not recolor the old landing.
   - Use `name`, `domain`, `voice`, `vocabulary`, and `compliance` from `brand.md`.
   - Use palette, typography, and visual cues from `visual-system.md`.
   - Use the real SVG logos from `brands/<brand-id>`; copy them into the page app public assets or inline them into a `BrandLogo` component.
   - Rebuild CSS variables, typography choices, visual motifs, and section concepts around the new brand.

4. Generate the page structure.
   - Use the `mode` field from the angle's `Landing Experience` section to decide the route model: `interactive`, `editorial`, or `hybrid`.
   - Home must include logo, main lead form or a clear path into a lead-capturing experience, concise positioning, compliance-aware copy, and links to angle pages.
   - For a full-brand request, create one route per angle in `angles.md`. For a single-angle request, create only that angle route plus any home updates needed to reach it.
   - Keep sections in separate components under `src/components/<route-or-angle>/`; never put a full landing in one page file.
   - For sequential value exchange pages, make the first screen the first meaningful step of the flow. The route should still use separate components for the shell, steps, result, and final lead form.

5. Wire leads and i18n.
   - Add all `formId`, `source`, and `crmTag` values to `packages/lead-tags/src/index.ts`; import from `@leadgen/lead-tags` in pages/components.
   - Use `@leadgen/ui` `LeadForm` and `@leadgen/next-utils` `submitLead`.
   - For sequential flows, keep answers in local component state and pass a compact JSON string through `LeadForm` as `hidden.qualificationContext` only on the final submit.
   - Store messages as `messages/{locale}/common.json` plus one JSON file per route/page, and import every namespace in `src/i18n/request.ts`.

6. Validate before finishing.
   - Run the relevant package checks: lint, typecheck when available, and build.
   - Start the app and verify desktop/mobile rendering with the browser when UI changed.
   - Confirm every form uses lead tags, every route has metadata, and forbidden compliance terms are absent.

## Design Rules

- Build the actual landing experience as the first screen; no generic SaaS landing or placeholder hero.
- Do not force every angle into a traditional hero/sections/form layout. If the ad promise is a calculation, diagnostic, profile, route, or potential estimate, the page may be the flow itself.
- Sequential value exchange pages must show progress, ask one small decision at a time, reveal a useful educational result before the contact form, and provide a visible disclaimer near numeric or financial outputs.
- Match the brand's `Required visual cues` from `visual-system.md` and avoid the `Visual cues a evitar`.
- Use CTAs from the angle's landing file or compliance-safe variants. Avoid guarantees, regulated-advice language, fake results, balance screenshots, or "invest now" pressure.
- Frame outputs as ranges, scenarios, profiles, or educational potential. Never present them as guaranteed gain, personalized investment advice, or a promise that a call will produce profit.
- Make disclaimers visible and readable, especially in financial/trading/crypto angles.
- Preserve the project's restrained component style: cards only for real repeated items, modals, or forms; sections should be full-width bands or unframed layouts.
