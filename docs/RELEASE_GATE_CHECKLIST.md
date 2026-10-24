## Last fully verified code checkpoint before this documentation refresh — 2026-10-24

- Verified code/test HEAD: `47b513c2f0fedfa0e7bcdbaf77a40857d82e0a2b`; PR #1 was open, draft and unmerged against `main`. The subsequent commits in this documentation refresh change documentation only; the final branch HEAD and its CI are reported in the PR description and completion response.
- All three GitHub Actions validation workflows passed on that exact code/test HEAD, each with 107 passed, 0 failed, 0 skipped: [automation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082256630), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082256649), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082256549).
- The automation run passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and 8 Python safety tests. The metadata workflow intentionally verifies that `npm run check` fails closed while production metadata remains incomplete; that is a successful safety check, not production readiness. Plain `npm ci` without `--ignore-scripts` remains unverified.
- Schedule implementation converts configured 17:00 local time with IANA timezone rules, validates elapsed-hour gaps and local dates, and applies schedule/spacing checks to dashboard draft creation, draft updates and direct job creation. The dashboard state/readiness responses now explicitly show the unresolved cadence decision. The current two-slot draft schedule (Tuesday long-form, Saturday Short) has 96-hour and 72-hour cyclic gaps.
- **Cadence decision remains BLOCKED:** the requested target is two long-form videos plus one Short every seven days. Three cyclic gaps of at least 72 hours require 216 hours, so that target cannot fit in a 168-hour week. The active one-long-form + one-Short schedule is an explicitly labelled interim safety fallback, not a silent replacement of the requested goal. Public publishing remains disabled.
- Production acceptance remains blocked by genuine rights-cleared source media and manifests, real rendered and fully decoded exports, human review bound to final hashes, secure live SonicVhibez OAuth identity verification, one explicitly authorized private upload with remote private-status receipt, and owner-run restart/backup-restore acceptance. Safari remains inactive until exact HTTPS destination, disclosure and owner approval exist.

# Release gate checklist — SonicVhibez Marketing Machine

## Current publication-spacing control — 2026-10-24

The active interim draft plan has two weekly slots: Tuesday 17:00 SAST (long-form draft) and Saturday 17:00 SAST (Short draft), with 96-hour and 72-hour cyclic gaps. The dashboard enforces timezone-aware timestamp spacing and slot collisions. The requested target remains 2 long-form + 1 Short weekly, which cannot satisfy 72-hour cyclic spacing within 168 hours; owner decision required. The interim schedule does not authorize publication. Complete public/private/unlisted upload history and the live destination queue must still be inspected before any publication operation. Public publishing remains disabled.


Keep each item unchecked until evidence has actually been inspected. Automated tests and mocks do not close real-world acceptance gates.

## Historical checkpoint — superseded by the current verified baseline above

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

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


## Current branch checkpoint — 2026-10-24

Branch HEAD at the latest verified documentation checkpoint: `54680587e71b5c84074a2c681ed8e95d919a87fd`. The three PR validation workflows passed on this exact SHA: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578167), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578180), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578198). Each reported 100 passed, 0 failed, 0 skipped. The automation workflow verified `npm ci --ignore-scripts` and Python compilation. The metadata workflow deliberately verifies that production checks fail closed while production metadata is incomplete; it is not a production-readiness pass.

These CI results do not close owner-controlled media, rights, human playback, OAuth/channel identity, private upload, or operational restore gates. PR #1 remains open, draft and unmerged; public publishing remains disabled. Recheck this section against the current HEAD before relying on it after future commits.


## Historical implementation checkpoint — superseded by the current verified baseline above

- Tested code/workflow HEAD: `4ba995bc51ed2ae0513bc312865713a73e0e3160` (timezone-aware local-time conversion plus the 72-hour weekly schedule guard).
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Planned draft slots are Tuesday 17:00 and Saturday 17:00 Africa/Johannesburg. The cyclic gaps are 96 hours and 72 hours. The validator checks the weekly UTC schedule and queue collisions; actual public/private/unlisted upload history and live destination queue must still be inspected before any publication.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.
