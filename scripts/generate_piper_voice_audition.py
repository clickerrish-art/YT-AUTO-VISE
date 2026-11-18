#!/usr/bin/env python3
"""Create review-only Australian male Piper voice auditions; never final narration."""
from __future__ import annotations
import argparse, hashlib, json, sys, urllib.request, wave
from pathlib import Path

REPO = "DataCraftsmanAustralia/piper-en_AU-librivox-medium"
REVISION = "3faad046064c56f7316ffd745d5a8b14035f35df"
MODEL_NAME = "en_AU-librivox-medium.onnx"
CONFIG_NAME = MODEL_NAME + ".json"
MODEL_SHA256 = "f34849bce64d803d0fe90087766d5d6f2a8215a12edad43e486d77072df7dd41"
TEST_TEXT = ("At first, the river looks still. Then a ripple moves across the water. "
             "A saltwater crocodile rises near the bank, pauses, and slips beneath the surface. "
             "Keep your distance and let the animal behave naturally.")
CANDIDATES = (
    {"voice": "banjo", "speaker_id": 5, "narrator": "Timothy Ferguson", "hours": 7.97},
    {"voice": "angus", "speaker_id": 4, "narrator": "Algy Pug", "hours": 1.80},
    {"voice": "flynn", "speaker_id": 6, "narrator": "Howard Skyman", "hours": 0.58},
)

def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def download_pinned(filename: str, destination: Path, opener=urllib.request.urlopen) -> None:
    url = f"https://huggingface.co/{REPO}/resolve/{REVISION}/{filename}"
    request = urllib.request.Request(url, headers={"User-Agent": "SonicVhibez-Piper-Audition/1.0"})
    with opener(request, timeout=90) as response, destination.open("wb") as output:
        total = 0
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > 120 * 1024 * 1024:
                raise ValueError("Voice model/config exceeded 120 MiB safety limit")
            output.write(chunk)
    if destination.stat().st_size == 0:
        raise ValueError(f"Downloaded file is empty: {filename}")

def validate_config(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    speaker_map = data.get("speaker_id_map", {})
    expected = {"timothy_ferguson": 5, "algy_pug": 4, "howard_skyman": 6}
    if data.get("num_speakers") != 10:
        raise ValueError("Unexpected Piper model speaker count")
    for name, speaker_id in expected.items():
        if speaker_map.get(name) != speaker_id:
            raise ValueError(f"Unexpected speaker mapping for {name}")
    return data

def generate(output_dir: Path, downloader=download_pinned) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path, config_path = output_dir / MODEL_NAME, output_dir / CONFIG_NAME
    downloader(MODEL_NAME, model_path)
    actual_sha = sha256_file(model_path)
    if actual_sha != MODEL_SHA256:
        raise ValueError("Pinned Australian Piper ONNX model SHA-256 mismatch")
    downloader(CONFIG_NAME, config_path)
    config = validate_config(config_path)

    from piper import PiperVoice, SynthesisConfig
    voice = PiperVoice.load(str(model_path))
    results = []
    for item in CANDIDATES:
        destination = output_dir / f"{item['voice']}-australian-male-audition.wav"
        with wave.open(str(destination), "wb") as wav_file:
            voice.synthesize_wav(TEST_TEXT, wav_file, SynthesisConfig(speaker_id=item["speaker_id"]))
        if not destination.is_file() or destination.stat().st_size < 1024:
            raise ValueError(f"Audition output missing or unexpectedly small: {destination.name}")
        results.append({
            **item,
            "file": destination.name,
            "sha256": sha256_file(destination),
            "bytes": destination.stat().st_size,
            "sampleRate": config.get("audio", {}).get("sample_rate"),
            "ownerAuditionStatus": "PENDING",
            "productionApproved": False
        })
    report = {
        "schemaVersion": 1,
        "status": "VOICE_AUDITION_ONLY_NOT_FINAL_NARRATION",
        "provider": "piper_local",
        "modelRepository": REPO,
        "modelRevision": REVISION,
        "modelSha256": actual_sha,
        "modelLicense": "CC-BY-4.0",
        "attributionRequired": "en_AU-librivox-medium, CC BY 4.0. Fine-tuned from en_GB-jenny_dioco-medium, derived from the Jenny TTS dataset by Jenny (Dioco). Training audio is public domain, recorded by LibriVox volunteers.",
        "engine": "piper-tts",
        "testText": TEST_TEXT,
        "voices": results,
        "rightsStatus": "MODEL_CARD_STATES_COMMERCIAL_USE_PERMITTED_ATTRIBUTION_REQUIRED_OWNER_REVIEW_PENDING",
        "ownerSelectionRequired": True,
        "finalNarration": False,
        "publishingEnabled": False
    }
    (output_dir / "audition-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="artifacts/piper-audition")
    args = parser.parse_args()
    try:
        report = generate(Path(args.output))
        for voice in report["voices"]:
            print(f"PASS audition generated: {voice['voice']} ({voice['speaker_id']}) {voice['bytes']} bytes")
        print("HOLD: owner audition and attribution review are still required; these are not production narration.")
        return 0
    except Exception as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
