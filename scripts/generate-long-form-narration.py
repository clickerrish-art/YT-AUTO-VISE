#!/usr/bin/env python3
"""Generate review-only MP3 narration drafts from content/long-form-scripts.md.

Uses edge-tts with an online Microsoft speech endpoint. This is a convenience
draft path, not a guaranteed-free or guaranteed-available service. No uploads
or publication are performed.
"""
from pathlib import Path
import argparse
import asyncio
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
import edge_tts

SOURCE = Path("content/long-form-scripts.md")
OUT = Path("artifacts/narration")
NONCOMMERCIAL_AUDITION_NOTICE = (
    "This Edge TTS voice is not owner-approved or commercially cleared. "
    "It may be generated only as an explicitly acknowledged internal audition and cannot be used commercially."
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_noncommercial_audition(acknowledged: bool) -> None:
    if acknowledged is not True:
        raise SystemExit(
            "BLOCKED: Edge TTS is not the approved Roderic voice and is not commercially cleared. "
            "Pass --allow-noncommercial-audition only for internal evaluation."
        )

def extract_episodes(markdown: str):
    pieces = re.split(r"(?m)^## Episode \d+ — ", markdown)
    episodes = []
    for index, piece in enumerate(pieces[1:], start=1):
        title = piece.splitlines()[0].strip()
        match = re.search(r"(?ms)^### Narration script\s*\n(.*?)(?=^### Suggested description\s*$)", piece)
        if not match:
            raise ValueError(f"Could not find narration script section for: {title}")
        body = match.group(1)
        # Remove production/visual cues, markdown emphasis, and end-card directions.
        body = re.sub(r"(?m)^\*\*\[.*?\]\*\*\s*$", " ", body)
        body = re.sub(r"\[[^\]]{0,180}\]", " ", body)
        body = re.sub(r"\*\*(.*?)\*\*", r"\1", body)
        body = re.sub(r"(?m)^#+\s*", "", body)
        body = re.sub(r"(?m)^\s*[-*]\s+", "", body)
        body = re.sub(r"\s+", " ", body).strip()
        if len(body.split()) < 500:
            raise ValueError(f"Script for {title} is unexpectedly short ({len(body.split())} words); refusing to create misleadingly incomplete audio.")
        slug = "long-001" if index == 1 else "long-002"
        episodes.append((slug, title, body))
    if len(episodes) != 2:
        raise ValueError(f"Expected exactly two episode scripts; found {len(episodes)}.")
    return episodes

async def main(voice: str, allow_noncommercial_audition: bool = False):
    require_noncommercial_audition(allow_noncommercial_audition)
    if not voice:
        raise SystemExit("BLOCKED: supply --voice explicitly for an internal audition.")
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source script: {SOURCE}")
    OUT.mkdir(parents=True, exist_ok=True)
    episodes = extract_episodes(SOURCE.read_text(encoding="utf-8"))
    generated = []
    for slug, title, text in episodes:
        destination = OUT / f"{slug}-{voice}.mp3"
        print(f"Generating INTERNAL AUDITION ONLY for {title} ({len(text.split())} words)")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(destination))
        generated.append({
            "id": slug,
            "title": title,
            "audioFile": destination.name,
            "audioSha256": sha256_file(destination),
            "wordCount": len(text.split()),
        })
        print(f"Created {destination}")
    manifest = {
        "schemaVersion": 1,
        "status": "INTERNAL_AUDITION_ONLY",
        "provider": "Edge TTS",
        "voice": voice,
        "voiceApprovalStatus": "NOT_OWNER_APPROVED",
        "licenseStatus": "NON_COMMERCIAL_INTERNAL_EVALUATION_ONLY",
        "commercialUseAllowed": False,
        "productionUseAllowed": False,
        "publishingEnabled": False,
        "humanReviewRequired": True,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "files": generated,
        "notice": NONCOMMERCIAL_AUDITION_NOTICE,
    }
    (OUT / "narration-audition-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    (OUT / "README.txt").write_text(
        "INTERNAL AUDITION ONLY — NOT APPROVED FOR COMMERCIAL OR PRODUCTION USE.\n"
        f"Voice: {voice} (Edge TTS; not owner-approved).\n"
        "No upload or publication occurred.\n",
        encoding="utf-8",
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate non-commercial Edge TTS internal audition drafts only.")
    parser.add_argument("--voice", default=None, help="Voice to audition; must be explicitly supplied.")
    parser.add_argument(
        "--allow-noncommercial-audition",
        action="store_true",
        help="Explicitly acknowledge that generated audio is non-commercial internal evaluation only.",
    )
    args = parser.parse_args()
    try:
        asyncio.run(main(args.voice, args.allow_noncommercial_audition))
    except Exception as exc:
        print(f"FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
