#!/usr/bin/env python3
"""Generate draft English narration MP3s from the two long-form scripts.
This script only creates local audio files. It never uploads or publishes.
"""
from pathlib import Path
import asyncio
import re
import sys

try:
    import edge_tts
except ImportError:
    print("ERROR: Install edge-tts first: python -m pip install edge-tts", file=sys.stderr)
    raise SystemExit(2)

SOURCE = Path("content/long-form-scripts.md")
OUT = Path("media/long-form-drafts")
VOICE = "en-US-GuyNeural"

def clean_script(text: str) -> str:
    text = re.sub(r"(?m)^#{1,6} .*\n", "", text)
    text = re.sub(r"(?m)^\*\*[^\n]*\*\*\s*$", "", text)
    text = re.sub(r"(?m)^\*\*\[.*?\]\*\*.*$", "", text)
    text = re.sub(r"(?m)^### Suggested (description|tags).*$", "", text)
    text = re.sub(r"(?m)^Promotional resource:.*$", "", text)
    text = re.sub(r"https://selar\.com/0u19v8u99l", "the approved creator resource linked in the video description", text)
    text = re.sub(r"\[[^\]]*\]", " ", text)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"(?m)^[-*]\s+", "", text)
    text = re.sub(r"(?m)^\s*---\s*$", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def extract_episodes(markdown: str):
    matches = list(re.finditer(r"(?m)^## Episode (\d+) — (.+)$", markdown))
    episodes = []
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown)
        section = markdown[match.end():end]
        narration = re.search(r"(?m)^### Narration script\s*$", section)
        if not narration:
            raise ValueError(f"Episode {match.group(1)} has no Narration script section")
        body = section[narration.end():]
        description = re.search(r"(?m)^### Suggested description\s*$", body)
        if description:
            body = body[:description.start()]
        cleaned = clean_script(body)
        if len(cleaned.split()) < 500:
            raise ValueError(f"Episode {match.group(1)} script seems unexpectedly short ({len(cleaned.split())} words)")
        episodes.append((match.group(1), match.group(2).strip(), cleaned))
    if len(episodes) != 2:
        raise ValueError(f"Expected 2 episodes; found {len(episodes)}")
    return episodes

async def main():
    if not SOURCE.exists():
        raise SystemExit(f"ERROR: Missing source file: {SOURCE}")
    OUT.mkdir(parents=True, exist_ok=True)
    episodes = extract_episodes(SOURCE.read_text(encoding="utf-8"))
    for number, title, text in episodes:
        stem = f"long-{int(number):03d}-narration-draft"
        target = OUT / f"{stem}.mp3"
        text_target = OUT / f"{stem}.txt"
        text_target.write_text(text + "\\n", encoding="utf-8")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(str(target))
        print(f"CREATED draft narration: {target} | {title} | {len(text.split())} words")
        print(f"CREATED narration text: {text_target}")
    print("DRAFT ONLY: listen for pronunciation, pacing, factual accuracy and voice quality. No upload or publishing occurred.")

if __name__ == "__main__":
    asyncio.run(main())
