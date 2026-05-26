---
name: extract-design-system
description: Extract a descriptive design system Markdown document from a brand HTML identity file such as `brands/<brand>/Brand System.html` and save it as `DESIGN.md`. Use when the user wants to convert visual system HTML, token docs, or brand identity pages into a reusable Markdown design-system summary with colors, typography, components, and layout rules.
---

# Extract Design System

## Goal

Turn a brand identity HTML document into a concise, reusable `DESIGN.md` file that another agent can use as a source of truth for landing-page or creative work.

This skill is intended for files like:

- `brands/<brand>/Brand System.html`
- other self-contained HTML brand system or identity documents with CSS tokens and component examples

## Output Contract

Create a Markdown file named `DESIGN.md` in the same directory as the source HTML unless the user requests a different path.

Use this structure:

```md
# Design System: [Project Title]
**Project ID:** [project-id]

## 1. Visual Theme & Atmosphere

## 2. Color Palette & Roles

## 3. Typography Rules

## 4. Component Stylings
* **Buttons:**
* **Cards/Containers:**
* **Inputs/Forms:**

## 5. Layout Principles
```

## Writing Rules

- Write in natural, descriptive design language, not raw token dumps.
- Always include exact color values in hex when available or derivable.
- Explain the function of visual decisions, not only their appearance.
- Prefer precise phrases such as "midnight graphite canvas" or "gently chamfered 8px corners" over generic wording.
- Keep terminology stable across the document.
- If the HTML does not include a direct example for a category such as inputs, infer the closest consistent styling from the token and component system, and state it confidently without adding unnecessary caveats.

## Workflow

1. Read the source HTML.
2. Extract:
   - project title
   - project id from the brand folder name
   - palette entries and roles
   - typography families, sizes, weights, and letter spacing
   - component examples such as buttons, cards, panels, badges, disclaimers, risk widgets
   - layout tokens such as content width, gutter, section spacing, grid density, and corner radii
3. Convert non-hex color values into hex if needed.
4. Generate `DESIGN.md`.
5. Quickly review the result to ensure it is descriptive rather than mechanical.

## Script

Use the bundled script for deterministic extraction:

```bash
node skills/extract-design-system/scripts/extract-design-system.mjs "brands/<brand>/Brand System.html"
```

Optional output override:

```bash
node skills/extract-design-system/scripts/extract-design-system.mjs "brands/<brand>/Brand System.html" "brands/<brand>/DESIGN.md"
```

## When To Refine Manually

After running the script, manually refine only if:

- the HTML is unusually sparse
- section wording is too literal
- the source contains strong brand nuance not captured by tokens alone

Do not create extra documentation files for this skill.
