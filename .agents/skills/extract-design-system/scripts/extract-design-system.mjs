#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error(
    "Usage: node skills/extract-design-system/scripts/extract-design-system.mjs \"brands/<brand>/Brand System.html\" [output-file]",
  );
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = outputArg
  ? path.resolve(outputArg)
  : path.join(path.dirname(inputPath), "DESIGN.md");

const html = fs.readFileSync(inputPath, "utf8");
const brandId = path.basename(path.dirname(inputPath));

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeHtml(value.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(regex, source = html) {
  const match = source.match(regex);
  return match ? match[1].trim() : "";
}

function allMatches(regex, source = html) {
  return [...source.matchAll(regex)];
}

function parseCssValue(selector, property) {
  const regex = new RegExp(
    `${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{[\\s\\S]*?${property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`,
  );
  return firstMatch(regex);
}

function parseRootVar(varName) {
  return firstMatch(new RegExp(`${varName}\\s*:\\s*([^;]+);`));
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function gammaEncode(linear) {
  if (linear <= 0.0031308) {
    return 12.92 * linear;
  }
  return 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
}

function linearSrgbToHex(r, g, b) {
  const channels = [r, g, b].map((channel) => {
    const encoded = gammaEncode(clamp01(channel));
    return Math.round(clamp01(encoded) * 255);
  });
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function oklchToHex(input) {
  const normalized = input.replace(/\s+/g, " ").trim();
  const match = normalized.match(
    /^oklch\(\s*([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+)%?)?\s*\)$/i,
  );
  if (!match) {
    return "";
  }

  const l = Number(match[1]) / 100;
  const c = Number(match[2]);
  const h = (Number(match[3]) * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const r =
    +4.0767416621 * l3 +
    -3.3077115913 * m3 +
    +0.2309699292 * s3;
  const g =
    -1.2684380046 * l3 +
    +2.6097574011 * m3 +
    -0.3413193965 * s3;
  const bl =
    -0.0041960863 * l3 +
    -0.7034186147 * m3 +
    +1.707614701 * s3;

  return linearSrgbToHex(r, g, bl);
}

function toHex(value) {
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed.length === 4
      ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toUpperCase()
      : trimmed.toUpperCase();
  }
  if (/^oklch\(/i.test(trimmed)) {
    return oklchToHex(trimmed);
  }
  return "";
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function describeHue(hex) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 510;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  if (lightness < 0.12) return "Obsidian";
  if (lightness < 0.2) return "Midnight";
  if (lightness > 0.9) return "Chalk";
  if (hue >= 190 && hue < 230) return "Cerulean";
  if (hue >= 160 && hue < 190) return "Teal";
  if (hue >= 35 && hue < 70) return "Amber";
  if (hue >= 0 && hue < 25) return "Ember";
  return "Slate";
}

function descriptiveColorName(baseName, hex) {
  const key = baseName.toLowerCase();
  const special = {
    base: "Midnight Slate",
    "surface 1": "Graphite Panel",
    "surface 2": "Steel Surface",
    texto: "Soft Chalk",
    señal: "Precision Cerulean",
    insight: "Analyst Amber",
    entrada: "Confirmation Teal",
    riesgo: "Risk Ember",
  };
  if (special[key]) {
    return `${special[key]} (${hex})`;
  }
  return `${describeHue(hex)} ${baseName} (${hex})`;
}

function brandTitle() {
  const hero = firstMatch(/<h1 class="hero-h1">([\s\S]*?)<\/h1>/i);
  if (hero) {
    return stripTags(hero)
      .replace(/\s+/g, " ")
      .replace(/\b(\w)(\w*)/g, (_, a, b) => a.toUpperCase() + b);
  }
  const title = firstMatch(/<title>([\s\S]*?)<\/title>/i);
  return stripTags(title.split("—").pop() || title);
}

function sectionDescription(id) {
  const match = html.match(
    new RegExp(`<section class="section" id="${id}">[\\s\\S]*?<p class="sec-desc">([\\s\\S]*?)<\\/p>`, "i"),
  );
  return match ? stripTags(match[1]) : "";
}

function extractMeta() {
  const items = allMatches(
    /<div class="hero-meta-item">\s*<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>\s*<\/div>/gi,
  ).map((match) => ({
    label: stripTags(match[1]),
    value: stripTags(match[2]),
  }));
  return Object.fromEntries(items.map((item) => [item.label.toLowerCase(), item.value]));
}

function extractColors() {
  return allMatches(
    /<div class="swatch">[\s\S]*?<p class="sw-name">([\s\S]*?)<\/p>[\s\S]*?<p class="sw-role">([\s\S]*?)<\/p>[\s\S]*?<span class="sw-val">([\s\S]*?)<\/span>[\s\S]*?<span class="sw-val">([\s\S]*?)<\/span>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,
  ).map((match) => {
    const tokenValue = stripTags(match[3]);
    const tokenName = stripTags(match[4]);
    const hex = toHex(tokenValue);
    return {
      name: stripTags(match[1]),
      role: stripTags(match[2]),
      tokenValue,
      tokenName,
      hex,
    };
  });
}

function extractTypeSpecimens() {
  return allMatches(
    /<div class="type-spec-head">\s*<span>([\s\S]*?)<\/span>[\s\S]*?<\/div>[\s\S]*?<div class="type-spec-body">([\s\S]*?)<\/div>\s*<\/div>/gi,
  ).map((match) => ({
    heading: stripTags(match[1]),
    body: stripTags(match[2]),
  }));
}

function extractTypeScale() {
  return allMatches(
    /<div class="ts-row">\s*<span class="ts-meta">([\s\S]*?)<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/div>/gi,
  ).map((match) => ({
    meta: stripTags(match[1]),
    sample: stripTags(match[2]),
  }));
}

function extractButtons() {
  return allMatches(/<button class="btn ([^"]+)">([\s\S]*?)<\/button>/gi).map((match) => ({
    variant: match[1].trim(),
    label: stripTags(match[2]),
  }));
}

function extractList(titleText) {
  const escaped = titleText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(`<p class="dd-title">${escaped}<\\/p>[\\s\\S]*?<ul class="dd-list">([\\s\\S]*?)<\\/ul>`, "i"),
  );
  if (!match) return [];
  return allMatches(/<li>([\s\S]*?)<\/li>/gi, match[1]).map((item) => stripTags(item[1]));
}

function joinSentence(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function translateArchetype(value) {
  const normalized = value.trim().toLowerCase();
  const map = {
    "mentor operativo": "pragmatic trading mentor",
  };
  return map[normalized] || normalized;
}

function translateRole(value) {
  const normalized = value.trim().toLowerCase();
  const map = {
    "fondo principal": "the primary background canvas",
    "tarjetas, paneles": "cards, panels, and supporting containers",
    "elementos elevados": "elevated surfaces and highlighted modules",
    "texto principal": "primary reading text",
    "acciones, precisión, cta primario": "primary actions, precision cues, and the main CTA",
    "tesis, análisis, educación": "analysis moments, thesis highlights, and educational emphasis",
    "confirmación, take profit": "confirmation states and take-profit markers",
    "stop loss, invalidación": "stop-loss warnings and invalidation messaging",
  };
  return map[normalized] || value.toLowerCase();
}

function buildVisualTheme(meta) {
  const archetype = meta.arquetipo ? translateArchetype(meta.arquetipo) : "technical market mentor";
  return `${projectTitle} is positioned as a ${archetype}: dark, deliberate, and built around process over impulse. The visual atmosphere avoids speculative hype in favor of analytical calm, with a deep neutral canvas, a single dominant signal blue, and explicit risk markers that remain visually dignified instead of being hidden. Density is controlled rather than sparse, giving the interface the feel of a structured trading workstation where judgment, invalidation, and next-step clarity matter as much as opportunity.`;
}

function buildColorPalette(colors) {
  return colors
    .map((color) => {
      const descriptor = descriptiveColorName(color.name, color.hex || color.tokenValue);
      const source = color.hex ? `The source token is defined as ${color.tokenValue}.` : "";
      return `- **${descriptor}:** Use this for ${translateRole(color.role)}. The token name is \`${color.tokenName}\`. ${source}`;
    })
    .join("\n");
}

function buildTypography(specimens, scale) {
  const display = specimens.find((item) => item.heading.toLowerCase().includes("space grotesk"));
  const body = specimens.find((item) => item.heading.toLowerCase().includes("ibm plex sans"));
  const mono = specimens.find((item) => item.heading.toLowerCase().includes("ibm plex mono"));
  const displayScale = scale.find((item) => item.meta.toLowerCase().startsWith("display"));
  const h1Scale = scale.find((item) => item.meta.toLowerCase().startsWith("h1"));
  const bodyScale = scale.find((item) => item.meta.toLowerCase() === "body 15px / normal");
  const labelScale = scale.find((item) => item.meta.toLowerCase().startsWith("label"));

  return `${display?.heading || "Display typography"} carries the hierarchy, using heavy-weight geometric forms for headlines and hero statements. The top of the scale starts at ${displayScale?.meta || "large display sizes"} and compresses letter-spacing into negative values to create a compact, deliberate rhythm; the main heading tier sits around ${h1Scale?.meta || "H1 scale"} for primary section headlines. ${body?.heading || "Body typography"} handles narrative and instructional copy with softer spacing and a more breathable line height, keeping technical explanation readable over dark surfaces; the standard interface body settles around ${bodyScale?.meta || "15px with normal tracking"}. ${mono?.heading || "Mono typography"} is reserved for prices, labels, states, and risk metadata, using all-caps tracking similar to ${labelScale?.meta || "10px / +15%"} so operational data feels precise, machine-adjacent, and scannable.`;
}

function buildButtons(buttons, signalHex, surfaceHex, textHex) {
  const labels = buttons.map((button) => button.label.toLowerCase());
  return `Buttons use compact, gently curved 8px corners with a high-control silhouette rather than pill styling. The primary action is a filled signal tone (${signalHex}) with dark text for instant emphasis on evaluation and next-step actions; the secondary button keeps a transparent field with a signal outline for lower-pressure exploration; the tertiary option falls back to a muted surface fill (${surfaceHex}) with restrained copy color (${textHex}) for demo or educational actions. Label language should stay action-specific and process-led, following patterns like ${joinSentence(labels)} instead of promise-heavy CTA copy.`;
}

function buildCards(surfaceHex, borderHex, signalHex, insightHex, entryHex, riskHex) {
  return `Cards and containers favor softly engineered shells with 12px corners, dark layered backgrounds (${surfaceHex}), and low-contrast structural borders (${borderHex}) instead of dramatic shadow. Important modules use color as semantic structure rather than decoration: signal panels highlight actionable entries with ${signalHex}, insight or disclosure blocks use ${insightHex}, positive confirmation states draw from ${entryHex}, and risk or invalidation cues retain clear visibility through ${riskHex}. The result should feel like a professional dashboard where every panel communicates state, confidence, and consequence at a glance.`;
}

function buildInputs(surfaceHex, borderHex, monoHeading) {
  return `Form controls should inherit the same trading-terminal discipline as the cards: dark surface fields (${surfaceHex}), thin subdued borders (${borderHex}), and compact uppercase helper labels in the mono system (${monoHeading || "IBM Plex Mono"}). Corners should stay lightly rounded rather than soft, focus states should escalate with the signal accent, and spacing should remain clean enough that the form reads as an operational checklist instead of a consumer-marketing widget.`;
}

function buildLayout() {
  const wrapWidth = parseCssValue("\\.wrap", "max-width");
  const wrapPadding = parseCssValue("\\.wrap", "padding");
  const sectionPadding = parseCssValue("\\.section", "padding");
  const heroPadding = parseCssValue("\\.hero", "padding");
  const gridGap = parseCssValue("\\.comp-grid", "gap");
  const logoGrid = parseCssValue("\\.logo-grid", "grid-template-columns");

  return `The layout runs on a disciplined central frame with a maximum content width of ${wrapWidth || "1100px"} and horizontal gutters defined by ${wrapPadding || "48px side padding"}. Major sections breathe through generous vertical spacing (${sectionPadding || "88px rhythm"}), while the hero opens with a larger introductory cadence (${heroPadding || "expanded top/bottom spacing"}) to establish authority before content density increases. Grids favor clean bilateral structures such as ${logoGrid || "two-column compositions"} with narrow seams and a typical module gap around ${gridGap || "20px"}, creating a sharp editorial cadence that feels ordered, technical, and easy to scan.`;
}

const projectTitle = brandTitle();
const meta = extractMeta();
const colors = extractColors();
const specimens = extractTypeSpecimens();
const scale = extractTypeScale();
const buttons = extractButtons();

const surface1 = colors.find((item) => item.tokenName === "--surf-1")?.hex || "";
const surface2 = colors.find((item) => item.tokenName === "--surf-2")?.hex || surface1;
const textHex = colors.find((item) => item.tokenName === "--text")?.hex || "";
const signalHex = colors.find((item) => item.tokenName === "--signal")?.hex || "";
const insightHex = colors.find((item) => item.tokenName === "--insight")?.hex || "";
const entryHex = colors.find((item) => item.tokenName === "--entry")?.hex || "";
const riskHex = colors.find((item) => item.tokenName === "--risk")?.hex || "";
const borderHex = toHex(parseRootVar("--border") || "") || toHex(parseRootVar("--border-dim") || "");

const markdown = `# Design System: ${projectTitle}
**Project ID:** ${brandId}

## 1. Visual Theme & Atmosphere
${buildVisualTheme(meta)}

## 2. Color Palette & Roles
${buildColorPalette(colors)}

## 3. Typography Rules
${buildTypography(specimens, scale)}

## 4. Component Stylings
* **Buttons:** ${buildButtons(buttons, signalHex, surface2, textHex)}
* **Cards/Containers:** ${buildCards(surface2, borderHex, signalHex, insightHex, entryHex, riskHex)}
* **Inputs/Forms:** ${buildInputs(surface1, borderHex, specimens.find((item) => item.heading.toLowerCase().includes("ibm plex mono"))?.heading)}

## 5. Layout Principles
${buildLayout()}
`;

fs.writeFileSync(outputPath, markdown);
console.log(`Wrote ${outputPath}`);
