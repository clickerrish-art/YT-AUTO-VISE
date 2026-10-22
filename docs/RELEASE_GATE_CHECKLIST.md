# Release gate checklist — SonicVhibez Shorts

Use this checklist for each generated artifact. Keep every box unchecked until the evidence has actually been inspected. A green code-validation run is not evidence of media rights, factual accuracy, or YouTube channel ownership.

## Artifact identity
- [ ] Record source GitHub Actions run ID and artifact name.
- [ ] Confirm exactly one MP4 and matching metadata JSON are selected.
- [ ] Confirm metadata channel is exactly `SonicVhibez`.
- [ ] Confirm queue item ID and title match the generated artifact.
- [ ] Confirm the only product URL is `https://selar.com/0u19v8u99l`.

## Media and content
- [ ] Watch the entire rendered video and listen to the entire narration.
- [ ] Verify final duration is 50–60 seconds and audio is intelligible.
- [ ] Replace text-only placeholder visuals with appropriate footage before calling it a finished wildlife video.
- [ ] Record source and license/permission for every footage, photo, music and sound asset.
- [ ] Verify required attribution and keep proof of permission.
- [ ] Fact-check every factual claim; remove or correct unsupported claims.
- [ ] Align captions to actual speech; inspect spelling and timing.
- [ ] Verify thumbnail depicts the actual finished video and is not misleading.
- [ ] Ensure the promotional relationship/resource is clearly disclosed in the description.
- [ ] Confirm the content is not deceptively presented as an actual wildlife encounter if it is synthetic or illustrative.

## Channel and upload
- [ ] Confirm the YouTube OAuth account resolves to the intended SonicVhibez channel.
- [ ] Confirm configured channel ID matches the authenticated channel ID.
- [ ] Confirm reviewed metadata says `visibility: private`.
- [ ] Set `rightsConfirmed: true` only after all final media rights are evidenced.
- [ ] Set `complianceReviewed: true` only after the checks above are completed.
- [ ] Set `status: READY_FOR_PRIVATE_UPLOAD` only after every applicable item above passes.
- [ ] Run the private artifact handoff workflow and inspect its receipt.
- [ ] Verify the uploaded video's channel, title, and private visibility in YouTube Studio.

## Publication gate
Public posting is out of scope until the private upload has been verified and the channel owner separately authorizes public publishing. Never use the Nature Frontiers YouTube channel for these promotions.
