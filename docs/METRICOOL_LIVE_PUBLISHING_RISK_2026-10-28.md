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
