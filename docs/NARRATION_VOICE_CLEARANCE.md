> **SUPERSEDED — 2026-11-21. HISTORICAL RECORD ONLY.** Nothing below is a current candidate selection or production instruction. The owner selected **Roderic — Authoritative & Refined** (HeyGen voice ID `b5c5b28db1ea408abc7d851202983bdb`) as the exclusive narrator and rejected Banjo; the owner has not approved Norman or any other alternative. HeyGen Support has now explicitly denied zero-cost commercial-use permission for existing and future Roderic Free-plan outputs. Therefore no commercially eligible narrator is currently available under the combined Roderic-only and zero-cost constraints. Do not generate, audition or substitute another voice unless the owner explicitly changes that instruction. The existing Roderic Free-plan WAV remains internal-only and must not be used in public branded or commercial production. See `content/assets/long-form-001-narration-status.md` and `content/heygen-roderic-commercial-rights-determination-2026-11-21.json` for current controls.

---

# SonicVhibez narration voice — American male candidate review

## Historical candidate — superseded; not approved for production

**Norman — `en_US-norman-medium`** was an earlier free local Piper audition candidate. The owner later selected Roderic exclusively; Norman was never approved for production and must not be used.

The historical creative direction at the time of this audition was a mature, approximately 45-year-old American male wildlife storyteller: clean, clear, warm, confident, energetic and passionate, with natural conversational pacing. Perceived age is a creative direction, not a claim about the synthetic speaker.

## Exact review artifact

- Workflow: [American narration review run 44563576507](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44563576507)
- Artifact: `sonicvhibez-american-wildlife-encounter-voice-review` (ID `14550782584`)
- Artifact SHA-256: `f1cb09dc70baf54156435e55ddc0656010848e492ec5969c014f352f6ac45d93`
- Exact audio SHA-256: `f68b0b9b453948688f08f800dbf61ccd9188d1976308d94f27bb2cd58b543813`
- Source script: `content/short-001-wildlife-video-storytelling.md`
- Source script SHA-256: `20f807f0a1c6afd62ced948cfc8d8ed21478d479a76cc287eae62411bc185c53`
- Audio: 53.023 seconds, WAV PCM 16-bit, mono, 22,050 Hz
- Measured peak: −0.77 dBFS; RMS: −18.59 dBFS; clipped samples: 0
- Artifact retention: 30 days from 18 November 2026. The evidence JSON is retained in the repository; the WAV itself must be downloaded and stored separately if it is to be retained permanently.

The render passed the technical duration and clipping checks. These metrics do not establish subjective realism, expressive delivery, noise quality or owner satisfaction. It is generated TTS, not a recording of the owner's voice.

## Pinned model and licence review

- Model repository: `rhasspy/piper-voices`
- Revision: `8e602cc224300e0961258a0c885bccbfcc515a7f`
- Model file: `en/en_US/norman/medium/en_US-norman-medium.onnx`
- Model SHA-256: `b9739443232a80a59c7d18810dd856899bf16a7964725f5ab81ea49b1351cb71`
- Model card SHA-256: `60eaf4d10009d1bd4a1aa555d337dae00f60421d72fee415b9139a021e7cb5d0`
- Model card: [Pinned Norman model card](https://huggingface.co/rhasspy/piper-voices/blob/8e602cc224300e0961258a0c885bccbfcc515a7f/en/en_US/norman/medium/MODEL_CARD)
- Model card describes a single-speaker US-English male voice, medium quality, trained from public-domain LibriVox recordings.
- Engine: `OHF-Voice/piper1-gpl` 1.8.0, GPL-3.0-or-later.

The pinned model card identifies the voice as trained from scratch on public-domain LibriVox recordings. The Piper project's current commercial-use list explicitly includes `en_US-norman-medium` under “Voices trained from scratch” with dataset license “Public domain” (https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/COMMERCIAL_USE.md). This is the strongest available project-level evidence that the voice's training-data chain permits commercial use. Piper's licensing guide still cautions that it is not legal advice and leaves the derivative-work question to the user; retain the pinned MODEL_CARD and attribution record, and do not redistribute the ONNX model or Piper engine as part of the video. The engine is GPL-3.0-or-later; that software license is distinct from the generated audio and voice-model data. Owner listening/selection remains pending.

## Required owner decision

1. Listen to the complete 53.023-second WAV and approve or reject Norman for production.
2. Assess naturalness, warmth, clarity, energetic storytelling, pronunciation and suitability for wildlife encounters.
3. If Norman is rejected, keep the production voice unselected; do not silently substitute another voice.
4. If the owner prefers a personal voice, supply a clean recording of their own voice and explicitly approve its use for the intended voice workflow. No owner-recorded voice sample is currently in the repository.
5. Retain the exact approved narration WAV hash and licence/attribution decision before using it in any final Short or long-form render.

## Production gate

`humanVoiceQualityReview=PENDING_OWNER_LISTENING`; `commercialAttributionReview=PENDING_OWNER_REVIEW`; `productionApproved=false`; `finalNarration=false`; `publishingEnabled=false`.

Do not set a global production default or mark the voice as permanently selected until the owner approves the exact reviewed artifact and the commercial attribution review is complete.
