const VIDEO_INSERT_SCOPES = Object.freeze([
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtubepartner"
]);

export function youtubeVideoInsertScopeStatus(tokenInfo) {
  const rawScopes = Array.isArray(tokenInfo) ? tokenInfo : tokenInfo?.scopes;
  const scopes = Array.isArray(rawScopes)
    ? [...new Set(rawScopes.filter(scope => typeof scope === "string" && scope.trim()).map(scope => scope.trim()))]
    : [];
  const acceptedScope = VIDEO_INSERT_SCOPES.find(scope => scopes.includes(scope)) ?? null;
  return Object.freeze({
    allowed: acceptedScope !== null,
    acceptedScope,
    grantedYouTubeScopes: scopes.filter(scope => scope.startsWith("https://www.googleapis.com/auth/youtube"))
  });
}

export function assertYoutubeVideoInsertScope(tokenInfo) {
  const status = youtubeVideoInsertScopeStatus(tokenInfo);
  if (!status.allowed) {
    throw new Error(
      "YOUTUBE_REFRESH_TOKEN lacks an OAuth scope accepted by YouTube videos.insert. " +
      "Re-authorize the existing OAuth client with https://www.googleapis.com/auth/youtube.upload (preferred); " +
      "never paste tokens into source files or chat."
    );
  }
  return status;
}
