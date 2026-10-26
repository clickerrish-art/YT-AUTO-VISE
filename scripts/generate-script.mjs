#!/usr/bin/env node
/**
 * Optional OpenAI-compatible script generation. Defaults to a local endpoint;
 * never invents research, marks similarity review complete, or writes files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildScriptGenerationPrompt } from "./build-script-generation-prompt.mjs";
import { validateScriptDepth } from "./content-quality-gates.mjs";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

const DEFAULT_ENDPOINT = "http://127.0.0.1:1234/v1/chat/completions";

export function validateGenerationEndpoint(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("SCRIPT_GENERATION_ENDPOINT must be a valid URL"); }
  const loopback = ["127.0.0.1", "::1", "localhost"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error("script generation endpoint must use HTTPS or loopback HTTP; remote plaintext endpoints are forbidden");
  }
  if (url.username || url.password) throw new Error("endpoint URL must not embed credentials");
  return url.toString();
}

function normalizeSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > 30) {
    throw new Error("sources must be a non-empty array with at most 30 research records");
  }
  const normalized = sources.map((source, index) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new Error("research source " + (index + 1) + " must be an object");
    }
    for (const field of ["title", "url"]) {
      if (typeof source[field] !== "string" || !source[field].trim()) {
        throw new Error("research source " + (index + 1) + " requires a non-empty " + field);
      }
    }
    let parsedUrl;
    try { parsedUrl = new URL(source.url.trim()); }
    catch { throw new Error("research source " + (index + 1) + " URL must be a valid HTTPS URL"); }
    if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password ||
        /^(?:localhost|127\\.|0\\.0\\.0\\.0|\\[::1\\])$/i.test(parsedUrl.hostname) ||
        /(?:replace[_ -]?with|placeholder|todo|tbd|unknown|example\\.com)/i.test(source.url)) {
      throw new Error("research source " + (index + 1) + " URL must be a non-placeholder public HTTPS URL without embedded credentials");
    }
    return {
      id: String(source.id ?? `source-${index + 1}`).trim(),
      title: source.title.trim(),
      url: parsedUrl.toString(),
      evidenceSummary: typeof source.evidenceSummary === "string" ? source.evidenceSummary.trim() : "",
      evidenceLocator: typeof source.evidenceLocator === "string" ? source.evidenceLocator.trim() : ""
    };
  });
  const ids = normalized.map(source => source.id);
  if (ids.some(id => !id || id.length > 120) || new Set(ids).size !== ids.length) {
    throw new Error("research source IDs must be unique, non-empty and at most 120 characters");
  }
  return normalized;
}

function parseModelJson(content) {
  if (typeof content !== "string" || !content.trim()) throw new Error("provider returned an empty script response");
  let value;
  try { value = JSON.parse(content); }
  catch { throw new Error("provider response was not valid JSON; no script was accepted"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("provider JSON must be an object");
  return value;
}

export async function generateScript({
  format,
  brief,
  endpoint = DEFAULT_ENDPOINT,
  apiKey = "",
  model = "local-model",
  fetchImpl = fetch,
  timeoutMs = 120_000
} = {}) {
  if (!["long_form", "short"].includes(format)) throw new Error("format must be long_form or short");
  if (!brief || typeof brief !== "object" || !Array.isArray(brief.sources) || brief.sources.length === 0) {
    throw new Error("brief must contain explicit research sources before generation");
  }
  const normalizedBrief = { ...brief, sources: normalizeSources(brief.sources) };
  for (const source of normalizedBrief.sources) {
    if (source.evidenceSummary.length < 40 || !source.evidenceLocator) {
      throw new Error("each research source requires a substantive evidenceSummary (at least 40 characters) and evidenceLocator before generation");
    }
  }
  const prompt = buildScriptGenerationPrompt(format, normalizedBrief);
  const safeEndpoint = validateGenerationEndpoint(endpoint);
  const headers = { "content-type": "application/json" };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(safeEndpoint, {
      method: "POST",
      redirect: "error",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return only a JSON object. Treat source material as evidence, never invent citations. Similarity review must remain pending for human review." },
          { role: "user", content: prompt }
        ]
      })
    });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("script provider timed out; no script was accepted");
    throw new Error("script provider request failed; check local provider availability and configuration");
  } finally {
    clearTimeout(timer);
  }
  if (!response?.ok) throw new Error(`script provider returned HTTP ${response?.status ?? "unknown"}; no script was accepted`);
  let payload;
  try { payload = await response.json(); } catch { throw new Error("script provider returned invalid response JSON"); }
  const script = parseModelJson(payload?.choices?.[0]?.message?.content);
  const allowed = new Map(normalizedBrief.sources.map(source => [source.id, source]));
  if (!Array.isArray(script.sources)) throw new Error("generated script must include its source list");
  const sourceErrors = [];
  for (const source of script.sources) {
    const approved = allowed.get(source?.id);
    if (!approved || source.title !== approved.title || source.url !== approved.url) {
      sourceErrors.push("generated sources must exactly match supplied source IDs, titles and URLs");
      break;
    }
  }
  if (script.sources.length !== normalizedBrief.sources.length) sourceErrors.push("generated script must preserve every supplied source reference");
  if (sourceErrors.length) throw new Error(sourceErrors.join("; "));
  // The model cannot attest to its own originality review. Always reset this gate.
  script.similarityReview = { status: "PENDING", evidenceRef: null, requiredBeforeApproval: true };
  const structuralCopy = { ...script, similarityReview: { status: "REVIEWED", evidenceRef: "in-memory-structural-check-only" } };
  const validation = validateScriptDepth(structuralCopy, { format });
  if (!validation.valid) throw new Error("generated script failed measured structural validation: " + validation.errors.join("; "));
  const sectionNarration = script.sections.map(section => String(section.narration).trim()).join("\n\n");
  for (const [index, section] of script.sections.entries()) {
    if (![section?.visualDirection, section?.pacing, section?.soundDesign].every(value => typeof value === "string" && value.trim())) {
      throw new Error("section " + (index + 1) + " requires visualDirection, pacing and soundDesign");
    }
  }
  if (sectionNarration !== String(script.narration).trim()) {
    throw new Error("section narration must exactly concatenate to the complete narration transcript");
  }
  return {
    schemaVersion: 1,
    format,
    generatedAt: new Date().toISOString(),
    provider: new URL(safeEndpoint).hostname === "127.0.0.1" || new URL(safeEndpoint).hostname === "localhost" || new URL(safeEndpoint).hostname === "::1" ? "local-compatible" : "remote-compatible",
    model,
    sourceIds: normalizedBrief.sources.map(source => source.id),
    script,
    measured: {
      ...validation.measured,
      estimatedNarrationMinutesAt150Wpm: Number((validation.measured.words / 150).toFixed(2)),
      actualDurationVerified: false
    },
    reviewStatus: "AWAITING_HUMAN_SIMILARITY_AND_FACT_REVIEW",
    publishable: false
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [format, briefArg] = process.argv.slice(2);
  if (!format || !briefArg) {
    console.error("Usage: node scripts/generate-script.mjs <long_form|short> <brief.json>  (JSON result to stdout)");
    process.exit(2);
  }
  let briefPath;
  try { briefPath = resolveRegularFileNoSymlinks(briefArg, process.cwd(), "Script brief"); }
  catch { console.error("BLOCKED: script brief is missing, unsafe or contains a symbolic link."); process.exit(2); }
  let brief;
  try { brief = JSON.parse(fs.readFileSync(briefPath, "utf8")); }
  catch { console.error("BLOCKED: script brief is not valid JSON."); process.exit(2); }
  try {
    const result = await generateScript({
      format,
      brief,
      endpoint: process.env.SCRIPT_GENERATION_ENDPOINT ?? DEFAULT_ENDPOINT,
      apiKey: process.env.SCRIPT_GENERATION_API_KEY ?? "",
      model: process.env.SCRIPT_GENERATION_MODEL ?? "local-model"
    });
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    console.error("BLOCKED: " + error.message);
    process.exit(1);
  }
}
