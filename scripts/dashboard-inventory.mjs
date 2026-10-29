import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function attributesOf(raw) {
  const attributes = {};
  const expression = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of raw.matchAll(expression)) {
    const key = match[1].toLowerCase();
    if (key === "button" || key === "input" || key === "select" || key === "textarea" || key === "form") continue;
    attributes[key] = match[2] ?? match[3] ?? match[4] ?? true;
  }
  return attributes;
}

/**
 * Read opening tags without treating a greater-than sign inside a quoted
 * attribute as the end of the tag. Comments are skipped so example markup
 * cannot be mistaken for live dashboard controls or forms.
 */
function* openingTags(source) {
  const trackedTags = new Set(["button", "input", "select", "textarea", "form"]);
  let cursor = 0;
  while (cursor < source.length) {
    const start = source.indexOf("<", cursor);
    if (start < 0) return;

    if (source.startsWith("<!--", start)) {
      const commentEnd = source.indexOf("-->", start + 4);
      cursor = commentEnd < 0 ? source.length : commentEnd + 3;
      continue;
    }

    const nameStart = start + 1;
    if (source[nameStart] === "/" || source[nameStart] === "!" || source[nameStart] === "?") {
      cursor = nameStart + 1;
      continue;
    }
    const nameMatch = source.slice(nameStart).match(/^([a-z][a-z0-9:-]*)\b/i);
    if (!nameMatch) {
      cursor = start + 1;
      continue;
    }

    const tag = nameMatch[1].toLowerCase();
    const attributesStart = nameStart + nameMatch[0].length;
    let quote = null;
    let end = -1;
    for (let index = attributesStart; index < source.length; index++) {
      const character = source[index];
      if (quote !== null) {
        if (character === quote) quote = null;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === ">") {
        end = index;
        break;
      }
    }
    if (end < 0) return;
    if (trackedTags.has(tag)) {
      yield { tag, raw: source.slice(attributesStart, end), index: start };
    }
    cursor = end + 1;
  }
}

function stableAcceptanceId(kind, identity, occurrences) {
  const normalized = String(identity || "anonymous").trim().toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "anonymous";
  const digest = createHash("sha256").update(kind + ":" + normalized).digest("hex").slice(0, 8);
  const base = kind + "-" + slug + "-" + digest;
  const occurrence = (occurrences.get(base) ?? 0) + 1;
  occurrences.set(base, occurrence);
  return occurrence === 1 ? base : base + "-" + occurrence;
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

/**
 * Build a deterministic static inventory. This intentionally measures source
 * declarations only; it does not claim that a control or route is accepted.
 */
export function inventoryDashboardSources(html, server) {
  const tags = [...openingTags(html)];
  const controls = [];
  const controlIds = new Map();
  for (const match of tags) {
    if (!["button", "input", "select", "textarea"].includes(match.tag)) continue;
    const attributes = attributesOf(match.raw);
    const tag = match.tag;
    const identity = attributes.id
      ? "id:" + attributes.id
      : attributes.name
        ? "name:" + attributes.name + "|tag:" + tag
        : attributes["aria-label"]
          ? "aria:" + attributes["aria-label"] + "|tag:" + tag
          : "tag:" + tag + "|type:" + (attributes.type ?? "unspecified") + "|form:" + (attributes.form ?? "default");
    controls.push({
      index: controls.length + 1,
      acceptanceId: stableAcceptanceId("control", identity, controlIds),
      tag,
      line: lineAt(html, match.index),
      id: typeof attributes.id === "string" ? attributes.id : null,
      name: typeof attributes.name === "string" ? attributes.name : null,
      type: typeof attributes.type === "string" ? attributes.type : (tag === "button" ? "submit-default" : null),
      form: typeof attributes.form === "string" ? attributes.form : null,
      ariaLabel: typeof attributes["aria-label"] === "string" ? attributes["aria-label"] : null,
      disabled: Object.hasOwn(attributes, "disabled"),
    });
  }

  const forms = [];
  const formIds = new Map();
  for (const match of tags) {
    if (match.tag !== "form") continue;
    const attributes = attributesOf(match.raw);
    const identity = attributes.id
      ? "id:" + attributes.id
      : attributes.name
        ? "name:" + attributes.name
        : "method:" + (attributes.method ?? "GET") + "|action:" + (attributes.action ?? "default");
    forms.push({
      index: forms.length + 1,
      acceptanceId: stableAcceptanceId("form", identity, formIds),
      line: lineAt(html, match.index),
      id: typeof attributes.id === "string" ? attributes.id : null,
      name: typeof attributes.name === "string" ? attributes.name : null,
      method: typeof attributes.method === "string" ? attributes.method.toUpperCase() : "GET",
      action: typeof attributes.action === "string" ? attributes.action : null,
    });
  }

  const routes = [];
  const routeIds = new Map();
  const routeExpression = /if\s*\(([^\n]*url\.pathname\s*===\s*["']([^"']+)["'][^\n]*)\)/g;
  for (const match of server.matchAll(routeExpression)) {
    const methodMatch = match[1].match(/req\.method\s*===\s*["'](GET|POST|PUT|PATCH|DELETE)["']/);
    const method = methodMatch?.[1] ?? "METHOD_NOT_INLINE";
    const routePath = match[2];
    routes.push({
      index: routes.length + 1,
      acceptanceId: stableAcceptanceId("route", method + ":" + routePath, routeIds),
      line: lineAt(server, match.index),
      method,
      path: routePath,
      condition: match[1].trim(),
    });
  }

  const byTag = Object.fromEntries(["button", "input", "select", "textarea"].map(tag => [tag, controls.filter(item => item.tag === tag).length]));
  const byMethod = Object.fromEntries(["GET", "POST", "PUT", "PATCH", "DELETE", "METHOD_NOT_INLINE"].map(method => [method, routes.filter(item => item.method === method).length]).filter(([, count]) => count > 0));
  return {
    schemaVersion: 1,
    disclaimer: "Static source inventory only; not control/route acceptance evidence.",
    counts: { controls: controls.length, forms: forms.length, routes: routes.length, controlsByTag: byTag, routesByMethod: byMethod },
    controls,
    forms,
    routes,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const htmlPath = path.join(root, "public", "dashboard.html");
  const serverPath = path.join(root, "scripts", "dashboard-server.mjs");
  const inventory = inventoryDashboardSources(
    fs.readFileSync(htmlPath, "utf8"),
    fs.readFileSync(serverPath, "utf8"),
  );
  process.stdout.write(JSON.stringify(inventory, null, 2) + "\n");
}
