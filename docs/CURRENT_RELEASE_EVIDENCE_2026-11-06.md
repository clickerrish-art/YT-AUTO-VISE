# Release evidence checkpoint — 6 November 2026

## Exact repository state

- Implementation branch: `codex/marketing-machine-audit-fixes`
- Exact application source/test SHA exercised by the CI evidence below: `8b98c70e189a73e6afa6d9727cba0b5be8fa0899`
- Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Live compare: **2,897 commits ahead / 2 behind / 261 changed files**.
- PR #1: **OPEN · DRAFT · UNMERGED**.
- No merge, main-branch edit, reset, rebase, force-push, or destructive reconciliation was performed.
- Branch-protection state remains **UNVERIFIED**; the integration previously received HTTP 403 for the protection endpoint.

## Exact-SHA CI evidence

All run references below are for the exact application source/test SHA above.

| Check | Result | Evidence |
|---|---|---|
| Automation/security | **PASS** — 119/119 Node test files; 16 Python tests; npm audit found zero vulnerabilities; FFmpeg 6.1.1 and ffprobe verified | [Run 42295243016](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295243016) |
| Dashboard Chromium E2E | **PASS** — 26/26 browser tests | [Run 42295243299](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295243299) |
| Content quality | **PASS** — test suite completed; exact-SHA automation log confirms 119/119 Node test files | [Run 42295243314](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295243314) |
| Queue readiness | **PASS** — 16 topics; safe held status; public publishing disabled | [Run 42295243173](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295243173) |
| Metadata validation | **PASS** | [Run 42295243139](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295243139) |
| Isolated main/candidate baseline | **PASS** | [Run 42295242971](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295242971) |
| Non-destructive branch inventory | **PASS** | [Run 42295243033](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295243033) |
| Nature Frontiers local draft validation | **PASS** — local validation only, not provider-side creation/read-back | [Run 42295243125](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295243125) |
| Production readiness | **HOLD** — 24 blockers; readiness exit code 2 is intentional fail-closed behavior | [Run 42295242942](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42295242942) |

The FFmpeg workflow setup now uses bounded package-manager timeouts/retries. The exact-SHA automation log verifies FFmpeg and ffprobe were available and reports 119/119 Node test files passed. Browser E2E reports 26 passed.

## Acceptance status and evidence boundaries

- **DASH-001 remains NOT_TESTED overall.** The 26 browser journeys are useful exact-SHA evidence but do not prove every dashboard control and form has complete business-success, validation, error, authorization, persistence, refresh, concurrency, restart and accessibility acceptance.
- **API-001 remains NOT_TESTED overall.** The checked-in route matrix currently reports 36 routes, 36/36 authentication-negative checks, 31 route-level PASS and five externally BLOCKED. Its route-by-route evidence is tied to older exact source/test SHA `8272d2e39868237c05b2951f37bcade6ae6608c4`; it must not be relabelled as route-by-route acceptance on the 6 November SHA merely because the broader CI suite passed.
- **SCHED-001, STATE-001, DEPLOY-001 and GIT-002 remain open.** Existing targeted worker, queue, backup/restore and inventory tests are evidence for individual slices, not completion of their full operational acceptance drills.
- Production readiness is separate from engineering CI. The 24 blockers include owner-approved feasible cadence and approval evidence; complete SonicVhibez public/private/unlisted history plus uncertain-attempt reconciliation; genuine rights-cleared Short and long-form manifests/assets; human metadata/compliance review; promotion compensation/disclosure evidence; final `media/next-short.mp4`; and the four YouTube OAuth/channel environment variables.
- No upload, publication, live schedule, provider mutation, account reconnection, spending, or public/unattended publishing was performed. Nature Frontiers remains draft-only and publishing-disabled.
- Synthetic fixtures and passing local validation do not establish real media rights, human approval, account ownership, or provider-side acceptance.

## Next engineering work

1. Refresh API-001 route-by-route evidence from the current exact source/test SHA without changing older evidence claims or treating external provider prerequisites as passed.
2. Continue DASH-001 control/form journeys and SCHED-001/STATE-001/DEPLOY-001 operational drills, recording each tested SHA and exact workflow run.
3. Keep the PR draft and the main branch untouched pending owner semantic review of the divergence.
4. Keep all production and publishing gates fail-closed until their genuine owner-controlled prerequisites are supplied.

This file records evidence; its own documentation commit is not represented as application-code test evidence.
