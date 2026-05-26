---
name: create-brand-video-creative
description: Create or adapt paid video creatives in the Remotion workspace from brand MD files, angle creatives files, brand assets, visual systems, voiceover, ElevenLabs timestamps, scene-timed subtitles, shared video layout components, and render verification. Use when Codex is asked to create, clone, redesign, add audio/subtitles to, or render creatives under creatives-videos/src for any brand or angle in this monorepo.
---

# Create Brand Video Creative

## Goal

Build real Remotion video creatives for lead-generation brands. The output should be a renderable composition, not a mockup: brand-aligned visuals, compliance-safe copy, optional ElevenLabs voiceover, scene timing from audio timestamps, subtitles, and verified MP4 output.

Use this alongside `$remotion-best-practices` for Remotion mechanics and `$text-to-speech` when generating ElevenLabs audio.

## Workflow

1. Ground the task before editing.
   - Read `README.md`, `creatives-videos/README.md`.
   - Read `brands/<brand>/brand.md` and `brands/<brand>/visual-system.md` for brand identity, compliance, and visual system.
   - Read `brands/<brand>/angles/<angulo-id>-<slug>-creatives.yml` for the target angle — pack ids, hooks, scene scripts, vid_* fields, and props variables.
   - Identify brand id, requested angle id, campaign promise, CTA, compliance language, visual system, and destination.
   - Inspect existing `creatives-videos/src/<brand>/` and `creatives-videos/src/shared/`.
   - Preserve user edits and unrelated dirty files.

2. Apply mandatory production constraints.
   - Videos must be 15 seconds or shorter. At 30 fps, `durationInFrames` must be `<= 450`.
   - The hook must be visible or audible in the first 6 seconds. The first hook block starts at frame 0 and `hookEndFrame` must be `<= 180` at 30 fps.
   - **Maximum 3 scenes per video.** Fewer scenes = more time per scene = readable. Each scene must be at least 100 frames (~3.3s) so the viewer can read the headline, the visual, and the captions without rushing. If the narrative needs more beats, consolidate them inside a single scene using sequential sub-elements (e.g. calculator inputs → result card → route chips all appearing within one `Sequence`), not by adding a fourth scene.
   - Every video creative must be registered/renderable in 9:16, 1:1, and 16:9.
   - Use these dimensions unless the user explicitly overrides them: 9:16 `1080x1920`, 1:1 `1080x1080`, 16:9 `1920x1080`.
   - Every video must use the brand: brand tokens, official logo/asset, and brand-specific copy/CTA from the brand folder.
   - Add/update `creatives-videos/src/composition-metadata.json` for each creative and run `bun run validate:rules` from `creatives-videos`.

3. Define a compact video brief.
   - One core idea per creative.
   - Pick the format: static motion ad, route explainer, checklist, diagnostic teaser, demo preview, market context, or CTA spot.
   - Use compliance-safe language: educational, conditional, orientative. Avoid guarantees, fake results, "invest now", screenshots of balances, aggressive trading aesthetics, or promised returns.
   - For trading/finance brands, include a readable disclaimer in the video shell.

4. Build or reuse brand modules.
   - Keep brand tokens in `creatives-videos/src/<brand>/theme.ts`.
   - Keep default props/copy in `video-props.ts`.
   - Keep brand-specific layout wrappers in `layout.tsx`, delegating to shared components when possible.
   - Put reusable cross-brand primitives in `creatives-videos/src/shared/`, such as `video-layout.tsx`, `scene-timed-captions.tsx`, and animation helpers.
   - Keep assets in `creatives-videos/public/brands/<brand>/` and audio in `creatives-videos/public/audio/<brand>/`.

5. Design the Remotion composition.
   - Use 30 fps unless the user requests otherwise.
   - Register all required format variants in `creatives-videos/src/root.tsx`.
   - Use `Sequence`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, and local animation helpers.
   - Do not use CSS transitions, CSS keyframes, or Tailwind animation classes.
   - Structure the video in exactly 3 scenes: **Hook** (problem / attention), **Insight** (mechanism / evidence), **CTA** (close / action). Map all narrative beats into these three slots.
   - Inside a multi-beat scene (e.g. Insight), drive sub-element visibility with frame-relative `interpolate` thresholds rather than adding more `Sequence` wrappers. `useCurrentFrame()` inside a `Sequence` returns frames relative to the sequence start — use that to stagger sub-elements.
   - Make text accessible. Use large readable text, avoid tiny captions, and keep subtitles away from infographics and the legal disclaimer.

6. Add voiceover when requested or useful.
   - Write a short Spanish script that follows the scene order.
   - Use ElevenLabs `/with-timestamps`, not the simple MP3 endpoint, so scene durations can follow real pronunciation.
   - Save:
     - `creatives-videos/public/audio/<brand>/<creative-id>-voiceover.mp3`
     - `creatives-videos/public/audio/<brand>/<creative-id>-voiceover-alignment.json`
   - Use `scripts/generate-elevenlabs-voiceover.js` when possible instead of retyping fetch logic.
   - Use voice ids intentionally. For serious Spanish finance education, Daniel (`onwK4e9ZLuTAKqWW03F9`) is a good default.

7. Sync video to audio.
   - Convert ElevenLabs alignment into `sceneTimings`: scene id, text, character range, start/end seconds, `from`, and `durationInFrames`.
   - Drive `Composition.durationInFrames` from the alignment JSON.
   - Drive every scene `Sequence` from `sceneTimings`, with first scene starting at frame 0 if the audio has initial silence.
   - Add `<Audio src={staticFile(...)} />`.

8. Add subtitles and audio wave.
   - Prefer scene-timed subtitle blocks from `sceneTimings` over word-by-word pages.
   - Split each scene into 1-2 clear blocks, not tiny fragments like "es un plan. En".
   - Use `SceneTimedCaptions` from `creatives-videos/src/shared/scene-timed-captions.tsx` when available.
   - Keep subtitles low and clear, above the legal disclaimer, without covering infographics or CTAs.
   - The wave is a "speaking indicator", not a technical amplitude plot unless explicitly requested.

9. Register composition.
   - Add or update `creatives-videos/src/root.tsx`.
   - Use clear composition ids, e.g. `<brand>-<angle-slug>-v1`.
   - Update `creatives-videos/README.md` if the current composition list or commands become stale.

10. Verify before finishing.
   - Run `bun run typecheck` from `creatives-videos`.
   - Run `bun run validate:rules` from `creatives-videos`.
   - Render stills at representative frames from each scene. Inspect them visually.
   - Run `bun run render`. In this environment, Chromium may require escalation because the sandbox blocks browser launch.
   - Use `ffprobe` to confirm video duration and audio stream.
   - Remove temporary stills unless they are intentional deliverables.

## Implementation Rules

- Keep brand-specific decisions in brand folders; keep reusable mechanics in `shared`.
- Do not hardcode a brand's visual offsets directly into shared components. Shared components accept props; brand wrappers pass the brand-specific positions.
- Do not leave generated helper scripts embedded in shell commands when they will be reused. Put them in this skill's `scripts/` folder or in project code.
- Do not expose `.env` secrets. When checking keys, print variable names or lengths only.
- Do not regenerate ElevenLabs audio unless the script/copy/voice changed or the user asks.
- Do not add dependencies unless the repo needs them after the final approach. Remove unused packages.
- Treat legal disclaimer as mandatory for financial creatives and keep it readable.

## Reusable Resources

- Read `references/remotion-video-patterns.md` before implementing a new creative or refactoring shared video primitives.
- Use `scripts/generate-elevenlabs-voiceover.js` to generate MP3 + alignment JSON + scene timings from a scene JSON file.

Example scene input (always 3 scenes — Hook, Insight, CTA):

```json
[
  {"id": "hook",    "label": "Hook",    "text": "Tu ahorro parado pierde fuerza con la inflación."},
  {"id": "insight", "label": "Insight", "text": "Calcula el efecto. Ve un resultado claro. Descubre tres rutas según tu perfil."},
  {"id": "cta",     "label": "CTA",     "text": "Calcula tus opciones ahora."}
]
```

Keep each scene text short enough that, at ~0.4 s/word, the total audio fits within 13–14 s (leaving ~1–2 s headroom before the 15 s limit). Aim for each scene to generate ≥100 frames (≥3.3 s) so it is readable. After dry-run, verify `durationInFrames <= 450` before calling the live API.

Example command:

```bash
set -a; source creatives-videos/.env; set +a
node .agents/skills/create-brand-video-creative/scripts/generate-elevenlabs-voiceover.js \
  --brand goldentraderpro \
  --creative bootcamp-15min-route \
  --scenes /tmp/voiceover-scenes.json
```

Validate scene JSON before spending API credits:

```bash
node .agents/skills/create-brand-video-creative/scripts/generate-elevenlabs-voiceover.js \
  --brand goldentraderpro \
  --creative bootcamp-15min-route \
  --scenes /tmp/voiceover-scenes.json \
  --dry-run true
```

## Final Response

When finishing, report:

- creative/composition id
- voiceover and subtitle source
- files changed
- verification run
- MP4 output path
- any render limitation or required user review
