# Current release evidence — 3 November 2026

## Exact tested source and branch state

- Repository: `clickerrish-art/YT-AUTO-VISE`.
- Implementation branch: `codex/marketing-machine-audit-fixes`.
- Exact tested source/test candidate: `423a670ea56ec38fb9ec5c174f95614c69ac72be`.
- Main: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Comparison at the tested candidate: **2,513 ahead / 2 behind / 218 changed files**.
- PR #1 remains **OPEN, DRAFT, UNMERGED**. Branch protection is disabled. Main was not edited; no merge, reset, rebase, force-push or destructive reconciliation occurred.
- The latest source/test changes include worker backoff fail-closed handling (`5e2b648a6dcab0ad43371b9cd95ae469dadb8e0c`), its persistence-failure regression (`2d60073573b553f1574aca70cf9f79ed693fe33b`), and the dashboard control accessibility acceptance (`fdfeb6e9893c8ab8bebee8ba192170cd692b7948`, finalized by `423a670ea56ec38fb9ec5c174f95614c69ac72be`).

## Implemented and verified

### Worker retry-backoff durability

- The worker now stops with `WORKER_BACKOFF_PERSISTENCE_FAILED` if it cannot persist the cooldown after a dispatch conflict. It does not continue polling and redispatch a job without a durable cooldown.
- The regression test deliberately makes the retry-state parent path unusable after a 409 response and proves there is exactly one dispatch request before the worker exits.
- Existing worker restart/backoff, corrupt-state and symlink-state tests remain in the same suite.

### DASH-001 partial browser acceptance

- Added a real Chromium browser test that checks all **104 current dashboard controls** and **16 forms** after operator connection.
- The test checks unique control IDs where applicable, accessible names, associated labels or valid ARIA naming references, stable unique form IDs, and a submit control for every form.
- Exact browser workflow [41595436080](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595436080): **22/22 journeys passed**, including the new all-104-control check.
- This is a meaningful accessibility/identity acceptance slice, **not** proof that every control's complete business operation, validation, authorization, error feedback, API persistence, refresh, concurrency and restart behavior is accepted. **DASH-001 remains NOT_TESTED overall.**

## Exact-SHA GitHub Actions evidence

All listed runs are associated with exact candidate `423a670ea56ec38fb9ec5c174f95614c69ac72be`.

| Check | Run | Result |
|---|---:|---|
| Automation/security and complete Node/Python suites | [41595440424](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595440424) | **PASS** — 105/105 Node test files, 16 Python tests, zero skips |
| Dashboard Chromium E2E | [41595436080](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595436080) | **PASS** — 22/22 journeys |
| Content quality | [41595440398](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595440398) | **PASS** |
| Metadata validation | [41595440441](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595440441) | **PASS** |
| Isolated main/candidate baseline | [41595440603](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595440603) | **PASS** |
| Non-destructive branch inventory | [41595440403](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595440403) | **PASS — inventory only, not human semantic review** |
| Nature Frontiers local draft-package validation | [41595440458](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595440458) | **PASS — local validation only; no provider-side draft creation/read-back** |
| Locked npm install / lockfile verification | [41595436069](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595436069) | **PASS** |
| Production readiness | [41595440415](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41595440415) | **HOLD / BLOCKED — 13 prerequisites; fail-closed as designed** |

The automation log reports zero skipped Node tests and 16 Python tests. The browser workflow reports 22/22 passing. Passing these checks does not override the production-readiness hold.

## Current channel, publication-spacing and Metricool evidence

- vidIQ exposes a YouTube channel titled `SonicVibes`, handle `@sonicvhibez`, channel ID `UCSlkuPfHH78oGC1o418HV4w`. The display title is not literally `Sonic Fire`; do not silently treat those names as identical.
- The authorized upload-history query returned one Short, `LjePS02hA1o`, actually published at **2026-10-22 17:05:56 Africa/Johannesburg**. It returned no `scheduledPublishAt`, no further page token and no additional uploads across the queried public, unlisted and private statuses.
- The 72-hour threshold after that publication was **2026-10-25 17:05:56 Africa/Johannesburg**. At the 3 November 2026 09:11:38 SAST check, **280 hours, 5 minutes, 42 seconds** had elapsed since the observed publication.
- Metricool still exposes only Nature Frontiers brand `7545638`; its YouTube destination ID matches the vidIQ `SonicVibes / @sonicvhibez` channel. No separate SonicVhibez/Sonic Fire Metricool brand is selectable. Therefore the correct destination's Metricool schedule cannot be independently verified and **no new post may be scheduled**.
- The read-only Metricool schedule query returned eight future Nature Frontiers product-promotion records at 10:00 SAST on **4, 7, 11, 14, 18, 21, 25 and 28 November 2026**. All are `draft=false` and `autoPublish=true`; the 25 November record targets Facebook and Instagram, and the others target Facebook. They were not changed. Nature Frontiers is not an authorized SonicVhibez promotional destination.
- Metricool's scheduled-post endpoint does not return publication history. The vidIQ history result is useful channel evidence, but the Metricool destination collision still prevents a destination-safe scheduling check.

## Product listing verification

The three supplied Selar product pages were fetched successfully. Each displays seller **Click 47**:

- Complete YouTube Wildlife Creator's Vault — listing describes a wildlife field-to-feed content resource for story ideas, captions and consistent content.
- The Full Video Creation Prompt Pack Premium Edition — listing describes **20 ready-to-use AI prompts across six production stages**.
- The YouTube Success Blueprint 90-Day Creator System — listing describes a beginner-to-growth roadmap, audience/niche work, video ideas, packaging, analytics and a 30/60/90-day plan.

The public listings do not verify an affiliate commission or paid-sponsorship arrangement for the supplied links. Promotional copy must disclose the actual relationship once confirmed; do not claim an affiliate commission or sponsorship without evidence.

## Remaining acceptance and owner-controlled blockers

- **DASH-001:** exhaustive behavior acceptance for all 104 controls and 16 forms.
- **API-001:** complete route-by-route positive, negative, persistence, audit, concurrency and restart acceptance.
- **SCHED-001:** complete retry, manual retry, cancellation, dead-letter, ordering, shutdown and recovery drills.
- **STATE-001:** backup/restore corruption, interruption, disk-full and rollback failure injection.
- **DEPLOY-001:** clean install, supported runtime, configuration, startup, upgrade, rollback and recovery drills.
- **GIT-002:** human semantic review of the 2,513-ahead / 2-behind divergence; automated inventory is not approval.
- Production readiness continues to report 13 blockers, including independently verified SonicVhibez/Sonic Fire identity, complete private/unlisted history and uncertain-upload reconciliation, genuine rights-cleared media/manifests, human playback/metadata/compliance approval, final rendered media, secure OAuth configuration and a feasible owner-approved cadence.
- Meta Page/Instagram identity and permissions, and provider-side draft creation/read-back, remain unverified. Safari remains inactive until its exact HTTPS destination, disclosure and explicit owner approval are supplied.

## Safety

- Public and unattended YouTube publishing remains disabled.
- No video was uploaded or published; no live post was created or scheduled.
- No Metricool record was changed, no account was reconnected and no money was spent.
- Nature Frontiers is not a SonicVhibez promotional destination.
- The approved application Selar destination remains `https://selar.com/0u19v8u99l`.
- GitHub scheduled workflows execute from `main`; PR-branch Actions are validation evidence, not active production automation.

**Verdict: implementation is progressing and the exact source/test candidate passes its configured checks, but the application remains INCOMPLETE / NOT PRODUCTION READY.**
