# Remotion Video Patterns For Lead Generation Creatives

## Repo Shape

- `creatives-videos/src/root.tsx`: registers compositions.
- `creatives-videos/src/composition-metadata.json`: declares production-rule metadata.
- `creatives-videos/src/<brand>/theme.ts`: brand tokens.
- `creatives-videos/src/<brand>/video-props.ts`: default copy, CTA, disclaimer, logo.
- `creatives-videos/src/<brand>/layout.tsx`: brand wrappers around shared shell/scene components.
- `creatives-videos/src/<brand>/<creative>.tsx`: composition scenes.
- `creatives-videos/src/<brand>/voiceover-captions.tsx`: brand-specific caption blocks and alignment import.
- `creatives-videos/src/shared/animation.ts`: frame-based animation helpers.
- `creatives-videos/src/shared/video-layout.tsx`: reusable shell, header, scene text.
- `creatives-videos/src/shared/scene-timed-captions.tsx`: scene-timed subtitle blocks and audio wave.
- `creatives-videos/public/brands/<brand>/`: logo assets.
- `creatives-videos/public/audio/<brand>/`: generated voiceover assets.

## Scene Timing Pattern

Use the ElevenLabs alignment JSON as the single source of truth after audio is generated:

```ts
import voiceoverAlignment from '../../public/audio/<brand>/<creative>-voiceover-alignment.json'

const voiceoverSceneTimings = voiceoverAlignment.sceneTimings
export const compositionDuration = voiceoverAlignment.durationInFrames
```

In the composition, use the scene timing frame offsets:

```tsx
const getSceneStart = (index: number) => (index === 0 ? 0 : voiceoverSceneTimings[index].from)
const getSceneDuration = (index: number) =>
  voiceoverSceneTimings[index].durationInFrames + (index === 0 ? voiceoverSceneTimings[index].from : 0)
```

The first scene starts at frame 0 even if audio starts after a few silent frames.

## Shared Layout Pattern

Use shared components for mechanics and brand wrappers for brand taste:

```tsx
export const BrandVideoShell = ({ children, logoSrc, disclaimer }) => (
  <SharedVideoShell
    logoSrc={logoSrc}
    disclaimer={disclaimer}
    theme={brandTheme}
    header={{
      left: '20%',
      top: 30,
      logoHeight: 150,
      showBadge: false,
    }}
  >
    {children}
  </SharedVideoShell>
)
```

Do not bake brand offsets into shared components. Brand wrappers pass `header` values.

## Subtitle Pattern

Prefer scene-level subtitle blocks:

```tsx
const captionBlocksByScene = {
  hook: ['First readable block,', 'second readable block.'],
  cta: ['Final clear CTA.'],
}

export const BrandVoiceoverCaptions = () => (
  <SceneTimedCaptions
    sceneTimings={voiceoverAlignment.sceneTimings}
    captionBlocksByScene={captionBlocksByScene}
    theme={brandTheme}
  />
)
```

Rules:

- 1-2 blocks per scene when possible.
- Use large text; captions must be readable on mobile social feeds.
- Keep captions low but not on top of legal copy.
- Do not split captions using word-level pages unless the user explicitly wants TikTok-style word highlighting.

## Production Rules

- Videos must be 15 seconds or shorter.
- Hook must land in the first 6 seconds.
- Register 9:16 `1080x1920`, 1:1 `1080x1080`, and 16:9 `1920x1080`.
- 30 fps.
- Use brand tokens, brand logo/asset, and brand-specific copy/CTA.
- Keep one message per scene.
- Remove explanatory body copy when captions already explain the scene.
- Use title, infographic, and captions together; avoid three competing text systems.
- Use brand logos from `public/brands`.
- Make disclaimers visible but do not enlarge them unless asked.

## Verification Checklist

Run from `creatives-videos`:

```bash
bun run typecheck
bun run validate:rules
bun run still -- --frame=<frame> --output=out/<check-name>.png
bun run render
ffprobe -v error -show_entries format=duration -show_entries stream=codec_type,codec_name,channels,duration -of compact=p=0:nk=1 out/<video>.mp4
```

If Remotion render fails with `MachPortRendezvousServer Permission denied`, rerun with escalated permissions. This is an environment/browser sandbox issue, not usually a code issue.
