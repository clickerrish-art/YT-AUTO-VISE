import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "sonicvhibez-durable-state-staging",
    entrypoint: "./cloudflare/worker.js",
    compatibilityDate: "2026-11-07",
    observability: {
      enabled: true,
      traces: { enabled: true }
    },
    env: {
      STATE_DB: bindings.d1({ name: "sonicvhibez-state-staging" })
    }
  }
});
