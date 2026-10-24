# Go-live blockers — SonicVhibez Marketing Machine

**Acceptance status: BLOCKED for real media release and live YouTube acceptance.** Code and mock tests do not substitute for real rights evidence, media inspection or remote upload verification.

Last review: 2026-10-24. PR #1 remains open, draft and unmerged. Public publishing remains disabled.

| Gate | Status | Owner action | Evidence required to close |
|---|---|---|---|
| Real media | BLOCKED | Supply genuine wildlife footage, narration and any music with permission for commercial YouTube use. | Actual rendered Short and long-form MP4s, real thumbnails/captions, SHA-256 values, ffprobe output, full decode and human playback inspection. |
| Production manifests | BLOCKED | Populate `content/render-manifest.json` and `content/long-form-render-manifest.json` using real existing files; do not promote example placeholders. | Both manifests reference existing, non-empty, validated inputs. |
| Rights | BLOCKED pending owner evidence | Retain original licence/permission documents; verify platform/commercial permissions, attribution, restrictions and expiry per asset. | Evidence files and checksums, source checksums, actual verifier identity and timestamp. A filename or checkbox is not proof. |
| Human review | BLOCKED pending production artifacts | Review exact video, thumbnail, captions, metadata, factual claims, disclosures and synthetic/altered-media flags. | Authenticated decision bound to the final video, thumbnail, caption, metadata and rights-evidence hashes, timestamp and rejection reason where applicable. |
| YouTube identity | BLOCKED | Securely configure `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` and independently confirmed `SONICVHIBEZ_CHANNEL_ID` in a secret store/environment. Never paste secrets into chat. | Authenticated API confirms channel title exactly `SonicVhibez` and channel ID matches configured ID. |
| Live private upload | BLOCKED | After all gates pass, explicitly authorize one private upload; set `CONFIRM_PRIVATE_UPLOAD=YES` only for that operation. | Durable pre-upload attempt, remote video ID, re-fetched remote ownership/private visibility, durable receipt. |
| Safari affiliate | INACTIVE by design | Supply exact HTTPS destination and disclosure if wanted; preview and explicitly approve. | Exact destination, disclosure and owner approval. Until then Safari stays inactive. |
| Plain `npm ci` | NOT VERIFIED | Review install-script effects and run plain `npm ci` in a clean environment if required. | Captured command exit code and output. The evidenced install path is `npm ci --ignore-scripts`. |
| Operator runtime acceptance | PARTIALLY VERIFIED | Run clean local startup, authenticated API checks, restart-persistence and backup/restore. | Captured health/readiness results and persisted-state/restore checks. Automated integration tests alone are not operator acceptance. |

## Non-negotiable controls

- SonicVhibez only; never use Nature Frontiers as the YouTube target.
- Public publishing remains disabled. No public/unlisted upload or unattended public scheduling.
- Preserve the exact Selar destination: `https://selar.com/0u19v8u99l`.
- Never blindly retry an uncertain upload; reconcile the existing attempt with YouTube first.
- Keep PR #1 open, draft and unmerged unless the owner separately authorizes a merge.

## Existing CI evidence

At implementation checkpoint `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`, three GitHub Actions workflows reported 95 passed, 0 failed and 0 skipped: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766). The automation workflow also passed `npm ci --ignore-scripts`. These runs are not evidence of real-media rendering, real-world rights verification or a live YouTube upload. Recheck the final branch head before owner acceptance.
