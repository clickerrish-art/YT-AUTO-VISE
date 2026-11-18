# SonicVhibez narration voice — Australian male candidate review

## Preferred candidate set

The first candidate model found that directly matches the requested Australian-English male profile is `DataCraftsmanAustralia/piper-en_AU-librivox-medium`, pinned at `3faad046064c56f7316ffd745d5a8b14035f35df`.

The model card identifies three male speakers:
- **Banjo / Timothy Ferguson (speaker 5):** 7.97 training hours. The model author records that Timothy's spoken outro identifies him as recording from the Gold Coast, Australia. Highest-priority audition.
- **Angus / Algy Pug (speaker 4):** 1.80 hours.
- **Flynn / Howard Skyman (speaker 6):** 0.58 hours.

Audition the original samples:
- [Banjo — Timothy Ferguson](https://huggingface.co/DataCraftsmanAustralia/piper-en_AU-librivox-medium/resolve/3faad046064c56f7316ffd745d5a8b14035f35df/samples/banjo.wav)
- [Angus — Algy Pug](https://huggingface.co/DataCraftsmanAustralia/piper-en_AU-librivox-medium/resolve/3faad046064c56f7316ffd745d5a8b14035f35df/samples/angus.wav)
- [Flynn — Howard Skyman](https://huggingface.co/DataCraftsmanAustralia/piper-en_AU-librivox-medium/resolve/3faad046064c56f7316ffd745d5a8b14035f35df/samples/flynn.wav)

The project workflow generates all three on the same wildlife test sentence and also synthesizes the complete current Short narration draft in each voice. It verifies the exact model hash and records the source-script hash, audio hashes, file sizes and durations in a downloadable Actions artifact. These full-script files remain auditions only, not final narration. They are auditions only, not approved final narration.

## Licence and attribution

- Piper engine: `piper-tts` 1.8.0, GPL-3.0-or-later.
- Voice model: CC BY 4.0. The model author states commercial use, redistribution and modification are permitted.
- Training recordings: public-domain LibriVox recordings; source dataset CC0-1.0.
- Base checkpoint: `en_GB-jenny_dioco-medium`, derived from the Jenny TTS dataset by Jenny (Dioco). The model author states commercial use is permitted but attribution to Jenny (Dioco) is required. The model author's interpretation of how that attribution applies to this multi-speaker fine-tune is explicitly described as good-faith interpretation, not a legal conclusion.

Required retained attribution:
> en_AU-librivox-medium, CC BY 4.0. Fine-tuned from en_GB-jenny_dioco-medium, derived from the Jenny TTS dataset by Jenny (Dioco). Training audio is public domain, recorded by LibriVox volunteers.

Retain the upstream `ATTRIBUTION.md` and exact model card with the production package. The model is not automatically cleared just because the model card says commercial use is permitted; review the base-checkpoint attribution condition and exact model provenance before production release.

## Quality limitation

The model author describes the accent as period-inflected and the delivery as formal literary reading rather than conversational. Source recordings have variable home-recording quality, level drift and band-limiting; modern technical terms, numerals, abbreviations and URLs may be weak. It may therefore fail the user's "realistic" and conversational narration requirement. The owner must listen to the same test text from all three male candidates. Reject all if none meet the quality bar.

## Production gate

Do not change the main narration generator to use a selected speaker until:
1. the audition artifact is generated and verified;
2. the owner chooses one speaker or rejects all;
3. the final attribution treatment is reviewed and retained;
4. an end-to-end sample is checked for pronunciation, pace, audio quality and factual/script fidelity;
5. final captions are aligned against actual generated audio.

No voice selection or production approval is implied by this candidate registry.
