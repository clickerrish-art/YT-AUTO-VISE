# SonicVhibez Production Quality Standard

**Policy ID:** SV-PQS-001  
**Status:** Mandatory acceptance policy  
**Applies to:** Every current and future Short, long-form video, thumbnail, still image, narration, script, caption, edit, render, scheduled item and publication package.  
**Effective:** On adoption into the production branch.

## 1. Non-negotiable release rule

No asset or video may be accepted, scheduled, uploaded or published unless the exact final deliverable passes every applicable critical gate and has a documented final quality score of **at least 85/100**. A score is attached to the exact final artifact SHA-256, not to a prompt, source clip, draft, preview or earlier export.

The 85/100 threshold is a floor, not a target average. A rolling 10-video portfolio target is that at least 8 of 10 accepted videos achieve 85/100 or better. This portfolio target never permits an individual video below 85/100 to pass. Every released video must meet the floor. If a video fails, it is rejected, revised and reviewed again; it is never published to satisfy a cadence target.

Automated technical checks, model-generated ratings, workflow success, a successful FFmpeg render, or an unverified reviewer checkbox do not constitute proof of visual quality. Final human review must include full playback of the exact exported video and inspection of every final thumbnail/image at intended display size.

## 2. Critical visual gates — all must pass

- **Photorealism and credibility:** natural animal anatomy, proportions, movement, lighting, environments, textures, shadows and physics. No generic stock-looking filler, synthetic-looking wildlife, malformed anatomy, invented behavior presented as documentary fact, or visibly AI-generated artifacts.
- **Sharpness and clarity:** subject and important details are in focus; no material blur, pixelation, compression damage, low-resolution upscaling, smeared detail, excessive noise or illegible overlays.
- **Composition:** clear primary subject and visual hierarchy; intentional framing, scale, negative space and contrast; uncluttered background; no accidental crops, competing focal points, excessive text, decorative clutter or obstructed subject.
- **Editorial specificity:** every shot must serve a named story beat or factual purpose. Generic, repetitive, irrelevant or merely decorative footage is rejected.
- **Continuity and motion:** coherent movement, stable subject identity, plausible action, consistent geography, lighting and screen direction; no morphing, flicker, jitter, duplicated limbs, jumpy interpolation, unexplained scene changes or distracting transitions.
- **Thumbnail/image integrity:** one unmistakable focal subject, legible concise wording where used, clean hierarchy, accurate depiction of the story, no misleading visual claim, and no clutter. Inspect at mobile size and desktop size.
- **Technical export:** correct aspect ratio and resolution for destination, stable frame rate, full-file decode, no corruption, no black/frozen unintended sections, no missing frames, no unintended bars, and no unwanted generator watermark.

A single critical visual failure is an automatic REJECT regardless of numeric score.

## 3. Story, retention and narration gates

- The opening must create an immediate, truthful curiosity or stakes hook. No generic greetings, slow preamble or empty intro.
- The story must have a clear promise, progressive escalation, meaningful new information or visual evidence, deliberate pacing, and a satisfying payoff. No padding, repetitive narration or manufactured suspense unsupported by the facts.
- Every scene must advance the story, answer a question, reveal evidence, change the stakes or provide necessary context. Remove scenes that do none of these.
- Retention engineering must use purposeful visual changes, pattern interrupts, open loops and curiosity resets at natural story beats. Do not use arbitrary cuts, false claims, fake danger or misleading edits to force attention.
- Narration must be clear, natural, authoritative, emotionally appropriate and synchronized to the actual footage. Script, spoken audio and captions must agree. No robotic cadence, clipped words, rushed delivery, long dead air, distracting breaths, clipping or unintelligible passages.
- Mix must preserve speech intelligibility and controlled dynamics; music and ambience must support rather than compete with narration. Full audio playback is mandatory.
- Factual claims must be sourced, contextualized and checked against the original sources. Dramatic language must not overstate what the footage or evidence shows.

## 4. Mandatory scorecard

The reviewer records a 0–100 score for each dimension on the exact final artifact. Every dimension must score at least 80 and the unweighted mean must be at least 85:

1. Photorealism / visual credibility
2. Sharpness / image clarity
3. Composition / visual simplicity
4. Motion / continuity / technical execution
5. Story originality / factual integrity
6. Hook / pacing / retention engineering
7. Narration / voice performance
8. Audio mix / captions / accessibility

The reviewer must also record:
- final video file path and SHA-256;
- final thumbnail and all other image paths and SHA-256 values;
- reviewer identity and timezone-aware review timestamp;
- evidence reference for full video playback and image inspection;
- factual/editorial review reference;
- `artifactHashes.images`: SHA-256 for every final image in the approved related-artifact set, including the thumbnail and any scene stills;
- exact narration audio SHA-256 matched to an approved audio artifact;
- rights evidence references and exact asset hashes;
- defects found, corrections made and final disposition (APPROVED or REJECTED).

No missing score, placeholder, inferred value, self-certified automated score, stale review or hash mismatch may pass. A score cannot override a critical-gate failure. Re-review is mandatory after any change to video, thumbnail, captions, narration, metadata, source assets, edit or rights evidence.

## 5. Production workflow and rejection policy

1. **Brief and story:** define the audience promise, factual question, story arc, opening hook, scene purpose and payoff before asset selection.
2. **Asset selection:** choose only specific, high-quality, rights-cleared footage/images that visibly support the story. Reject generic filler at intake.
3. **Narration and captions:** approve the script, voice performance, factual claims and caption transcript before final render.
4. **Assembly:** use deliberate shot selection, purposeful pacing, coherent transitions, clean typography and restrained sound design.
5. **Technical validation:** run media probes, full-file decode, audio measurement, caption synchronization, aspect-ratio and export checks.
6. **Human quality review:** watch the complete final export; inspect every image and thumbnail at actual device sizes; score all eight dimensions; record exact hashes.
7. **Approval binding:** bind the quality review, rights evidence, metadata, thumbnail, captions and final media to the same approval package. Any change invalidates the affected approval.
8. **Release gate:** only approved packages scoring at least 85/100 may enter the eligible scheduling/upload queue. A failure remains held; no override for deadlines, cadence or volume.
9. **Post-publication learning:** record retention and audience-performance metrics against the content ID and creative version. Review rolling 10-video results and use them to improve hooks, pacing, visual variety and payoff without compromising accuracy.

## 6. Performance measurement

The portfolio target is at least 8 of every rolling 10 accepted videos scoring 85/100 or higher. In addition, record available platform retention measures (first-30-second retention, average view duration, average percentage viewed, key drop-off points, rewatch/loop signals and click-through rate) for each video. Do not fabricate or predict actual audience retention from a script or scorecard. A video is marked performance-verified only after platform analytics are available.

The 8-of-10 target is an outcome metric, not a release exception: all individually released videos must still score at least 85/100. If the rolling result falls below target, pause scale-up, diagnose the failures and revise the creative system before increasing volume.

## 7. Brand, rights and destination safeguards

- YouTube production destination is **SonicVhibez only**. Nature Frontiers must never be selected as a YouTube target.
- Branding and watermarks must match the destination brand; never place Nature Frontiers branding on SonicVhibez deliverables or vice versa.
- No source may be used without genuine documented rights for the intended commercial/platform use. AI generation does not remove the need to check tool terms, source/reference rights and commercial-use permissions.
- No synthetic, stock or generated asset may be described as genuine wildlife footage. Synthetic-media disclosures must be assessed and applied where required.
- Never publish merely because a schedule slot is due. Quality, rights, factual accuracy, human review, channel identity and publication authorization take precedence.
- Keep public/unattended publishing disabled unless a separately approved release policy explicitly authorizes it. A quality score is not publishing authorization.

## 8. Enforcement and evidence status

**Implemented and verified for the SonicVhibez private YouTube release path on exact commit `511eaf1f22da19bfb1dc00e8004241463cadcad2`:**

- **Renderer/export:** both Short and long-form renderers run the technical export/audio checks. When `productionQualityApprovalPath` is supplied, they invoke `validate-production-quality-approval.mjs` against the exact final video, metadata and approval record. Without that record they emit only a clearly labelled provisional render, explicitly state it is **not approved for release**, and perform no upload or publishing action.
- **Approval queue:** the dashboard's final human-review endpoint validates the scorecard and technical receipt before transitioning a job to `APPROVED_FOR_PRIVATE_UPLOAD`. The pre-render worker-dispatch queue is a production-work queue, not a publication queue; it requires an approved render plan because the final video scorecard cannot exist before rendering.
- **Private uploader:** the uploader revalidates the scorecard and technical receipt before any YouTube insert. The receipt must bind the exact video path and SHA-256, required format dimensions and duration, metadata hash, captions path/hash, thumbnail path/hash and dimensions, required technical checks, and a valid checked-at timestamp. Private-only visibility remains mandatory.
- **Regression evidence:** production-quality workflow run `44506913188` passed 23/23 focused tests with zero skips. Full automation workflow run `44506913257` passed 1,021 Node tests across 176 files with zero failures or skips, 84 Python tests, queue invariants, metadata safety checks, JavaScript syntax checks and Python compilation. `npm audit` found zero vulnerabilities.

**Scheduling boundary:** the current schedule policy reserves draft-preparation slots; it is not a YouTube publication scheduler. No public or unattended YouTube release scheduler is active. Therefore there is no separate publication-scheduler path to gate today. If one is introduced, it must accept only `APPROVED_FOR_PRIVATE_UPLOAD` jobs and revalidate the exact approval before release. The authenticated Cloudflare staging smoke was skipped in run `44506913257`, and Chromium browser E2E was not rerun on this commit; neither is claimed as passed.

**Remaining cross-brand scope:** Nature Frontiers Facebook/Instagram publishers do not yet use this same numeric video scorecard. Their separate editorial-approval and disabled-auto-publishing safeguards remain in force. Consequently, the SonicVhibez private YouTube path is enforced, but the broader cross-brand policy remains **PARTIALLY ENFORCED, NOT UNIVERSAL**. Do not claim universal enforcement or production readiness across every brand until the applicable Meta paths have their own fail-closed quality gates and exact-commit negative regression tests.

No one may report this policy as technically enforced based only on this document or a passing generic test suite. Evidence must identify the exact commit, changed files, tests, workflow run and negative cases proving that each gate blocks a failing asset.

The score is a pre-release human editorial assessment, not a guarantee of actual audience retention or a predicted view-through rate. Actual retention must be measured from platform analytics after publication. The stored SHA-256 is an integrity checksum that detects an unpaired scorecard edit; it is not a digital signature against a privileged actor who can rewrite both the scorecard and its checksum.
