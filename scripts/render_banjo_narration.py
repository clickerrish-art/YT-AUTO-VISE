#!/usr/bin/env python3
"""Render the selected Banjo voice as a review-only narration WAV."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import struct
import sys
import wave
from pathlib import Path

from scripts.generate_piper_voice_audition import (
    CONFIG_NAME,
    MODEL_NAME,
    MODEL_SHA256,
    REPO,
    REVISION,
    download_pinned,
    extract_short_narration,
    sha256_file,
    sha256_text,
    validate_config,
)

VOICE_ID = "banjo"
SPEAKER_ID = 5
NARRATOR = "Timothy Ferguson"
OUTPUT_NAME = "banjo-short-001-narration-review.wav"
ATTRIBUTION = (
    "en_AU-librivox-medium, CC BY 4.0. Fine-tuned from "
    "en_GB-jenny_dioco-medium, derived from the Jenny TTS dataset "
    "by Jenny (Dioco). Training audio is public domain, recorded "
    "by LibriVox volunteers."
)
ATTRIBUTION_URL = (
    "https://huggingface.co/DataCraftsmanAustralia/"
    "piper-en_AU-librivox-medium/blob/3faad046064c56f7316ffd745d5a8b14035f35df/ATTRIBUTION.md"
)


def inspect_wav(path: Path) -> dict:
    with wave.open(str(path), "rb") as wav:
        channels = wav.getnchannels()
        sample_width = wav.getsampwidth()
        sample_rate = wav.getframerate()
        frame_count = wav.getnframes()
        frames = wav.readframes(frame_count)

    if channels != 1:
        raise ValueError("Banjo review narration must be mono")
    if sample_width != 2:
        raise ValueError("Banjo review narration must be 16-bit PCM")
    if sample_rate < 16000 or frame_count <= 0:
        raise ValueError("Banjo review narration has an invalid sample rate or no frames")
    if len(frames) != frame_count * sample_width:
        raise ValueError("Banjo review narration is truncated or malformed")

    samples = [item[0] for item in struct.iter_unpack("<h", frames)]
    peak = max(abs(value) for value in samples)
    clipped = sum(1 for value in samples if abs(value) >= 32760)
    rms = math.sqrt(sum(value * value for value in samples) / len(samples))
    duration = frame_count / sample_rate
    if duration < 20 or duration > 180:
        raise ValueError("Narration duration is outside the expected 20–180 second review range")
    if peak == 0 or rms < 8:
        raise ValueError("Narration is silent or effectively silent")
    if clipped:
        raise ValueError("Narration contains clipped PCM samples")

    threshold = 64
    leading = 0
    for value in samples:
        if abs(value) >= threshold:
            break
        leading += 1
    trailing = 0
    for value in reversed(samples):
        if abs(value) >= threshold:
            break
        trailing += 1

    return {
        "channels": channels,
        "sampleWidthBits": sample_width * 8,
        "sampleRateHz": sample_rate,
        "frameCount": frame_count,
        "durationSeconds": round(duration, 3),
        "peakDbfs": round(20 * math.log10(peak / 32768), 2),
        "rmsDbfs": round(20 * math.log10(rms / 32768), 2),
        "clippedSampleCount": clipped,
        "leadingSilenceSeconds": round(leading / sample_rate, 3),
        "trailingSilenceSeconds": round(trailing / sample_rate, 3),
    }



def repair_isolated_clips(path: Path, *, max_run: int = 4, peak_ceiling: int = 30000) -> dict:
    """Interpolate only isolated full-scale spikes, then add deterministic peak headroom."""
    with wave.open(str(path), "rb") as wav:
        params = wav.getparams()
        if params.nchannels != 1 or params.sampwidth != 2:
            raise ValueError("Clip repair requires mono 16-bit PCM")
        samples = [item[0] for item in struct.iter_unpack("<h", wav.readframes(params.nframes))]

    clipped_runs = []
    index = 0
    while index < len(samples):
        if abs(samples[index]) >= 32760:
            end = index
            while end < len(samples) and abs(samples[end]) >= 32760:
                end += 1
            run_length = end - index
            if run_length > max_run:
                raise ValueError("Clipping run is too long for safe isolated-peak interpolation")
            if index == 0 or end == len(samples):
                raise ValueError("Clipping at a file boundary cannot be safely interpolated")
            clipped_runs.append((index, end))
            index = end
        else:
            index += 1

    for start, end in clipped_runs:
        left, right = samples[start - 1], samples[end]
        span = end - start + 1
        for offset in range(end - start):
            fraction = (offset + 1) / span
            samples[start + offset] = round(left + (right - left) * fraction)

    repaired_peak = max(abs(value) for value in samples)
    if repaired_peak == 0:
        raise ValueError("Narration is silent after clip repair")
    gain = min(1.0, peak_ceiling / repaired_peak)
    if gain < 1.0:
        samples = [round(value * gain) for value in samples]

    temp_path = path.with_name(path.name + ".repair.tmp")
    try:
        with wave.open(str(temp_path), "wb") as wav:
            wav.setnchannels(params.nchannels)
            wav.setsampwidth(params.sampwidth)
            wav.setframerate(params.framerate)
            wav.writeframes(b"".join(struct.pack("<h", value) for value in samples))
        os.replace(temp_path, path)
    finally:
        if temp_path.exists():
            temp_path.unlink()

    return {
        "clippedSamplesDetected": sum(end - start for start, end in clipped_runs),
        "clippedSamplesInterpolated": sum(end - start for start, end in clipped_runs),
        "maxConsecutiveClipRun": max((end - start for start, end in clipped_runs), default=0),
        "peakCeilingDbfs": round(20 * math.log10(peak_ceiling / 32768), 2),
        "gainAppliedDb": round(20 * math.log10(gain), 3),
    }

def render(
    output_dir: Path,
    source_script_path: Path = Path("content/short-001-wildlife-video-storytelling.md"),
    downloader=download_pinned,
    voice_loader=None,
    synthesis_config_factory=None,
) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / MODEL_NAME
    config_path = output_dir / CONFIG_NAME

    downloader(MODEL_NAME, model_path)
    actual_model_sha = sha256_file(model_path)
    if actual_model_sha != MODEL_SHA256:
        raise ValueError("Pinned Australian Piper ONNX model SHA-256 mismatch")
    downloader(CONFIG_NAME, config_path)
    config = validate_config(config_path)

    if config.get("speaker_id_map", {}).get("timothy_ferguson") != SPEAKER_ID:
        raise ValueError("Banjo speaker mapping does not match the pinned model config")

    source_markdown = source_script_path.read_text(encoding="utf-8")
    narration = extract_short_narration(source_markdown)
    source_script_sha = sha256_text(source_markdown)
    narration_sha = sha256_text(narration)

    if voice_loader is None or synthesis_config_factory is None:
        from piper import PiperVoice, SynthesisConfig
        voice_loader = voice_loader or (lambda path: PiperVoice.load(str(path)))
        synthesis_config_factory = synthesis_config_factory or SynthesisConfig

    voice = voice_loader(model_path)
    wav_path = output_dir / OUTPUT_NAME
    with wave.open(str(wav_path), "wb") as wav_file:
        voice.synthesize_wav(
            narration,
            wav_file,
            synthesis_config_factory(speaker_id=SPEAKER_ID),
        )

    if not wav_path.is_file() or wav_path.stat().st_size < 1024:
        raise ValueError("Banjo narration WAV is missing or unexpectedly small")
    audio_repair = repair_isolated_clips(wav_path)
    audio_metrics = inspect_wav(wav_path)

    report = {
        "schemaVersion": 1,
        "status": "BANJO_NARRATION_RENDERED_HUMAN_REVIEW_REQUIRED",
        "voice": VOICE_ID,
        "speakerId": SPEAKER_ID,
        "narrator": NARRATOR,
        "provider": "piper_local",
        "engine": "OHF-Voice/piper1-gpl",
        "engineVersion": "1.8.0",
        "engineLicense": "GPL-3.0-or-later (software; not bundled in this audio artifact)",
        "modelRepository": REPO,
        "modelRevision": REVISION,
        "modelSha256": actual_model_sha,
        "modelLicense": "CC-BY-4.0",
        "modelLicenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "modelAttribution": ATTRIBUTION,
        "modelAttributionSource": ATTRIBUTION_URL,
        "upstreamAttributionNote": (
            "The model author requests Jenny (Dioco) credit for the base-checkpoint "
            "lineage where practical, including server-side audio generation. "
            "The author's interpretation is expressly not a legal conclusion."
        ),
        "commercialUseStatus": "MODEL_CARD_PERMITS_COMMERCIAL_USE_WITH_ATTRIBUTION; OWNER_REVIEW_REQUIRED",
        "sourceScriptPath": str(source_script_path),
        "sourceScriptSha256": source_script_sha,
        "sourceNarrationSha256": narration_sha,
        "sourceNarrationWordCount": len(narration.split()),
        "audioFile": wav_path.name,
        "audioSha256": sha256_file(wav_path),
        "audioBytes": wav_path.stat().st_size,
        "audioMetrics": audio_metrics,
        "audioRepair": audio_repair,
        "technicalValidation": "PASS_WAV_DECODE_PCM_MONO_16BIT_NON_SILENT_NO_CLIPPING_AFTER_RECORDED_ISOLATED_PEAK_REPAIR",
        "humanVoiceQualityReview": "PENDING",
        "commercialAttributionReview": "PENDING",
        "productionApproved": False,
        "finalNarration": False,
        "publishingEnabled": False,
        "releaseStatus": "HOLD",
    }
    report_path = output_dir / "banjo-narration-review.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    (output_dir / "ATTRIBUTION.txt").write_text(
        ATTRIBUTION + "\n\nModel source and full attribution: " + ATTRIBUTION_URL +
        "\nLicense: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/\n",
        encoding="utf-8",
    )
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="artifacts/banjo-narration-review")
    parser.add_argument("--source-script", default="content/short-001-wildlife-video-storytelling.md")
    args = parser.parse_args()
    try:
        report = render(Path(args.output), Path(args.source_script))
        print(
            "PASS: Banjo review narration rendered "
            f"({report['audioMetrics']['durationSeconds']} seconds, "
            f"{report['sourceNarrationWordCount']} words)."
        )
        print("HOLD: human voice-quality and attribution review remain mandatory; not production-approved.")
        return 0
    except Exception as exc:
        print("BLOCKED: " + str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
