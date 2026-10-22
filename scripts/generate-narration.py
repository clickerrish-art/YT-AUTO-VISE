#!/usr/bin/env python3
"""Generate natural-sounding US English narration MP3s from the approved narration master.
Uses the public Edge TTS service via edge-tts; no paid API key or upload permissions are used.
This script creates audio only. It does not fetch footage, render a video, or publish anything.
"""
from __future__ import annotations

import argparse
import asyncio
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "content" / "narration-master-short-001-and-002.md"
OUTPUT = ROOT / "media" / "narration"
VOICES = {
    "short-001": "en-US-GuyNeural",
    "short-002": "en-US-GuyNeural",
}

def extract_read(master: str, short_id: str) -> str:
    heading = "Short 001" if short_id == "short-001" else "Short 002"
    section = re.search(
        rf"^## {re.escape(heading)}[^\n]*\n(.*?)(?=^## |\Z)",
        master,
        flags=re.MULTILINE | re.DOTALL,
    )
    if not section:
        raise ValueError(f"Could not find narration section for {short_id}")
    read = re.search(r"\*\*Read:\*\*\s*(.*?)(?=\n\s*\*\*Performance notes:\*\*|\Z)",
                     section.group(1), flags=re.DOTALL)
    if not read:
        raise ValueError(f"Could not find the Read section for {short_id}")
    text = " ".join(line.strip() for line in read.group(1).splitlines() if line.strip())
    text = re.sub(r"\s+", " ", text).strip()
    if len(text.split()) < 90:
        raise ValueError(f"Narration unexpectedly short for {short_id}: {len(text.split())} words")
    return text

async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--short", choices=["short-001", "short-002", "both"], default="both")
    parser.add_argument("--voice", default="en-US-GuyNeural")
    parser.add_argument("--rate", default="-5%", help="Speech rate adjustment, e.g. -5%%")
    parser.add_argument("--extract-only", action="store_true", help="Print the extracted script without generating audio")
    args = parser.parse_args()

    if not MASTER.exists():
        raise SystemExit(f"Missing narration master: {MASTER}")
    master = MASTER.read_text(encoding="utf-8")
    selected = list(VOICES) if args.short == "both" else [args.short]
    output_dir = ROOT / "media" / "narration"
    if not args.extract_only:
        output_dir.mkdir(parents=True, exist_ok=True)

    for short_id in selected:
        text = extract_read(master, short_id)
        if args.extract_only:
            print(f"--- {short_id} ({len(text.split())} words) ---\n{text}\n")
            continue
        output = output_dir / f"{short_id}-{args.voice}.mp3"
        communicate = edge_tts.Communicate(text, args.voice, rate=args.rate)
        await communicate.save(str(output))
        print(f"GENERATED {output.relative_to(ROOT)} ({len(text.split())} words; voice={args.voice}; rate={args.rate})")
    return 0

if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
