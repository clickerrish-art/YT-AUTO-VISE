import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function attributesOf(raw) {
  const attributes = {};
  const expression = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of raw.matchAll(expression)) {
    const key = match[1].toLowerCase();
    if (key === "button" || key === "input" || key === "select" || key === "textarea") continue;
    attributes[key] = match[2] ?? match[3] ?? match[4] ?? true;
  }
  return attributes;
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

/**
 * Build a deterministic static inventory. This intentionally measures source
 * declarations only; it does not claim that a control or route is accepted.
 */
export function inventoryDashboardSources(html, server) {
  const controls = [];
  const controlExpression = /<(button|input|select|textarea)\b([^>]*)>/gi;
  for (const match of html.matchAll(controlExpression)) {
    const attributes = attributesOf(match[2]);
    const tag = match[1].toLowerCase();
    controls.push({
      index: controls.length + 1,
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
  for (const match of html.matchAll(/<form\b([^>]*)>/gi)) {
    const attributes = attributesOf(match[1]);
    forms.push({
      index: forms.length + 1,
      line: lineAt(html, match.index),
      id: typeof attributes.id === "string" ? attributes.id : null,
      name: typeof attributes.name === "string" ? attributes.name : null,
      method: typeof attributes.method === "string" ? attributes.method.toUpperCase() : "GET",
      action: typeof attributes.action === "string" ? attributes.action : null,
    });
  }

  const routes = [];
  const routeExpression = /if\s*\(([^\n]*url\.pathname\s*===\s*["']([^"']+)["'][^\n]*)\)/g;
  for (const match of server.matchAll(routeExpression)) {
    const methodMatch = match[1].match(/req\.method\s*===\s*["'](GET|POST|PUT|PATCH|DELETE)["']/);
    routes.push({
      index: routes.length + 1,
      line: lineAt(server, match.index),
      method: methodMatch?.[1] ?? "METHOD_NOT_INLINE",
      path: match[2],
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
