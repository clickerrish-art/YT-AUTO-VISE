# Release gate checklist — SonicVhibez Marketing Machine

Keep each item unchecked until evidence has actually been inspected. Automated tests and mocks do not close real-world acceptance gates.

## Latest code/test checkpoint — 2026-10-24

Code and regression-test commit: `68cb2359628ca069e33f7de905b10183989f53e1`. The three GitHub Actions validation workflows are running for this exact commit: [automation validation](`https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40078895025`), [metadata/schedule validation](`https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40078895040`), and [content quality](`https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40078895024`). The prior code/test commit `6e56b240868c07cb5207fe8fa7f13a8b664be376` passed all three workflows with 99 passed, 0 failed, 0 skipped; `npm ci --ignore-scripts` installed 46 packages and audited 47, and Python compilation passed. The new candidate adds one regression test for Git-ignored local secrets/state/media and is awaiting these final runs.

Code additions since the prior checkpoint: upload preflight now verifies the approval-bound rights record hash and current source/licence-file checksums; dashboard audit events use the required `DASHBOARD_OPERATOR_ID`; per-asset rights records retain reviewer and timestamp; `backup:state` and guarded `restore:state` preserve dashboard state/audit, upload attempts/receipts/approvals and retained rights files. Restore validates checksums, requires explicit confirmation, and refuses to overwrite a different existing upload ledger. `.gitignore` excludes local secrets, state, rights documents, backups and generated production media.

These automated checks do not prove genuine licence authenticity, real wildlife media or live YouTube upload acceptance. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## Repository and automation
- [ ] Re-fetch and record branch/PR head SHA; PR #1 remains open and unmerged.
- [ ] Public publishing remains disabled.
- [ ] `npm ci --ignore-scripts` and `npm test` pass on the candidate SHA; record exit codes and test counts.
- [ ] Run `npm run check`, `npm run validate:schedule`, `npm run validate:campaigns`, `npm run check:captions`, and `npm run readiness`; record outcomes.
- [ ] Workflow cron values agree with `config/weekly-content-plan.json`; schedules create drafts only.
- [ ] Dashboard starts on loopback with actual operator credentials; unauthenticated calls fail and authenticated actions persist/audit.
- [ ] Restart recovery, slot idempotency/conflict, and backup/restore are verified.

## Real production artifacts
- [ ] Both production manifests point to present, non-empty, validated source files.
- [ ] Each asset has retained original licence/permission evidence and checksums.
- [ ] Commercial YouTube use, attribution, restrictions and expiry were checked by an identified reviewer.
- [ ] Narration, captions, metadata and edit match; wildlife claims are fact-checked.
- [ ] Short: 50–60 seconds, 1080×1920, H.264/AAC, full-file decode and measurable audio.
- [ ] Long-form: 6–10 minutes, 16:9, supported video/audio codecs and full-file decode.
- [ ] Thumbnail is a real file derived from the final rendered artifact and has a checksum.
- [ ] Video, thumbnail, captions, metadata and rights-evidence hashes are recorded.
- [ ] Human playback inspection and synthetic/altered-media disclosure review are complete.
- [ ] Authenticated human approval binds the exact artifact hashes and current metadata/rights versions.

## Private YouTube upload
- [ ] OAuth credentials remain in a secure environment/secret store, never browser code or chat.
- [ ] Authenticated API confirms exact title `SonicVhibez` and independently confirmed channel ID.
- [ ] Artifact package and explicit per-operation operator confirmation are present.
- [ ] Durable upload attempt is written before remote insert.
- [ ] Request explicitly sets `privacyStatus: private`; no public/unlisted fallback.
- [ ] Exact remote video is re-fetched and channel ownership/private visibility verified.
- [ ] Durable receipt and ledger are persisted; uncertain outcomes are reconciled before retry.

## Campaign compliance
- [ ] Selar destination is exactly `https://selar.com/0u19v8u99l` with accurate visible disclosure.
- [ ] Safari remains inactive unless exact HTTPS destination, disclosure and owner approval are retained.
- [ ] No unsupported sales, SEO-score, monetization or wildlife-event claims.
- [ ] Nature Frontiers is never selected as a target.

**Decision: BLOCKED** if any required real-world gate remains unchecked. Passing mock tests never substitutes for a genuine render, rights verification, human review or remote private-upload verification.
