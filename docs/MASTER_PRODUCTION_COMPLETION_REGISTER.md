# Latest master-completion snapshot — 19 November 2026

## Execution addendum — 22 November 2026 (current media-policy and production update)

> This addendum is the current operational status and supersedes older statements below that prohibit all Pexels/Pixabay stock for SonicVhibez. Historical snapshots remain preserved for audit. Nature Frontiers remains a separate brand and its independent media policy is not changed by this SonicVhibez owner instruction.

### Owner media-policy decision

The owner explicitly instructed: use previously shared footage unless an individual asset is not legally usable, noting that approximately 99% of the shared footage comes from Pexels and Pixabay. Effective 22 November 2026, qualifying Pexels/Pixabay licensed stock is allowed for SonicVhibez subject to exact source-page provenance, platform-licence evidence, original MP4 acquisition, SHA-256, technical probe and full decode, third-party-rights review, human visual review and final owner approval. Pexels/Pixabay licences are not public-domain declarations and do not automatically clear people, property, trademarks, music or other third-party rights. AI-generated wildlife visuals remain prohibited. Other stock/archive sources remain excluded unless separately approved. Public and unattended publishing remain disabled.

Policy evidence: `content/owner-media-policy-override-2026-11-22.json`  
Pexels licence evidence: `content/media/pexels-license-evidence-2026-11-22.md`

### Completed media recovery and first review render

- Recovered the four-clip Short 001 Pexels acquisition ZIP from GitHub Actions artifact **14700765594**.
- All four original MP4 files were extracted; their SHA-256 values matched the historical acquisition manifest; all four completed full FFmpeg decode.
- Three clips were selected for a silent visual review: lion walking (lifeofhicham), elephant mother and calf (ROMAN ODINTSOV), and resting lions (Lorenzo Boldorini). The resting-lion source includes a visible dark collar/strap; its context is not verified and is explicitly flagged.
- The fourth clip (MC G'Zay, Pexels 31702128) is excluded from this edit because the sampled frames show an enclosure/barrier and a partial foreground person. This is an editorial exclusion, not a claim that the platform licence is invalid.
- Created `SonicVhibez_Short001_Visual_Review_ONLY.mp4`: 55.033 seconds, 720×1280, H.264, 30 fps, no audio, full decode PASS, SHA-256 `c90491f31fc8de1dd7095eeec78f9e9642cf7e3ae7944417b1415c7f5d158844`. It uses three separate examples and does not imply one continuous animal encounter. This is a review-only visual preview, not a final narrated Short or publication master.
- Evidence: `content/short-001-visual-review-evidence-2026-11-22.json`. The MP4 is retained as a conversation deliverable, not committed as a repository binary.

### Crocodile footage acquisition

Five Pexels crocodile candidates have been imported into Canva for the Nile crocodile documentary:
- Johnny Tilly — Pexels 30026544, 36 seconds, South Africa.
- MC G'Zay — Pexels 31702202, 10 seconds.
- MC G'Zay — Pexels 31702221, 17 seconds, Kenya.
- MC G'Zay — Pexels 31702245, 13 seconds.
- Floating Rabbit — Pexels 31998380, 60 seconds, Lower Zambezi, Zambia.

Canva asset IDs, source pages and current acquisition state are in `content/media/pexels-crocodile-candidates-2026-11-22.json`. These five originals are **not yet present as local MP4 bytes**; no local SHA-256, ffprobe, full decode or full visual review is claimed. The acquisition script `scripts/acquire-crocodile-footage-review.mjs` now downloads and verifies them for review only. Short 001 acquisition is handled by `scripts/acquire-short-001-assets.mjs`; the enclosure clip is excluded.

### Software and policy corrections

- The reviewed-footage renderer now accepts original recordings and qualifying Pexels/Pixabay stock for review renders when platform-licence evidence is present. Incomplete rights checks force a review-only hold. The renderer never grants release approval.
- Updated Short 001, long-form, queue and weekly-plan media policy fields; updated Pexels source records; preserved Nature Frontiers' separate stock-exclusion policy.
- Added a conditional source-acquisition stage to `.github/workflows/validate-automation.yml`. It runs only on a push to the implementation branch whose commit message contains `[acquire-media]`, and only after the full validation job passes. It uploads the acquired source files and evidence as short-retention review artifacts; it does not render or publish.
- A previous exact-head regression run had 1,098 passes, 3 failures and zero skips. Those three failures were stale assertions enforcing the superseded original-only Pexels policy. The corresponding test assertions have been updated; the new exact-SHA validation run must pass before this change is considered verified.

### Remaining production and operational blockers

1. **Short 001 narration:** Speechma Andrew is selected for a manual, zero-cost browser audition only. No approved MP3, exact audio hash, full listening review or owner production approval exists. Free-site automation is prohibited; do not automate the browser or substitute another voice.
2. **Short 001 rights/editorial:** Complete full playback and third-party-rights review for the three selected clips; resolve the resting-lion collar/strap context; approve the exact asset list. The 720×1280 preview must be rebuilt at final 1080×1920 after approved narration and captions exist.
3. **Long-form 001 footage:** Acquire the five crocodile Pexels MP4s into a review artifact; verify original bytes, SHA-256, duration, dimensions, frame rate and full decode; inspect every clip; keep South Africa, Kenya and Zambia contexts distinct; select only scenes that match the factual script.
4. **Long-form 001 research:** Complete owner and qualified zoological review of the Nile crocodile script and scene-to-claim map. Do not infer animal intent, location, species or behaviour beyond evidence.
5. **Narration/captions:** Generate Andrew manually on Speechma, download the MP3, record its exact hash, listen in full, obtain owner approval, then regenerate and validate captions against that exact audio. Existing HeyGen Roderic/Wade free-plan audio remains prohibited for public branded/commercial production.
6. **Final packaging:** Produce final 16:9 long-form and 9:16 Short exports; inspect full playback; create truthful thumbnails; approve titles, descriptions, tags, disclosures and product links; record all final hashes and source credits.
7. **YouTube:** Reconfirm the exact SonicVhibez channel identity and upload-capable OAuth scope; reconcile complete public/private/unlisted history and upload-attempt ledger; private upload only after exact one-shot owner authorization; read back remote video ID, privacy and metadata. No public/unattended upload.
8. **Scheduling:** Keep the rolling `long_form → long_form → short` sequence, Africa/Johannesburg timezone, minimum 72 elapsed hours between actual publications and no same Johannesburg calendar day. A full three-gap cycle is at least 216 hours; no seven-day publication promise is made. Actual remote history still gates scheduling.
9. **Dashboard/API/state/recovery:** Continue exact-SHA acceptance for user journeys, authenticated routes, durable state, leases, retry/backoff, dead-letter handling, cancellation, restart recovery, backup/restore and remote provider reconciliation. Passing unit tests alone does not close live-provider gates.
10. **Facebook/Meta:** Nature Frontiers remains separate from SonicVhibez. Keep Meta publishing disabled until Page identity, permissions, draft approval, rights and provider-side receipts are independently verified.
11. **Release/deployment/Git:** Preserve the implementation branch and draft/unmerged PR state. Do not merge, close, mark ready, reset, rebase, force-push or rewrite history. Verify deployment and all release gates at the exact final SHA.

**Current release decision: HOLD — NOT MASTER COMPLETE.** No final narrated Short, final long-form documentary, publication-ready media, private upload receipt or public publication is claimed. The first recovered footage preview and policy corrections are real progress, but they do not establish 100% completion.

---


**Latest branch inventory checkpoint:** `4f38aa392f97e944c97c3d3c312be08e57686069` (run [44595474867](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474867)); current exact source/test candidate: `4f38aa392f97e944c97c3d3c312be08e57686069`. Full automation/security [44595474749](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474749) passed **1,038 Node tests across 181 files, 87 Python tests, zero failures/skips and zero npm audit vulnerabilities**.  
**Current master acceptance register:** 89 requirements — **72 PASS / 7 NOT_TESTED / 10 BLOCKED / 0 FAIL**. SCHED-003 is now PASS from explicit owner approval; the live YouTube history gate remains open.  
Release decision: **HOLD**. This is not a production-complete or risk-free release.

**Current master acceptance register:** 89 requirements — **71 PASS / 8 NOT_TESTED / 10 BLOCKED / 0 FAIL**. SCHED-003 is PASS from explicit owner approval; the live YouTube history gate remains open.

## Current exact-head evidence — 20 November 2026

**DASH-001: NOT_TESTED.** Browser run [44778971471](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44778971471) passed 41/41 journeys; Node run [44778971476](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44778971476) passed 1,042 tests across 181 files. These evidence passes do not close exhaustive per-control acceptance.

**API-001: BLOCKED.** 42 positive route evidence sets and 48 authentication-negative checks pass; six provider/production routes remain blocked.

**SCHED-001: NOT_TESTED.** OAuth identity and both scopes are verified; the complete read-only inventory contains one public legacy Short and no private/unlisted videos. New-cycle actual spacing is not yet demonstrated; owner upload-attempt attestation after 18 November is required.

## Exact verification checkpoints

- Full automation/security run [44589125374](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44589125374), source/test SHA `e9cc56ba3a1a3ca37a73d78a1fcc679b9d2c13f3`: **1,037/1,037 Node tests across 181/181 files; 87/87 Python tests; zero failures/skips; zero npm audit vulnerabilities**. The exact-SHA regression includes the dashboard/API acceptance suites.
- **DASH-001: PASS.** The exact dashboard matrix source/test SHA `3edcdde4d20cbb4a69017e9c3e156f743c17bec0` accepts **121/121 controls, 17/17 forms and 15/15 cross-cutting dimensions**. Latest branch Chromium E2E [44595474683](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474683) passed **41/41 journeys**. Coverage includes authorization, actionable errors, persistence/restart, concurrency/idempotency, keyboard and mobile accessibility, validation boundaries, and read-only/disabled invariants. Six production-dependent forms are accepted as expected fail-closed outcomes, not dashboard defects.
- API route acceptance matrix is reconciled to exact source/test SHA `e9cc56ba3a1a3ca37a73d78a1fcc679b9d2c13f3` (matrix commit `3295aae6a19c1e8d07cec6ac48eb624ad2f28845`): **42 authorized application-level routes PASS**, **48/48 protected-route missing/invalid-auth checks PASS**, and **6 provider/production routes remain BLOCKED**. The 42 positive-route tests and six blocked-route fail-closed tests are referenced in `docs/API_ROUTE_ACCEPTANCE_MATRIX.json` and included in the 181-file regression. These are local application tests, not live provider acceptance or publication; API-001 remains BLOCKED overall.
- Queue readiness [44595474754](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474754): PASS; 16 queue items, approved Selar destination, rolling `long_form → long_form → short` order, 72 elapsed-hour minimum, 216-hour minimum cycle, draft-only preparation and publishing disabled.
- Cloudflare durable-state unit checks [44595474871](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474871) and deployment recovery smoke [44595474812](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474812): PASS. The controlled staging backup/restore drill [43701290286](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/43701290286) also passed: explicit backup and automatic pre-restore backup retained, restore audit receipt present, exact pre-test state restored, and state stable after Node restart. This is staging evidence, not production deployment.
- Nature Frontiers daily local draft package [44595474776](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474776) and Instagram fail-closed safety [44595474764](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474764): PASS. The daily package is research-only (2 Reel + 1 feed); no Meta provider-side draft, upload, schedule or publish was performed. Publishing remains disabled, dry-run enabled and emergency stop active.
- Non-destructive branch reconciliation [44595474867](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474867), exact inventory HEAD `4f38aa392f97e944c97c3d3c312be08e57686069`: **4,680 commits ahead / 9 behind**, **467 changed paths**. Decision remains **REQUIRES_REVIEW**; no history mutation performed.
- Production readiness [44595474996](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474996): **HOLD / 20 blockers**. The live OAuth refresh still returns `invalid_grant`.

## Scheduler and worker status

- Owner approval is now correctly recorded from the explicit 18 November 2026 decision: rolling `long_form → long_form → short`, no weekly publication target, Africa/Johannesburg, at least 72 elapsed hours between actual publications, and no two publications on the same Johannesburg calendar day.
- The queue validator and cadence tests pass. The 72-hour spacing and 216-hour cycle minimum remain invariants; owner approval cannot weaken them.
- Worker dispatch safety is verified on exact branch source/test SHA `4f38aa392f97e944c97c3d3c312be08e57686069`: automation/security run [44595474749](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474749) passed 1,038 Node tests, 87 Python tests, zero failures/skips and npm audit zero vulnerabilities. The worker tests prove HTTP 409 preflight cooldown, persisted cooldown across restart, fail-stop plus retained process lock when cooldown persistence fails, restart rejection before another poll, ambiguous POST quarantine, operator-only dead-letter recovery, leases, cancellation and restart safety. Queue readiness [44595474754](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474754) passed with 16 draft-only items and publishing disabled; runner-bridge safety [44595475574](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595475574) and deployment recovery [44595474812](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474812) passed. **Live worker dispatch remains NOT_TESTED**: staging OIDC trust is pinned to the old `codex/cloudflare-adapter-integration-20261108` ref, runner D1 has no operational rows, and no SonicVhibez production publisher Worker exists. No real remote YouTube dispatch or publication is claimed.
- **Still blocked:** fresh authenticated complete YouTube public/private/unlisted history, actual remote publication timestamps, verified channel identity/scope, and complete local/workflow/owner upload-attempt reconciliation. Do not retry an uncertain upload.

## Media and production status

- Short 001: four source clips were explicitly owner-selected and downloaded. Their MP4 bytes match the recorded SHA-256 values and FFprobe confirms valid H.264 streams. Pexels' published platform license and source pages have been reviewed; this confirms the platform-license terms only, not every possible third-party right. Three clips were used in a **silent 54.67-second visual review preview**; the fourth was excluded because the preview shows an enclosure/barrier and a partial foreground person.
- The preview is a review-only attachment, 720×1280 H.264, with no audio, no narration, no music, no fabricated encounter and no claim of original-camera footage. It is not stored in the repository and is **not** the final narrated Short. The evidence record is in `content/short-001-visual-review-evidence.json`.
- The available Roderic HeyGen Free-plan audition is internal/personal non-commercial only; it is not licensed for monetized production or Selar promotion. No paid upgrade or silent voice substitution was made. Production narration remains blocked pending commercial rights or explicit owner authorization for a zero-cost commercially licensed alternative.
- Short final media, narration, music, full human playback, factual/compliance review, exact-hash approval and upload metadata remain incomplete.
- Long-form 001 still lacks the required genuine footage, commercially usable narration, final captions, rights evidence, final render, full playback and hash-bound approval.
- The 20 current readiness blockers are exact and actionable: Short footage/narration missing (2) plus rights/compliance confirmations (2); long-form footage/narration/captions missing (3) plus human-verified rights evidence and rights/compliance confirmations (4); metadata human/rights/compliance approval (3); exact-hash production approval (1); final Short MP4 missing (1); and YouTube OAuth, upload scope, complete public/private/unlisted history and upload-attempt reconciliation (4). Five imported Canva assets remain excluded because they are not rights-cleared.

## Nature Frontiers / Meta

- Nature Frontiers remains separate from SonicVhibez and is not a YouTube destination.
- Current tests confirm safe local configuration: publishing disabled, dry-run enabled, emergency stop active, no guessed Page/Instagram account ID and no provider action. No Metricool write or post mutation was performed in this session.
- The latest PR-event Meta workflow [44595474792](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474792) passed its regression suite, but the live read-only identity/permission GET was skipped because this was a pull_request event. A prior manual live check returned HTTP 401 / OAuth error 190; Meta Page and Instagram identity are therefore not accepted as live-verified.
- Read-only Metricool inspection now confirms one connected brand, Nature Frontiers SA, with Africa/Johannesburg timezone, Facebook and Instagram connections, and a YouTube connection pointing to the SonicVhibez channel. Do not use that YouTube connection for Nature Frontiers; it is a cross-brand routing risk requiring owner correction.
- Metricool scheduled-post lookup for 1 November 2026 through 31 January 2027 returned **zero future scheduled posts**. Published-post analytics for 1 August–19 November returned **five Facebook items** (feed/photo posts and Reels, 13–14 November) and **zero Instagram feed/Reel rows** in the inspected range. This is a current connector snapshot, not proof of the older records' disposition.
- The historical eight `draft=false` / `autoPublish=true` records were not surfaced by the current Metricool scheduled-post lookup; their origin and final disposition remain unresolved. The previous legacy-brand records must not be assumed deleted, published or safe. No auto-publishing or provider schedule mutation is authorized.
- The local 2-Reel + 1-feed plan is not a Facebook/Instagram provider draft and contains no fabricated media or rights. The approved-content auto-publishing preference remains gated on actual content approval, valid media/rights, and correction of the cross-brand YouTube connection.

## Deployment, state and Git

- Staging backup/restore and local deployment recovery smoke are PASS. The live staging Worker’s eight multipart modules now match `cloudflare/staging-snapshot/*` byte-for-byte at GitHub commit `6302fae3cda5255296dcc50de69254e70dc61481`, resolving source-content provenance. However, the deployed Worker still trusts the old unprotected `codex/cloudflare-adapter-integration-20261108` OIDC ref/workflow, while current `cloudflare/worker.js` is a smaller state-only implementation that lacks the runner-bridge API. R2 is disabled at account level (403/code 10042), despite the staging ARTIFACTS binding. The staging D1 has one state row and five backups but no runner state/control/artifact records. There is no SonicVhibez production publisher Worker. No Cloudflare resources were changed, no paid infrastructure was activated, and no production job was dispatched.
- Branch protection is still disabled (`protected=false`). Owner/admin action is required to configure required checks and branch protection.
- PR #1 remains **OPEN / DRAFT / UNMERGED**. `main` remains `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38`; it has not been modified. No merge, rebase, reset, force-push or destructive reconciliation was performed.
- GIT-002 remains open. The exact branch inventory shows 9 commits unique to `main`; their patches were reviewed and affect only tests, documentation and workflows. The OIDC token test has one patch-equivalent counterpart on the implementation branch. The branch retains `test/restore-facebook-draft-history.test.mjs`, `tests/restore-state.test.mjs`, the OIDC/interstitial test coverage and the acceptance register. Four branch-history deletions were reviewed: the Pexels acquisition workflow/script and Cloudflare state workflow were later restored and are present in the final tree; the duplicate YouTube channel workflow remains removed and read-only verification is handled by the existing workflow. No final-tree deletions or destructive reconciliation occurred.
- A scoped high-risk code review found the private uploader fail-closed: explicit one-shot authorization, exact artifact/metadata/rights hashes, exact SonicVhibez channel, upload-capable scope, emergency-stop release, private-only `videos.insert`, pre-upload ledger, and recovery-required state for uncertain outcomes. The production readiness command is read-only. YouTube history checks require complete paginated inventory, channel match, reconciled upload attempts and the 72-hour cycle gate. Restore logic rejects symlink/path escapes, uses a cross-process lock and durable journal, and preserves newer upload/Facebook ledgers. Relevant tests passed in the exact regression above. This targeted review is not a full semantic review of all 4,616 branch-only commits or 460 changed paths; do not merge/rebase/reset/force-push or reconcile yet.

## Required owner inputs to finish

1. Reauthorize the existing YouTube OAuth client and update the GitHub Actions `YOUTUBE_REFRESH_TOKEN` secret securely; do not paste tokens into chat. Verify `youtube.upload` scope, channel identity and complete remote history.
2. Resolve production narration rights: commercially license the approved Roderic voice, or explicitly authorize a zero-cost commercially licensed alternative. The Free-plan Roderic audition cannot be used in monetized production.
3. Complete full human playback and editorial/compliance review of the source footage, final Short, long-form video, captions, thumbnail and metadata; approve exact hashes only after final files exist.
4. Provide/approve genuine long-form source footage and commercially usable narration, plus required caption and license evidence.
5. Repository admin: enable branch protection and required checks; complete GIT-002 semantic review.
6. Owner/admin: authorize a durable off-account backup/storage path and production Worker deployment; resolve R2 access or approve a free alternative.
7. Restore access to the historical Metricool Nature Frontiers brand and reconcile all uncertain auto-publish records before any provider publishing is enabled.

**No YouTube upload, public/private publication, Meta publication, Metricool mutation, R2 activation, production Worker deployment or PR merge has been performed.**

---

# Latest master-completion snapshot — 18 November 2026

**Code/test evidence SHA:** `8d3f24b46af34af3238ca7714e96606af0c3940f`  
**Register status:** 67 PASS / 9 NOT_TESTED / 13 BLOCKED / 0 FAIL (89 requirements). Metadata-validation FFmpeg/zero-skip workflow [44272071849](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071849) remains in progress; its two CI acceptance rows are deliberately NOT_TESTED.

## Exact current-head evidence

- Automation/security [44272071799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071799): **983/983 Node, 84/84 Python, zero skips, zero npm audit vulnerabilities**.
- Content quality [44272072115](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072115): **985/985 passed**, zero failures/skips.
- **DASH-001: PASS.** The exact dashboard matrix source/test SHA `3edcdde4d20cbb4a69017e9c3e156f743c17bec0` accepts **121/121 controls, 17/17 forms and 15/15 cross-cutting dimensions**. Latest branch Chromium E2E [44595474683](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474683) passed **41/41 journeys**. Coverage includes authorization, actionable errors, persistence/restart, concurrency/idempotency, keyboard and mobile accessibility, validation boundaries, and read-only/disabled invariants. Six production-dependent forms are accepted as expected fail-closed outcomes, not dashboard defects.
- Queue readiness [44272072055](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072055): PASS; 16 draft-only items, zero scheduled timestamps, publishing disabled, no new items.
- Cloudflare durable-state [44272071939](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071939): 9/9; deployment recovery [44272071892](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071892): 2/2; runner bridge [44272072194](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072194): 4/4.
- Nature Frontiers local Meta regression [44272071929](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071929): 100/100; live Meta identity GET was **skipped** on the PR event. Instagram safety [44272072105](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072105): 68/68; signed approval checks [44272072175](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072175): 34/34.
- Nature Frontiers daily draft candidate [44272072179](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072179) is a deterministic **2030-10-25 research-only fixture**, not today's content or a Facebook Page draft. It contains 2 Reel and 1 feed research briefs with no factual claims, media, rights evidence, Page ID or approval.
- Main/candidate baseline [44272071843](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071843): main 54 Node / 8 Python tests and 4 moderate npm vulnerabilities; candidate 983 Node / 84 Python, zero skips and zero npm vulnerabilities.
- Production readiness [44272072084](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072084): correctly returns **HOLD / exit 2 / 19 blockers**. This is an expected fail-closed result, not a green production release.

## Repository and merge safety

- Implementation branch `codex/marketing-machine-audit-fixes`, code/test SHA `8d3f24b46af34af3238ca7714e96606af0c3940f`.
- `main`: `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Divergence: **4,331 ahead / 9 behind**; **433 changed paths**, **17 critical modules**, zero final-tree deletions and zero patch-equivalent commits.
- PR #1 remains OPEN / DRAFT / UNMERGED. It is technically mergeable, but no merge, rebase, cherry-pick or force-push is authorized.
- Branch-protection read returned HTTP 403; protection is not independently verified. Repository owner/admin must verify required checks and protection settings.

## Live infrastructure findings

- SonicVhibez has a staging state Worker, not a production publisher Worker. Staging D1 has six application tables, five backup rows and one dashboard-state row (revision 3, last updated 15 November); runner state/artifact/control tables have zero rows.
- Staging dashboard snapshot: 16 queue items, 3 campaigns and 4 audit events; `publishingEnabled=false`.
- R2 is not enabled (Cloudflare error 10042). No paid or account-level infrastructure was enabled.
- Nature Frontiers production D1 has seven application tables, all empty. Its publisher Worker has only a D1 binding, no publishing secrets and no schedules; browser-QC Worker has no operational bindings.
- Metricool current brand `8094526` is Nature Frontiers SA and includes the SonicVhibez YouTube network mapping. It returned zero scheduled posts for the checked window. Historical brand `7545638` returns HTTP 403; eight previously observed `draft=false` / `autoPublish=true` records remain unverified. SAFE-001 is BLOCKED.
- YouTube upload-attempt ledger is reconciled: zero previously executed private-upload jobs and owner attestation of no additional manual/local/external attempts. The mirrored verification record and reconciliation file now agree, guarded by a regression test.
- Latest YouTube OAuth refresh attempt is `invalid_grant`; the prior successful identity/inventory snapshot is historical only. It showed one public legacy Short, zero private and zero unlisted items. Full history cannot be refreshed until the owner updates `YOUTUBE_REFRESH_TOKEN`.

## Production blockers — 19 exact readiness findings

**Short (6):** `media/next-short-footage.mp4` and `media/next-short-narration.mp3` are missing; genuine footage/narration rights evidence is missing; `rightsConfirmed` and `complianceReviewed` remain false.

**Long-form (7):** `media/long-form-001-footage.mp4`, `media/long-form-drafts/long-001-narration-final.mp3`, and `long-form-001-captions-final.srt` are missing; genuine footage/narration rights evidence is missing; `rightsConfirmed` and `complianceReviewed` remain false. The previous narration artifact is superseded by a source-script hash mismatch.

**Metadata (3):** final metadata has not been human-reviewed and is not `READY_FOR_PRIVATE_UPLOAD`; rights and compliance review are not confirmed.

**Output (1):** `media/next-short.mp4` is missing. The long-form final MP4 must also be rendered and QC-verified after its source assets exist.

**YouTube authorization (2):** latest refresh token returns `invalid_grant`; current upload-capable `youtube.upload` scope is not independently verified.

Additional production tasks not represented by those 19 checks: create and approve Short and long-form thumbnails; re-sync Short captions to final audio; regenerate narration from the current long-form script; produce and verify both final MP4s; complete human factual/editorial review; verify source licenses and commercial/platform use; run one authorized private-only upload and remote read-back. Five imported Canva assets remain excluded from production evidence.

## Queue, voice and wildlife concept

- Existing 16-item SonicVhibez queue remains draft-only and creator-education focused. The Nile crocodile encounter is **not in the queue**; no existing queue content was silently replaced.
- Norman American male narration is an audition only (51.432 seconds). It is not approved as the permanent voice; model/engine commercial-use review remains open. The user may approve it or supply an authorized voice recording.
- A “TOO BIG?” crocodile thumbnail concept was generated in this chat. It is synthetic concept art, not actual wildlife footage, not rights-cleared documentary evidence and not yet approved or added to the production queue.

## Required owner inputs

1. Reauthorize the existing YouTube OAuth client and update only the GitHub Actions `YOUTUBE_REFRESH_TOKEN` secret; do not paste tokens into chat. Ensure offline access and the read-only plus upload scopes.
2. Provide or approve real Short and long-form footage, narration, captions, source/license records and the exact final metadata/thumbnail review.
3. Confirm the correct Metricool brand and restore owner access to historical brand `7545638`; reconcile the eight old auto-publish records before enabling anything.
4. Verify Nature Frontiers Page/Instagram identity and refresh Meta credentials; confirm the exact Page and linked Instagram account. The current PR workflow skipped live identity GET.
5. Decide whether the crocodile encounter should replace or supplement the creator-education queue; no queue change has been made.
6. Choose an owner-approved durable object-storage path. R2 remains disabled to avoid unapproved account activation/cost.
7. Have a repository admin verify/enable branch protection and complete GIT-002 semantic review.

**No public upload, private upload, Facebook/Instagram publication, Meta scheduling, Metricool mutation, R2 activation or merge was performed.**
---

# Latest master-completion snapshot — 18 November 2026

**Code/test evidence SHA:** `8d3f24b46af34af3238ca7714e96606af0c3940f`  
**Register status:** 67 PASS / 9 NOT_TESTED / 13 BLOCKED / 0 FAIL (89 requirements). Metadata-validation FFmpeg/zero-skip workflow [44272071849](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071849) remains in progress; its two CI acceptance rows are deliberately NOT_TESTED.

## Exact current-head evidence

- Automation/security [44272071799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071799): **983/983 Node, 84/84 Python, zero skips, zero npm audit vulnerabilities**.
- Content quality [44272072115](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072115): **985/985 passed**, zero failures/skips.
- **DASH-001: PASS.** The exact dashboard matrix source/test SHA `3edcdde4d20cbb4a69017e9c3e156f743c17bec0` accepts **121/121 controls, 17/17 forms and 15/15 cross-cutting dimensions**. Latest branch Chromium E2E [44595474683](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474683) passed **41/41 journeys**. Coverage includes authorization, actionable errors, persistence/restart, concurrency/idempotency, keyboard and mobile accessibility, validation boundaries, and read-only/disabled invariants. Six production-dependent forms are accepted as expected fail-closed outcomes, not dashboard defects.
- Queue readiness [44272072055](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072055): PASS; 16 draft-only items, zero scheduled timestamps, publishing disabled, no new items.
- Cloudflare durable-state [44272071939](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071939): 9/9; deployment recovery [44272071892](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071892): 2/2; runner bridge [44272072194](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072194): 4/4.
- Nature Frontiers local Meta regression [44272071929](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071929): 100/100; live Meta identity GET was **skipped** on the PR event. Instagram safety [44272072105](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072105): 68/68; signed approval checks [44272072175](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072175): 34/34.
- Nature Frontiers daily draft candidate [44272072179](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072179) is a deterministic **2030-10-25 research-only fixture**, not today's content or a Facebook Page draft. It contains 2 Reel and 1 feed research briefs with no factual claims, media, rights evidence, Page ID or approval.
- Main/candidate baseline [44272071843](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272071843): main 54 Node / 8 Python tests and 4 moderate npm vulnerabilities; candidate 983 Node / 84 Python, zero skips and zero npm vulnerabilities.
- Production readiness [44272072084](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44272072084): correctly returns **HOLD / exit 2 / 19 blockers**. This is an expected fail-closed result, not a green production release.

## Repository and merge safety

- Implementation branch `codex/marketing-machine-audit-fixes`, code/test SHA `8d3f24b46af34af3238ca7714e96606af0c3940f`.
- `main`: `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Divergence: **4,331 ahead / 9 behind**; **433 changed paths**, **17 critical modules**, zero final-tree deletions and zero patch-equivalent commits.
- PR #1 remains OPEN / DRAFT / UNMERGED. It is technically mergeable, but no merge, rebase, cherry-pick or force-push is authorized.
- Branch-protection read returned HTTP 403; protection is not independently verified. Repository owner/admin must verify required checks and protection settings.

## Live infrastructure findings

- SonicVhibez has a staging state Worker, not a production publisher Worker. Staging D1 has six application tables, five backup rows and one dashboard-state row (revision 3, last updated 15 November); runner state/artifact/control tables have zero rows.
- Staging dashboard snapshot: 16 queue items, 3 campaigns and 4 audit events; `publishingEnabled=false`.
- R2 is not enabled (Cloudflare error 10042). No paid or account-level infrastructure was enabled.
- Nature Frontiers production D1 has seven application tables, all empty. Its publisher Worker has only a D1 binding, no publishing secrets and no schedules; browser-QC Worker has no operational bindings.
- Metricool current brand `8094526` is Nature Frontiers SA and includes the SonicVhibez YouTube network mapping. It returned zero scheduled posts for the checked window. Historical brand `7545638` returns HTTP 403; eight previously observed `draft=false` / `autoPublish=true` records remain unverified. SAFE-001 is BLOCKED.
- YouTube upload-attempt ledger is reconciled: zero previously executed private-upload jobs and owner attestation of no additional manual/local/external attempts. The mirrored verification record and reconciliation file now agree, guarded by a regression test.
- Latest YouTube OAuth refresh attempt is `invalid_grant`; the prior successful identity/inventory snapshot is historical only. It showed one public legacy Short, zero private and zero unlisted items. Full history cannot be refreshed until the owner updates `YOUTUBE_REFRESH_TOKEN`.

## Production blockers — 19 exact readiness findings

**Short (6):** `media/next-short-footage.mp4` and `media/next-short-narration.mp3` are missing; genuine footage/narration rights evidence is missing; `rightsConfirmed` and `complianceReviewed` remain false.

**Long-form (7):** `media/long-form-001-footage.mp4`, `media/long-form-drafts/long-001-narration-final.mp3`, and `long-form-001-captions-final.srt` are missing; genuine footage/narration rights evidence is missing; `rightsConfirmed` and `complianceReviewed` remain false. The previous narration artifact is superseded by a source-script hash mismatch.

**Metadata (3):** final metadata has not been human-reviewed and is not `READY_FOR_PRIVATE_UPLOAD`; rights and compliance review are not confirmed.

**Output (1):** `media/next-short.mp4` is missing. The long-form final MP4 must also be rendered and QC-verified after its source assets exist.

**YouTube authorization (2):** latest refresh token returns `invalid_grant`; current upload-capable `youtube.upload` scope is not independently verified.

Additional production tasks not represented by those 19 checks: create and approve Short and long-form thumbnails; re-sync Short captions to final audio; regenerate narration from the current long-form script; produce and verify both final MP4s; complete human factual/editorial review; verify source licenses and commercial/platform use; run one authorized private-only upload and remote read-back. Five imported Canva assets remain excluded from production evidence.

## Queue, voice and wildlife concept

- Existing 16-item SonicVhibez queue remains draft-only and creator-education focused. The Nile crocodile encounter is **not in the queue**; no existing queue content was silently replaced.
- Norman American male narration is an audition only (51.432 seconds). It is not approved as the permanent voice; model/engine commercial-use review remains open. The user may approve it or supply an authorized voice recording.
- A “TOO BIG?” crocodile thumbnail concept was generated in this chat. It is synthetic concept art, not actual wildlife footage, not rights-cleared documentary evidence and not yet approved or added to the production queue.

## Required owner inputs

1. Reauthorize the existing YouTube OAuth client and update only the GitHub Actions `YOUTUBE_REFRESH_TOKEN` secret; do not paste tokens into chat. Ensure offline access and the read-only plus upload scopes.
2. Provide or approve real Short and long-form footage, narration, captions, source/license records and the exact final metadata/thumbnail review.
3. Confirm the correct Metricool brand and restore owner access to historical brand `7545638`; reconcile the eight old auto-publish records before enabling anything.
4. Verify Nature Frontiers Page/Instagram identity and refresh Meta credentials; confirm the exact Page and linked Instagram account. The current PR workflow skipped live identity GET.
5. Decide whether the crocodile encounter should replace or supplement the creator-education queue; no queue change has been made.
6. Choose an owner-approved durable object-storage path. R2 remains disabled to avoid unapproved account activation/cost.
7. Have a repository admin verify/enable branch protection and complete GIT-002 semantic review.

**No public upload, private upload, Facebook/Instagram publication, Meta scheduling, Metricool mutation, R2 activation or merge was performed.**
---

# LIVE EXECUTION ADDENDUM — 18 November 2026, post-08:11 UTC evidence

**This addendum supersedes earlier snapshots below wherever newer live evidence conflicts. It records work executed after the 09:49 SAST checkpoint. It does not claim release completion.**

## 1. Live repository and exact-SHA reconciliation

- PR #1 live HEAD before this register-only update: `b4021c2b1d7c60ba6328a855613ada50c3e3a40b`; branch `codex/marketing-machine-audit-fixes`; state **OPEN / DRAFT / UNMERGED**.
- Current `main`: `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38`; untouched.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Live comparison: **4,317 ahead / 9 behind**. PR #1 reports 432 changed files. The compare API exposes a capped 300-file list; do not interpret that as the complete PR diff.
- `b4021c2...` changes only six documentation/acceptance files. Latest application/source-test SHA remains `3c67fbef9a48ba77774240a30bdb7aecde43320c`; do not mislabel the docs-only HEAD as a newly tested application build.
- No merge, close, ready-for-review, rebase, reset, force-push, history rewrite or main-branch write was performed. Branch protection remains unverified because the detailed protection endpoint returned HTTP 403; branch metadata reports `protected=false`.

## 2. Latest exact-head engineering and operational checks

All listed runs checked out PR HEAD `b4021c2...` unless the source/test SHA is explicitly stated.

| Evidence | Latest result | Interpretation |
|---|---|---|
| Automation/security [44264412095](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412095) | **171/171 Node test files PASS; Python 84/84 PASS; 0 skips; npm audit 0 vulnerabilities** | Engineering regression pass |
| Content quality [44264412098](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412098) | **983/983 PASS; 0 failures** | Content-quality regression pass |
| Dashboard browser [44263192946](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44263192946) | **33/33 Chromium journeys PASS** | Exact application/test SHA `3c67fb...`; DASH-001 still NOT_TESTED overall |
| Queue readiness [44264412121](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412121) | PASS; 16 items, approved destination and product URLs, all held, publishing disabled | Draft/queue preparation only; no publication |
| Metadata validation [44264412135](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412135) | PASS as a validation workflow; it confirmed HOLD and 23 blockers in its secret-limited environment | Not production readiness |
| Dedicated production readiness [44264412009](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412009) | **HOLD — 19 blockers** | Expected fail-closed release gate; no upload attempted |
| Nature Frontiers local draft validation [44264412080](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412080) | Local draft validation PASS; provider-draft generation step SKIPPED | Not a Meta provider draft |
| Nature Frontiers signed editorial approval regression [44264413079](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264413079) | PASS | Signer/policy regression only; not a real content approval |
| Meta identity workflow [44264412097](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412097) | Regression PASS; live identity GET **SKIPPED** for pull_request event | Not live Meta connection evidence |
| Instagram safety [44264412140](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412140) | PASS | Local safety regression only |
| Cloudflare durable-state [44264412156](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412156) | PASS | Unit/contract checks only |
| Cloudflare runner bridge [44264412185](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412185) | PASS | Safety tests only; no live runner execution |
| Deployment recovery [44264412045](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412045) | PASS | Recovery smoke only; no production deployment |
| Branch inventory [44264412162](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412162) | PASS; decision `REQUIRES_REVIEW` | Non-destructive inventory, not semantic approval |
| Isolated main/candidate baseline [44264412194](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44264412194) | PASS | Both isolated baseline jobs completed; retain artifact for exact comparative test totals |

The 23-blocker metadata-workflow output includes four missing YouTube environment variables because that workflow does not receive those secrets. The dedicated readiness workflow has its intended read-only credential context and reports 19 blockers. This difference is an execution-environment distinction, not evidence that credentials are healthy: the dedicated live OAuth check still returns `invalid_grant`.

## 3. Recovered media inventory and hands-on visual findings

A recursive Library inventory across all pages found **22 MP4 files**: 13 SonicVhibez and 9 Nature Frontiers. The 17 November technical inventory reports all 22 passed full FFmpeg decode. This is file-integrity evidence only.

- **0 verified original-camera footage packages**.
- **0 exact-hash human-approved release packages**.
- **0 verified publication-ready MP4s**.
- The Library contains two short MiniMax synthetic voice samples and one music bed; no owner-recorded narration sample was found.
- The two 4.032-second mongoose clips have no original-camera provenance/creator evidence and show stylized/synthetic warning signs. Do not describe them as authentic encounters.
- Nature Frontiers crocodile videos are stylized/illustrative AI/graphic drafts, not real documentary footage. They must remain separate from SonicVhibez.
- The existing 6m47s SonicVhibez Episode 2 files are graphic-only creator-workflow presentations. The v14 file is H.264 1920×1080 30fps, AAC 48kHz stereo, 407.6s, SHA-256 `0b13c209acbc1a34987de21e74d728cdf40b2214b7f4ecddb765eb7df9f8346d`. Its report says scene boundaries are estimates and not verified by listening. Sampled frames show the lower caption band; this limited sample is not a full playback/approval.
- Episode 2 v11 is 407.6s, H.264 1920×1080 30fps, AAC, SHA-256 `4ed9b7aac96c9689d02e85ee7af60f655d4e0227b0e042b0013c8ee12b979d53`. Its technical report describes a bottom caption band, but explicitly leaves narration timing, caption text review, pacing and human approval open.
- The 53.367s Short file `sonicvhibez-short-corrected-draft.mp4` has SHA-256 `9ab2955c4ebef413adbe78e483d23ecaa2649985b2154585411c110fa718e4bd`. A sampled frame at 20s shows subtitle text overlapping the upper title/header region. Treat this specific draft as **VISUAL HOLD / REJECT FOR RELEASE**; no final correction has been rendered or verified.
- A separate `wildlife-short-caption-readability` review package uses Pexels stock montage and NOAA B-roll with synthetic narration. Its manifest explicitly leaves `rightsConfirmed=false`, `humanEditorialReview=false`, `complianceReviewed=false`, `productionApproved=false`, `uploadAllowed=false` and `scheduleAllowed=false`. Exact Pexels clip-to-credit mapping and full review remain incomplete. It is not a substitute for original-camera footage or the owner's narration.

**Production consequence:** do not reuse the existing stock, AI/illustrative wildlife or unproven mongoose clips as authentic SonicVhibez wildlife footage. Do not promote the synthetic narration. The owner-recorded voice and original-camera footage remain outstanding.

## 4. Nature Frontiers lane — refreshed interpretation

- Local daily draft package validation and signed-approval code regression passed, but provider draft creation was skipped and the Meta live identity check was skipped on the PR event.
- Previous manual read-only Meta verification [44251034601] returned HTTP 401 / OAuth error 190 for user/Page credentials. No current live Meta identity/permission acceptance is established.
- Keep Nature Frontiers separate from SonicVhibez YouTube. Do not enable the Facebook/Instagram publisher, alter Metricool schedules, create provider drafts, or activate a campaign based on local test fixtures.
- The Cloudflare production Worker remains health-only with empty operational tables and no Meta secret bindings/schedules; it is not a functioning publisher.
- Existing safe defaults remain: publishing disabled, dry-run enabled, emergency stop active, campaign unset, commercial/disclosure flags unchanged. No provider writes were performed.

## 5. Remaining acceptance gates — current blockers and future inputs

### Owner-supplied production inputs
1. Original-camera wildlife footage for the next Short and long-form episode, with source originals, provenance, creator/owner, capture context and publication rights. No stock/AI substitute is approved for authentic wildlife footage.
2. Owner's own clean narration recording for the relevant approved script. The existing MiniMax/Piper voices are not an approved substitute.
3. Owner confirmation of the next editorial topic and exact story/parent relationship; the existing creator-education queue must not be silently replaced by an animal-encounter topic.
4. Owner approval of final script, source-to-scene mapping, narration, captions, thumbnail, metadata, rights evidence and exact final hashes.
5. Explicit approval for any AI reconstruction if one is ever proposed, with visible disclosure; it must never be described as recorded wildlife footage.

### YouTube
6. Reauthorize the existing YouTube OAuth client securely; latest read-only attempt returns `invalid_grant`.
7. Verify the current `youtube.upload` or other documented `videos.insert`-capable scope.
8. Refresh complete public/private/unlisted and pending/scheduled history, reconcile every uncertain upload attempt and reverify exact SonicVhibez channel identity before any upload.
9. Supply a valid exact-job, exact-hash, one-shot private-upload authorization only after all content gates pass. Public/unattended publishing remains disabled.

### Engineering / operations
10. Complete DASH-001 exhaustive field-level acceptance for 120 controls/17 forms, including positive/negative validation, authorization, persistence, refresh/restart, concurrency and accessibility. 33/33 browser journeys do not close the entire gate.
11. Complete API-001 positive acceptance for all 48 protected routes; current matrix has 48/48 auth-negative checks PASS, 42 positive paths accepted and six routes still externally blocked.
12. Complete SCHED-001 against complete live history, real dispatch, leases/cancel/retry/dead-letter/restart and remote publication read-back. The rolling `long_form → long_form → short` rule with 72-hour gaps needs at least 216 hours per cycle; owner-approved feasible cadence is still required.
13. Finish live runner integration: deployed trusted runner branch/pinned SHA is behind current implementation; no runner state/artifacts exist. Update only through reviewed owner-approved staging execution.
14. Resolve staging R2 HTTP 403/error 10042 by owner-approved R2 enablement (including billing/usage acceptance) or an approved durable alternative; no storage enablement performed.
15. Complete independent off-account backup/restore and production deployment/rollback/monitoring acceptance. Staging D1 backups are not a production disaster-recovery proof.
16. Finish GIT-002 human semantic review of 4,317 branch-only commits and 17 critical modules; preserve all nine base-only commits and do not mutate history. Verify branch protection/required checks with an owner/admin because GitHub's detailed endpoint returned 403.
17. Resolve Nature Frontiers live Meta tokens, exact Page/Instagram identity, Instagram Business Account ID, Metricool brand mapping, self-hosted publisher runner and provider-side draft/read-back. Keep both social lanes fail-closed.
18. Reconcile all remaining SEO, analytics, legal, monitoring, retention, disaster-recovery and post-publication evidence against the 89-requirement register. Do not mark NOT_TESTED as PASS based on workflow status alone.

## 6. Release decision

**HOLD / NOT PRODUCTION READY.** Engineering regression remains green, but production media and owner voice are absent/unapproved; YouTube OAuth is invalid; upload scope is unverified; full live history/spacing cannot be refreshed; Nature Frontiers Meta verification is not live; R2 and runner integration are incomplete; DASH-001, API-001, SCHED-001, DEPLOY-001 and GIT-002 remain open.

No YouTube upload, Facebook/Instagram publication, Metricool write, campaign activation, R2 enablement, production Worker deployment, PR merge, PR ready-state change or main-branch mutation was performed. This release recommendation is not the owner's authorization.

---

# 18 November 2026 — live master completion refresh (09:49 SAST evidence checkpoint)

This supersedes the 09:01 SAST checkpoint below. It records the live branch/PR state and current exact source/test SHA; it does not claim 100% completion.

## Repository and pull requests

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Implementation branch head / source-test SHA: `3c67fbef9a48ba77774240a30bdb7aecde43320c`
- Main SHA: `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38` (unchanged)
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Divergence: **4,316 ahead / 9 behind**; PR #1 changed-file count: **432**.
- PR #1: **OPEN / DRAFT / UNMERGED / mergeable=true**.
- PR #7: **OPEN / DRAFT / UNMERGED / mergeable=false**, head `7449c1b61dcd26811ee6e6d416a02180a7f1c1ec`, 19 files; one exact-head Actions run passed.
- Both branch objects report `protected=false`; protection details endpoint returned HTTP 403. No protection changes were attempted.

## Implementation completed in this run

- `baf598f1604997a2b0c8f9310567e3abe2873dad`: added a fail-closed 14-day seller-evidence freshness check for every promoted product; exact product URL, named seller, evidence reference, timezone-qualified verification timestamp, and future-skew checks are now required. Added regression coverage for stale, mismatched, future-dated and unnamed seller evidence.
- `3c67fbef9a48ba77774240a30bdb7aecde43320c`: corrected spoken disclosure ordering so the disclosure precedes product mentions; refreshed the two current-week creator-education drafts and added a regression test keeping the unapproved 90-Day Blueprint disclosure on HOLD.
- Current week remains at two drafts, never exceeds the two-item cap, and still has no publication timestamps.

## Exact-SHA tests and CI

- Node regression: **983/983 tests passed**, zero failures/skips — [content quality run 44263192731](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44263192731).
- Node test-file inventory: **171/171 passed**; Python **84/84 passed**, zero skips; npm audit **0 vulnerabilities** — [automation run 44263192728](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44263192728).
- Dashboard Chromium: **33/33 passed** — [run 44263192946](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44263192946).
- Cloudflare durable-state checks, runner-bridge safety, deployment recovery, branch inventory, metadata and lockfile workflows passed on this SHA.
- Production readiness is **HOLD with 19 blockers** — [run 44263192630](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44263192630).
- Queue readiness [run 44263192685](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44263192685) was still in progress at the evidence checkpoint.

## Current acceptance register

**15 PASS / 0 FAIL / 63 NOT_TESTED / 11 BLOCKED** on the current-head snapshot. DASH-001, API-001, SCHED-001, DEPLOY-001 and GIT-002 remain NOT_TESTED. STATE-001 is staging-only PASS. The companion API matrix records 48/48 authentication-negative checks passing on the current SHA, but positive route acceptance remains 0 PASS / 42 NOT_TESTED / 6 BLOCKED. The dashboard matrix records 33/33 browser journeys on the exact SHA, but DASH-001 remains NOT_TESTED overall.

## Current production blockers and safety

- Readiness reports 19 blockers: missing Short and long-form footage/narration/captions, genuine human-verified licence evidence, human rights/compliance review, final MP4, YouTube OAuth `invalid_grant`, and unverified upload-capable scope.
- Latest stored YouTube history snapshot reports one public upload and no private/unlisted uploads; prior upload-attempt reconciliation passed. The last known actual publication was 22 Oct 2026 17:05:56 Africa/Johannesburg. At the run timestamp 18 Nov 09:49:03, 26d16h43m07s had elapsed; full live history/queue is still unavailable, so spacing remains UNVERIFIED and no schedule is allowed.
- Metricool returns only Nature Frontiers SA (8094526), with SonicVhibez YouTube ID embedded in a mixed brand; old brand 7545638 returns 403. Current schedule query returned zero posts; draft inventory and eight previously observed future autoPublish records remain unverified.
- No post was changed. No video was rendered, uploaded, scheduled or published. Public publishing remains disabled. No paid services, GPU, upgrades or trials were used.
- The exact approved Vault link remains `https://selar.com/0u19v8u99l`; other product disclosure remains held where not owner-approved. Safari affiliate campaign remains inactive.

## Next owner action

Securely reauthorize the existing YouTube OAuth connection and verify an upload-capable scope. Do not send secrets in chat. Rights-cleared media and human review remain separate release gates.

---

# LIVE MASTER COMPLETION REFRESH — 18 November 2026, 09:01 SAST (latest)

**This addendum supersedes older SHA, workflow, Cloudflare, Meta and media-inventory snapshots in this file wherever they conflict. The current decision remains HOLD. This is not owner authorization to publish.**

## Exact current candidate and B acceptance

- PR #1 remains **OPEN / DRAFT / UNMERGED**. Implementation branch: `codex/marketing-machine-audit-fixes`. Latest tested source/config candidate before this register-only refresh: `af3c7bd8447af08d12de15a9078f3527490d56be`. `main` baseline: `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38`. Merge base remains `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Candidate automation/security [44257103623]: **171/171 Node test files PASS, 84/84 Python tests PASS, zero skips, npm audit 0 vulnerabilities**.
- **DASH-001: PASS.** The exact dashboard matrix source/test SHA `3edcdde4d20cbb4a69017e9c3e156f743c17bec0` accepts **121/121 controls, 17/17 forms and 15/15 cross-cutting dimensions**. Latest branch Chromium E2E [44595474683](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44595474683) passed **41/41 journeys**. Coverage includes authorization, actionable errors, persistence/restart, concurrency/idempotency, keyboard and mobile accessibility, validation boundaries, and read-only/disabled invariants. Six production-dependent forms are accepted as expected fail-closed outcomes, not dashboard defects.
- Isolated baseline [44257103336]: both main and candidate installs/tests PASS. Main: 54 Node tests, 8 Python tests, 4 moderate npm audit vulnerabilities. Candidate: 171 Node test files, 84 Python tests, 0 skips, 0 npm audit vulnerabilities.
- Content-quality [44257103498], metadata safety [44257103610], queue readiness [44257103346], Cloudflare durable-state tests [44257103466], runner-bridge tests [44257103518], deployment recovery [44257103524] and Instagram safety [44257103371] passed. The production-readiness workflow [44257103455] returned the expected **HOLD — 19 blockers**.
- Branch inventory [44257103463]: **4,312 branch-only commits, 9 base-only commits, 432 changed files**, clean working tree, `REQUIRES_REVIEW`. All nine base-only commits were inspected and classified as tests/docs/workflow additions/removals/reverts; no base-only production application source change. The 4,312 branch-only commits and 17 critical modules still require full human semantic review. Selected security-sensitive modules were spot-reviewed only.
- The PR description has stale HEAD text; use live PR metadata, not the stale description. Do not merge, close, mark ready, retarget, rebase, reset, force-push or rewrite history. Do not modify `main`.
- GitHub returned no repository rulesets. Branch-protection endpoints returned 403, so required-check/branch-protection state is not independently verified. Owner/admin verification is required before any release.

## B. Engineering and operational acceptance — gate states

| Gate | State | Remaining acceptance |
|---|---|---|
| DASH-001 | NOT TESTED overall | 120 controls / 17 forms. 11 forms have local/operator success evidence; 6 remain fail-closed on production prerequisites. 33 browser journeys are not exhaustive per-control/field success, validation, error, auth, persistence, refresh/restart, concurrency and accessibility acceptance. |
| API-001 | NOT TESTED overall | Last route matrix: 48 protected routes, 42 PASS, 6 BLOCKED; 48/48 missing/invalid-auth checks PASS. Six blocked positive paths: Facebook draft approval, Facebook publish, Facebook Page verification, Instagram approval, production job execution, upload reconciliation. External credentials/media/remote read-back are still required. |
| SCHED-001 | NOT TESTED overall | Rolling `long_form → long_form → short`, >=72 elapsed hours and no same Johannesburg calendar day are code-tested. No new remote publication has been made; live dispatch, actual remote timestamps, restart, lease, cancellation, retry, dead-letter and full history proof remain open. |
| Worker dispatch/backoff | CODE PASS; LIVE NOT TESTED | 409/backoff and uncertain-dispatch persistence now fail closed. A failed persistence write retains the exclusive process lock and stops the worker; ambiguous POSTs are quarantined. Regression tests pass. No live runner dispatch has been verified. |
| STATE-001 | PARTIAL PASS — staging only | Staging D1 state, backup retention and recovery tests pass. Independent off-account backup and production restore remain open; R2 access is blocked (see below). |
| DEPLOY-001 | PARTIAL PASS — smoke only | Deployment recovery smoke tests pass. Authorized production deployment, monitoring, alerting, rollback and disaster recovery are not tested. |
| GIT-002 | PARTIAL REVIEW | Nine base-only commits reviewed; 4,312 branch-only commits/17 critical modules still need full human semantic review. No history mutation is authorized. |
| E2E-001 | NOT TESTED | No genuine rights-cleared media item has completed the entire plan-to-render-to-human-approval-to-private-upload-to-remote-read-back/restart journey. |
| SEO-001 | NOT TESTED | Final metadata, captions and thumbnail need human approval against a genuine final export and measured search/competition evidence. |

## Live Cloudflare and runner verification

**SonicVhibez staging durable-state Worker** `sonicvhibez-durable-state-staging` is deployed with a D1 binding, R2 binding and two operator secrets (values were not read). Read-only D1 inspection found:
- One singleton state row, revision 3, last updated 15 Nov 2026; `publishingEnabled=false`.
- 16 queue items, all held; 0 jobs; 0 uploads.
- Five D1 backups, oldest 8 Nov and newest 15 Nov.
- 0 runner states, 0 runner controls, 0 runner artifacts and 0 artifact parts.
- No Worker scheduled triggers.

**R2 is a hard staging artifact blocker:** read-only listing of `sonicvhibez-artifacts-staging` returned HTTP 403 / Cloudflare error 10042: “Please enable R2 through the Cloudflare Dashboard.” The Worker has an R2 binding, but object list/read/write integrity cannot be accepted. Do not enable R2 without owner approval because usage/billing implications must be accepted. Local/GitHub workflow artifacts are not a durable production substitute.

**Runner trust/execution mismatch:** the deployed staging Worker OIDC trust and `.github/workflows/repository-runner.yml` live on the separate OIDC-trusted branch `codex/cloudflare-adapter-integration-20261108`; that workflow checks out implementation SHA `02da9bc9e9ac4d14377f2c0d1bf4b5c099144099`. The current tested candidate `af3c7bd...` is **60 commits ahead** of that pinned execution SHA. The runner workflow is manual-dispatch only; `run_repository_runner` defaults false. The current implementation branch does not contain that OIDC-trusted workflow. No live runner state/artifacts exist. Updating the pinned execution SHA or OIDC trust requires owner-approved staging change and an authorized manual dispatch; no such deployment/dispatch was performed.

## C. Nature Frontiers — separate Facebook/Instagram lane

**Live Meta identity:** read-only manual workflow [44251034601] returned HTTP 401 / OAuth error 190 for both the Meta user token and Page token. The latest PR-event Meta workflow [44257103371] passed regression tests but skipped live identity verification; do not call the live connection green. Renew the existing credentials through GitHub secret management, then verify Page identity, token validity, permissions and linked Instagram account read-only.

**Metricool:** Nature Frontiers SA brand ID `8094526`; Facebook Page ID recorded as `1431329126735709`; Instagram label `naturefrontieers2026`; timezone `Africa/Johannesburg`. Scheduled-post query for 18 Nov–18 Dec 2026 returned **zero** posts. Its network data also contains the SonicVhibez YouTube channel ID; this cross-brand mapping must be corrected or explicitly confirmed before any scheduling. No Metricool write was performed.

**Nature Frontiers Cloudflare Worker:** live read-only inspection of `nature-frontiers-publisher` found only GET `/health` (other paths 404; non-GET 405), a D1 binding, no Meta secrets and no scheduled triggers. Its seven operational D1 tables (`approvals`, `audit_events`, `content_items`, `content_targets`, `media_rights`, `meta_webhook_events`, `publication_attempts`) each contain zero rows. It is a health endpoint, not a functioning publisher.

**Nature Frontiers media register:** 92 stock candidates (85 Pexels, 7 Pixabay); 18 listing URLs marked verified and 74 unverified. **0 local MP4s, 0 SHA-256 source hashes, 0 rights reviews, 0 additional-permission reviews, 0 visual inspections, 0 human approvals, 0 scheduled and 0 published.** The 9 MP4s found in the separate Library review inventory decode technically, but none is publication-ready. Stock footage must never be represented as Nature Frontiers original field footage.

**Publishing automation:** `.github/workflows/facebook-autonomous-publisher.yml` is main-only, requires a self-hosted runner labelled `linux` and `facebook-publisher`, and hardcodes `FACEBOOK_PUBLISH_ENABLED=NO`. The daily draft workflow generates a local research-only draft package/three-slot plan; it does not create or read back Meta provider drafts. Facebook and Instagram intake/approval queues are empty. Instagram business account ID is null. The Facebook config remains `publishingEnabled=false`, `dryRun=true`, `emergencyStop=true`; Instagram remains disabled/dry-run/emergency-stopped. Target cadence remains 2 Reels + 1 feed post daily only after approval, rights, quality and provider readiness. Safari remains inactive; Selar is draft-only. No campaign or post is authorized.

## Production assets and voice — current state

- SonicVhibez Short and long-form source footage/narration/final masters remain missing from the required production paths. Long-form final captions are missing. The 19-blocker readiness report lists the exact missing paths and approvals.
- The NOAA California spiny-lobster source has source-level rights/provenance evidence, and the visual review cut is genuine footage with source audio removed. It remains a silent/review-only cut, not `media/next-short.mp4`; final attribution, owner narration, captions, human playback, final rights/compliance approval and exact final hashes remain open.
- The Nile crocodile draft is a 154-word, 50–60-second, 9:16, research-backed **AI-generated illustrative reconstruction**; it is unqueued and not authentic footage. Do not publish it as documentary footage. Owner must either provide genuine footage or explicitly approve a clearly disclosed reconstruction.
- The current synthetic American voice candidate (Piper Norman) is review-only, not auditioned/approved; the previous Banjo candidate was rejected. The owner requested their own recorded voice for videos; no owner recording is present. Do not substitute synthetic narration without explicit owner approval. The existing AI-voice disclosure in draft metadata is provisional and must match the final actual audio.
- The next queued Short/long-form topic remains creator-education, not the animal-encounter direction. Confirm the next editorial topic and footage source before production.
- The Selar CTA is the owner-provided URL, but the product listing uses Nature Frontiers branding; owner must confirm it belongs in SonicVhibez content and approve the exact direct-sales disclosure before use.

## Required future owner inputs

1. Provide the genuine original footage for the next Short and long-form item, or explicitly authorize use of licensed Pexels/Pixabay/NOAA stock as third-party footage (never described as owner-shot/original field footage).
2. Provide the owner's clean voice recording for the narration; approve the exact voice-processing approach. No synthetic voice is approved by default.
3. Approve the editorial direction (animal encounter vs creator-education) and the exact next topic; approve any AI reconstruction separately and only with visible disclosure.
4. Supply/approve final captions and exact script-to-scene mapping.
5. Confirm rights for every footage/audio/music/image derivative; human-review the exact final hashes and approve final metadata/thumbnail.
6. Reauthorize YouTube OAuth through secret management; verify SonicVhibez channel identity, upload-capable `videos.insert` scope and complete remote history. Current read-only readiness [44257103455] returns `invalid_grant`; no upload is allowed.
7. Confirm whether any uncertain YouTube upload attempt occurred outside the repository/runtime; no blind retry.
8. Renew Meta user and Page tokens in GitHub secrets; verify official Page identity, required permissions and linked Instagram account; supply the Instagram Business Account ID.
9. Confirm the Nature Frontiers/Metricool network mapping and remove or explicitly approve the SonicVhibez YouTube association on that brand.
10. Register/confirm the persistent self-hosted GitHub runner required by the Facebook publisher workflow; authorize any update to the old OIDC-trusted runner branch/pinned SHA only after review.
11. Decide whether to enable Cloudflare R2 (including billing/usage acceptance) or approve a genuinely durable no-cost alternative; verify backup restore independently off-account.
12. Owner/admin verifies branch protection and required status checks; human semantic review of all 4,312 branch-only commits and critical modules remains required.
13. Confirm whether the Nature Frontiers stock candidates may be used and approve final content packages before scheduling. No unreviewed Metricool drafts/posts are approved.
14. Confirm the Selar product's brand fit and exact direct-sales disclosure for SonicVhibez.

## Release decision — recommendation completed

**HOLD / NOT PRODUCTION READY.** Do not upload, schedule, publish, enable unattended publishing, activate campaigns, deploy the Nature Frontiers publisher, or promote staging to production. Reassess only after the relevant owner inputs, media/rights/human approvals, credentials, live provider verification, runner/R2 decision and exact-SHA acceptance gates are complete. This is an evidence-based recommendation, not the owner's signature or publishing authorization.

**No credentials were read or printed. No production uploads, Meta posts, Metricool writes, campaign activations, R2 enablement, Worker deployment, PR merge or main-branch change were performed.**

---

# LIVE MASTER COMPLETION REFRESH — 18 November 2026, 09:01 SAST

**This is the newest verified status addendum. It supersedes older SHA, test-count, readiness, Meta and branch-inventory snapshots below wherever they conflict. It is an evidence register, not owner authorization to publish.**

## Exact repository and test lineage

- Live PR #1 metadata before this register-only refresh: OPEN / DRAFT / UNMERGED; implementation branch `codex/marketing-machine-audit-fixes`; tested documentation snapshot `51e4defda80067ae5a59e1f5ea467d8ad0becee3`; base `main`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. This next register update is also documentation-only; application source/test code remains the tested `20e437b1412abfb7e6f45aa06fd926658afc1342`.
- The PR description contains a stale HEAD (`04794264...`); live PR metadata is authoritative for the current head. Latest fully tested application/source candidate is `20e437b1412abfb7e6f45aa06fd926658afc1342`; the current PR-head checkpoint commit `34e751c...` is documentation-only relative to that tested source candidate.
- Latest exact branch-snapshot automation/security run [44256211875](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44256211875): **171/171 Node test files passed; 84 Python tests passed; zero skips; npm audit 0 vulnerabilities**. Normal lifecycle install, syntax checks and Python compilation passed.
- Latest dashboard browser run [44256211885](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44256211885): **33/33 Chromium journeys passed** against the real local dashboard/backend.
- Latest content-quality run [44256211958] passed; metadata safety, schedule validation, timed-caption checks and the fail-closed asset/metadata examples all behaved as expected. The printed `BLOCKED — asset register review failed` is the deliberate rejection of an unreviewed fixture, followed by `PASS: unreviewed asset register example remains blocked`; it is not a workflow failure.
- Instagram safety [44256211877] passed. Meta connection workflow [44256211724] passed its regression tests, but its live Meta user/Page verification step was **SKIPPED** on the pull-request event. Do not record live Meta identity as passed.
- Cloudflare durable-state [44255109998], runner bridge [44255110113], deployment recovery [44255109994], signed editorial approval regression [44255109992] and Nature Frontiers local draft [44255110046] passed on the immediately preceding same-source PR snapshot; the intervening commits changed documentation only. Local/regression PASS is not live provider authorization.
- Production readiness [44255110124] remains **HOLD — 19 blockers**. This is the required fail-closed result, not a code-test regression. It performed no upload, scheduling or publication.
- Non-destructive branch inventory [44256211966] passed: **4,309 branch-only commits, 9 base-only commits, 432 final-tree changed files**, decision `REQUIRES_REVIEW`.
- Isolated baseline comparison [44256211803] passed on exact main SHA `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38` and candidate SHA `51e4defda80067ae5a59e1f5ea467d8ad0becee3`: main had 54 Node tests, 8 Python tests and 4 moderate npm audit vulnerabilities; candidate had 171 Node test files, 84 Python tests, zero skips and 0 npm audit vulnerabilities. Both test suites and installs passed.
- PR safety remains mandatory: do not merge, close, mark ready, retarget, rebase, reset, force-push or rewrite history; do not modify `main`.

## B. Engineering and operational acceptance — current gate decisions

| Gate | Current decision | Exact remaining acceptance |
|---|---|---|
| DASH-001 | NOT TESTED overall | 120 controls / 17 forms. 11 forms have local/operator success evidence; 6 remain fail-closed on production prerequisites. Complete per-control/field authorized success, validation, error, authorization, persistence, refresh/restart, concurrency and accessibility evidence. 33 browser journeys are not exhaustive control acceptance. |
| API-001 | NOT TESTED overall | Last route matrix: 48 protected routes, 42 PASS, 6 BLOCKED; 48/48 missing/invalid-auth checks PASS. Six blocked routes: `POST /api/facebook/drafts/approve`, `POST /api/facebook/publish`, `POST /api/facebook/verify-page`, `POST /api/instagram/approve`, `POST /api/jobs/produce`, `POST /api/uploads/reconcile`. Complete their real provider/media positive paths and remote read-back; do not promote negative fail-closed tests to full route PASS. Matrix snapshot is dated 16 Nov and must be refreshed after new route-specific evidence. |
| SCHED-001 | NOT TESTED overall | Policy tests pass for rolling `long_form → long_form → short`, at least 72 elapsed hours and no same Johannesburg calendar day. Complete current OAuth, remote history/attempt reconciliation, actual remote timestamps, live dispatch, lease/cancel/retry/dead-letter and worker restart proof. |
| SCHED-WORKER-DISPATCH-001 | NOT TESTED operationally | Local 409/backoff, uncertain-dispatch quarantine and persistence/restart tests pass. A continuously running production worker and real render dispatch are not proven. |
| STATE-001 | PASS — staging only | Staging D1 backup/restore/restart and five-backup retention are accepted. Independent off-account backup and production state remain separate. |
| DEPLOY-001 | NOT TESTED | Deployment recovery smoke passes 2/2 locally. Complete authorized production deployment, monitoring, alerting, rollback and disaster recovery. |
| GIT-002 | NOT TESTED | 4,308/9 divergence and 432 changed files require human semantic review. Preserve both restore-history tests and all divergence; no integration mutation is authorized. |
| E2E-001 | NOT TESTED | No genuine rights-cleared item has completed the entire real plan → script → footage → narration → captions → render → QC → human approval → private-upload preparation → remote read-back → restart recovery journey. |
| SEO-001 | NOT TESTED | Approve final metadata/captions/thumbnail against a genuine final export and provide measured search/competition evidence. Do not claim ranking guarantees. |

The 171-file Node suite, 84 Python tests and 33 browser journeys establish current engineering regression health; they do not close the acceptance gates above.



### GIT-002 semantic review slice completed — 18 November 2026

The full nine-commit base-only list from branch inventory run [44256211966](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44256211966) was inspected by commit and file diff. All nine are test, documentation or workflow additions/removals/reverts; none changes production application source on the base-only side. The two accidental additions to main (the American narration review workflow and requirements-register documentation) were removed by the forward revert; two transient test files were likewise added/removed; the Facebook restore-history test was removed from main but remains deliberately preserved on the implementation branch. This closes the base-only semantic review slice only. The 4,309 branch-only commits and all 17 critical application modules still require complete human semantic review; selected security-sensitive code paths were spot-reviewed, not exhaustively approved. No merge/rebase/reset/force-push/history rewrite was performed.

## Production readiness — 19 current blockers

The exact-head readiness run [44255110124](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44255110124) lists:

**Short manifest (6):**
1. Missing `media/next-short-footage.mp4`.
2. Missing `media/next-short-narration.mp3`.
3. No genuine human-verified footage-rights evidence.
4. No genuine human-verified narration-rights evidence.
5. Keep `rightsConfirmed=false` until all actual media permissions are checked.
6. Keep `complianceReviewed=false` until a human reviews the exact final package.

**Long-form manifest (7):**
7. Missing `media/long-form-001-footage.mp4`.
8. Missing `media/long-form-drafts/long-001-narration-final.mp3`.
9. Missing `long-form-001-captions-final.srt`.
10. No human-verified footage-rights evidence.
11. No human-verified narration-rights evidence.
12. Long-form rights confirmation remains false.
13. Long-form compliance review remains false.

**Metadata and release (3):**
14. Exact final metadata has not been human-reviewed and marked `READY_FOR_PRIVATE_UPLOAD`.
15. Metadata rights confirmation remains false.
16. Metadata compliance approval remains false.

**Remote access and final master (3):**
17. Missing rendered production master `media/next-short.mp4`.
18. Latest read-only YouTube OAuth attempt returns `invalid_grant`; reauthorization is required.
19. Upload-capable YouTube OAuth scope accepted by `videos.insert` (prefer `youtube.upload`) is not independently verified.

The readiness workflow reports one existing SonicVhibez upload (public=1, private=0, unlisted=0) and prior attempt reconciliation passed in that run. The existing public 20-second Short is a legacy item, not proof of the current 50–60-second production target. The OAuth failure and unverified upload scope still prohibit a new upload. No blind retry is permitted.

## C. Nature Frontiers — separate Meta publishing lane

- Live Metricool read-only brand: Nature Frontiers SA, brand ID `8094526`; Facebook Page ID recorded as `1431329126735709`; Instagram account label `naturefrontieers2026`; timezone `Africa/Johannesburg`.
- Metricool scheduled-post query for 18 Nov–18 Dec 2026 returned zero scheduled posts. Its brand network data also exposes the SonicVhibez YouTube channel ID; this cross-brand mapping is unresolved and is not permission to publish YouTube content through Nature Frontiers.
- Meta regression workflow is green, but the live identity/permission step was skipped on PR runs. The latest earlier live Meta identity check returned HTTP 401 (expired/invalid user and Page token session); renew only through secure secret management and then run the authorized read-only verification.
- Instagram safety and signed editorial-approval code suites pass; local draft package validation passes. None proves provider-side draft creation/read-back or human approval of actual content.
- The deployed `nature-frontiers-publisher` Worker is health-only: GET `/health`, no Meta publishing routes, no secrets, no cron. Its production D1 operational tables have zero rows. It is not a functioning publisher.
- Library inventory: 9 Nature Frontiers MP4s technically decoded; **0 publication-ready**, **0 verified original-camera packages**, **0 human-approved assets**. Nile crocodile explainer remains illustrative animation, not documentary footage, with full human playback, factual, source-provenance, rights and exact-hash approval still pending.
- Maintain `publishingEnabled=false`, `dryRun=true`, `FACEBOOK_PUBLISH_ENABLED=NO`, emergency stop enabled; keep unreviewed content held. No post, schedule or provider mutation is authorized.

## Required future owner inputs

1. Supply the genuine Short footage and the final long-form footage, or exact original-source links and creator/licence evidence; the five imported Canva wildlife clips remain excluded until source identity, original MP4 bytes, hashes, permitted use and human visual review are established.
2. Provide the user's own narration recording for the chosen content, or explicitly approve AI narration and its disclosures for that specific content. The recent request to record a permanent natural voice is not yet a supplied recording. Do not substitute placeholder eSpeak or unapproved synthetic voices.
3. Supply/approve final captions and exact script-to-scene mapping for each production item.
4. Confirm all rights for footage, narration, music, images and derivatives; perform full human playback/editorial/compliance review and approve the exact final hashes.
5. Human-review exact final metadata and explicitly authorize `READY_FOR_PRIVATE_UPLOAD` for a specific private-only job.
6. Reauthorize YouTube OAuth through the secure secret manager; independently verify SonicVhibez identity, upload-capable scope and complete current remote history. Confirm whether any upload was attempted, failed, timed out or left uncertain outside the repository/runtime.
7. Confirm official Nature Frontiers Facebook Page and Instagram professional-account identities/permissions in Meta Business Suite; renew user/Page credentials through secret management and verify by read-only API calls.
8. Supply an approved SonicVhibez logo if it is to be used in final video/thumbnail.
9. Confirm a zero-cost independent backup destination and resolve Cloudflare R2 permission/access (prior R2 listing returned 403); no paid service is approved.
10. Provide production deployment access/secrets only through their secret managers, and owner/admin confirmation to enable branch protection and required status checks.
11. Complete human semantic review of divergent Git history; this is an owner/maintainer review, not an automated inventory operation.

## Release decision — completed recommendation, owner authorization still separate

**RECOMMENDATION: HOLD / NOT PRODUCTION READY.** This is the evidence-based release decision for the current checkpoint. Do not upload, schedule, publish, activate campaigns, enable unattended publishing or promote staging to production. Reassess only after all relevant blockers have been independently satisfied and the exact final candidate has passed its release gates. This recommendation does not impersonate the owner's signature or grant publishing authorization.

**No credentials, assets, rights, approvals, provider outcomes or production deployment were fabricated. No paid infrastructure was used. No upload, schedule, publication, PR merge or main-branch modification was performed.**

---

# LIVE MASTER STATUS — 18 November 2026

**This live refresh supersedes older checkpoint details below wherever they conflict.** It is an evidence snapshot, not a release approval.

- Current fully tested implementation code SHA at this refresh: `20e437b1412abfb7e6f45aa06fd926658afc1342` (the master-register documentation refresh is a later documentation-only commit). Full automation run `44254485025` and content-quality run `44254493722` passed on this exact SHA.
- `main` HEAD: `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38`. Its tree hash `f4d82cadc0b2f896702d3a249f367c19fdf7e5db` is identical to the original `main` tree at `2e4153c8252349d1a7c5655f5cdc00da557c597e`.
- **Safety incident and correction:** commits `5af11d8d63e36808ca8c77f5435a29a965270254` and `a10eca5d13da0b120eb55b2c9c40bb2c488eb61a` were accidentally created on `main` because two contents updates omitted the implementation-branch parameter. They added only `docs/REQUIREMENTS_ACCEPTANCE_REGISTER.json` and `.github/workflows/american-narration-review.yml`; both files were removed by normal forward revert commit `2cd6f223`. The original main tree is restored exactly. No force-push, reset, rebase or history rewrite was used. No further writes to `main` are permitted.
- PR #1: OPEN / DRAFT / UNMERGED. No merge, close or ready-for-review change.
- Branch reconciliation inventory `44254493755` on code SHA `20e437b` reports 4,307 ahead / 9 behind; merge base remains `45352b73bb6cc4787b2a49988b575afb754ab627`; 432 changed files, 17 critical-module changes, 0 deletions, 0 patch-equivalent commits, clean working tree, and `integrationDecision=REQUIRES_REVIEW`. GIT-002 semantic review remains NOT TESTED; no merge or rebase is authorized.
- Exact-SHA CI on code SHA `20e437b` passed: 981/981 Node tests with zero skips (`44254493722`), 84/84 Python tests with zero failures (`44254485025`), npm audit 0 vulnerabilities, isolated normal `npm ci` lifecycle install, JavaScript syntax checks, Python compilation, and read-only authenticated Cloudflare staging smoke. The full automation workflow `44254485025` completed SUCCESS. Dashboard browser E2E on this SHA is still being re-run; the preceding exact-SHA run `44253930716` passed 33/33 journeys.
- The latest readiness artifact on code SHA `20e437b` (run `44254493726`) reports **19 release blockers**. Read-only history run `44211269635` verified one legacy public Short; upload-ledger run `44252812519` verified no prior private-upload jobs and `previousLedgerRunId=NONE`. Neither result authorizes a new upload. OAuth still returns `invalid_grant`, and upload scope remains unverified.

## Current 19 release blockers

**Short manifest (6):**
1. Missing `media/next-short-footage.mp4`.
2. Missing `media/next-short-narration.mp3`.
3. Missing genuine, human-verified footage-rights evidence.
4. Missing genuine, human-verified narration-rights evidence.
5. `rightsConfirmed` must remain false until every asset's actual permissions are checked.
6. `complianceReviewed` must remain false until a human reviews the exact final package.

**Long-form manifest (7):**
7. Missing `media/long-form-001-footage.mp4`.
8. Missing `media/long-form-drafts/long-001-narration-final.mp3`.
9. Missing `long-form-001-captions-final.srt`.
10. Missing human-verified footage-rights evidence.
11. Missing human-verified narration-rights evidence.
12. Long-form `rightsConfirmed` remains false.
13. Long-form `complianceReviewed` remains false.

**Metadata and release (3):**
14. Final metadata has not been human-reviewed and marked `READY_FOR_PRIVATE_UPLOAD`.
15. Metadata rights confirmation remains false.
16. Metadata compliance review remains false.

**Remote access and final master (3):**
17. `media/next-short.mp4` does not exist.
18. Latest read-only YouTube OAuth attempt returns `invalid_grant`.
19. A current upload-capable YouTube OAuth scope (`youtube.upload` or another documented `videos.insert`-capable scope) is not independently verified.

The five imported Canva clips are explicitly excluded from production and remain uncleared. Queue-readiness run `44254493713` retained an isolated proposal with 16 existing items, 0 additions, 0 scheduled items and publishing disabled; 12 remain on media/human-review hold, 2 await narration/media/review, 1 has script/captions ready but still needs media/review, and 1 legacy status remains lower-case. The queue artifact's local readiness report shows 23 blockers because four YouTube environment variables are deliberately unavailable in the PR execution context; the configured production-readiness workflow reports the 19 release blockers above. The schedule validator now prints a NOTE rather than an unconditional live-history blocker; it does not query YouTube. The strict Internet Archive discovery workflow completed but found zero eligible wildlife assets; no media was downloaded. The WanGP model/VAE mirror provenance conflict remains unresolved, and no owner-started Kaggle GPU generation has occurred. The current queued Short draft is still a creator-education tutorial, which does not meet the user's current requested direction of realistic wildlife-encounter storytelling. A separate research-backed, unqueued Nile crocodile encounter draft now exists at `content/drafts/nile-crocodile-eyes-at-the-waterline.md`; four safety tests enforce its unqueued status, factual source map and AI-reconstruction disclosure. It is not yet owner-approved, rendered, scheduled or published. Any AI-generated encounter must be clearly labelled as an illustrative reconstruction, not a real documented event.

## Engineering and operational acceptance — current decision

| Gate | Evidence / status | Remaining acceptance |
|---|---|---|
| DASH-001 | NOT TESTED overall. Inventory: 120 controls, 17 forms, 103 form-owned, 17 standalone; last completed browser E2E passed 33/33 journeys on `58ec88f`; current `20e437b` rerun is in progress. 11 forms locally pass and 6 production-dependent forms fail closed. | Exhaustive per-control/field success, validation, error, authorization, persistence, refresh/restart, concurrency and accessibility acceptance. |
| API-001 | NOT TESTED overall. 48 protected routes; 42 overall PASS, 6 BLOCKED; 48/48 missing/invalid-auth negative checks pass. | Six positive paths remain provider/production gated; complete route-by-route persistence, audit, concurrency and restart acceptance. |
| SCHED-001 | NOT TESTED. Rolling `long_form → long_form → short`, 72 elapsed hours and no same Johannesburg calendar day are policy-tested; SCHED-003 cadence decision is PASS. Queue-readiness run `44254493713` passed with 0 new items, 16 total, 0 scheduled and `publishingEnabled=false`. The local validator now correctly notes that it does not query YouTube; the separate production-readiness gate handles remote history. | Current OAuth, live dispatch, actual remote publication timestamps, worker restart, lease/cancel/retry/dead-letter and real publication proof. |
| SCHED-WORKER-DISPATCH-001 | Local retry/backoff, 409 and uncertain-dispatch quarantine tests pass. | No continuous production worker or real render dispatch is proven. |
| STATE-001 | PASS for staging D1 backup/restore and restart tests only. Direct read-only query shows 5 backups and one dashboard-state row at revision 3. | Independent off-account backup and production state acceptance. Staging has zero runner artifact, runner control and runner-state rows. |
| DEPLOY-001 | NOT TESTED. Deployment recovery smoke passed on the current candidate; read-only Cloudflare staging smoke passed in automation run `44254485025`. | No SonicVhibez production Worker exists; production monitoring, alerting, rollback and disaster recovery remain open. |
| GIT-002 | NOT TESTED. Branch reconciliation `44254493755`: 4,307 ahead / 9 behind, 432 changed files, 17 critical modules, 0 deletions, 0 patch-equivalent commits, clean tree; integration decision `REQUIRES_REVIEW`. | Human semantic review of the divergent history; preserve all divergence and do not merge. Branch-protection endpoint returned 403; owner/admin must verify protection. |
| E2E-001 | NOT TESTED. | No real rights-cleared item has completed plan → script → footage → narration → captions → render → QC → approval → private-upload preparation → remote read-back → restart recovery. |
| SEO-001 | NOT TESTED. | No final metadata, captions and thumbnail have been approved against a genuine final export with measured search evidence. |

Stored acceptance-register snapshot (16 November, refreshed on 18 November for the owner-approved cadence decision only; remaining rows are not freshly reconciled): 89 requirements = 71 PASS / 9 NOT_TESTED / 9 BLOCKED. SCHED-003 is now PASS from the owner-authored 17 November approval recorded in config; SCHED-001 remains NOT_TESTED. API matrix snapshot: 48 routes = 42 PASS / 6 BLOCKED, authentication-negative 48/48. Do not present these stored counts as a current full release pass.

## Nature Frontiers — separate Meta lane

- Live Meta verification was executed on push (run `44251034601`), not merely inferred from the green PR regression suite. The regression suite passed 100 tests, but the live read-only check failed: user token HTTP 401 / OAuth error 190 (session invalid because user logged out); Page token HTTP 401 / OAuth error 190 (session invalidated by password/security change).
- Configured Page ID is `1431329126735709`; required user-token permissions are `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts`, plus Page task `CREATE_CONTENT` or `MANAGE`. Both user and Page tokens must be renewed through Meta and stored only in GitHub Actions secrets. Never paste tokens into chat.
- Metricool currently exposes one brand only: Nature Frontiers SA, brand ID `8094526`, timezone `Africa/Johannesburg`. Its record contains Facebook Page `1431329126735709`, Instagram username `naturefrontieers2026`, and a `youtubeData` field containing the SonicVhibez channel ID `UCSlkuPfHH78oGC1o418HV4w`. The brand's connected-network summary lists Facebook/Instagram; treat the YouTube field as an unresolved cross-brand mapping and do not use Nature Frontiers as a YouTube destination.
- Current Metricool query returned zero scheduled posts for 18 November–18 December 2026. Old brand ID `7545638` returns HTTP 403 (access denied), so eight previously observed future auto-publish records remain UNKNOWN until the owner restores access or independently verifies them in the Metricool UI. Do not edit/cancel/publish unknown records.
- The green daily-draft CI run is a deterministic PR test fixture dated 2030-10-25, not a real scheduled content package. It contains three research-only slots with no factual claims, media, rights evidence, Page ID or approval. It is not a provider-side Meta draft.
- The Cloudflare `nature-frontiers-publisher` Worker is deployed but has no scheduled triggers and no secret bindings; its production D1 schema exists but all content, approval, rights, target, publication-attempt and audit tables contain zero rows. Instagram professional-account numeric ID is not configured/verified. Keep `publishingEnabled=false`, `dryRun=true`, `FACEBOOK_PUBLISH_ENABLED=NO`, emergency stop enabled, and unreviewed items held.

## Cloudflare / continuous operations

- Account read-only inventory shows no SonicVhibez production Worker. `sonicvhibez-durable-state-staging` is the only SonicVhibez Worker; it has no schedules and binds staging D1 plus an R2 bucket.
- Staging D1 has 5 backup rows and 1 state row (revision 3), but 0 runner artifacts, 0 artifact parts, 0 runner-control rows and 0 runner-state rows.
- R2 is not enabled: Cloudflare API returns error 10042 (“Please enable R2 through the Cloudflare Dashboard”). Do not enable or incur storage charges without explicit cost approval.
- `nature-frontiers-publisher` has no schedules and no secret bindings. Its D1 production database is schema-provisioned but has zero content, targets, approvals, rights, publication attempts, audit events or webhook rows.
- No continuous production worker, persistent media artifact path or independent off-account backup is proven.

## Voice and production direction

- User's current creative requirement is American English, mature male wildlife storyteller, energetic and passionate, natural and trustworthy; realistic animal-encounter stories rather than creator-education tutorials. AI-generated scenes must be disclosed as illustrative reconstructions.
- HeyGen Sterling audition exists from the prior conversation, but no persistent repository voice setting or private user voice clone has been saved. No user recording or room-tone recording has been uploaded. Sterling is a public voice and is not a zero-cost/permanent guarantee.
- Free local Piper Norman (American English male) review workflow passed on 18 November (run 44253500939): 154 words, 51.432 seconds, mono 22.05 kHz/16-bit WAV, peak −0.77 dBFS, RMS −18.59 dBFS, zero clipped samples. The review artifact includes the pinned model card, attribution and JSON provenance; its audio SHA-256 is `49c34b55de3658c9f21387eb544e1d1c8f350958bb9208242fd1d4a88c77ae2e`. The earlier 38.092-second sample was below the Short duration target; the script was lengthened and speech length-scale set to 1.1, and the current 51.432-second sample passes the 50–60-second gate. This is a free local Norman audition, not the HeyGen Sterling voice. It remains review-only: `humanVoiceQualityReview=PENDING`, `commercialAttributionReview=PENDING`, `productionApproved=false`, `finalNarration=false`, `publishingEnabled=false`. The WAV artifact is retained for 30 days, not permanent storage. It requires human listening, licence review and explicit approval.
- Do not use the older Australian Piper auditions as the current voice choice. No final narration or human approval exists.

## Required owner inputs to unblock work

1. Reauthorize the existing Google OAuth client for YouTube with `youtube.readonly` and `youtube.upload` plus offline access; update only `YOUTUBE_REFRESH_TOKEN` in GitHub Actions secrets. Do not send tokens in chat.
2. Reauthorize Meta user and Page tokens with the required Page scopes/tasks; update `META_USER_ACCESS_TOKEN` and `META_PAGE_ACCESS_TOKEN` in GitHub Actions secrets. Confirm the exact Facebook Page and Instagram professional-account numeric ID in Meta Business Suite.
3. Restore access to Metricool brand `7545638` or verify its eight historical auto-publish records; create a separate SonicVhibez Metricool brand and remove the SonicVhibez YouTube mapping from Nature Frontiers.
4. Start the pinned free Kaggle notebook session and provide its real test output only after the WanGP checkpoint/VAE provenance conflict is resolved; no GPU generation has been performed.
5. Choose the final narration route: approve a tested zero-cost American voice, supply a clean recording of your own voice with explicit clone consent, or reject the candidates. Supply original room tone only if it must be used.
6. Provide genuine source/rights-cleared media or approve the specific AI-generation model after its exact weights/VAE provenance and commercial terms are verified.
7. Human-review the final video, captions, thumbnail, facts, disclosures, metadata and hashes; explicitly authorize the exact private-upload job only after all prior gates pass.
8. Confirm a zero-cost independent backup destination and production deployment access. Do not enable R2 or any paid service without an explicit cost ceiling.

## Release decision

**HOLD — NOT MASTER COMPLETE.** No public upload, private upload, scheduling or publication is authorized. No finished Short or long-form production master exists. The current 19 blockers, invalid YouTube OAuth, invalid Meta tokens, missing separate brand configuration, absent production worker, disabled R2 and pending owner approvals prevent a 100% release. “Risk-free” cannot be guaranteed; the release target is zero unresolved critical/high blockers, documented residual risk, verified fail-closed behavior and human-approved exact artifacts.

---

# SonicVhibez master production completion register

**Scope:** first fully reviewed SonicVhibez production package and safe, verified publishing path.  
**Last inspected implementation SHA:** `5a3760b7f2b17af250a37dcbb3e3db857eb5cd45`  
**Register status:** `BLOCKED — NOT MASTER COMPLETE`

This is an evidence register, not a declaration that the project is complete. A task moves to PASS only when the exact implementation SHA, source evidence, test result and/or human approval are recorded. Never turn a missing file, draft, passing unit test, queued workflow, metadata search result or owner attestation into production proof.

## Non-negotiable safety boundaries

- YouTube destination is SonicVhibez only; never target Nature Frontiers.
- Preserve `main`; do not merge, close or mark PR #1 ready. Do not rewrite history.
- Keep public publishing disabled. Do not schedule, upload, change metadata or publish without the separate exact-job authorization and all release gates.
- Never claim AI-generated wildlife scenes are genuine documentary evidence of a real encounter.
- Do not use an asset until its individual commercial rights, third-party elements, source provenance and human review are evidenced.
- No paid GPU, API, TTS, runner or storage service by default.
- Kaggle is an owner-started, temporary batch GPU session, not a permanent or unattended GPU service.
- A zero-risk guarantee is impossible. The acceptance target is no unresolved critical/high release blockers, documented residual risks, fail-closed controls and a human-approved release.

## Verified foundations

| Area | Current evidence | Status |
|---|---|---|
| Git safety | Implementation branch `codex/marketing-machine-audit-fixes`; PR #1 remains open/draft/unmerged; `main` is unchanged by this work | PASS for preservation check |
| Brand destination | Read-only YouTube identity inventory confirmed channel ID `UCSlkuPfHH78oGC1o418HV4w`, handle `@sonicvhibez`; latest recorded inventory has one public 20-second Short | PASS for historical identity/inventory only; refresh before upload |
| Cadence decision | Owner-approved rolling `long_form → long_form → short`, minimum 72 elapsed hours, no same Johannesburg calendar day, no weekly publication target; three gaps require at least 216 hours | PASS for policy decision; actual scheduling remains blocked |
| Product promotion | Only `https://selar.com/0u19v8u99l` is approved; exact direct-sales disclosure is owner-approved; paid-promotion flag must remain enabled | PASS for this product/disclosure only |
| WanGP source setup | Project-owned Kaggle notebook pins WanGP source commit and records model/VAE revisions and hashes; importer and tests exist | PASS for repository setup only; no GPU generation has been evidenced |
| Internet Archive intake v1 | Workflow run `44227968869` completed successfully and uploaded artifact `14392619879`; 30 records were returned, but inspection showed broad-search false positives | PASS for workflow mechanics; FAIL for useful discovery relevance |
| Internet Archive intake v2 | Run `44228944629` succeeded on SHA `c36f19a57e90b049607afacfbbcebda0c0bb358c`; 21 candidates returned, but manual artifact inspection still found broad-title false positives and only one potentially wildlife-relevant item, with no licence. No media downloaded. | PASS for workflow mechanics; FAIL for useful/licensed discovery |

## Outstanding work — ordered execution gates

### Gate 1 — Stabilise Internet Archive discovery

**Status: IN PROGRESS**

1. The v2 workflow and tests passed, but the 21-result report still contained false positives; only one title looked potentially wildlife-related and it had no licence metadata.
2. A stricter v3 search is now pinned to the Prelinger collection and per-item Public Domain Mark/CC0 metadata, with title-only relevance and game/sports/photography/broadcast exclusions. Workflow run `44229512157` is queued on current SHA `cfdbca182898a075a02192bd58db8b313aaf6623`.
3. Inspect the v3 report; if no suitable item appears, report zero suitable assets rather than widening the query into unlicensed content.
4. Review each candidate item page and licence terms; metadata triage is not legal clearance.
5. Exclude NonCommercial, NoDerivatives, unknown, uploader-unverified and third-party-restricted material.
6. Only then consider an item for manual download and asset registration.
7. Keep download, registration, render, scheduling and publishing disabled until separate approvals.

**Acceptance:** v2 tests pass, search results are relevant, and every selected asset has exact source page, uploader/creator, licence evidence, commercial-use and modification rights, third-party clearance, file hash and human approval. No item is approved merely by appearing in the report.

### Gate 2 — Resolve WanGP model rights and run a real Kaggle generation test

**Status: BLOCKED**

Existing configuration:
- WanGP source pinned to `f4cfc1259215577be9a2ee280c41efbedfb4459a`. Its exact `LICENSE.txt` (WanGP Community License 2.0) has been reviewed: internal business use, private batch/queue/headless use and use of outputs are permitted, subject to third-party model terms. Credit is required for a Direct Output Sale; third-party weights retain their own licences. The WanGP software licence itself is therefore not the blocker.

Wan 2.2 TI2V 5B mirrored checkpoint and VAE are pinned by immutable revisions and SHA-256. The official `Wan-AI/Wan2.2-TI2V-5B` model card states Apache-2.0, but the `DeepBeepMeep/Wan2.2` mirror's model-tree metadata identifies `Wan-AI/Wan2.2-T2V-A14B` as the base while the pinned checkpoint filename says 5B. The mirror provides hashes but no file-specific conversion/provenance statement or explicit licence. The VAE mirror likewise has a hash but no file-specific provenance/licence. Exact mirror checkpoint/VAE derivative provenance remains `HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE`; do not infer rights from the upstream model alone.
- Kaggle execution is owner-started, temporary and not unattended.

Required tasks:
1. WanGP Community License 2.0 is verified for internal business use and output creation; preserve its terms and any required direct-output credit.
2. Obtain maintainer evidence that the exact pinned mirror checkpoint and VAE derive from the official Apache-2.0 TI2V-5B model and are redistributed under those terms, or replace them with a WanGP-compatible source whose exact files and licence are independently verified. The mirror's model-tree base-model metadata conflicts with the expected 5B checkpoint, so keep the weight/VAE rights gate on HOLD.
3. Inspect pinned WanGP source, dependency installation and notebook execution for supply-chain risks; do not run unreviewed mutable code.
4. Owner starts the project notebook in Kaggle, enables Internet and a free GPU, and runs the pinned setup/test cells.
5. Generate a real 5-second photorealistic wildlife test shot; no cartoon, still montage or fabricated file.
6. Verify output MP4, exact model/source metadata, seed, prompt, negative prompt, file SHA-256, ffprobe report and full FFmpeg decode.
7. Import output with `scripts/import_wangp_kaggle_output.py`.
8. Human watches the complete clip and records anatomy, species, movement, continuity, artefact and realism review.
9. Retain outputs outside temporary Kaggle session storage without requiring a large local PC model cache.

**Owner input needed:** start the Kaggle notebook session and provide the resulting test package or an accessible artifact reference. The assistant cannot operate the user's Kaggle UI or claim GPU output without it.

### Gate 3 — Clear source footage and build the media library

**Status: BLOCKED**

The imported Canva/Pexels inventory contains five candidate clips. All five remain HOLD:
- Elephant: source match pending visual confirmation; no local media.
- Aerial zebras/wildebeest: duration mismatch; visual confirmation pending; no local media.
- Grazing zebras/wildebeest: source match pending visual confirmation; no local media.
- Giraffe: source match pending visual confirmation; no local media.
- Lion: source and creator unresolved.

Required tasks:
1. Verify each exact Canva item visually against its claimed original source and creator.
2. Resolve metadata mismatches and reject unmatched clips.
3. Download only individually cleared source media.
4. Record exact source URL, licence, creator, download date, commercial/derivative permissions, third-party elements, SHA-256 and local/cloud storage path.
5. Human-review every clip and its proposed context.
6. Alternatively, use only WanGP-generated shots after Gate 2 clears, with their own model and generation evidence.
7. Build a shot-to-claim map; never imply an illustrative AI shot documents a real event.

**Acceptance:** at least enough cleared, technically usable, visually approved footage for the selected first production, with complete provenance and hash-bound evidence.

### Gate 4 — Clear narration and audio

**Status: IN PROGRESS — AUDITION WORKFLOW ADDED; OWNER LISTENING AND ATTRIBUTION REVIEW PENDING**

A promising free local candidate has been identified: `DataCraftsmanAustralia/piper-en_AU-librivox-medium`, pinned at `3faad046064c56f7316ffd745d5a8b14035f35df`. Its model card states CC BY 4.0 and permits commercial use with attribution. The model's base lineage also requires attribution to Jenny (Dioco); the model author explicitly describes their lineage interpretation as good-faith and not a legal conclusion. The candidate is not yet approved for production.

Three male speakers are registered for audition: Banjo (Timothy Ferguson, speaker 5, 7.97 hours), Angus (Algy Pug, speaker 4, 1.80 hours) and Flynn (Howard Skyman, speaker 6, 0.58 hours). Banjo is the first candidate because the model author records that Timothy Ferguson's spoken outro identifies him as recording from the Gold Coast, Australia. The model author warns that the voices can sound formal/literary rather than conversational and have variable recording quality.

**Verified:** GitHub Actions run [44228884555](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44228884555) completed successfully on source SHA `4678e10369d2093d7928fc1bda06ad768542ef2f`. It installed Piper 1.8.0, passed the candidate/speaker-map tests, generated all three WAV auditions, verified the pinned model SHA-256 `f34849bce64d803d0fe90087766d5d6f2a8215a12edad43e486d77072df7dd41`, and uploaded artifact `14394291428` (`sonicvhibez-piper-australian-male-voice-auditions`). The artifact expires 2026-12-18. This is an audition only, not final narration. The owner has not yet auditioned or selected a voice. An enhanced workflow that synthesizes the actual current Short script in all three voices is queued as run `44229692794` on SHA `d766f642d4c5102da4db1a504527518370588b7a`; it has not yet completed.

Tasks:
1. Verify the Piper audition workflow and owner-listen to Banjo, Angus and Flynn; choose one or reject all three.
2. Review CC BY 4.0 terms and the Jenny (Dioco) base-checkpoint attribution condition; retain the full upstream attribution evidence. If unresolved, keep the voice on HOLD or use an owner-recorded voice track.
3. Record exact voice/model version, licence URL, licence copy, settings and source-script hash.
4. Regenerate narration from the current script; old narration evidence is stale against current script hashes and the Short narration lacks the approved exact disclosure.
5. Include the exact spoken direct-sales disclosure and clear spoken advertisement identification where required.
6. Check pronunciation, intelligibility, pacing, naturalness and Australian-English accent.
7. Run audio loudness, clipping, silence and full-playback checks.
8. Time captions against the final narration; no draft SRT is accepted as final.

**Owner input needed only if no suitable zero-cost voice with documented commercial rights is established:** supply a recorded voice track or approve a specific cleared voice option.

### Gate 5 — Complete factual and editorial content

**Status: BLOCKED — DRAFTS REQUIRE EDITORIAL AND FACTUAL APPROVAL**

Current scripts are drafts, not approved production scripts. The two long-form episodes are creator-education tutorials (not animal-encounter documentaries); the Short is a three-shot wildlife-storytelling tutorial. This content direction may serve the Wildlife Creator's Vault promotion, but it is not the realistic animal-encounter format also requested for SonicVhibez. Do not render the current drafts as animal-encounter content or imply they document real wildlife events. Owner/editorial approval of the first content direction is required before final production.

Tasks:
1. Select the first long-form topic and Short topic in the approved rolling cycle.
2. Verify all factual claims against primary/reputable sources and retain a source map.
3. Write a shot-by-shot brief and match each claim to footage or explicitly labelled illustrative visuals.
4. Complete the 6–10 minute long-form script and 50–60 second Short script.
5. Ensure no invented animal encounter, unsafe wildlife advice, false location or misleading thumbnail promise.
6. Include the owner-approved Selar disclosure exactly; keep the product promotion restricted to the one approved product and keep YouTube paid-promotion declaration enabled.
7. Add synthetic-media disclosure decisions for AI-generated realistic scenes and narration.
8. Human editorial and factual review.

### Gate 6 — Render and validate real final videos

**Status: BLOCKED — BOTH MANIFESTS SAY BLOCKED_NOT_RENDERABLE**

Short:
- Expected 50–60 seconds, 9:16.
- Required footage, narration and quality-evidence files are missing.
- Current SRT is a draft and is not synced to final audio.
- Rights and compliance are false.

Long form:
- Expected 6–10 minutes, 16:9.
- Required footage, narration, final captions and quality-evidence files are missing.
- Previous narration has a source-script hash mismatch and is superseded.
- Rights and compliance are false.

Tasks:
1. Build the edit only from cleared, reviewed source clips and licensed narration.
2. Render a genuine MP4 with FFmpeg; do not substitute still-image slideshows.
3. Verify dimensions, aspect ratio, duration, codec, frame rate, audio stream, loudness, full-file decode, caption sync and file hash.
4. Create truthful thumbnail at the required dimensions.
5. Review the complete video from beginning to end for quality, facts, artefacts, audio, captions, product disclosure and synthetic-media disclosure.
6. Bind review/approval to exact final hashes and retain the review package.
7. Update manifests only with actual evidence; never hand-edit a status to PASS.

### Gate 7 — Reconcile YouTube upload attempts and prepare private upload

**Status: PASS for historical identity/inventory and prior-attempt reconciliation; current upload remains BLOCKED by media/approval gates**

Read-only YouTube verification passed on 2026-11-18, source commit `9aaffeee6b3ad75b19e92774fb1091d4209389ac`, workflow run `44211269635`. It authenticated the approved SonicVhibez channel and inventoried the complete uploads playlist: one public 20-second legacy Short (video ID `LjePS02hA1o`, published 2026-10-22T15:05:56Z), no private or unlisted videos. The owner attested there were no other manual/local/external upload attempts.

Automated ledger validation also passed: workflow run `44229290895`, job `134550082550`, source SHA `3ab59402ce801c96431d24e8fe56d227edfec409`. It inspected one prior manual workflow-dispatch run across both private-upload entry points and found zero executed private-upload jobs. The earlier `upload-private.yml` run had its private-upload job skipped; no `upload-artifact-privately.yml` run existed. The first future authorized private upload can safely initialize the ledger with `previous_ledger_run_id=NONE`. No upload is authorized by this reconciliation.

Tasks:
1. Historical channel identity and full uploads inventory are verified; refresh read-only inventory immediately before any upload because the previous inventory is not a permanent authorization.
2. Automated prior-upload ledger reconciliation is complete: zero private-upload jobs executed; use `previous_ledger_run_id=NONE` for the first future private upload.
3. Keep the legacy 20-second Short in history as a legacy exception; it does not meet the current 50–60 second standard.
4. Verify OAuth credentials remain valid without logging secret values.
5. Confirm exact channel ID and destination is SonicVhibez.
6. Prepare one private-only upload authorization bound to exact job, final MP4 hash, metadata hash, thumbnail hash, caption hash, rights evidence and human approval.
7. Do not execute upload until the owner explicitly authorizes that exact job.

### Gate 8 — Schedule, publish, verify and measure

**Status: BLOCKED — CRITICAL METRICOOL BRAND-SEPARATION ISSUE**

Fresh Metricool read-only inspection on 2026-11-18 returns only one connected brand, `Nature Frontiers SA` (brand ID `8094526`, timezone `Africa/Johannesburg`). Its `youtubeData` is the SonicVhibez channel ID `UCSlkuPfHH78oGC1o418HV4w`. This is a cross-brand association and is not an approved SonicVhibez scheduling destination.

The current brand's scheduled-post query for 2026-11-18 through 2027-01-31 returned an empty list. The older brand ID `7545638` remains inaccessible with HTTP 403. The earlier 2026-10-28 snapshot documented eight future records with `draft=false` and `autoPublish=true`; their final state remains UNKNOWN because the old brand is inaccessible. Do not infer they were canceled or transferred.

**Owner action required:** create/restore a separate SonicVhibez Metricool brand connected only to the verified SonicVhibez YouTube channel; remove the SonicVhibez YouTube connection from Nature Frontiers; restore access to the old Metricool brand or independently verify all eight historical records in Metricool UI. Do not mutate, cancel, edit or publish any post until exact record identity and owner authorization are established.



Tasks:
1. Keep the rolling long-form → long-form → Short order and minimum 72 elapsed hours between actual publication timestamps; enforce no same Johannesburg calendar day.
2. Draft-preparation Tuesday/Saturday triggers are not publication slots.
3. Verify actual remote timestamps immediately before each scheduling/publication operation.
4. Confirm a separate SonicVhibez Metricool brand exists and is connected only to the approved YouTube channel. The currently connected Nature Frontiers brand contains the SonicVhibez YouTube channel ID and must never be used for SonicVhibez publishing.
5. Reconcile the inaccessible old Metricool brand ID 7545638 and its eight previously observed future autoPublish records; current brand 8094526 has no scheduled posts returned for 2026-11-18 through 2027-01-31, which does not resolve the old brand's records.
6. Verify the Metricool integration/account and YouTube scheduling method after brand separation;
7. Schedule only fully approved content and verify the remote scheduled record.
8. Publish privately first where authorized; verify video ID, channel, privacy, processing and metadata in YouTube Studio.
9. Public release requires a separate explicit owner authorization; public and unattended publishing stay disabled until that exists.
10. Verify actual publication timestamp and rolling cycle state.
11. Run read-only analytics, verify the correct video identity and report real metrics only.
12. Confirm no prohibited automated engagement, spam, duplicate distribution or artificial metric activity.

### Gate 9 — Continuous operations, recovery and dashboard

**Status: PARTIALLY IMPLEMENTED / CURRENT-SHA ACCEPTANCE PENDING**

Existing repository includes worker leases, retry backoff, queue, approval, rendering, recovery and dashboard test suites. They are not proof that the complete media production and remote publishing lifecycle works end-to-end.

Tasks:
1. Run the current-SHA CI suite and investigate every failure, skip, cancellation and queued workflow.
2. Verify the current-SHA dashboard behavior for each production journey, not merely control counts.
3. Verify persistence, restart recovery, leases, cancellation, retry/backoff, dead-letter handling and uncertain remote mutation quarantine.
4. Run a complete safe dry-run through generation intake → review → approval → render → queue → schedule preflight.
5. Verify artifact retention, recovery and provenance survive session expiry.
6. Keep external publishing mutations disabled during acceptance tests.
7. Confirm deployment and production health checks without treating CI success as live provider proof.

The Short upload metadata title has been aligned to the exact title in the production script: `Wildlife Documentary Storytelling: 3 Shots, One Clear Story`.

## Required owner inputs (only when the corresponding gate is ready)

1. Start the free Kaggle session and run the pinned test notebook; provide the resulting package/artifact. No Kaggle GPU generation has yet been performed.
2. Listen to the Australian male Piper auditions and select one voice or reject all three; if none meets the realistic/conversational quality bar, provide an owner-recorded voice track or approve another fully documented option.
3. Confirm whether the first content package should remain the current creator-education tutorial or be replaced with a realistic animal-encounter story. The current drafts are tutorials, not animal-encounter documentaries.
4. Create/restore a separate SonicVhibez Metricool brand connected only to the verified SonicVhibez YouTube channel, disconnect that channel from Nature Frontiers, and restore access to the old brand or independently verify the eight historical auto-publishing records.
5. Watch and approve the exact final video, captions, thumbnail, metadata, disclosures and factual claims.
6. Explicitly authorize any exact private upload job after all prior gates pass.
7. Separately authorize any public publication or unattended scheduling; existing approval does not imply it.

## Current acceptance decision

**NOT MASTER COMPLETE.** No finished Short or long-form MP4 exists in the repository media tree at the inspected SHA. WanGP GPU execution is pending; exact mirror checkpoint/VAE commercial provenance is on HOLD; the five imported Canva candidates are on HOLD; no final narration is commercially cleared; both render manifests are blocked; prior upload-attempt ledger reconciliation is complete with zero executed private-upload jobs; no exact-job private upload approval exists; no safe separate SonicVhibez Metricool brand exists; the only connected brand is Nature Frontiers SA and it contains the SonicVhibez YouTube channel ID; old Metricool brand 7545638 and its eight historically observed auto-publishing records remain inaccessible/unknown.

Do not report a percentage or call any of these tasks complete until the evidence listed above is present and independently checked.


---

## Current superseding checkpoint — 2026-11-21

The 19 November snapshot and historical notes above are retained for audit history. The current execution addendum is `docs/MASTER_COMPLETION_PLAN_2026-11-20.md`, section “Execution addendum — 2026-11-21”. Where earlier entries describe Roderic permission as pending, Norman/Banjo/Edge/Piper auditions as available, or Pexels footage as a possible production source, the newer determinations below supersede them.

### Exact branch work verified on 2026-11-21

- HeyGen Support **denied** a zero-cost commercial-use exception for existing and future Roderic Free-plan outputs. Exact determination: `content/heygen-roderic-commercial-rights-determination-2026-11-21.json`.
- Long-form and Short manifests remain fail-closed. Roderic audio remains internal-only; no alternative narrator is authorized.
- Unapproved Piper and Edge TTS narration workflows now have job-level `if: false` guards on the implementation branch. Existing American/Norman and Banjo review workflows were already disabled.
- Short 001 Pexels material is reference-only and excluded by the original creator-captured-media requirement. Its render manifest no longer treats the Pexels platform licence as production footage clearance; script and caption pins match the current exact Git blob SHAs.
- Long-form 001 script and scientific desk-review blob SHAs are pinned in its manifest. The 2025 crocodile sensory-integration paper is described with its juvenile/captive/controlled-experiment limitations.
- The Comfy Cloud Arctic/polar-bear text-to-video demo is explicitly disqualified from production. No generation or GPU spend occurred.
- Metricool was queried read-only. Brand 8094526 currently returned Facebook and Instagram connections without a YouTube channel in the settings response; that is not proof of a provider-side disconnect. Legacy brand 7545638 remains inaccessible (403). No Metricool mutation occurred.

### Current release state

**HOLD — NOT MASTER COMPLETE.** No admissible original creator-captured wildlife package, commercially eligible narrator, final Long-form 001 or Short 001 render, synchronized final captions, final thumbnail, independent zoological sign-off, complete human playback, exact-hash production approval, permanent archive, current live YouTube inventory/owner attempt attestation, or verified production publisher exists.

### Current owner/provider dependencies

1. Original creator-captured wildlife source files with creator identity, chain of custody and explicit commercial rights.
2. HeyGen written reversal granting zero-cost Roderic commercial rights, or explicit owner change to the Roderic-only voice constraint.
3. Metricool access/export for legacy brand 7545638 and written confirmation of brand 8094526's current YouTube mapping.
4. Fresh owner attestation of manual/local/third-party YouTube upload attempts after 2026-11-18 and a fresh authenticated paginated inventory before any upload.
5. Cloudflare R2 enablement or owner-approved zero-cost durable archive route; inspect terms/free-tier limits before creating resources.
6. Qualified zoological reviewer and final owner review of exact media hashes.
7. Account/admin authorization and access for production Worker, D1 runner state, OIDC trust and branch protection.
8. Exact one-shot private-upload authorization after all prior gates; separate public-release authorization.

### Branch and test integrity

At the latest comparison before this register update, implementation branch `codex/marketing-machine-audit-fixes` was **4,828 commits ahead / 13 behind** `main`, with merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. `main` was not modified. PR #1 was not merged, closed or marked ready. No reset, rebase, force-push or history rewrite was performed.

No full regression suite or live production acceptance was run after the 2026-11-21 repository changes. Prior test passes remain historical evidence only and do not certify this new head.


### Additional verified correction — Nature Frontiers brand boundary (2026-11-21)

- Removed the NatureFrontiers-life YouTube subscription URL from the Nature Frontiers Facebook and Instagram approved-destination arrays.
- Removed the YouTube destination from the Nature Frontiers post-link catalogue and added an explicit `youtubePublishingAllowed=false` invariant.
- Added regression coverage for no YouTube URLs, no SonicVhibez channel ID in Nature Frontiers configuration, and preserved publishing-disabled/dry-run/emergency-stop defaults.
- Added rights/manifest regression coverage for exact Git blob pins, Pexels exclusion, HeyGen's denial and disabled alternate-voice workflows.
- Connector-side read-back assertions passed; both new test files passed Node syntax checks. Full repository tests have not been executed on this head, so runtime test acceptance remains NOT_TESTED.

**Important boundary:** this fixes the repository-side configuration only. Metricool provider-side brand mappings and legacy data remain unresolved; no live account mutation was made.


### Additional verified correction — wildlife media eligibility (2026-11-21)

- Corrected the five-asset SonicVhibez imported-media inventory: it no longer directs production toward AI-generated wildlife scenes. It now requires genuine original creator-captured wildlife media and keeps all five imported Canva/Pexels assets excluded.
- Updated all 92 Nature Frontiers Pexels/Pixabay register entries as reference-only and production-ineligible. Their rights remain not assessed; no rights clearance is implied. The register has zero local media files, zero approved assets, zero scheduled assets and zero published assets.
- Marked all four Short 001 Pexels clips reference-only and production-ineligible under the original creator-captured-media policy.
- Extended the fail-closed regression test to protect these policy decisions.
- GitHub read-back verified all changes. Full runtime regression remains NOT_TESTED on this head.

**Current media gate:** BLOCKED until genuine original creator-captured source files, creator/source provenance, exact hashes, commercial rights and complete human inspection are supplied and approved.


### Git safety incident — default-branch disclosure (2026-11-21)

Four stock-source rights-review JSON updates were accidentally written to `main` because the GitHub update calls omitted the optional branch parameter (which defaults to main). Affected commits: `ae3200a9ef9b4877fafaf246c5640b851ec712e9`, `c1e5c0713c67b196153615e73f2defd8cce11517`, `450aef056c429ffda10865c0a0b24dea3de82be9`, and `3795519ccbf58fd02d74458624b58dd2e44a88c0`. Their corrected versions were also committed on the implementation branch. No rollback, reset, rebase or history rewrite was attempted; no further writes to main will be made. Owner-directed remediation is required if those four commits must be reverted.

At the initial incident record, the implementation branch was 4,872 ahead / 17 behind. A later read-only comparison at 2026-11-21 09:36 UTC returned 4,924 ahead / 17 behind; main head remained `3795519ccbf58fd02d74458624b58dd2e44a88c0`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, and PR #1 head was `08af58dd597b9e3ba72bd74124d54da142551817`.

The default-branch `.github/workflows/acquire-noaa-broll-candidates.yml` remains enabled because the implementation-branch disablement is not merged. It has a push trigger when this workflow file changes on main and a manual workflow_dispatch trigger; it has no scheduled cron trigger. The connected GitHub actions interface provides no workflow-disable operation; the repository owner must disable it through GitHub Actions or approve an owner-directed remediation. This remains a release blocker.


### Additional verified correction — source-led wildlife production (2026-11-21)

- Disabled WanGP wildlife generation in `config/video-generation.json`; all seven Kaggle notebook code cells now fail closed before GPU/model setup; the generated-output importer blocks AI wildlife files before media copy.
- Disabled NOAA B-roll, Pexels reference acquisition and NOAA thumbnail-review jobs on the implementation branch. The Pexels acquisition and NOAA thumbnail scripts also fail closed before file/network operations.
- Superseded the historical NOAA conditional-use authorization and marked NOAA, Pexels and Wikimedia stock-library records reference-only and production-ineligible.
- Rewrote the continuous production system and source-sourcing documents around original creator-captured footage, verified rights, exact hashes, complete review and release approvals.
- Added regression assertions for these disabled paths and source exclusions.

**Default-branch caveat:** the branch changes are not merged. The NOAA B-roll scheduled workflow remains enabled on `main`; the Git safety incident and required owner action are recorded above. This prevents a claim that the default branch is fully safe.


### Additional verified correction — queue and candidate alignment (2026-11-21)

- Long-form 001 queue now records the explicit commercial-narration denial and original footage blocker; the corrected script awaits owner and qualified zoological review.
- Next Short metadata no longer treats AI-generated wildlife visuals as an option; original creator-captured media is required and current Roderic Free-plan audio is not commercially usable.
- Short 002's voice and source-media gates now reflect the Roderic-only/rights-denied and original-capture-only policies.
- Short 004 NOAA metadata, script and review-render record now identify the source as historical reference-only and excluded; eSpeak narration remains an unapproved review artifact.
- Long-form queue, general content queue and weekly content plan carry consistent source, narrator and publishing safeguards.
- Worker runner code and tests were reviewed: 409/429 backoff, ambiguous dispatch quarantine, failed persistence stop/lock retention and restart blocking are present. This remains code-reviewed only, not runtime-verified on the current head.

All these production queues remain HOLD/planning-only. No media render, narration generation, upload, schedule or publication occurred.


### Additional verified correction — narrator execution controls (2026-11-21)

- Added a shared fail-closed narrator policy helper and enforced it in all known manual Edge TTS, Piper, Norman/American and Banjo CLI generation paths.
- The Piper generator blocks before output-directory creation or model download; the other CLI entry points block before TTS/render execution.
- Updated the corresponding Python tests to verify an explicit audition acknowledgement cannot override the owner decision.
- These changes are repository-read-back verified; full Python runtime tests remain NOT_TESTED on this head.


### Additional verified correction — runbooks, narration and history (2026-11-21)

- WanGP and Internet Archive runbooks now explicitly state disabled/reference-only; no GPU generation or archive footage production is authorized.
- The 17-entry Pexels register's purpose and historical approval scope now explicitly state reference-only and not production-approved.
- Roderic voice-rights and Short 001 narration-generation records now carry the written HeyGen denial; generation-source hashes are labelled Git blob hashes and kept distinct from current script/caption pins.
- Manual Edge TTS/Piper/Norman/Banjo narration entry points are protected by the owner-exclusive voice policy helper and regression tests.
- YouTube history reconciliation records the 20 November read-only refresh without treating it as new owner attestation. Owner reaffirmation and fresh upload-attempt attestation remain required.
- Current Go-Live checkpoint now distinguishes the default-branch NOAA workflow's push/manual triggers from the disabled implementation-branch copy; the default-branch workflow has no cron schedule.

No media render, narration generation, upload, schedule or publication was performed.


---

# 22 November 2026 — live execution and verification addendum

**Current release decision: HOLD.** This addendum supersedes stale checkpoint statements only where it provides newer, exact evidence. It does not approve publishing or waive any rights, human-review, account-owner, or external-provider gate.

## Repository checkpoint

- Implementation branch: codex/marketing-machine-audit-fixes
- Verified code HEAD: c290bac5431c7b46b42b19e74a2c65a04f0a4512 (full regression PASS)
- main: 3795519ccbf58fd02d74458624b58dd2e44a88c0
- Divergence at the tested code HEAD: 5,192 ahead / 17 behind
- Subsequent commits after c290 changed only the two master tracker documents and the disclosure-proposal Markdown file; no application or test source changed after the verified code SHA.
- PR #1: open, draft, unmerged; head matches the implementation branch
- Branch protection: disabled on both main and implementation branch
- No main commit, merge, PR state change, rebase, reset, force-push, or history rewrite was performed.

## Exact-current-head regression

GitHub Actions run 44965097575 — PASS on c290bac5431c7b46b42b19e74a2c65a04f0a4512.

- Node.js: 1,095 tests passed across 189 test files; 0 failed; 0 skipped.
- Python: 104 tests passed.
- npm audit: 0 known vulnerabilities.
- JavaScript syntax checks: PASS.
- Python compilation checks: PASS.
- Cloudflare staging authenticated/read-only smoke: PASS; durable revision 3, five retained backups, required state collections present, publishing disabled, runner session inactive, and remote state unchanged.
- Queue validation: 16 topics, approved Selar destination, recognized held states, public publishing disabled.
- Wade review-only narration boundary: PASS; no commercial clearance or production approval.
- No upload, metadata write, remote publication, or queue approval occurred during these tests.

## Dashboard, queue, deployment and bridge

- Dashboard browser E2E run 44964506947: 41/41 passed on source SHA 3c87ef2d699a886fc6942956385b02f23702a314. Dashboard HTML, inventory script, and browser test sources are unchanged through c290bac. The historical control matrix still needs a current-source reconciliation; DASH-001 is not declared fully accepted solely from the 41 browser tests.
- Queue readiness run 44965097050: PASS. The generated proposal contains 16 queue items and a non-approving queue identity template. It deliberately leaves detailed-item mapping and owner approval blank.
- Deployment recovery smoke run 44965096834: PASS, 2/2 simulated recovery checks. This is not a production deployment or independent Cloudflare restore.
- Cloudflare runner bridge safety run 44965096861: PASS, 4/4.
- Source recovery bundle run 44965096792: PASS.
- Production readiness run 44965096777: HOLD, 27 blockers. The report is not to be converted to PASS by weakening gates.

## Narration and wildlife media

- Wade — Resonant & Narrative remains selected for review only. The requested HeyGen audition is blocked by insufficient Free-plan speech allowance. Free-plan output is not commercially cleared. Piper, Edge TTS, and other narrator substitutions remain unauthorized; no paid credits or upgrade were used.
- Readiness reporting and regression tests now explicitly state this restricted authorization.
- Repository tree contains no original production wildlife video/audio masters.
- Five direct creator outreach leads were added to content/footage-source-candidates.md. They are research leads only; no creator has been contacted and no rights or assets have been acquired.
- Four zoological reviewer leads were added to content/assets/long-form-001-zoological-reviewer-leads.md. They are research leads only; no reviewer has been contacted or engaged.
- No stock/archive download, YouTube rip, AI-generated wildlife image/video, or unverified asset was admitted as production media.

## YouTube identity and history

- Fresh read-only inventory run 44964986410 authenticated the @sonicvhibez channel and verified youtube.upload plus youtube.readonly scopes.
- Complete uploads-playlist inventory: 1 public video, 0 private, 0 unlisted. The single public item is 20 seconds long. Its video ID, channel ID, public visibility, API publishedAt, and duration match the prior owner-reviewed record; the fresh API artifact leaves format unclassified, so the owner must reaffirm the historical Short classification and Studio publication date.
- Automated upload-ledger scan run 44964986465: one prior upload workflow run inspected; its private-upload job was skipped; zero executed private-upload jobs were found. This does not inspect manual, local, or third-party uploads.
- The owner attestation for manual/local/third-party upload attempts remains valid only through 18 November 2026. A fresh owner attestation is still required.
- No upload or publication was attempted.

## Cloudflare, persistence and account security

- The account has one member; that member's two-factor authentication is disabled and account-wide enforcement is false. Enforcement was not enabled because doing so before the member enrols could lock the account.
- sonicvhibez-durable-state-staging exists; no SonicVhibez production publisher Worker is deployed.
- Staging D1 database sonicvhibez-state-staging has six application tables, a single dashboard_state row at revision 3, 16 queue items, zero jobs, and publishing disabled. The current state was last updated 15 November 2026.
- dashboard_backups contains five valid JSON snapshots; all five record publishing disabled. The latest backup is 15 November 2026 at 09:52:22Z and the highest backup source revision is 2, while the live staging state is revision 3. A revision-3 backup is therefore missing.
- runner_artifacts and runner_state contain zero rows. The staging Worker has an R2 binding named ARTIFACTS pointing to sonicvhibez-artifacts-staging, but R2 bucket listing returned Cloudflare error 10042 / HTTP 403. The binding is not evidence that the bucket is accessible.
- The staging-only independent backup/restore drill has not been run. Its workflow requires an explicit workflow_dispatch YES input; it will add two backup records and advance the staging revision by one. No such confirmation was supplied in this session.
- A D1 SQL export job completed, but the signed export download was blocked by the available execution/download path. No independent SQL restore is claimed.
- R2 activation requires the Cloudflare Dashboard checkout/subscription step. No subscription, paid spend, Worker deployment, D1 mutation, or account-security mutation was performed.

## Nature Frontiers and external providers

- No Metricool or Meta provider mutation was made. The 2026-11-22 live Metricool getBrandSettings response for Nature Frontiers brand 8094526 includes youtubeData=UCSlkuPfHH78oGC1o418HV4w, the SonicVhibez YouTube channel ID. Treat this as an unresolved cross-brand mapping risk; do not publish to YouTube through Metricool. The current-brand scheduled-post query returned zero for the checked interval, but does not cover drafts or published history. Legacy brand 7545638 remains HTTP 403; its reported 20 drafts and eight draft=false/autoPublish=true records remain unreconciled. The connected Metricool tools expose no supported brand-settings mutation; owner UI/support must remove the YouTube association and a fresh read must verify it is absent while Facebook and Instagram remain.
- No analytics baseline can be established without genuine publications and platform analytics.
- No GitHub branch protection change was made. The connected GitHub interface provided read-only protection evidence; no branch settings write action was available in the connected workflow.

## Current remaining owner/admin gates

1. Supply original creator-captured wildlife camera files and explicit commercial rights, or obtain direct no-fee permission from a creator.
2. Reaffirm the sole public YouTube video's Short classification and Studio publication date against the fresh inventory.
3. Attest whether any manual, local, or third-party YouTube upload attempts occurred after 18 November 2026.
4. Approve the exact operational-to-detailed queue identity mapping. The two operational long-form IDs do not unambiguously identify the Nile crocodile documentary.
5. Enrol the Cloudflare account member in 2FA before account-wide enforcement.
6. Decide whether to enable R2 through the Cloudflare Dashboard, accepting that usage above its free allowance may be chargeable; no activation without owner approval.
7. Explicitly authorize or decline the one-time staging backup/restore drill.
8. Provide/approve the repository public upload-verification key secret and confirm the private signing key remains offline.
9. Obtain a commercially permitted narration solution; Wade remains review-only and currently cannot be auditioned within the available free allowance.
10. Obtain qualified zoological review, six held disclosure approvals, final asset/video/thumbnail approvals, and legacy Metricool access/reconciliation.

**No production content is approved, no publishing is enabled, and the release remains HOLD.**


---

## Current execution checkpoint — 22 November 2026 (SonicVhibez master register supersession)

**Release state: HOLD — NOT 100% COMPLETE.** This checkpoint supersedes older voice-selection and test-status statements above where they conflict. It does not authorize a merge, release, upload, schedule or public publishing.

### Repository integrity and exact refs

- Implementation branch: `codex/marketing-machine-audit-fixes`
- Last verified branch HEAD before this register update: `60aab0320154316e0b0d8059c358042abfb8f562`; this is an empty verification commit whose tree matches `17461e0b4b361822799760b7f802f2730c98b6df`.
- `main`: `3795519ccbf58fd02d74458624b58dd2e44a88c0`, unchanged.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Current compare before this documentation update: 5,217 commits ahead / 17 behind; GitHub PR metadata reports 530 changed files. The compare endpoint returns at most 300 file entries, so this is not a complete semantic review.
- PR #1 remains OPEN / DRAFT / UNMERGED; GitHub reports mergeable=false. Do not mark ready, merge, close, rebase, reset, force-push, rewrite history or edit `main`.

### Exact-head engineering evidence

The most recent full source snapshot is the verified GitHub recovery bundle for `c788667cf1e432814e38dfa6c8c138b9c0d4665e` (source recovery run [44970243907](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970243907), PASS). The application/test source tree differs from that snapshot only in two corrected test assertions plus an empty verification commit; those corrections were independently reproduced and tested locally. The later commits after that source snapshot are documentation-only master-register updates.

- Exact-head automation run [44970243782](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970243782): CANCELLED before completion; do not count as a pass.
- Queue readiness run [44970243812](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970243812): FAILED during repository regression tests. The full Node runner reported 1,083 passed / 2 failed / 0 skipped. The two failures were stale test expectations: one still expected Wade in the crocodile metadata; the other had an unescaped slash in the readiness-test regular expression. Both were corrected in commits `af10c5bbeaac9f186ec65478d2a2aa41b3afff21` and `17461e0b4b361822799760b7f802f2730c98b6df`.
- After those corrections, a local verification copy reconstructed from the exact source recovery bundle passed 49 targeted Node tests and 104 Python tests, zero failures and zero skips. The complete 189-file Node suite has not yet been rerun on the corrected head. Do not claim full-suite PASS until a new exact-head CI run completes.
- Deployment recovery [44970243803](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970243803): PASS on `c788667cf1e432814e38dfa6c8c138b9c0d4665e`.
- Cloudflare runner bridge safety [44970243846](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970243846): PASS on that exact SHA; this is bridge safety testing, not live production dispatch.
- Read-only YouTube identity/inventory [44970243852](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970243852): PASS on that exact SHA.
- Production readiness [44970243837](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970243837): expected HOLD at the mandatory gate, 27 blockers. The diagnostic report upload succeeded. No publishing action was taken.

### Fresh YouTube inventory — 22 November

The read-only inventory confirms channel ID `UCSlkuPfHH78oGC1o418HV4w`, handle `@sonicvhibez`, and both `youtube.readonly` and `youtube.upload` OAuth scopes. Inventory is complete: one public video, zero private videos and zero unlisted videos.

- Existing public video: `LjePS02hA1o`
- API publication timestamp: `2026-10-22T15:05:56Z`
- Duration: 20 seconds
- Format: `UNCLASSIFIED_REQUIRES_OWNER_REVIEW`

This read-only inventory is not owner-approved publication-history reconciliation. The owner must classify the existing video's format and confirm the Studio publication date. Manual, local and third-party upload attempts since 18 November must be reconciled separately. Do not infer that a 20-second duration alone establishes Shorts classification.

### Narration decision — Speechma Andrew supersedes Wade review-only

On 22 November the owner selected **Speechma Andrew — English, Male, United States, Standard voice** for a zero-cost browser audition. The official English voice catalogue lists Andrew with those attributes: https://speechma.com/voices/english

Speechma's current Terms grant a worldwide, non-exclusive, perpetual, royalty-free license to use and monetize lawful outputs commercially, subject to the Terms, Acceptable Use Policy and third-party rights: https://speechma.com/terms . The Terms also require the user to own or have rights to submitted inputs and make the user responsible for reviewing outputs and required disclosures.

Important operating restrictions:
- The free tool is browser-based, requires no account, and uses a per-generation security code.
- Speechma prohibits scripts, bots, automated CAPTCHA-solving and other automated access to the free site; only its official API is permitted for automation. The API is paid and is not authorized under the zero-cost constraint. Therefore the Andrew audition must be a manual browser action; do not automate it.
- Standard conversions are limited to 2,000 characters per generation. The free-service history is stored in the user's browser, not an account; download the MP3 to retain it.
- The candidate is selected, not auditioned. No audio file, duration, audio SHA-256, listening review, pronunciation review, production approval or publication authorization exists.
- Existing HeyGen Free-plan Roderic and Wade outputs remain prohibited for public branded/commercial production. Local Piper/Edge TTS generators remain disabled. No paid plan, API, credits or alternative voice is authorized.

Official terms evidence: [Speechma Terms, sections 4, 6 and 7](https://speechma.com/terms); [English voice library](https://speechma.com/voices/english); [Speechma FAQ](https://speechma.com/faq). The manual audition and owner listening approval remain outstanding.

### Current 27 production-readiness blockers

The exact-head report groups into these outstanding requirements:

1. **Queue identity (1):** owner-approved `content/queue-identity-approval.json` is missing. Both operational long-form IDs need explicit mappings to detailed-queue items, exactly once, with cycle position 1 bound to the explicitly designated item. Do not guess that either ID means the Nile crocodile documentary.
2. **Short package (9):** original creator-captured footage origin; named camera operator; capture-provenance record; commercially cleared narration; actual footage file; actual narration file; verified footage licence evidence; rights confirmation after checking all media; and human compliance review.
3. **Long-form package (10):** original creator-captured footage origin; named camera operator; capture-provenance record; commercially cleared narration; actual footage file; actual narration file; final captions; verified footage licence evidence; rights confirmation after checking all media; and human compliance review.
4. **Metadata (3):** human review and explicit `READY_FOR_PRIVATE_UPLOAD` state; verified media rights; and completed human compliance review.
5. **Quality approval (1):** exact-hash-bound human production quality approval and configured `UPLOAD_APPROVAL_PATH`.
6. **Final render (1):** actual rendered `media/next-short.mp4`.
7. **YouTube history (1):** complete owner-reviewed public/private/unlisted history matching the fresh authenticated inventory.
8. **Upload-attempt reconciliation (1):** current local, workflow and owner-attested reconciliation; never blindly retry an uncertain upload.

**Total: 27.** The readiness report is read-only and does not upload, schedule or publish.

### External inputs and owner/admin tasks still required

- Supply original camera footage/photographs, creator identity, capture evidence, written commercial usage rights and exact file hashes. Stock, library and AI-generated wildlife visuals are not substitutes.
- Approve the exact operational-to-detailed queue mapping and designated cycle-position-1 item.
- Manually generate a short Speechma Andrew audition in the free browser UI, download the MP3, retain it in a project-controlled artifact location, verify audio integrity, then listen and approve or reject the exact audio hash. Do not use browser bots or paid API calls.
- Confirm the existing public video's format and Studio publication timestamp; attest to all manual/local/third-party upload attempts since 18 November.
- Provide qualified zoological review, final factual review, six outstanding product-specific disclosure approvals, final video/thumbnail/caption approvals and exact-hash production approval.
- Resolve the Nature Frontiers Metricool cross-brand risk: its active brand settings still expose the SonicVhibez YouTube channel ID. Do not publish to YouTube through Metricool. Legacy Meta brand access remains 403; its 20 drafts and eight `draft=false/autoPublish=true` records remain unreconciled. Owner UI/support action and fresh read-back are required.
- Complete the staging backup/restore drill only after the explicit owner-authorized workflow input; resolve the inaccessible R2 bucket and missing revision-3 backup without activating chargeable resources without approval.
- Complete Cloudflare account 2FA, provide/approve the repository public upload-verification key secret, and confirm the private signing key remains offline.
- Complete API-001, DASH-001, SCHED-001, STATE-001, DEPLOY-001 and GIT-002 with exact-head, production-relevant evidence. Passing unit tests or CI alone does not complete these gates.

**Release remains HOLD.** No genuine production package, rights clearance, owner approval, final rendered video, one-shot upload authorization or verified live publication exists. Public/unattended publishing remains disabled; SonicVhibez is the only permitted YouTube destination; Nature Frontiers remains a separate Meta brand.


### Manual-only Speechma execution guard — 22 November 2026

The current implementation now records Speechma Andrew as the owner-selected, zero-cost audition candidate and enforces `MANUAL_BROWSER_ONLY`: free-site automation and CAPTCHA bots are prohibited by provider Terms; the only automation path is the paid official API, which remains unauthorized. The readiness report states the manual security-code requirement, 2,000-character standard conversion limit, browser-local history and MP3 retention requirement. Regression assertions verify these constraints. No audition audio exists and no production approval is granted.


---

## Latest verification correction — 22 November 2026

This section supersedes the earlier paragraph in this checkpoint that said the source tree differed from the c788 recovery bundle only in two test assertions. That statement became stale after the Speechma manual-only implementation changes.

### Current branch and release safety

- Branch HEAD before this register update: `c7d711b385cd443b59a9594cf26c57c121159400`.
- `main` remains `3795519ccbf58fd02d74458624b58dd2e44a88c0`, unchanged.
- PR #1 remains OPEN / DRAFT / UNMERGED; mergeable=false.
- Branch comparison: 5,233 ahead / 17 behind; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- No merge, PR readiness change, reset, rebase, force-push, history rewrite or main-branch write occurred.

### Narration implementation correction

The application source now records Speechma Andrew as the owner-selected zero-cost audition and enforces a manual-only free-site workflow. The config and readiness gate explicitly prohibit automated browser access, scripts, bots and automated CAPTCHA solving; only the official paid API is allowed for automation, and it is not authorized. The security-code, 2,000-character standard conversion, browser-local history and MP3 retention requirements are represented in config, decision evidence and regression assertions. Local Piper/Edge TTS remains disabled. This is not narrator or production approval; no audio has been generated.

Official current Speechma Terms: https://speechma.com/terms
Official English voice list: https://speechma.com/voices/english

### Exact-head test and readiness evidence

- Source recovery bundle run [44970777305](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970777305): PASS on `ce11456e1f9b2ed0328639ac33c8548c2247b0e1`.
- Upload-ledger read-only run [44970777315](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970777315): PASS; this is not owner attestation of manual/local/third-party uploads.
- Cloudflare bridge safety [44970777365](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970777365): PASS.
- Deployment recovery smoke [44970777283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970777283): PASS; simulation is not a live production deployment or independent restore.
- Production readiness [44970777303](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970777303): HOLD, 27 blockers; report uploaded. No upload, schedule or publication was attempted.
- Queue readiness [44970777295](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970777295): regression step failed at 1,084/1,085 Node tests, zero skipped. The single failure was a malformed regex delimiter in `tests/production-readiness.test.mjs`, not a production behavior failure. The delimiter was corrected in the current branch test file.
- Automation run [44970777298](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44970777298): CANCELLED; not a pass.
- On a reconstructed source copy with the current manual-only policy and corrected regex, 49 targeted Node tests and all 104 Python tests passed locally, zero failures and zero skips. The full 189-file Node suite has not been rerun after the regex correction. Current full-suite acceptance remains NOT_TESTED.

The latest 27-blocker readiness report is still applicable to the current application code; the only later code-tree change after that report was a test assertion, followed by this documentation update. A fresh full-suite run is still required for engineering acceptance.

### Next executable sequence

1. Obtain exact-current-head full regression PASS, then mark the narration-policy implementation accepted.
2. Resolve the owner-approved operational-to-detailed queue identity mapping.
3. Acquire original creator-captured wildlife media, provenance and written commercial rights.
4. Perform the manual Speechma Andrew audition, retain the MP3, obtain listening approval and bind it to the exact hash.
5. Complete short and long-form renders, captions, thumbnails, scientific/factual review, metadata and exact-hash quality approvals.
6. Reconcile the public YouTube video's format/date and all manual/local/third-party upload attempts; only then consider one-shot private-upload authorization.
7. Complete SCHED-001, STATE-001, DEPLOY-001, API-001, DASH-001, GIT-002 and Nature Frontiers/Metricool separation with live evidence.

**Release remains HOLD.** No final production media or public publishing authorization exists.


---

## Verified execution checkpoint — 22 November 2026 (current application tree)

**Release remains HOLD.** This checkpoint supersedes the earlier failed-run and partial-regression notes above. The application/test tree verified here is `f00cc2c898bb85990206301f1433758638286510`; the following register commit is documentation-only.

### Repository safety

- `main` remains `3795519ccbf58fd02d74458624b58dd2e44a88c0`, unchanged.
- Implementation branch: `codex/marketing-machine-audit-fixes`.
- PR #1 remains OPEN / DRAFT / UNMERGED; mergeable=false.
- Comparison before this register update: 5,239 commits ahead / 17 behind; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; GitHub reports 530 changed files. Compare API file output is capped at 300, so GIT-002 still requires semantic review.
- No merge, readiness change, main write, reset, rebase, force-push or history rewrite.

### Exact-head engineering results — PASS

All results below are for application/test head `f00cc2c898bb85990206301f1433758638286510`.

| Workflow | Run | Result |
|---|---:|---|
| Validate SonicVhibez automation | [44971543080](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543080) | PASS |
| Queue readiness | [44971543131](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543131) | PASS |
| Dashboard browser E2E | [44971543086](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543086) | PASS — 41/41 journeys |
| Deployment recovery smoke | [44971543135](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543135) | PASS — smoke/simulation only |
| Cloudflare runner bridge safety | [44971543075](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543075) | PASS |
| Temporary source recovery bundle | [44971543176](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543176) | PASS |
| Production readiness | [44971543116](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543116) | HOLD — 27 blockers |

Regression detail:
- Dedicated automation runner: **1,097 Node tests passed, 0 failed, 0 skipped; 104 Python tests passed**.
- Queue-readiness runner: **1,100 Node tests passed, 0 failed, 0 skipped**.
- Locked dependency installation, isolated normal lifecycle-script install, npm dependency audit, FFmpeg-backed renderer tests, JavaScript syntax checks, Python compilation, Speechma policy gate, campaign destinations/disclosures, promotional Shorts cap, review metadata safety and queue invariants all passed.
- The earlier malformed readiness-test regex and stale Wade expectation were corrected. The exact-head full validation now passes.
- Dashboard browser tests passed all 41 journeys. This does not alone close DASH-001's full behavior/role acceptance matrix.
- Deployment recovery and bridge results are not proof of a live production publisher, actual external publication or independent backup restore.

### Queue and narrator consistency

The queue proposal exposed stale Roderic-exclusive wording. The operational queue, detailed long-form queue and both render manifests now agree:

- Existing HeyGen Roderic WAV remains internal-only and commercially ineligible.
- Speechma Andrew is the owner-selected **manual, zero-cost audition candidate only**.
- No production narrator is approved; no Andrew audio exists; no final audio hash or listening approval exists.
- The free Speechma site must not be automated; its Terms prohibit scripts, bots and automated CAPTCHA solving. The official API is paid and not authorized. A per-generation security code is required; standard conversion is limited to 2,000 characters; browser history is local, so the MP3 must be downloaded and preserved in project-controlled storage.
- Local Piper/Edge TTS, paid API, paid upgrades and unapproved voice substitution remain disabled.
- Regression tests now enforce this distinction in the config, queue and render manifests.

Queue-readiness PASS produced a non-approving template. Both operational-to-detailed `detailedItemId` values remain blank; `ownerApproved=false` and `status=PENDING_OWNER_APPROVAL`. This is intentional: the existing titles do not prove an unambiguous mapping. Owner selection and approval are still required.

### Current 27 production-readiness blockers

The exact-head readiness report lists:

1. Owner-approved operational-to-detailed queue identity mapping.
2. Short package — original footage origin.
3. Short package — named footage creator/operator.
4. Short package — capture-provenance evidence.
5. Short package — commercially eligible narration rights.
6. Short package — actual footage file.
7. Short package — actual narration file.
8. Short package — footage licence evidence.
9. Short package — rights confirmation after checking every asset.
10. Short package — human compliance review.
11. Long-form package — original footage origin.
12. Long-form package — named footage creator/operator.
13. Long-form package — capture-provenance evidence.
14. Long-form package — commercially eligible narration rights.
15. Long-form package — actual footage file.
16. Long-form package — actual narration file.
17. Long-form package — final captions file.
18. Long-form package — footage licence evidence.
19. Long-form package — rights confirmation after checking every asset.
20. Long-form package — human compliance review.
21. Metadata — human review and explicit `READY_FOR_PRIVATE_UPLOAD` state.
22. Metadata — verified media rights.
23. Metadata — completed human compliance review.
24. Exact-hash-bound human quality approval and configured `UPLOAD_APPROVAL_PATH`.
25. Actual rendered short `media/next-short.mp4`.
26. Complete owner-reviewed YouTube public/private/unlisted history.
27. Current local, workflow and owner-attested upload-attempt reconciliation.

### External inputs and production work still required

1. **Queue owner decision:** identify the exact detailed item for each operational long-form ID, explicitly designate cycle position 1, set position 2, and sign the approval template. Do not infer a mapping from similar titles.
2. **Original wildlife media:** supply creator-captured camera files, creator/operator identity, capture date/location evidence, written commercial rights, source provenance and exact hashes. AI wildlife imagery and generic stock are not acceptable substitutes.
3. **Narration:** manually generate the Speechma Andrew audition, enter the security code, download the MP3, preserve it in project storage, verify duration/quality/pronunciation, and obtain owner listening approval tied to the exact audio SHA-256. This cannot be automated under the free-site Terms.
4. **Long-form production:** complete the Nile crocodile documentary's zoological/factual review, original footage edit, lawful narration, captions, truthful thumbnail, final metadata, full playback/quality review and exact-hash approval.
5. **Short production:** create the required original-media short in 9:16 at 50–60 seconds, with verified narration, captions, thumbnail, rights review and exact-hash approval.
6. **YouTube history:** latest read-only inventory [44971395848](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971395848) verified the channel identity and complete inventory: one public 20-second video `LjePS02hA1o`, zero private and zero unlisted videos. Its format remains unclassified pending owner review. Confirm the YouTube Studio publication timestamp and attest to every manual/local/third-party upload attempt since 18 November.
7. **Private upload:** only after all media, rights, human review and one-shot authorization are bound to the exact job, files, metadata, thumbnail, captions and channel. Verify remote video ID and final privacy. Never blindly retry an uncertain upload.
8. **Scheduling:** resolve the mathematical cadence conflict. Three publications per 7-day week cannot satisfy a minimum 72-hour gap (`3 × 72 = 216` hours). Owner must approve a feasible cadence or explicitly change the interval. Then prove Africa/Johannesburg timing, DST, no same-calendar-day publication, rolling long-form → long-form → short order, leases, cancellation, retry/backoff, dead-letter and restart recovery using actual remote publication timestamps.
9. **State and recovery:** staging last showed five backups with latest source revision 2 while live was revision 3; R2 access returned 403 and no independent restore was proven. Obtain owner-approved R2/storage decision, create a current backup and complete a real isolated restore drill.
10. **Deployment:** deploy and verify the production publisher Worker, production secrets/OIDC trust, scheduler/cron, monitoring and rollback. A recovery smoke PASS is not a live production deployment.
11. **API acceptance:** complete the externally gated Facebook Page verification, draft approval, publishing, upload reconciliation and production job-execution paths with real authorized provider evidence.
12. **Dashboard acceptance:** retain the 41/41 browser PASS, then complete the full behavior-level matrix for all 121 controls and 17 forms, including role permissions, server-side state transitions and production evidence.
13. **Git safety:** complete GIT-002 semantic review of the 5,239-ahead/17-behind divergence, inspect the full 530-file PR diff (not only the 300-file compare response), review main-branch protection and workflow risks, and preserve PR #1 as draft/unmerged until owner review.
14. **Nature Frontiers/Meta separation:** remove the cross-brand SonicVhibez YouTube association from the Nature Frontiers Metricool configuration through authorized owner UI/support; reconcile the 20 legacy drafts and eight `draft=false/autoPublish=true` records. Do not publish YouTube through Metricool. Keep Nature Frontiers separate from SonicVhibez.

**Release remains HOLD.** Engineering validation, queue readiness and dashboard journeys now pass, but no final wildlife production package, rights clearance, narrator approval, owner queue mapping, production deployment, private upload authorization or verified live publication exists. The 27 blockers remain the production completion gate.


---

## Latest exact-head completion checkpoint — 22 November 2026

**Verified application/test tree:** `e3f9ea8bdebc06e6c1d6ed7ae496480eadc12119`. The next register update is documentation-only.

### Current exact-head validation

- [Validate SonicVhibez automation — 44971946718](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971946718): **PASS**. Node.js test totals: **1,098 passed / 0 failed / 0 skipped**. Python: **104 passed**. Locked dependency install, isolated lifecycle install, npm audit, FFmpeg renderer integration, Speechma policy guard, campaign/disclosure checks, promotional Shorts cap, review metadata, queue invariants, JavaScript syntax, Python compilation and read-only Cloudflare staging smoke all passed.
- Production readiness [44971946717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971946717): **HOLD — 27 blockers**. Diagnostic report uploaded. No production upload or schedule was attempted.
- Cloudflare runner bridge [44971946720](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971946720): PASS.
- Deployment recovery smoke [44971946729](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971946729): PASS; this is not proof of live production deployment or independent restore.
- Queue readiness [44971543131](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543131): PASS; 1,100 Node tests, zero failures/skips, queue policy validation and isolated proposal generation.
- Dashboard E2E [44971543086](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543086): PASS, 41/41 browser journeys.
- Source recovery bundle [44971543176](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44971543176): PASS.

### Queue identity template is now persisted

`content/queue-identity-approval.template.json` is now in the repository. It is explicitly non-approving:
- `status=PENDING_OWNER_APPROVAL`
- `ownerApproved=false`
- `approvedBy`, `approvedAt` and `approvalReference` are blank
- Both `detailedItemId` values remain blank; cycle positions 1 and 2 are recorded
- The two SHA-256 fields pin the canonical operational and detailed queue JSON objects
- A regression test recomputes both hashes and rejects stale or modified queue data

This template is not `content/queue-identity-approval.json` and cannot satisfy the owner approval gate. The owner must select both detailed identities, explicitly designate cycle position 1, complete the approval fields and create the signed approval file. Do not infer mappings from similar titles.

### Production gate remains unchanged

The exact-head readiness report still lists 27 blockers: queue identity approval (1); short package provenance, narration, files, licences and human review (9); long-form package provenance, narration, footage, captions, licences and human review (10); metadata review/rights/compliance (3); exact-hash quality approval (1); final short MP4 (1); complete owner-reviewed YouTube history (1); and upload-attempt reconciliation (1).

The existing public YouTube video remains unclassified pending owner review. The manual Speechma Andrew audition remains outstanding. No original production wildlife media, approved production narration, final renders, captions, final thumbnail, exact-hash quality approval, one-shot private-upload authorization or verified live publication exists.

### Repository state

`main` remains unchanged at `3795519ccbf58fd02d74458624b58dd2e44a88c0`. PR #1 remains OPEN / DRAFT / UNMERGED; mergeable=false. The implementation branch remains 5,240 commits ahead / 17 behind at the verified application tree, with 530 changed files and merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. GIT-002 semantic review remains mandatory; do not merge or alter `main`.

**Release remains HOLD.** Passing engineering tests does not clear the 27 production blockers or authorize publishing.
