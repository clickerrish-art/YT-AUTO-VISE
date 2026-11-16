# Metricool live publishing-risk snapshot — 2026-10-28

## Scope and method

This is a read-only snapshot retrieved from the connected Metricool account on 2026-10-28. It records the state returned by the brand and scheduled-post read APIs. It is not a full audit log and does not prove future platform behavior beyond the returned configuration. No Metricool records were changed as part of this inspection.

## Observed brand

- Brand: Nature Frontiers
- Metricool brand ID: 7545638
- Configured timezone: Africa/Johannesburg
- Facebook Page identifier returned by Metricool: 1003575786161492
- Instagram identity returned by Metricool: naturefrontieers

The brand response also included a YouTube channel identifier. This is a cross-destination risk signal: Nature Frontiers must not be used as a YouTube target in the SonicVhibez workflow. Do not use this brand record as proof of the authorized SonicVhibez channel identity.

## Observed scheduled records

The scheduled-post query covered 2026-10-28 through 2026-11-28 (expanded range enabled). It returned eight future records. All eight had `autoPublish: true` and `draft: false`.

| Post ID | Scheduled local time | Returned provider state |
|---|---|---|
| 406357296 | 2026-10-31 10:00 | Facebook PENDING |
| 406357335 | 2026-11-04 10:00 | Facebook PENDING |
| 406357364 | 2026-11-07 10:00 | Facebook PENDING |
| 406357388 | 2026-11-11 10:00 | Facebook PENDING |
| 406357414 | 2026-11-14 10:00 | Facebook PENDING |
| 406357443 | 2026-11-18 10:00 | Facebook PENDING |
| 406357483 | 2026-11-21 10:00 | Facebook PENDING |
| 406357554 | 2026-11-25 10:00 | Facebook PENDING; Instagram PENDING |

The query also returned post 406357273, scheduled for 2026-10-27 10:00, with Facebook status PUBLISHED. This confirms the returned published state for that record only; it does not independently establish the complete publication history.

The future records include promotions for online-business products as well as wildlife creator content. Their brand/content suitability and exact destinations require owner review. The wildlife creator campaign record used the approved URL `https://selar.com/0u19v8u99l`; do not substitute this URL for other products.

## Risk and safe next action

**Risk: high.** Future records are not drafts and have automatic publication enabled. Repository-local `dryRun` or disabled publishing flags cannot be assumed to affect already scheduled Metricool records.

No records were paused, cancelled, edited, deleted, rescheduled or republished during this read-only check. Before changing any live record, obtain explicit owner authorization identifying the intended records and permitted action. Then perform only the authorized change and read the records back to verify the actual remote state. Do not blindly retry uncertain mutations.

## Evidence limitations

- This snapshot contains the values returned by the connected Metricool integration, not exported raw HTTP responses or cryptographically signed provider receipts.
- It does not prove the current state after the snapshot time.
- It does not prove that the Instagram account has correct permissions for every record.
- It does not establish which system originally created each post or whether other scheduling paths exist.
- No external post creation, publication, cancellation, pause or configuration mutation was performed.
- External integration acceptance remains blocked until owner-authorized intervention (if required), identity/permission verification, and remote read-back evidence are complete.

## Acceptance status

- Metricool read-only inspection: **PASS** for the returned brand and scheduled-record snapshot.
- Risk of automatic publication: **CONFIRMED** for the eight returned future records.
- External intervention and post-change verification: **BLOCKED_EXTERNAL** pending explicit owner authorization.
- Repository draft-only behavior: separate acceptance item; this snapshot does not prove or disprove every repository execution path.

---

## Follow-up verification — 2026-11-16 (read-only)

A fresh read-only inspection was performed through the connected Metricool account. No Metricool records were changed.

### Current connected brand

The current brand list returns one Nature Frontiers brand:

- Brand label: **Nature Frontiers SA**
- Current Metricool brand ID: `8094526`
- Timezone: `Africa/Johannesburg`
- Facebook Page ID returned by Metricool: `1431329126735709`
- Instagram username returned by Metricool: `naturefrontieers2026`

The returned Facebook Page ID matches `config/facebook-publishing.json` and `config/instagram-publishing.json`. This is a Metricool metadata match, **not** a fresh Meta Graph API identity/permission verification. The Instagram username is not the required numeric Instagram Business Account ID; that ID remains intentionally unset.

The brand metadata also includes a YouTube connection. It is a Nature Frontiers destination and must never be used as the SonicVhibez YouTube target.

### Scheduled-post reconciliation result

- Current brand `8094526`: scheduled-post query for 2026-10-28 through 2026-11-28 (expanded range) returned an empty data set.
- Current brand `8094526`: upcoming query for 2026-11-16 through 2026-12-16 returned an empty data set.
- Previous snapshot brand `7545638`: it is no longer present in the current connected brand list. Both scheduled-post queries against that old brand ID returned **HTTP 403 — Access denied to blog: 7545638**.

**Important unresolved risk:** the eight historical future records in the 2026-10-28 snapshot were `draft: false` and `autoPublish: true`. The current connection cannot access their former brand, so the empty schedule on brand `8094526` does not prove that the old records were canceled, transferred, or otherwise resolved. Their final state remains **UNKNOWN / BLOCKED_EXTERNAL** until the owner restores access to the old Metricool brand or independently verifies those exact records in the Metricool UI.

### Meta identity check

The exact-candidate Meta verification workflow still receives HTTP 401, OAuth error 190, subcode 463 (expired access-token session) when requesting `/me`. The Page ID metadata match above does not bypass this failure. Renew Meta authorization, then rerun the read-only identity and permissions check before enabling any publishing path.

### Required safe posture

- Keep Meta/Instagram publishing disabled, dry-run enabled and emergency stop active.
- Do not infer the status of the eight historical records from the new brand's empty schedule.
- Do not guess an Instagram Business Account ID from the returned username.
- Do not use the Nature Frontiers YouTube connection as SonicVhibez.
- Do not update, pause, cancel, reschedule or publish any Metricool record without explicit owner authorization for the exact record and action.

### Current brand publication and analytics snapshot — 2026-11-16

Read-only Metricool post-level queries for current brand `8094526` returned:

- **Facebook feed:** 3 feed posts dated 2026-11-13. Two are photo posts with empty caption text; one is a welcome post for Nature Frontiers SA.
- **Facebook Reels:** 2 Reels dated 2026-11-13 and 2026-11-14, both about “Mongoose vs King Cobra fight.” The returned post-level metrics are sparse and some values are null/zero; they are not treated as a reliable performance baseline.
- **Instagram feed and Reels:** no post rows returned for 2026-11-12 through 2026-11-16.
- **Future schedule:** no scheduled posts returned for the current brand through 2026-12-16.

This shows some recent Facebook activity but no confirmed Instagram publishing activity or upcoming schedule in the current Metricool brand. It does not prove the status of records on inaccessible old brand `7545638`, and it does not establish that the Facebook content passed this repository's rights/editorial approval process.

No analytics ingestion or optimization loop is currently accepted in the repository. Metricool data remains a read-only external snapshot; sparse/null/zero metrics must not be interpreted as verified account-wide performance or used to fabricate a content-performance baseline.


### Fresh Metricool analytics cross-check — 2026-11-16 (read-only)

A second read-only analytics query was run for 2026-10-01 through 2026-11-16 (Africa/Johannesburg). The provider returned three Facebook feed rows and zero Instagram Reel rows.

| Facebook post ID | Returned type | Post date | Impressions | Reach | Comments | Reactions | Shares |
|---|---|---|---:|---:|---:|---:|---:|
| 1431329126735709_927095510487741 | photo | 2026-11-13 | 6 | 1 | 0 | 0 | 0 |
| 1431329126735709_122095771209554605 | post | 2026-11-13 | 0 | 0 | 0 | 0 | 0 |
| 1431329126735709_122095749285554605 | photo | 2026-11-13 | 4 | 1 | 0 | 0 | 0 |

The welcome post's engagement field was null; the other two returned 0.0. These small/sparse values are recorded as returned and must not be extrapolated into an account-wide performance claim. The zero Instagram Reel rows are consistent with the separate zero-activity best-time response below, but neither is proof that the Instagram account has no activity outside the connected brand or queried window.

Metricool's Facebook best-time endpoint for 2026-11-16 through 2026-11-22 returned its highest hourly values on Wednesday at 12:00 (15,834), Monday at 10:00 (15,247), and Tuesday at 10:00 (14,999). These are provider-relative values, not guaranteed reach or a sufficient basis to override editorial review, rights checks, or the owner's approved publishing cadence. The corresponding Instagram best-time response returned zero for every hour on every day; do not infer a useful Instagram posting time from it.

The Metricool metrics catalogue was also checked. Useful currently listed fields include Facebook impressions/reach/comments/reactions/shares and Instagram Reel reach/interactions/saves/shares/views/average watch time/retention/skip rate. The catalogue marks Instagram Reel videoViews and videoViewsTotal as deprecated; any future analytics integration must use the non-deprecated fields (for example, views and interactions) instead.

**Acceptance update:** Metricool brand and scheduled-post read checks remain PASS for the accessible brand; current analytics retrieval is PASS for the returned Facebook/Instagram data; the Instagram activity baseline remains NOT_ESTABLISHED; historical old-brand scheduled-record reconciliation remains BLOCKED_EXTERNAL. No Metricool records, account settings, publication dates, or delivery modes were changed.


### Owner-confirmed Nature Frontiers Page identity — 2026-11-16 (read-only)

The owner explicitly confirmed that the official Nature Frontiers Facebook Page ID is **1431329126735709**, and authorized identity verification only. No publishing or account changes are authorized by that confirmation.

Read-only cross-checks:

- Metricool brand `8094526` identifies itself as **Nature Frontiers SA** and returns Facebook Page ID `1431329126735709`.
- Repository `config/facebook-publishing.json` at implementation commit `31cf7e81dcc4efa36515ba2965a02c44cc13d281` has `destinationPageId` set to `1431329126735709`, `publishingEnabled=false`, `dryRun=true`, and `emergencyStop=true`.
- The connected vidIQ account inventory does **not** contain that Page ID. It instead exposes a different Page named **Nature Frontiers**, ID `1090224080838313`, with an active OAuth connection and publishing capability. Treat that as a different/unverified destination; do not use it for Nature Frontiers publishing or change it automatically.
- The connected vidIQ account inventory contains no Instagram account.
- The Meta read-only GitHub Actions identity check for the implementation branch failed before Page enumeration: `GET /me` returned HTTP 401, OAuth error 190, subcode 463 (expired user access-token session). Therefore the current Meta user identity, managed-Page list, Page task permissions, and direct Page-name match remain **NOT VERIFIED**.
- Metricool brand `8094526` also reports YouTube channel ID `UCSlkuPfHH78oGC1o418HV4w`, which is the SonicVhibez channel. This is a cross-brand association risk: do not use the Nature Frontiers Metricool brand for YouTube publishing or change its connection without a separately authorized, verified migration.

**Identity conclusion:** owner-designated ID, Metricool ID, and repository destination ID agree. This is a consistent configuration/owner-confirmation match, **not** a successful live Meta OAuth identity verification. Final Meta identity verification remains **BLOCKED_EXTERNAL** until a valid Meta user access token is restored and the read-only `/me`, `/me/accounts`, and `/{page-id}?fields=id,name` checks succeed. Meta's Page API documents these read requirements and token/permission constraints; see the official [Page Graph API reference](https://developers.facebook.com/docs/graph-api/reference/page/) and [User Accounts edge](https://developers.facebook.com/docs/graph-api/reference/user/accounts/).

**Safety:** no posts were read or changed through a write endpoint; no post was created, scheduled, edited, paused, canceled, or published; no account connection, credential, permission, destination, or publishing flag was modified. The Facebook/Instagram publishing posture remains disabled, dry-run, and emergency-stopped.
