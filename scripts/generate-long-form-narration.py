#!/usr/bin/env python3
"""Generate review-only MP3 narration drafts from content/long-form-scripts.md.

Uses edge-tts with an online Microsoft speech endpoint. This is a convenience
draft path, not a guaranteed-free or guaranteed-available service. No uploads
or publication are performed.
"""
from pathlib import Path
import asyncio
import re
import sys
import edge_tts

SOURCE = Path("content/long-form-scripts.md")
OUT = Path("artifacts/narration")
VOICE = "en-US-GuyNeural"

def extract_episodes(markdown: str):
    pieces = re.split(r"(?m)^## Episode \d+ — ", markdown)
    episodes = []
    for piece in pieces[1:]:
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
        slug = "long-001" if "Episode 1" in piece else "long-002"
        episodes.append((slug, title, body))
    if len(episodes) != 2:
        raise ValueError(f"Expected exactly two episode scripts; found {len(episodes)}.")
    return episodes

async def main():
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source script: {SOURCE}")
    OUT.mkdir(parents=True, exist_ok=True)
    episodes = extract_episodes(SOURCE.read_text(encoding="utf-8"))
    for slug, title, text in episodes:
        destination = OUT / f"{slug}-en-US-GuyNeural.mp3"
        print(f"Generating narration draft for {title} ({len(text.split())} words)")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(str(destination))
        print(f"Created {destination}")
    (OUT / "README.txt").write_text(
        "REVIEW-ONLY NARRATION DRAFTS\n"
        "Voice: en-US-GuyNeural (synthetic neural voice)\n"
        "Review pronunciation, factual accuracy, pacing, rights, and disclosure requirements.\n"
        "The files are not approved for upload. Audio generation uses an online speech service and may be subject to availability and provider terms.\n",
        encoding="utf-8",
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print(f"FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
