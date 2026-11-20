#!/usr/bin/env python3
"""Generate Edge TTS audio only for explicitly acknowledged, non-commercial internal auditions.

This is not the approved Roderic production voice. Free-plan Edge TTS output is not
commercially licensed and must never be used in monetized YouTube, advertising or
revenue-generating product promotion.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "content" / "narration-master-short-001-and-002.md"
OUTPUT = ROOT / "media" / "narration"
NONCOMMERCIAL_AUDITION_NOTICE = (
    "Edge TTS output is not the approved Roderic voice, is not owner-approved, "
    "is restricted to non-commercial internal evaluation and cannot be used commercially."
)


def require_noncommercial_audition(acknowledged: bool) -> bool:
    if acknowledged is not True:
        raise SystemExit(
            "BLOCKED: Edge TTS is not the approved Roderic voice and is not commercially cleared. "
            "Pass --allow-noncommercial-audition only for an internal audition."
        )
    return True


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extract_read(master: str, short_id: str) -> str:
    heading = "Short 001" if short_id == "short-001" else "Short 002"
    section = re.search(
        rf"^## {re.escape(heading)}[^\n]*\n(.*?)(?=^## |\Z)",
        master,
        flags=re.MULTILINE | re.DOTALL,
    )
    if not section:
        raise ValueError(f"Could not find narration section for {short_id}")
    read = re.search(
        r"\*\*Read:\*\*\s*(.*?)(?=\n\s*\*\*Performance notes:\*\*|\Z)",
        section.group(1),
        flags=re.DOTALL,
    )
    if not read:
        raise ValueError(f"Could not find the Read section for {short_id}")
    text = " ".join(line.strip() for line in read.group(1).splitlines() if line.strip())
    text = re.sub(r"\s+", " ", text).strip()
    if len(text.split()) < 90:
        raise ValueError(f"Narration unexpectedly short for {short_id}: {len(text.split())} words")
    return text


async def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate non-commercial Edge TTS internal audition audio only."
    )
    parser.add_argument("--short", choices=["short-001", "short-002", "both"], default="both")
    parser.add_argument("--voice", default=None, help="Voice to audition; must be explicitly supplied.")
    parser.add_argument("--rate", default="-5%", help="Speech rate adjustment, e.g. -5%%")
    parser.add_argument("--extract-only", action="store_true", help="Print extracted scripts without generating audio.")
    parser.add_argument(
        "--allow-noncommercial-audition",
        action="store_true",
        help="Explicitly acknowledge that Edge TTS output is internal evaluation only and cannot be used commercially.",
    )
    args = parser.parse_args()

    if not args.extract_only:
        require_noncommercial_audition(args.allow_noncommercial_audition)
        if not args.voice:
            raise SystemExit("BLOCKED: supply --voice explicitly for a non-commercial audition.")
    if not MASTER.exists():
        raise SystemExit(f"Missing narration master: {MASTER}")
    master = MASTER.read_text(encoding="utf-8")
    selected = ["short-001", "short-002"] if args.short == "both" else [args.short]
    if args.extract_only:
        for short_id in selected:
            text = extract_read(master, short_id)
            print(f"--- {short_id} ({len(text.split())} words) ---\n{text}\n")
        return 0

    OUTPUT.mkdir(parents=True, exist_ok=True)
    generated = []
    for short_id in selected:
        text = extract_read(master, short_id)
        output = OUTPUT / f"{short_id}-{args.voice}.mp3"
        communicate = edge_tts.Communicate(text, args.voice, rate=args.rate)
        await communicate.save(str(output))
        generated.append({
            "shortId": short_id,
            "voice": args.voice,
            "rate": args.rate,
            "wordCount": len(text.split()),
            "file": output.name,
            "sizeBytes": output.stat().st_size,
            "sha256": sha256_file(output),
        })
        print(f"GENERATED INTERNAL AUDITION {output.relative_to(ROOT)} ({len(text.split())} words; voice={args.voice}; rate={args.rate})")

    manifest = {
        "schemaVersion": 1,
        "status": "INTERNAL_AUDITION_ONLY",
        "provider": "Edge TTS",
        "voice": args.voice,
        "voiceApprovalStatus": "NOT_OWNER_APPROVED",
        "licenseStatus": "NON_COMMERCIAL_INTERNAL_EVALUATION_ONLY",
        "commercialUseAllowed": False,
        "productionUseAllowed": False,
        "publishingEnabled": False,
        "humanReviewRequired": True,
        "sourceScriptPath": str(MASTER.relative_to(ROOT)),
        "sourceScriptSha256": hashlib.sha256(master.encode("utf-8")).hexdigest(),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "files": generated,
        "notice": NONCOMMERCIAL_AUDITION_NOTICE,
    }
    manifest_path = OUTPUT / "narration-audition-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("INTERNAL AUDITION ONLY: no YouTube upload or platform publication occurred.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
