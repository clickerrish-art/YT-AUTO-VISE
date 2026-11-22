import { fileURLToPath } from "node:url";

export const FIXED_NOW_ISO = "2026-11-22T12:00:00.000Z";
export const FIXED_NOW = Date.parse(FIXED_NOW_ISO);

export function fixedClockEnv(overrides = {}) {
  const preload = fileURLToPath(new URL("./fixed-clock-preload.mjs", import.meta.url));
  const inheritedOptions = overrides.NODE_OPTIONS ?? process.env.NODE_OPTIONS ?? "";
  const nodeOptions = [inheritedOptions, "--import=" + preload].filter(Boolean).join(" ").trim();
  return {
    ...process.env,
    ...overrides,
    TEST_FIXED_NOW: FIXED_NOW_ISO,
    NODE_OPTIONS: nodeOptions
  };
}
