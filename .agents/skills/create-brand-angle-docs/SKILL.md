---
name: create-brand-angle-docs
description: Create, rebuild, or normalize brand angle source files under `brands/<brand>/angles/`, including `*-landing.md`, `*-creatives.yml`, and `*-copies.yml`, plus the corresponding entry in `angles.md`. Use when Codex is asked to generate initial angle docs, recreate deleted angle files, scaffold new angle documentation before landing or creative production, or clean angle docs so they can become the source of truth for future page and ad work.
---

# Create Brand Angle Docs

## Goal

Generate the source-of-truth files for a brand angle before any landing or creative implementation starts.

This skill only owns brand documentation under `brands/<brand>/`:

- `angles.md`
- `angles/<angle-id>-<slug>-landing.md`
- `angles/<angle-id>-<slug>-creatives.yml`
- `angles/<angle-id>-<slug>-copies.yml`

Do not use this skill to build `pages/**`, `creatives/src/**`, or media assets. Those come later via other skills.

## When To Use

Use this skill when the user wants to:

- create the first version of angle docs
- recreate deleted or missing `landing.md` / `creatives.yml` / `copies.yml` files
- standardize angle docs before rebuilding pages or ads
- turn a raw angle idea into repo-native source docs

Use `$create-brand-landing` only after these docs exist and the user wants actual page implementation.
Use `$create-brand-video-creative` only after these docs exist and the user wants real Remotion production work.

## Inputs Required

Before writing files, ground the work in:

1. `brands/<brand>/brand.md`
2. `brands/<brand>/DESIGN.md` (or `visual-system.md`)
3. `brands/<brand>/angles.md`
4. Existing sibling files in `brands/<brand>/angles/` if they exist
5. `brands/Creatives-direction.md`

If the brand already has one good angle doc, use it as the structural reference before inventing formatting.

## Workflow

1. Identify the brand and angle.
   - Define brand id, angle id, slug, route, hook, mechanism, CTA, and fit with the avatar in `brand.md`.

2. Create or update the `angles.md` index entry.
   - Keep `angles.md` concise.
   - Do not restate the full avatar from `brand.md`.
   - Use a short `Contexto del angulo` instead.
   - Link each angle to `angles/<id>-<slug>-landing.md` and `angles/<id>-<slug>-creatives.yml`.

3. Create the landing source file.
   - Use `references/landing-template.md`.
   - The file must define:
     - `Landing Copy`
     - `Landing Experience`
     - `Creative-Landing Match`
     - `Above the Fold Rule`
   - The first screen must match the action promised in the creative.
   - Keep compliance to minimum legal visible. Do not turn the doc into a disclaimer wall.

4. Create the creatives and copies source files.
   - `creatives.yml` holds the image/slide generation prompts. Use `references/creatives-template.yml`.
     - Include at least 3 packs unless the user asks for fewer.
     - Every creative item is a `kind: image` or `kind: slide` entry with an `id`, a `title`, and a `prompt`.
     - Write each `prompt` in structured English following the documented sections: Audience, Positioning, Visual concept, Composition, Visual direction, Typography, "Exact text", "Text controls", and "STRICT EXCLUSIONS".
   - `copies.yml` holds the Meta ad copy and angle metadata. Use `references/copies-template.yml`.
     - Include `core_message`, `audience_pain`, `proof_anchor`, `ads_copy` (primary_text with hook/prueba/mecanismo tones, headline, description, cta_button), `creatives_ref`, and `compliance_notes`.
   - Do not put Meta ad copy inside `creatives.yml`; it lives in `copies.yml`.
   - Use the brand visual system and `brands/Creatives-direction.md` rules.
   - Allow commercial claims that are conditional and credible; avoid guarantees, fake proof, or regulated-advice implications.

5. Keep the files implementation-ready.
   - `landing.md` must be specific enough that another agent can build the page without product decisions left open.
   - `creatives.yml` must be specific enough that another agent can produce image prompts without redefining the angle.

## Writing Rules

- Keep tone and vocabulary aligned with `brand.md`.
- If the brand has already been consolidated to one avatar, archive or exclude off-brand angles instead of blending them back in.
- Prefer short concrete sections over long theory.
- For `landing.md`, make the primary UI explicit: calculator, quiz, demo, comparison, checklist, scan, or route.
- For `creatives.yml`, one pack = one dominant idea.
- Do not hardcode copy that contradicts the brand's compliance section.
- Do not touch `pages/**` or `creatives/**` from this skill.

## Files To Read As Needed

- `references/landing-template.md`
- `references/creatives-template.yml`
- `references/copies-template.yml`

## Final Response

When finishing, report:

- brand id
- angle id(s) created or updated
- files changed
- whether any old angle was marked `legacy / fuera de scope`
