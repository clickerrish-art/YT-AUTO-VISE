# SonicVhibez no-cost production handoff

This guide is designed to avoid paid subscriptions, generated-media credits, and public uploads until a human approves the final export.

## Free tools to use

- **Editing/rendering:** FFmpeg (free, open-source). The repository's long-form renderer requires FFmpeg with libass and FFprobe.
- **Captions:** Create an SRT file from the final narration, then run the repository caption validator. Always compare captions to the final audio.
- **Narration:** Prefer a narration file recorded by the channel owner or a locally available operating-system text-to-speech voice. Availability and commercial-use terms vary by OS/voice; check them before monetized use. Do not call metered cloud speech generation unless remaining quota and cost are known and the user has approved.
- **Footage:** Prefer original footage or verified public-domain/Creative Commons media. Search results and a free download do not themselves grant commercial reuse rights.
- **Thumbnail:** Make a truthful frame-based thumbnail from cleared footage using a free local editor; no fabricated animal encounters or misleading composites.

## Candidate footage libraries (license must be checked per asset)

- Pexels license: https://www.pexels.com/legal-pages/license/
- Pixabay license summary: https://pixabay.com/service/license-summary/
- Wikimedia Commons licensing help: https://commons.wikimedia.org/wiki/Commons:Licensing
- U.S. National Park Service media usage: https://www.nps.gov/aboutus/disclaimer.htm
- U.S. Fish & Wildlife Service ethics guidance: https://www.fws.gov/story/ethics-wildlife-photography

A library-wide license page does not prove that an individual upload is correctly licensed or that all restrictions are met. Save the asset-specific page and creator attribution requirements. Avoid clips with unclear authorship, editorial-only restrictions, identifiable people without suitable releases, or music/audio with separate rights.

## Asset ledger template

For every visual/audio asset, record:
- Exact local filename
- Original asset-page URL (not only the direct download URL)
- Creator/rights holder
- License name and URL as displayed on the asset page
- Download date
- Required attribution text
- Whether commercial use and modification are permitted
- Whether any third-party audio, logos, people, or restrictions are present
- Reviewer name/date and decision

## Local production commands

Run from the repository root after the required real assets are present:

```sh
npm test
node scripts/check-captions.mjs content/long-form-captions.srt
npm run render:long
```

The manifest path expected by the renderer is `content/long-form-render-manifest.json`. Start from `content/long-form-render-manifest.example.json`, then use real local file paths and genuine rights evidence. Do not set `rightsConfirmed` or `complianceReviewed` to true until a human has actually checked the assets and finished edit. The example manifest is not a license record.

## Current limitation

The repository automation can validate files and render when assets are present. It cannot conjure a verified source file, establish ownership, guarantee a cloud TTS quota, or safely publish without channel credentials and approval. If the machine running the repository does not have FFmpeg and the assets locally, a repository CI job cannot produce the finished wildlife video from these notes alone.
