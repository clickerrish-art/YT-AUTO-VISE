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
