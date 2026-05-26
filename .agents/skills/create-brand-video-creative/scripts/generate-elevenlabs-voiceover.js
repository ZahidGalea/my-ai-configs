#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const defaultVoiceId = 'onwK4e9ZLuTAKqWW03F9'
const defaultModelId = 'eleven_multilingual_v2'
const defaultOutputFormat = 'mp3_44100_128'
const defaultFps = 30
const defaultHoldSeconds = 1.1

const parseArgs = () => {
  const args = process.argv.slice(2)
  const options = {}

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`)
    }

    const key = arg.slice(2)
    const value = args[i + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }

    options[key] = value
    i += 1
  }

  return options
}

const requireOption = (options, key) => {
  if (!options[key]) {
    throw new Error(`Missing required --${key}`)
  }

  return options[key]
}

const getTimedRange = ({ chars, starts, ends, startIndex, endIndex }) => {
  let first = -1
  let last = -1

  for (let i = startIndex; i <= endIndex && i < chars.length; i += 1) {
    if (/\S/.test(chars[i]) && typeof starts[i] === 'number') {
      first = i
      break
    }
  }

  for (let i = Math.min(endIndex, chars.length - 1); i >= startIndex; i -= 1) {
    if (/\S/.test(chars[i]) && typeof ends[i] === 'number') {
      last = i
      break
    }
  }

  if (first === -1 || last === -1) {
    throw new Error(`Could not map timing for character range ${startIndex}-${endIndex}`)
  }

  return { startSeconds: starts[first], endSeconds: ends[last] }
}

const buildSceneMetadata = ({ scenes, text, alignment, fps, holdSeconds }) => {
  const chars = alignment.characters
  const starts = alignment.character_start_times_seconds
  const ends = alignment.character_end_times_seconds

  const timedScenes = scenes.map((scene, index) => {
    const range = getTimedRange({
      chars,
      starts,
      ends,
      startIndex: scene.characterStartIndex,
      endIndex: scene.characterEndIndex,
    })

    return {
      ...scene,
      startSeconds: Math.max(0, range.startSeconds - (index === 0 ? 0 : 0.08)),
      endSeconds: range.endSeconds + (index === scenes.length - 1 ? holdSeconds : 0.16),
    }
  })

  for (let i = 1; i < timedScenes.length; i += 1) {
    const previous = timedScenes[i - 1]
    const current = timedScenes[i]
    const midpoint = (previous.endSeconds + current.startSeconds) / 2
    previous.endSeconds = midpoint
    current.startSeconds = midpoint
  }

  const audioDurationSeconds = Math.max(...ends.filter((value) => typeof value === 'number'))
  const videoDurationSeconds = Math.max(audioDurationSeconds + holdSeconds, timedScenes[timedScenes.length - 1].endSeconds)
  const sceneTimings = timedScenes.map((scene, index) => {
    const from = Math.max(0, Math.round(scene.startSeconds * fps))
    const nextFrom = index < timedScenes.length - 1 ? Math.round(timedScenes[index + 1].startSeconds * fps) : Math.ceil(videoDurationSeconds * fps)

    return {
      id: scene.id,
      label: scene.label ?? scene.id,
      text: scene.text,
      characterStartIndex: scene.characterStartIndex,
      characterEndIndex: scene.characterEndIndex,
      startSeconds: Number(scene.startSeconds.toFixed(3)),
      endSeconds: Number(scene.endSeconds.toFixed(3)),
      from,
      durationInFrames: Math.max(1, nextFrom - from),
    }
  })

  return {
    fps,
    text,
    audioDurationSeconds: Number(audioDurationSeconds.toFixed(3)),
    videoDurationSeconds: Number(videoDurationSeconds.toFixed(3)),
    durationInFrames: Math.ceil(videoDurationSeconds * fps),
    sceneTimings,
  }
}

const main = async () => {
  const options = parseArgs()
  const brand = requireOption(options, 'brand')
  const creative = requireOption(options, 'creative')
  const scenesPath = requireOption(options, 'scenes')
  const voiceId = options.voice || defaultVoiceId
  const modelId = options.model || defaultModelId
  const languageCode = options.language || 'es'
  const outputFormat = options.format || defaultOutputFormat
  const fps = Number(options.fps || defaultFps)
  const holdSeconds = Number(options['hold-seconds'] || defaultHoldSeconds)
  const outputDir = options.output || path.join('creatives-videos', 'public', 'audio', brand)
  const dryRun = options['dry-run'] === 'true'

  const scenes = JSON.parse(fs.readFileSync(scenesPath, 'utf8'))
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error('Scenes file must be a non-empty JSON array')
  }

  let cursor = 0
  const text = scenes.map((scene) => scene.text).join(' ')
  const scenesWithRanges = scenes.map((scene) => {
    if (!scene.id || !scene.text) {
      throw new Error('Each scene must include id and text')
    }

    const start = text.indexOf(scene.text, cursor)
    if (start === -1) {
      throw new Error(`Could not locate scene text in script: ${scene.id}`)
    }

    cursor = start + scene.text.length
    return {
      ...scene,
      characterStartIndex: start,
      characterEndIndex: start + scene.text.length - 1,
    }
  })

  if (dryRun) {
    console.log(JSON.stringify({ brand, creative, fps, holdSeconds, text, scenes: scenesWithRanges }, null, 2))
    return
  }

  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set')
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=${outputFormat}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      language_code: languageCode,
      apply_text_normalization: 'on',
      voice_settings: {
        stability: Number(options.stability || 0.56),
        similarity_boost: Number(options['similarity-boost'] || 0.78),
        style: Number(options.style || 0.28),
        speed: Number(options.speed || 1.04),
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`ElevenLabs ${response.status}: ${body}`)
  }

  const result = await response.json()
  const alignment = result.normalized_alignment || result.alignment
  if (!alignment) {
    throw new Error('ElevenLabs response did not include alignment')
  }

  fs.mkdirSync(outputDir, { recursive: true })
  const audioPath = path.join(outputDir, `${creative}-voiceover.mp3`)
  const jsonPath = path.join(outputDir, `${creative}-voiceover-alignment.json`)

  fs.writeFileSync(audioPath, Buffer.from(result.audio_base64, 'base64'))

  const metadata = {
    voiceId,
    modelId,
    languageCode,
    outputFormat,
    ...buildSceneMetadata({
      scenes: scenesWithRanges,
      text,
      alignment,
      fps,
      holdSeconds,
    }),
    alignment: result.alignment,
    normalizedAlignment: result.normalized_alignment,
  }

  fs.writeFileSync(jsonPath, `${JSON.stringify(metadata, null, 2)}\n`)
  console.log(JSON.stringify({ audioPath, jsonPath, durationInFrames: metadata.durationInFrames, sceneTimings: metadata.sceneTimings }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
