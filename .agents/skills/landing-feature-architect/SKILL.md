---
name: landing-feature-architect
description: Design, choose, and implement brand-aligned signature features for lead-generation landing pages. Use when is asked to create, improve, redesign, optimize, or add conversion features to landings in this monorepo, especially interactive calculators, quizzes, simulators, diagnostic maps, market dashboards, TradingView widgets, proof modules, or any "wow" section that should make the visitor feel the offer is valuable, credible, technological, and potentially financially useful while respecting brand voice, i18n, lead capture, and compliance.
---

# Landing Feature Architect

## Goal

Turn a landing page from a static pitch into a felt product experience. Each angle should have one signature feature that makes the visitor think: "this understands my situation, shows me something useful, and is worth leaving my details for."

The feature must serve conversion, brand trust, and compliance. Do not add spectacle that fights the brand or implies guaranteed financial outcomes.

Some landings should not look like traditional content pages at all. When the angle is better served by participation before persuasion, use a **Sequential Value Exchange Landing**: a guided calculator, diagnostic, quiz, or simulator where the visitor gives small inputs, receives an educational result, and only then reaches the final lead form.

## Core Workflow

1. Read the local context before ideating:
   - `README.md`
   - `brands/<brand>/brand.md` — persona, positioning, voice, vocabulary, compliance
   - `brands/<brand>/visual-system.md` — palette, typography, visual cues
   - `brands/<brand>/angles.md` — index of angles and routes
   - `brands/<brand>/angles/<angulo-id>-<slug>-landing.md` for the target angle — landing experience mode, primary UI, lead moment, creative-landing match, above-the-fold rules
   - existing `pages/<brand>/messages/{locale}` files
   - existing components under `pages/<brand>/src`
   - `packages/ui/src` when reusable widgets may help

2. Extract a feature brief:
   - visitor desire: what outcome do they want to believe is possible?
   - visitor fear: what makes them hesitate?
   - credibility gap: what proof or product behavior would make the claim feel real?
   - ad/message match: what did the ad or angle promise before the click?
   - brand mode: calm mentor, expert trading desk, automation cockpit, luxury advisory, etc.
   - compliance limits: forbidden terms, required disclaimers, regulated-advice boundaries
   - data/trust exchange: what useful result does the visitor get for sharing inputs?
   - lead action: what exact form, download, call, or quiz completion should follow?
   - landing mode: traditional landing, landing with a signature feature, or sequential value exchange landing

3. Choose the experience model before choosing sections:
   - **Traditional landing**: use when the offer needs story, proof, and explanation before the form.
   - **Landing with signature feature**: use when a content page still needs one strong interactive module.
   - **Sequential Value Exchange Landing**: use when the calculator, diagnostic, quiz, or guided form is the page itself and the lead form should appear after the result.

4. Choose one signature feature, not a pile of sections. Score candidates 1-5 on:
   - desire intensity
   - brand fit
   - perceived technology
   - credibility/proof
   - user participation
   - message match
   - transparent personalization
   - compliance safety
   - performance and mobile fit
   - implementation speed using existing patterns

5. Design the feature as an experience:
   - input: what does the visitor provide or select?
   - reveal: what visual, score, map, scenario, dashboard, or route appears?
   - interpretation: what does the result mean in plain language?
   - limits: what should the result not be mistaken for?
   - next step: what CTA naturally follows?
   - qualification context: what short JSON summary should be passed to the final lead form?

6. Implement using repo conventions:
   - Keep copy in `messages/{locale}` files, split by page.
   - Use `LeadForm` and IDs from `@leadgen/lead-tags`; never hardcode form metadata.
   - For sequential landings, keep wizard inputs/results in local component state and pass a summarized JSON string as `hidden.qualificationContext` on the final `LeadForm`.
   - Use existing component, CSS, i18n, and routing patterns from the landing.
   - Prefer reusable components from `@leadgen/ui` when they fit the feature.
   - Keep the page's first screen experiential when possible, not just logo + copy + form.
   - Keep interactions light enough to preserve Core Web Vitals, especially INP.

7. Verify:
   - Run the relevant lint/build/typecheck command if available.
   - For frontend changes, open the local page in the browser and check desktop/mobile.
   - Confirm no text overlaps, no widgets render blank, and no CTA/forms broke.
   - Re-read financial copy for prohibited promises before finishing.

## Feature Rules

- Make the feature specific to the angle. "Interactive calculator" is generic; "Mapa de Potencial" for savings/investing is specific.
- Show the user's situation changing from uncertainty to a route, score, scenario, or next step.
- Use numbers carefully. Prefer ranges, scenarios, relative comparisons, and educational framing over promised outcomes.
- Keep the user in control. The feature can suggest what to learn, compare, or explore; it must not decide regulated financial actions for them.
- Make it visually inspectable. Dashboards, maps, sliders, timelines, market panels, and calculators usually beat plain cards.
- Use progressive disclosure: ask for the smallest useful input first, then reveal detail as the visitor engages.
- Treat personalization as a value exchange. Explain why inputs are requested and what result they unlock.
- When the feature is the full landing, keep steps short, show progress, allow back/adjust actions, reveal a useful result before asking for contact details, and end in the final `LeadForm`.
- Do not persist partial answers by default. Do not add localStorage, cookies, abandoned-step capture, or step-by-step CRM writes unless the user explicitly asks and the compliance model allows it.
- Store only a compact `qualificationContext` summary with the final lead, such as selected route, range bucket, intent, timeline, profile, and result label. Avoid sensitive free-text financial details unless required.
- Use AI language only when the product actually uses AI in the claimed way. Avoid vague claims like "AI-powered profits" or "expert AI forecasts" unless substantiated.
- Avoid fake social proof, fabricated performance, guaranteed income, "best investment" language, and before/after wealth narratives.

## Pattern References

Read `references/research-basis.md` when the user asks for rationale, current practices, or evidence behind the skill.

Read `references/signature-feature-patterns.md` when selecting the best feature for a landing angle.

Read `references/tradingview-widgets.md` when the landing involves finance, markets, trading, crypto, commodities, macro context, or when the user asks to use TradingView widgets.

## TradingView Guidance

The repo has reusable TradingView components in `@leadgen/ui`:

- `TradingViewHorizontal`
- `TradingViewWidget`
- `TradingViewHeatMap`

Use them when live market context increases credibility or seriousness. Do not use them if charts would make a calm educational brand feel like aggressive trading.

TradingView widgets are credibility surfaces, not promises. Pair them with copy like "market context", "educational example", "relative movement", or "scenario exploration"; never "signal to buy", "guaranteed profit", or "copy this trade".

## Example: GreenSignalGPT

For `greensignalgpt`, the best signature feature is not a live trading dashboard. The brand is a calm educational guide, so the feature should be a "Mapa de Potencial":

- input: savings amount, time horizon, and risk comfort
- reveal: three routes, such as "Cuenta quieta", "Ruta conservadora", and "Ruta con crecimiento potencial"
- interpretation: educational notes about inflation, liquidity, risk, and next concepts to learn
- next step: "Recibir mi mapa educativo" or "Descargar la guia"

This creates a technological and financially interesting moment without implying personalized advice or guaranteed returns.

## Agent Output

When you use this skill, include a short implementation note in your final response:

- feature chosen and why
- files changed
- verification run
- any compliance or widget caveat
