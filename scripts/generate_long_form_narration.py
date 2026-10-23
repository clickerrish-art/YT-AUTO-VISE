#!/usr/bin/env python3
"""Generate draft English narration MP3s, clean text, and word-timed draft SRT captions.
This script only creates local draft files. It never uploads or publishes.
"""
from pathlib import Path
import asyncio
import re
import sys

try:
    from mutagen.mp3 import MP3
except ImportError:
    MP3 = None

try:
    import edge_tts
except ImportError:
    print("ERROR: Install edge-tts first: python -m pip install edge-tts", file=sys.stderr)
    raise SystemExit(2)

SOURCE = Path("content/long-form-scripts.md")
OUT = Path("media/long-form-drafts")
VOICE = "en-US-GuyNeural"
CAPTION_MAX_WORDS = 7
CAPTION_MAX_CHARS = 42

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

def srt_time(seconds: float) -> str:
    millis = max(0, int(round(seconds * 1000)))
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, ms = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{ms:03}"

def captions_from_boundaries(boundaries):
    """Group actual TTS word-boundary events into readable draft caption cues."""
    cues, group = [], []
    for item in boundaries:
        word = str(item.get("text", "")).strip()
        if not word:
            continue
        start = max(0.0, float(item.get("offset", 0)) / 10_000_000)
        end = max(start + 0.15, (float(item.get("offset", 0)) + float(item.get("duration", 0))) / 10_000_000)
        if group and (len(group) >= CAPTION_MAX_WORDS or len(" ".join(x["text"] for x in group)) + len(word) + 1 > CAPTION_MAX_CHARS):
            cues.append(group)
            group = []
        group.append({"text": word, "start": start, "end": end})
        if word.endswith((".", "?", "!", ":", ";")):
            cues.append(group)
            group = []
    if group:
        cues.append(group)
    lines = []
    for index, cue in enumerate(cues, 1):
        start = cue[0]["start"]
        end = max(start + 0.5, cue[-1]["end"])
        lines.extend([str(index), f"{srt_time(start)} --> {srt_time(end)}", " ".join(x["text"] for x in cue), ""])
    return "\n".join(lines).rstrip() + "\n"

def captions_from_text_estimate(text: str, duration: float) -> str:
    """Build explicitly approximate draft caption timings when TTS word events are absent."""
    words = text.split()
    groups, group = [], []
    for word in words:
        candidate = " ".join(group + [word])
        if group and (len(group) >= CAPTION_MAX_WORDS or len(candidate) > CAPTION_MAX_CHARS):
            groups.append(group)
            group = []
        group.append(word)
        if word.endswith((".", "?", "!", ":", ";")):
            groups.append(group)
            group = []
    if group:
        groups.append(group)
    total_chars = sum(len(" ".join(g)) for g in groups) or 1
    cursor = 0.0
    lines = []
    for index, words_group in enumerate(groups, 1):
        caption = " ".join(words_group)
        share = duration * len(caption) / total_chars
        start = cursor
        end = duration if index == len(groups) else min(duration, cursor + share)
        if end <= start:
            end = min(duration, start + 0.1)
        lines.extend([str(index), f"{srt_time(start)} --> {srt_time(end)}", caption, ""])
        cursor = end
    return "\n".join(lines).rstrip() + "\n"

async def main():
    if not SOURCE.exists():
        raise SystemExit(f"ERROR: Missing source file: {SOURCE}")
    OUT.mkdir(parents=True, exist_ok=True)
    episodes = extract_episodes(SOURCE.read_text(encoding="utf-8"))
    for number, title, text in episodes:
        stem = f"long-{int(number):03d}-narration-draft"
        target = OUT / f"{stem}.mp3"
        text_target = OUT / f"{stem}.txt"
        srt_target = OUT / f"long-{int(number):03d}-captions-draft.srt"
        text_target.write_text(text + "\n", encoding="utf-8")
        communicate = edge_tts.Communicate(text, VOICE, boundary="WordBoundary")
        boundaries = []
        with target.open("wb") as audio_file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_file.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    boundaries.append(chunk)
        if not target.exists() or target.stat().st_size == 0:
            raise RuntimeError(f"No audio generated for episode {number}")
        if boundaries:
            caption_text = captions_from_boundaries(boundaries)
            caption_mode = f"{len(boundaries)} TTS word boundaries"
        else:
            if MP3 is None:
                raise RuntimeError("TTS returned no word-boundary data and mutagen is unavailable for duration estimation")
            duration = float(MP3(str(target)).info.length)
            if duration <= 0:
                raise RuntimeError(f"Invalid MP3 duration for episode {number}")
            caption_text = captions_from_text_estimate(text, duration)
            caption_mode = "approximate text-distributed timings; human timing review required"
            print(f"WARNING: Episode {number} had no TTS word-boundary data; using approximate caption timings.")
        srt_target.write_text(caption_text, encoding="utf-8")
        print(f"CREATED draft narration: {target} | {title} | {len(text.split())} words")
        print(f"CREATED narration text: {text_target}")
        print(f"CREATED draft captions: {srt_target} | {caption_mode}")
    print("DRAFT ONLY: review pronunciation, factual accuracy, caption punctuation/timing, voice quality, and total runtime. No upload or publishing occurred.")

if __name__ == "__main__":
    asyncio.run(main())
