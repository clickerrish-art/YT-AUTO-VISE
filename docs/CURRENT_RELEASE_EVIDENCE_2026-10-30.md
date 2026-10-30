# Latest exact-SHA implementation update — 30 October 2026

## Live refs and implementation

- PR #1 is OPEN, DRAFT and UNMERGED.
- Exact tested source/test SHA before this evidence-only update: `ab9416146adcd05a17f571b2cc7889dccac0c280`.
- Two focused commits added:
  - `0e4e6044840a5b62def1025799f452e71988d13a` — Nature Frontiers promotion guard scans the public `firstCommentText` as well as the caption, extracts URLs from both, and blocks Selar/Safari links or affiliate/promotional language hidden in the first comment. Policy version: `nf-facebook-autonomous-policy-2026-10-v3`.
  - `ab9416146adcd05a17f571b2cc7889dccac0c280` — regression test proves a neutral caption cannot move a prohibited Selar URL or affiliate disclosure into the public first comment; changing the first comment changes the approval fingerprint.
- The fingerprint includes `firstCommentText` only when the property is present, preserving legacy fingerprints for old payloads that do not contain the field.
- Live compare at the tested source/test SHA: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, **2,170 ahead / 2 behind / 182 changed files**. This is a live API compare snapshot, not human semantic approval to merge.

## Exact-SHA CI — source/test SHA ab9416146adcd05a17f571b2cc7889dccac0c280

- Automation/security [41024489463](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489463): **427 Node tests passed, 0 failures, 0 skips; 16 Python unit tests passed; npm audit 0 vulnerabilities; FFmpeg/ffprobe integration, syntax and Python compilation steps passed.**
- Content quality [41024489659](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489659): **427 tests passed, 0 failures, 0 skips.**
- Metadata validation [41024489440](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489440): **427 tests passed, 0 failures, 0 skips.** Its negative-path checks intentionally report that unreviewed asset metadata is BLOCKED.
- Dashboard browser E2E [41024489446](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489446): **15 Chromium journeys passed.**
- Isolated main/candidate baseline [41024489845](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489845): **PASS** for both exact checkouts.
- Non-destructive branch inventory [41024489462](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489462): **PASS**; inventory is not a semantic merge review.
- Nature Frontiers local draft-package validation [41024489472](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489472): **PASS for local deterministic validation only**; the external provider-create/read-back job was skipped.
- Production readiness [41024489515](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489515): **BLOCKED / fail-closed**, with the existing 13 prerequisites. This is not a code-test failure and is not production acceptance.

## Metricool and destination verification

- Metricool read-only brand list exposes only Nature Frontiers, brand ID `7545638`; it does not expose a distinct SonicVhibez/Sonic Fire brand.
- Metricool's configured YouTube channel ID is `UCSlkuPfHH78oGC1o418HV4w` (24 characters). The previously supplied SonicVhibez channel URL contains `UCSlkuPfHH78oC1o418HV4w` (23 characters). They are not equal. The connected destination must not be selected until the owner confirms the correct channel identity.
- Eight upcoming Nature Frontiers Facebook/Instagram promotional posts remain configured with `draft=false` and `autoPublish=true`: `406357296` (31 Oct 10:00 SAST), `406357335` (4 Nov 10:00), `406357364` (7 Nov 10:00), `406357388` (11 Nov 10:00), `406357414` (14 Nov 10:00), `406357443` (18 Nov 10:00), `406357483` (21 Nov 10:00), and `406357554` (25 Nov 10:00; Facebook and Instagram). No existing remote post was changed, cancelled or rescheduled. The repository guard does not alter provider-side queue records.
- The Metricool YouTube published-in-range connector returned one public video in the inspected 12-month period: `LjePS02hA1o`, title “How to make wildlife videos people actually watch #wildlife #filmmaking #shorts”, raw timestamp `20261022150556` without timezone metadata. At 30 Oct 2026 10:04:53 SAST, the known-public-video gap is **186h 58m 57s** if that timestamp is SAST or **184h 58m 57s** if it is UTC. Both exceed 72 hours, but private/unlisted history and uncertain upload attempts are not available and the timestamp timezone is ambiguous; the complete spacing check remains **UNVERIFIED**. No YouTube post was scheduled.
- HeyGen account read reports the Free plan and null/unavailable remaining-credit counters. The latest failed generation returned `MOVIO_PAYMENT_INSUFFICIENT_CREDIT`; completed library items inspected were 20.4016s, 22.3085s, 24.32s and 48.7967s. No new video was generated and no quota/payment was bypassed.
- All three supplied Selar pages were inaccessible to the available web reader. Seller identity, exact product contents and whether the link is affiliate, paid or owner-operated remain unverified. Do not publish promotional copy until the relationship is confirmed and the accurate disclosure is supplied.

## Release verdict

**NOT PRODUCTION READY.** Public/unattended YouTube publishing remains disabled; no live upload, schedule, Meta post, campaign activation, visibility change, merge, main-branch edit, rebase, reset, force-push or destructive reconciliation occurred. Nature Frontiers remains prohibited as a YouTube destination. The owner-controlled YouTube identity/history, genuine rights-backed media and human review, per-operation private-upload authorization, owner-approved feasible cadence, Meta identity/draft acceptance, branch protection and full semantic branch review remain unresolved.

---

# Current release evidence — 30 October 2026

## Latest live checkpoint — 30 October 2026, 09:36 SAST

- Repository: clickerrish-art/YT-AUTO-VISE
- Implementation branch: codex/marketing-machine-audit-fixes
- Current PR #1 HEAD at this snapshot: ef3eadd005a811f9596e1cc12fa58beaf4770a03 (documentation-only descendant). Exact tested application/source candidate: b31149df440a4c02cb2d7541b4894dcd916b8796.
- PR #1 remains open, draft and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Live main: fa00d28e7f58911482686e4ad69fac9f4701a2e6
- Merge base: 45352b73bb6cc4787b2a49988b575afb754ab627
- Compare at this snapshot: 2,167 ahead / 2 behind / 182 changed files
- No main edit, merge, rebase, reset, force-push, destructive reconciliation, live upload, public post or Metricool mutation occurred.

## Documentation-head workflow verification

The current PR HEAD ef3eadd005a811f9596e1cc12fa58beaf4770a03 is documentation-only after tested application/test candidate b31149df440a4c02cb2d7541b4894dcd916b8796. Its automation/security, content quality, metadata, 15 Chromium browser journeys, isolated baseline, non-destructive branch inventory and local Nature Frontiers draft-package validation all passed: runs 41023127603, 41023127627, 41023127609, 41023127570, 41023127566, 41023127689 and 41023127592. The external Meta draft-creation step was skipped. Production readiness remains blocked at run 41023127637 with 13 blockers. GitHub branch metadata reports protected=false; owner/admin must configure branch protection and required checks.

## Current implementation change

Commit 798d507dbb6188ac9df555c1300507c2f6b3815a adds a fail-closed product-promotion guard to the Nature Frontiers Facebook draft evaluator and final-payload policy. It rejects commercial flags, non-empty campaign IDs, Selar/Safari storefront links, affiliate/sponsor/advertising language, purchase/download CTAs and the three supplied Selar product names. Selar/Safari destinations are no longer eligible outbound destinations for Nature Frontiers social posts. The policy versions were bumped to v2 and the local configuration documents the education-only rule.

Follow-up commit b31149df440a4c02cb2d7541b4894dcd916b8796 adds explicit regression coverage for the exact Complete YouTube Wildlife Creator's Vault name, including its apostrophe, and the three supplied Selar URLs. This guard protects repository-generated Nature Frontiers Facebook/Instagram content; it does not alter existing Metricool schedules or provide enforcement for unconnected Pinterest/TikTok APIs.

## Exact-HEAD CI evidence for b31149df440a4c02cb2d7541b4894dcd916b8796

| Workflow | Result | Run |
|---|---|---|
| Automation/security | PASS: 426 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592775 |
| Content quality | PASS: 426 tests, 0 failures, 0 skips | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592787 |
| Metadata validation | PASS: 426 tests, 0 failures, 0 skips | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592837 |
| Dashboard browser E2E | PASS: 15 Chromium journeys | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592840 |
| Isolated main/candidate baseline | PASS | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592897 |
| Non-destructive branch inventory | PASS; retained artifact 12961912400 | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592859 |
| Nature Frontiers local draft package | PASS for local validation only; provider creation job skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592805 |
| Production readiness | BLOCKED by 13 prerequisites; fail-closed result is expected | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592898 |

The production-readiness run identifies the owner-controlled cadence decision, complete remote YouTube history and uncertain-attempt reconciliation, real rights-backed manifests, human review, verified channel identity, missing final MP4, and secure OAuth/channel configuration as blockers. It never uploads, schedules or publishes.

## Live Metricool and YouTube destination inspection

Metricool exposes only Nature Frontiers brand 7545638. Its YouTubeData channel ID is UCSlkuPfHH78oGC1o418HV4w. A 5-credit VidIQ channel lookup resolves this ID to the channel title SonicVibes; it does not establish the exact SonicVhibez/Sonic Fire identity. The earlier user-supplied channel ID differs and is 23 characters. Destination identity therefore remains unverified and must not be used for publishing.

Eight upcoming Nature Frontiers Facebook/Instagram product-promotion posts remain draft=false and autoPublish=true: 406357296 (31 Oct 10:00 SAST), 406357335 (4 Nov 10:00), 406357364 (7 Nov 10:00), 406357388 (11 Nov 10:00), 406357414 (14 Nov 10:00), 406357443 (18 Nov 10:00), 406357483 (21 Nov 10:00), and 406357554 (25 Nov 10:00; Facebook and Instagram). No remote record was modified, cancelled or rescheduled. The new code guard does not retroactively change these provider-side posts.

Metricool returned one public YouTube video in the inspected 12-month range: LjePS02hA1o, raw timestamp 20261022150556, with no timezone included in the metric response. If UTC, the timestamp is 22 Oct 17:05:56 SAST and the gap to 30 Oct 09:36:58 SAST is 184h 31m 02s. If already SAST, the gap is 186h 31m 02s. Both exceed 72 hours, but complete private/unlisted history and uncertain attempts were not available and timezone interpretation is ambiguous. Full spacing verification remains UNVERIFIED; no YouTube schedule was created.

## Media and product verification

HeyGen library lookup found completed videos of 20.4016s, 22.3085s, 24.32s and 48.7967s. None is the new approximately 55-second YouTube-hook script. The latest listed render attempt failed with MOVIO_PAYMENT_INSUFFICIENT_CREDIT. No render was started in this run and no paid quota was bypassed.

The three supplied Selar product URLs could not be opened by the available web reader. Product-page seller details, current contents, price and the actual own-product/affiliate/paid-placement relationship remain unverified. A disclosure must be finalized accurately before upload. No product facts or prices are inferred.

## Verdict

**NOT PRODUCTION READY.** Exact-HEAD CI is green for code/test checks, but 13 production prerequisites, exhaustive dashboard/API acceptance, complete recovery/deployment drills, human branch-history review, destination identity, real media and external provider acceptance remain open. Public/unattended YouTube publishing remains disabled.
## Changes since the earlier documented source/test candidate

A live compare from earlier candidate `75ef3a5ee5c3eb41f1edec106d65145b219d737c` to tested candidate `115fe82252b4fa1ef1eb2f9587bf0653356a6dc9` reports 14 commits ahead, 0 behind and nine changed files:

- `scripts/human-review.mjs`
- `test/human-review.test.mjs`
- `test/dashboard-api-auth-matrix.test.mjs`
- `docs/BRANCH_RECONCILIATION_REPORT_2026-10-28.md`
- `docs/CURRENT_RELEASE_EVIDENCE_2026-10-29.md`
- `docs/DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md`
- `docs/GO_LIVE_BLOCKERS.md`
- `docs/RELEASE_GATE_CHECKLIST.md`
- `docs/REQUIREMENTS_ACCEPTANCE_REGISTER.json`

The source change hardens review-receipt timestamp validation; the associated tests add invalid-timestamp and API authentication-matrix coverage. The subsequent five commits from the tested candidate to the live PR HEAD update documentation only. No assertion is made that every intervening commit has received a separate semantic review.

## Acceptance register snapshot

The live machine-readable register contains 69 requirements:

- PASS: 53
- NOT_TESTED: 8
- BLOCKED_EXTERNAL: 8

The aggregate is not 100% acceptance. In particular:

- DASH-001 remains NOT_TESTED: exhaustive behavior-specific acceptance for every dashboard control, form and API route is not complete. The static inventory is 105 controls, 15 forms and 38 literal routes (10 GET, 28 POST); this is inventory, not functional acceptance.
- STATE-001 remains NOT_TESTED: controlled process termination coverage exists, but all transaction boundaries, true power-loss durability and production-like recovery/rollback are not accepted.
- SCHED-001 remains NOT_TESTED: full queue/history, worker-overlap, restart and operational schedule acceptance is incomplete.
- GIT-002 remains NOT_TESTED: the large branch divergence still needs human semantic review, including both main-only commits and the historical restore-test incident.
- DEPLOY-001 remains NOT_TESTED: clean isolated installation, monitoring, backup/restore and deployment rollback have not been operationally accepted.
- SHORT-PARENT-001 and SCRIPT-PROMPT-001 remain NOT_TESTED.
- YT-001, YT-002, YT-003, FB-001, SEC-001, SCHED-003, YOUTUBE-RELATED-001 and META-REMOTE-SCHEDULED-001 remain BLOCKED_EXTERNAL.

## Safety and external boundaries

- YouTube target remains SonicVhibez only. Nature Frontiers must never be used as a YouTube destination.
- Public and unattended YouTube publishing remain disabled. No upload or visibility change was performed.
- The documented channel ID discrepancy must be resolved through authenticated account/API verification; do not guess or silently correct it.
- No provider-side Meta draft creation/read-back is proven. Live Facebook and Instagram publishing remain disabled; `publishingEnabled=false`, `dryRun=true`, `emergencyStop=true`, and `FACEBOOK_PUBLISH_ENABLED=NO` remain required.
- No campaign activation or Metricool schedule mutation was performed. The eight recorded future Nature Frontiers schedule records require individual owner decisions before any change.
- Owner-approved cadence, genuine rights-cleared production media, human review, provider identities/permissions, authorized private-upload evidence and native YouTube Related-video evidence remain outstanding.
- Branch protection/required checks must be verified and enabled by the repository owner/admin; connector access did not provide authoritative confirmation in this session.

## Branch reconciliation

The latest retained full-history inventory is for an earlier branch snapshot, not the live HEAD in this report. It identified 2,109 branch-only commits, 2 main-only commits and 178 final-tree changed files for its own recorded snapshot. The two main-only commits are the historical test-file addition and explicit revert. Both `test/restore-facebook-draft-history.test.mjs` and `tests/restore-state.test.mjs` are present on the current implementation branch.

The inventory artifact and report are evidence for a human review, not integration approval. A new inventory and full semantic review against the current live HEAD are still required. Do not reconcile destructively.

## Verdict

**NOT PRODUCTION READY.** The exact tested candidate has passing automated checks, but critical repository-controlled acceptance and genuine owner/provider gates remain open. No 100% completion claim is justified.


## Subsequent documentation-only branch refresh — 30 October 2026

After the evidence above was written, the existing project audit/report, go-live blockers, release checklist, acceptance register and operations runbook were refreshed, and `docs/BRANCH_RECONCILIATION_REPORT_2026-10-30.md` was added. The live PR HEAD at this later read was `7bb46f0167f145134e927ae32798a19432f66107`; PR #1 remained open, draft and unmerged. Live compare at that read: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,162 ahead / 2 behind / 182 changed files. These are documentation-only commits after tested source/test candidate `115fe82252b4fa1ef1eb2f9587bf0653356a6dc9`; they do not constitute a new application-code test run.

Fresh PR workflows triggered for `7bb46f0167f145134e927ae32798a19432f66107` were still queued/in progress at the time of the last status read: automation/security run 40977628344; content quality 40977628347; metadata 40977628324; dashboard E2E 40977628382; isolated baseline 40977628350; branch inventory 40977628363; local Facebook draft package 40977628346; production readiness 40977628341. No conclusion is claimed for these pending runs.
