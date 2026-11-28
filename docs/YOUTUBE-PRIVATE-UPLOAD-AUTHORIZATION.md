# Signed one-shot SonicVhibez YouTube upload authorization

## Why this exists

A plain JSON authorization with a typed operator name is not proof that the owner approved it. Live private uploads now require an Ed25519 signature over the exact authorization fields. The uploader verifies the signature with the configured public key before the YouTube insert.

The authorization remains limited to one exact job, video SHA-256, metadata SHA-256, approval SHA-256 and verified SonicVhibez channel ID. It must specify `visibility: "private"`, `publishingEnabled: false`, an operator identity and a timezone-aware timestamp no more than 24 hours old. Reuse of an authorization ID is rejected.

## Create the key pair once

Use OpenSSL on the owner's secure device:

```powershell
openssl genpkey -algorithm ED25519 -out "$env:USERPROFILE\youtube-upload-auth-private.pem"
openssl pkey -in "$env:USERPROFILE\youtube-upload-auth-private.pem" -pubout -out "$env:USERPROFILE\youtube-upload-auth-public.pem"
```

Keep `youtube-upload-auth-private.pem` offline or in an owner-controlled secure vault. Never commit it, upload it to GitHub, paste it into chat, or place it on a worker host. On POSIX systems restrict it with `chmod 600`.

The public key is not secret. Encode it as one line for the uploader environment:

```powershell
$pub = [Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\youtube-upload-auth-public.pem"))
```

Set the resulting value as `YOUTUBE_UPLOAD_AUTHORIZATION_PUBLIC_KEY_B64` in the secure local runtime environment. The uploader requires this value for live uploads. Read-only reconciliation does not require it.

## Create and sign an authorization

Only after all release prerequisites have passed, create a fresh JSON record with the exact values below. Replace every placeholder; do not use guessed hashes or channel IDs.

```json
{
  "authorizationId": "auth-unique-value",
  "decision": "AUTHORIZE_ONE_PRIVATE_UPLOAD",
  "jobId": "exact-job-id",
  "artifactSha256": "64-character-final-video-sha256",
  "metadataSha256": "64-character-final-metadata-sha256",
  "approvalSha256": "64-character-final-approval-sha256",
  "channelId": "exact-verified-SonicVhibez-channel-ID",
  "visibility": "private",
  "publishingEnabled": false,
  "operator": "owner identity",
  "authorizedAt": "2026-11-20T12:00:00.000Z"
}
```

Store the unsigned record under the repository root in an ignored private runtime directory, for example `run-logs/private-upload-authorization.json`. Then sign it using the private key:

```powershell
node scripts/sign-youtube-upload-authorization.mjs run-logs/private-upload-authorization.json "$env:USERPROFILE\youtube-upload-auth-private.pem"
```

The signer writes the signed record atomically and never prints or copies the private key. It refuses symlinked inputs, non-Ed25519 keys and re-signing an already signed record.

## Release safety

- Do not create or sign an authorization while any production readiness blocker remains.
- The signature is not a substitute for genuine rights evidence, full playback, factual review, the production quality scorecard, metadata approval or a current complete channel-history reconciliation.
- The authorization is not a general publishing permission. It authorizes one exact private upload only.
- If any bound file changes, create a new approval and a new authorization ID/signature.
- Never enable public or unattended publishing as part of this process.
