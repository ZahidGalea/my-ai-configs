---
name: gpt-image-2-prompt-improver
description: Use when the user wants to improve, rewrite, audit, structure, or make production-ready prompts for OpenAI GPT image generation, especially gpt-image-2. Trigger for image prompts, image edits, ads, infographics, logos, UI mockups, human scenes, compositing, marketing creatives with in-image text, or requests like "mejora este prompt para imagen", "prompt para gpt-image-2", "make this image prompt better", "optimiza este prompt", or "convierte esto en un prompt de imagen".
---

# GPT Image 2 Prompt Improver

Turn rough image ideas into clear, production-ready prompts for `gpt-image-2`. Prefer a skimmable brief over clever syntax. The output should help the model understand the intended use, visual mode, composition, subject behavior, exact text, and constraints.

## Prompting Fundamentals

The following prompting fundamentals are applicable to GPT image generation models. They are based on patterns that showed up repeatedly in alpha testing across generation, edits, infographics, ads, human images, UI mockups, and compositing workflows.

**Structure + goal:** Write prompts in a consistent order (background/scene -> subject -> key details -> constraints) and include the intended use (ad, UI mock, infographic) to set the "mode" and level of polish. For complex requests, use short labeled segments or line breaks instead of one long paragraph.

**Prompt format:** Use the format that is easiest to maintain. Minimal prompts, descriptive paragraphs, JSON-like structures, instruction-style prompts, and tag-based prompts can all work well as long as the intent and constraints are clear. For production systems, prioritize a skimmable template over clever prompt syntax.

**Specificity + quality cues:** Be concrete about materials, shapes, textures, and the visual medium (photo, watercolor, 3D render), and add targeted "quality levers" only when needed (e.g., film grain, textured brushstrokes, macro detail). For photorealism, include the word "photorealistic" directly in the prompt to strongly engage the model's photorealistic mode. Similar phrases like "real photograph," "taken on a real camera," "professional photography," or "iPhone photo" can also help, but detailed camera specs may be interpreted loosely, so use them mainly for high-level look and composition rather than exact physical simulation.

**Composition:** Specify framing and viewpoint (close-up, wide, top-down), perspective/angle (eye-level, low-angle), and lighting/mood (soft diffuse, golden hour, high-contrast) to control the shot. If layout matters, call out placement (e.g., "logo top-right," "subject centered with negative space on left"). For wide, cinematic, low-light, rain, or neon scenes, add extra detail about scale, atmosphere, and color so the model does not trade mood for surface realism.

**People, pose, and action:** For people in scenes, describe scale, body framing, gaze, and object interactions. Examples: "full body visible, feet included," "child-sized relative to the table," "looking down at the open book, not at the camera," or "hands naturally gripping the handlebars." These details help with body proportion, action geometry, and gaze alignment.

**Constraints (what to change vs preserve):** State exclusions and invariants explicitly (e.g., "no watermark," "no extra text," "no logos/trademarks," "preserve identity/geometry/layout/brand elements"). For edits, use "change only X" + "keep everything else the same," and repeat the preserve list on each iteration to reduce drift. If the edit should be surgical, also say not to alter saturation, contrast, layout, arrows, labels, camera angle, or surrounding objects.

**Text in images:** Text works best when instructions are very specific. Put literal text in quotes or ALL CAPS, keep it short, and specify typography details: font style, weight, approximate size, color, placement, alignment, and contrast. For brand names or uncommon words, spell them out letter-by-letter in a note (e.g., `S-T-R-I-P-E`). Example: `Add the headline "WEEKLY PLAN" in bold sans-serif, white, centered at the top, 72pt. No other text.`

**Self-contained creative prompts:** For ads and marketing creatives, each prompt should fully define the specific creative. Avoid relying on generic reusable style overlays that can contradict the prompt. Shared brand rules should be compact guardrails only (palette, mood, forbidden territory), while the creative prompt itself controls subject, composition, text, CTA, proof elements, exclusions, and safe margins.

**No ratio or output dimensions inside prompts:** Do not specify aspect ratio, output size, pixel dimensions, or platform placement dimensions inside the prompt text (for example `1:1`, `4:5`, `9:16`, `square`, `vertical`, `portrait`, `landscape`, `1080x1920`, or "feed/story/reel size"). Ratio, size, and final crop are controlled by generation code, not by the prompt. Prompts may describe layout behavior such as "centered stack", "split composition", "wide negative space", or "keep text within safe margins", but must not bind that layout to a specific ratio.

## Default Workflow

1. Identify the asset type: generation, edit, infographic, logo, ad, UI mockup, human scene, compositing, or marketing creative with text.
2. Ask only for missing information that blocks the result. If reasonable, infer conservative defaults and state them briefly.
3. Diagnose the original prompt before rewriting it. Keep this short and practical.
4. Rewrite the prompt in a consistent order:
   - intended use and format
   - background or scene
   - subject
   - key visual details
   - composition, camera, lighting, mood
   - exact text or labels
   - constraints and preserve rules

6. Keep the final prompt ready to paste into an image generation tool.

## Output Format

For most requests, return:

```text

Improved prompt:
"""
[prompt]
"""

Notes:
- [only include important assumptions, tradeoffs, or next iteration advice]
```

If the user asks for multiple variations, create 2-4 prompts with distinct creative directions. Do not bury the final prompt inside long explanation.

## Prompt Diagnosis

Before writing the improved prompt, identify only the meaningful weaknesses. Do not list generic issues to make the diagnosis look longer.

Check for:

- Missing intended use or output format.
- Weak subject, scene, or hierarchy.
- Unclear composition, placement, lighting, or mood.
- Missing material, texture, medium, or realism cues.
- Weak constraints: no watermark, no extra text, no unrelated logos, preserve identity/layout/geometry.
- Text risk: exact copy, typography, placement, or legibility not specified.

If the original prompt is already strong, say so briefly and improve only the missing controls.

## Prompt Rules

- Include the intended use: ad, landing hero, product mockup, infographic, logo, UI concept, social post, etc.
- Do not include aspect ratio, output dimensions, platform placement dimensions, or crop targets in the prompt. Avoid terms such as `1:1`, `4:5`, `9:16`, `square`, `vertical`, `portrait`, `landscape`, `1080x1080`, `1080x1350`, `1080x1920`, "story size", "reel size", or "feed placement" unless they are part of visible copy requested by the user.
- Use labeled segments or line breaks for complex prompts.
- Do not overoptimize. If a simple prompt is already clear, preserve its intent and add only the controls that materially improve the result.
- Do not inflate short prompts into long production briefs unless the task is complex, text-heavy, brand-sensitive, or composition-critical.
- For photorealism, include `photorealistic` directly.
- Specify framing, viewpoint, perspective, placement, lighting, mood, atmosphere, and color direction when composition matters.
- Use concrete visual nouns: materials, shapes, textures, garments, props, surfaces, environment, typography style.
- Include exclusions and invariants: no watermark, no extra text, no unrelated logos, preserve identity, preserve layout, keep camera angle, keep surrounding objects.
- For edits, use: `Change only [X]. Keep everything else the same.` Repeat critical preserve rules.
- Avoid overloading a single prompt with too many competing ideas. Suggest a base prompt plus small follow-up edits when needed.


## Infographics

Use high information structure. Define audience, title, sections, labels, flow direction, hierarchy, and desired density.

Infographics are useful for explainers, posters, labeled diagrams, timelines, and "visual wiki" assets. For dense layouts or heavy in-image text, explicitly request sharp text rendering and clear label hierarchy. Keep label copy short. For production-critical dense text, recommend polishing final typography in a design tool after generation.

Prompt pattern:

```text
Create a detailed infographic for [audience] explaining [topic].
Format: [poster / labeled diagram / timeline / visual wiki].
Structure: [top-to-bottom flow / left-to-right process / central object with callouts].
Include these sections: [list].
Visual style: clean, legible, technical, polished, with clear labels and arrows.
Text: render labels clearly, sharply, and keep wording concise.
No watermark, no unrelated logos, no decorative clutter.
```

## Ads and Marketing Creatives

Write these like a creative brief. Include brand, audience, culture, concept, composition, copy, typography, and restrictions.

For Meta/social ads, prefer complete per-creative prompts with strong operational control:

- State the exact platform/use case and audience.
- Define the visual concept in one sentence.
- Specify subject or proof element behavior, not just mood.
- Specify composition with placements or proportions when important (e.g., left 55% typography, right 45% person).
- Specify text hierarchy and typography for headline, support line, CTA, badge, and disclaimer.
- Put all visible copy in a clearly labeled `Exact text` block.
- Say each string should appear exactly once, verbatim, with correct accents.
- Include concise `STRICT EXCLUSIONS` specific to the creative.

Prompt pattern:

```text
Create a polished [platform/format] ad for [brand].
Audience: [target audience].
Positioning: [brand promise].
Concept: [scene or idea].
Visual direction: [vibe, style, color, photography/rendering cues].
Composition: [subject placement, negative space, text placement].
Ad copy EXACTLY: "[copy]"
Typography: [font style, size relationship, color, placement], clean and legible.
Render the text exactly once, verbatim, with no extra characters.
No watermark, no unrelated logos, no extra text.
```

## Text In Images

- Put literal text in quotes or ALL CAPS and label it `EXACT`.
- Keep text short. Short headlines, labels, badges, and CTA text render more reliably than paragraphs.
- Ask for verbatim rendering, no extra characters, and text appearing exactly once.
- Specify typography: font style, weight, color, approximate size, placement, alignment, contrast, and kerning.
- For uncommon brand names or tricky words, spell them letter-by-letter in a note.
- For dense layouts, say `sharp text rendering`, `crisp vector-like text`, or `fully legible labels`.

Good text instruction example:

```text
Add the headline "WEEKLY PLAN" in bold sans-serif, white, centered at the top, 72pt. No other text.
```

## People, Pose, and Action

For people, explicitly describe:

- body framing: close-up, half-body, full body visible, feet included
- scale: child-sized relative to objects, person in foreground/background
- gaze: looking at camera, looking down at product, looking away
- action geometry: hands gripping handlebars, holding cup naturally, sitting on chair with feet on floor
- identity constraints for edits: preserve identity, face shape, skin tone, hairstyle, clothing, pose, and camera angle


## Final Checks

Before delivering, verify the prompt answers:

- What is the image for?
- What should be in the image?
- Where should key elements be placed?
- What visual medium or realism level is intended?
- What exact text must appear, if any?
- What must not change or appear?
