# Current Release Evidence — 25 October 2026

## Release decision

**CODE ACCEPTANCE BLOCKED. PRODUCTION BLOCKED.** Automated regression, installation, dependency-audit and six browser journeys pass on the exact application-code candidate. Full dashboard-control acceptance, complete branch-history review, retained recovery/deployment evidence and real-account acceptance remain incomplete.

## Authoritative Git state

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Exact tested application-code/test SHA: `6b1de48043d16632957566c0ee84942f45e5ab87`
- Current branch HEAD: a documentation-only descendant of this tested SHA; live PR metadata is authoritative for the exact HEAD.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- At the tested code/test candidate, comparison was **1,027 ahead, 2 behind, 110 changed files**; subsequent documentation-only commits add no application-code changes. Use live PR metadata for the current-head comparison. The full PR changed-file inventory is available from GitHub. The 1,023 branch-only commits have not been reviewed patch by patch. The two base-only commits around Facebook history-restoration coverage are understood.
- PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1 — open, draft, unmerged.
- No direct `main` edits or destructive history operations were performed.

## Exact-SHA automated evidence

All runs below target `6b1de48043d16632957566c0ee84942f45e5ab87`.

| Check | Result | Evidence |
|---|---|---|
| Node regression suite | **243 passed; 0 failed; 0 skipped** | [Automation/security run 40175207834](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207834) |
| Python safety tests | **8 passed** | [Automation/security run 40175207834](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207834) |
| Locked and normal lifecycle-script `npm ci` | **Passed** | [Automation/security run 40175207834](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207834) |
| Dependency audit | **0 vulnerabilities** across 49 audited packages | [Automation/security run 40175207834](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207834) |
| Google API import, JS syntax, Python compilation, queue/campaign checks | **Passed**; 16 queue topics checked | [Automation/security run 40175207834](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207834) |
| Browser E2E | **6 passed** against local dashboard/backend | [Dashboard browser E2E run 40175207786](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207786) |
| Content quality | **Passed** | [Run 40175207785](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207785) |
| Metadata validation | **Passed** | [Run 40175207781](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207781) |
| Production readiness | **Blocked as required: 12 mandatory blockers** | [Run 40175207782](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207782); retained diagnostic [artifact 12592125035](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207782/artifacts/12592125035) |
| Nature Frontiers Facebook draft | **Skipped** on PR event | [Run 40175207784](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40175207784); not default-branch acceptance evidence |

## Implementation changes in this candidate

### Approval directory path safety
The dashboard previously used recursive directory creation for `run-logs/upload-approvals` before the approval transaction performed symlink checks. That could create nested output through a symlinked ancestor before rejection. Approval output now uses a shared component-by-component safe-directory helper that rejects symlinks and non-directory ancestors before nested writes.

`test/safe-directory-path.test.mjs` covers restrictive directory creation, symlink-ancestor rejection without creating descendants, non-directory ancestor rejection, and use of the guard by dashboard approval publication.

### Cross-process validation task durability
The `/api/tasks/run` route previously wrote initial and final task state without the cross-process state lock. Both transitions now acquire the lock, and a durable `RUNNING` record blocks a duplicate launch across dashboard processes sharing state. A regression test submits the same long-running allowlisted task to two processes and asserts one success and one conflict.

### Facebook Page verification feedback
The Page-verification button previously wrote its result into the autonomous-health panel and then refreshed that panel, overwriting the success/error message. The dashboard now uses a separate accessible live region for operation feedback. A sixth Chromium journey verifies that blocked feedback remains visible after the status refresh.

### Existing safeguards retained
Approval-artifact state-before-publication ordering and rollback handling; atomic JSON path validation; Facebook history restoration safeguards; dashboard form handler binding; queue idempotency and spacing; fail-closed readiness; hash-bound private-upload approval; remote-history/uncertain-attempt gates; inactive Safari campaigns; disabled public/unattended publishing.

## Requirement status

### Verified in code/CI
- 243 Node tests, 8 Python tests and six browser journeys pass on the exact tested SHA.
- Clean locked and normal dependency installation passed; `npm audit` reported zero vulnerabilities.
- The schedule uses `Africa/Johannesburg`, a rolling `long_form → long_form → short` cycle and a default 72 elapsed-hour minimum gap; Tuesday/Saturday triggers are draft-preparation only.
- The dashboard has authenticated operator routes, durable state, queue/job controls, campaign safeguards, Facebook draft workflows, review gates and read-only upload reconciliation.
- The private uploader requires verified SonicVhibez identity, exact approval hashes, one-shot authorization, explicit private visibility and durable attempt/receipt reconciliation.
- Public/unattended YouTube publishing and Facebook live publishing remain disabled.

### Still blocked or not fully verified
- The 1,023 branch-only commits have not been reviewed patch by patch; safe reconciliation requires owner approval.
- Not every visible dashboard control has a browser acceptance journey.
- Isolated crash, interruption, rollback, backup/restore and deployment drills with retained logs/checksums are incomplete.
- No genuine production Short or long-form export, accepted production manifest, final production hash or human playback approval has been verified.
- SonicVhibez OAuth/channel identity and complete remote history are not verified against a real account.
- No operation-specific authorization was used for a real private upload; no YouTube upload was performed.
- Nature Frontiers Page identity/permissions and a successful default-branch Facebook draft with inspected retained artifact are not verified; the PR-triggered workflow was skipped.
- Production deployment, monitoring, backup schedule, emergency-stop behavior and rollback are not accepted.

## Exact owner actions

1. Supply genuine rights-cleared footage, narration/music, captions and thumbnails for Short and long-form production, retaining source and licence evidence.
2. Review the actual rendered media and metadata; approve exact hashes only after technical, rights, disclosure and policy checks pass.
3. Configure OAuth securely; verify the authenticated channel is exactly SonicVhibez; reconcile all public/private/unlisted videos and uncertain attempts.
4. Only after all gates pass, separately authorize one private-only upload and independently verify remote channel, privacy state and receipt. Never make it public.
5. Verify Nature Frontiers Page identity, token tasks and permissions; run the permitted default-branch draft workflow and inspect its retained artifact. Do not publish a live post.
6. Approve a safe branch-reconciliation plan after complete review of divergent changes.
7. Complete and retain isolated recovery/backup/restore and deployment/monitoring evidence; then make the release decision.

## Safety posture

No real YouTube upload, public YouTube post or live Facebook post was performed. Public/unattended YouTube publishing remains disabled. Facebook live publishing remains disabled. The only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive until separately reviewed and approved.

## Evidence limits

CI results are real and target the exact code/test SHA above. Five Chromium journeys do not cover every dashboard control. A clean dependency audit does not establish overall security. Synthetic fixtures and test rights strings are not production media or genuine licences. The blocked readiness run is correct while mandatory prerequisites are missing. This report does not claim code acceptance or production acceptance.
