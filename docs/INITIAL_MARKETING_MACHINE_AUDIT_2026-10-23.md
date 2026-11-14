# SonicVhibez marketing machine — initial evidence-based audit

Date: 2026-10-23
Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
Implementation branch: codex/marketing-machine-audit-fixes

## Verified repository facts
- Default branch is `main`; repository is public.
- Queue configuration declares Tuesday, Thursday, Saturday in Africa/Johannesburg, three posts weekly, breakdown two long-form plus one Short; `publishingEnabled=false`.
- Queue items use the owner-approved Selar URL `https://selar.com/0u19v8u99l`.
- Long-form narration workflow is scheduled Tuesday and Saturday at 15:00 UTC.
- Short narration workflow is scheduled Thursday at 15:00 UTC.
- Existing readiness and queue validation workflow runs 39986849562 and 39986849388 respectively completed successfully. These runs validated code/tests/diagnostics and queue checks; they do not prove live upload, public publishing, rights clearance, or a completed wildlife documentary.
- `scripts/production-readiness.mjs` is diagnostic and fail-closed; it checks required queue/manifest/metadata/media and OAuth configuration but does not upload.
- `scripts/validate-long-form-export.mjs` validates duration, 1920×1080, H.264 and AAC, but does not run a full decode or verify caption accuracy.
- README and workflow configuration distinguish typography-led review media from rights-cleared wildlife footage and keep public publishing disabled.
- A queue cadence regression test exists on the implementation branch and asserts the three-day, two-long-form-plus-one-Short target. Its CI result on this branch must be checked after the current changes run.

## Implemented in this audit pass
- Created/selected isolated implementation branch `codex/marketing-machine-audit-fixes`; main was not modified.
- Corrected README cadence description: the Short narration workflow runs Thursday; the long-form narration workflow runs Tuesday and Saturday. This avoids incorrectly attributing all three days to the Short workflow.
- Preserved the safety posture: no rights or compliance flags were set true; no YouTube upload or public post was attempted.

## Known gaps / blocked acceptance criteria
- No live YouTube OAuth identity has been independently verified in this audit. Private upload remains dependent on configured secrets and a verified channel ID.
- No public scheduling or publication is enabled, and none was tested.
- Real footage and narration rights still require reviewable evidence and human approval. NOAA downloads are candidates, not blanket permission for all included material.
- Episode 2 graphic-only review exports have technical validation, but the latest reviewed versions still require a full listening/watch-through for scene timing and caption accuracy; they are not approved wildlife documentaries.
- No evidence in this audit proves Safari.com campaigns, conversion analytics, multi-tenant dashboard, or production deployment are implemented end to end.
- A full clean-checkout install/test and security review has not yet been executed on the current branch in this audit pass.
- Workflow actions are not pinned to immutable SHAs everywhere; this remains a supply-chain hardening task.

## Next engineering steps
1. Confirm CI result for this branch and fix any failing tests without weakening safeguards.
2. Inspect the complete workflow inventory and latest failures; record trigger, permissions, artifacts, and secrets by workflow.
3. Add tests for long-form cadence, queue idempotence, bad/missing media, upload retries and destination-channel mismatch.
4. Improve export validation to check frame rate, full-file decode, audio duration and caption coverage while retaining human review gates.
5. Validate the private-upload workflow using mocked APIs first; live private upload only after owner authorization and valid account secrets.
6. Build a real campaign adapter for approved Selar/Safari links only after verifying available APIs and owner-provided affiliate links.
7. Keep public publishing disabled until explicit authorization and all required evidence is recorded.

## Status
**PARTIALLY OPERATIONAL / PRODUCTION BLOCKED.** Draft generation, queue validation and technical media checks exist. Unattended, rights-cleared, channel-verified production and publishing are not established by the evidence currently reviewed.
