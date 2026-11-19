export const REQUIRED_YOUTUBE_OAUTH_SCOPES = Object.freeze([
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly"
]);

function normalizeScopes(tokenInfo) {
  const rawScopes = Array.isArray(tokenInfo) ? tokenInfo : tokenInfo?.scopes;
  return Array.isArray(rawScopes)
    ? [...new Set(rawScopes.filter(scope => typeof scope === "string" && scope.trim()).map(scope => scope.trim()))]
    : [];
}

export function youtubeOAuthScopeStatus(tokenInfo) {
  const scopes = normalizeScopes(tokenInfo);
  const missingScopes = REQUIRED_YOUTUBE_OAUTH_SCOPES.filter(scope => !scopes.includes(scope));
  return Object.freeze({
    allowed: missingScopes.length === 0,
    missingScopes: Object.freeze(missingScopes),
    requiredScopes: REQUIRED_YOUTUBE_OAUTH_SCOPES,
    grantedYouTubeScopes: Object.freeze(scopes.filter(scope => scope.startsWith("https://www.googleapis.com/auth/youtube")))
  });
}

export function assertRequiredYoutubeOAuthScopes(tokenInfo) {
  const status = youtubeOAuthScopeStatus(tokenInfo);
  if (!status.allowed) {
    throw new Error(
      "YOUTUBE_REFRESH_TOKEN is missing required OAuth scope(s): " + status.missingScopes.join(", ") +
      ". Re-authorize the existing OAuth client with BOTH youtube.upload and youtube.readonly; " +
      "never paste tokens into source files or chat."
    );
  }
  return status;
}

// Backwards-compatible names now enforce the complete two-scope requirement.
export const youtubeVideoInsertScopeStatus = youtubeOAuthScopeStatus;
export const assertYoutubeVideoInsertScope = assertRequiredYoutubeOAuthScopes;
