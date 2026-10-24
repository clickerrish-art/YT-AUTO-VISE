# Nature Frontiers Facebook autonomous runner setup

This guide configures the dedicated Facebook publisher. It does not enable public YouTube publishing and does not authorize the Nature Frontiers YouTube channel.

## 1. Runner isolation

1. Create a dedicated self-hosted Linux runner for this repository only, with labels self-hosted, linux, and facebook-publisher.
2. Do not register it at organization scope or share it with unrelated repositories.
3. Do not execute untrusted pull-request code on this runner. The autonomous workflow is scheduled on main only, has contents: read, and must remain protected by repository review and branch controls.
4. Run the runner service under a dedicated unprivileged OS account. Restrict filesystem access to the checkout and the dedicated state directory. Do not grant access to browser profiles, unrelated credentials, home-directory secrets, or other projects.
5. Keep runner software and OS patched. Restrict inbound network access; outbound access should be limited where practical to GitHub, the Meta Graph API, approved evidence sources, and required package registries.
6. Ensure the runner service starts after reboot and that its durable state volume is mounted before the job starts.

## 2. Durable state

Create a persistent directory outside the repository checkout, for example /var/lib/sonicvhibez/facebook-state. Set repository Actions variable FACEBOOK_STATE_DIR to that absolute path. The runner account must have exclusive read/write access.

Do not place state inside the ephemeral checkout or rely on GitHub workflow artifacts as the editorial database. Back up the directory using the repository's approved backup procedure; restrict backup access and retention. Do not restore a backup over a newer ledger without reconciling remote Meta state first.

## 3. Secure Meta configuration

Configure these as repository Actions secrets, not repository variables or files:

- META_USER_ACCESS_TOKEN
- META_PAGE_ACCESS_TOKEN

Configure these repository Actions variables:

- FACEBOOK_STATE_DIR — absolute durable directory on the runner.
- FACEBOOK_PUBLISH_ENABLED — keep NO until the acceptance gates below are passed. The publisher requires the exact value YES in addition to the JSON enablement flags.

Set NATURE_FRONTIERS_FACEBOOK_PAGE_ID in the secure runtime environment to the owner-verified numeric Page ID. Configure the exact same ID in config/facebook-publishing.json. Never put tokens in .env.example, workflow logs, command-line arguments, artifacts or dashboard responses.

The runtime performs live checks for pages_show_list, pages_read_engagement, pages_manage_posts, the exact managed Page, the Page's CREATE_CONTENT/MANAGE task, Page name and the matching Page access token before a new mutation. Use the currently configured Graph API version only after confirming it remains supported by Meta and the app has the required access level.

## 4. Initial acceptance before enabling

Do not enable live publishing until all of the following are complete:

- The exact Nature Frontiers Page identity and permission checks have succeeded using the secure runtime.
- A backup and restore drill has passed on an isolated copy of the state directory.
- The exact candidate SHA has passing full test and validation workflows.
- The production runner is isolated from untrusted pull requests and has durable storage.
- The policy engine has been tested against real evidence records and real licensed media, with source and rights evidence reviewed for authenticity.
- The candidate queue contains only genuine, fully evidenced content. An empty queue is an acceptable safe result.
- Uncertain-publish reconciliation has been tested with mocked timeouts, interrupted requests, delayed visibility, no-match outcomes and multiple matching candidates.
- A controlled integration test has been separately authorized and completed. Verify the remote receipt and persist it before any routine schedule is enabled.

The initial setup is the only routine owner configuration. The daily workflow itself does not require per-post approval. Content that fails a required check is skipped automatically and never waits for an override.

## 5. Enablement and emergency stop

The publisher requires all of these controls to permit a mutation:

- config/facebook-publishing.json: publishingEnabled: true
- config/facebook-publishing.json: dryRun: false
- config/facebook-publishing.json: emergencyStop: false
- repository Actions variable FACEBOOK_PUBLISH_ENABLED=YES
- valid secure tokens, matching Page ID, live permissions and a durable state directory
- an eligible payload and no unresolved attempt for that slot

Keep the emergency stop separate from the publishing enablement. To stop future posts immediately, set FACEBOOK_PUBLISH_ENABLED=NO and/or restore emergencyStop: true. Do not delete history or attempt records when disabling. A running request already sent to Meta may still complete; reconcile it rather than retrying.

## 6. Daily behavior and recovery

The GitHub Actions cron 30 5 * * * is 07:30 in Africa/Johannesburg; it prepares the 08:00 local scheduled post. A run outside the configured preparation window skips the slot. It does not backdate or catch up. The publisher enforces one post per local day and a minimum 20-hour interval.

Before new work, the publisher checks any persisted PUBLISHING or UNCERTAIN attempts. It queries the official Page scheduled_posts and feed edges with bounded pagination, matching the exact caption and scheduled/attempt time. A single verified match is recorded as a receipt. No match is not treated as proof of non-publication; ambiguous or unresolved results remain blocked with no automatic retry.

Monitor the authenticated dashboard endpoint /api/facebook/autonomous-status for readiness blockers, queue size, last run, intake summary, receipts and uncertain attempts. The dashboard deliberately does not expose credentials and does not claim the self-hosted runner is healthy merely because configuration exists.

## 7. Content intake

content/facebook-intake-candidates.json is an evidence-bearing candidate input, not a place for placeholders. The intake command evaluates candidates, queues only eligible records, writes a redacted summary to the durable state directory, and records blockers without asking for a human override. The publisher independently re-evaluates the final payload immediately before mutation.

The intake does not invent claims, sources, media, licences or attribution. No eligible candidates means no post. The current checked-in candidate list is intentionally empty until genuine research and rights-cleared media records are supplied.

## 8. Shutdown and rollback

For an emergency, set the environment enablement variable to NO and the JSON emergency stop to true; then disable the scheduled workflow if needed. Preserve the attempt ledger and history. If the runner or state volume is compromised, revoke/rotate Meta tokens in Meta's official security controls, disable publishing, preserve redacted diagnostics, and do not resume until Page identity, permissions, state integrity and outstanding remote operations are revalidated.
