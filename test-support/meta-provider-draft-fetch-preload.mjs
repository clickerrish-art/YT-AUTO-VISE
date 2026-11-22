const mockBase = process.env.META_GRAPH_API_MOCK_URL;
if (!mockBase) throw new Error("META_GRAPH_API_MOCK_URL is required for the test-only Graph API fetch shim");
const base = new URL(mockBase);
if (base.protocol !== "http:" || base.hostname !== "127.0.0.1") {
  throw new Error("The test Graph API shim may target only loopback HTTP");
}
const originalFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (input, init) => {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const requestUrl = new URL(raw);
  if (requestUrl.hostname !== "graph.facebook.com") return originalFetch(input, init);
  const target = new URL(base);
  target.pathname = requestUrl.pathname;
  target.search = requestUrl.search;
  return originalFetch(target.href, init);
};
