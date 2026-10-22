#!/usr/bin/env python3
"""Build a reviewable narration package from the next queued SonicVhibez topic.
Uses free Edge TTS; drafts only. It does not fetch footage or publish.
"""
from __future__ import annotations
import argparse, asyncio, json, re
from pathlib import Path
import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "content" / "queue.json"
OUT = ROOT / "media" / "queue-package"
APPROVED_URL = "https://selar.com/0u19v8u99l"

def sentence(s: str) -> str:
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    if s and s[-1] not in ".!?":
        s += "."
    return s

def build_script(item: dict) -> str:
    title = sentence(item.get("title") or item.get("topic") or "Wildlife video tips")
    hook = sentence(item.get("hook") or f"Want to make a clearer wildlife video about {item.get('topic', 'wildlife')}?")
    outline = [sentence(x) for x in (item.get("outline") or [])[:3] if sentence(x)]
    mandatory = [
        hook,
        f"Start with one clear goal: {title[:-1] if title.endswith('.') else title}.",
        "Keep every claim accurate, and use only footage, images, and sound you have permission to publish.",
        "Never bait, chase, or disturb wildlife to capture a shot. Let natural behaviour guide the story.",
        "For a more structured wildlife-creator resource, find the Complete YouTube Wildlife Creator's Vault at the link in the description."
    ]
    optional = [
        "Plan your shot before you arrive, then wait quietly and leave plenty of space.",
        "Choose transitions that support the story, leave space for viewers to absorb each moment, and avoid dramatic sound effects that misrepresent animal behaviour.",
        "Use natural sound where possible, and let each shot stay long enough for viewers to understand the behaviour.",
        "A focused story is easier to follow than a rushed list of clips.",
    ] + outline
    # Preserve complete sentences and the promotional call-to-action. Remove optional
    # material as needed rather than truncating mid-sentence at an arbitrary word count.
    lines = [mandatory[0], mandatory[1], *optional, *mandatory[2:]]
    drop_order = [
        "A focused story is easier to follow than a rushed list of clips.",
        "Choose transitions that support the story, leave space for viewers to absorb each moment, and avoid dramatic sound effects that misrepresent animal behaviour.",
        "Use natural sound where possible, and let each shot stay long enough for viewers to understand the behaviour.",
        "Plan your shot before you arrive, then wait quietly and leave plenty of space.",
    ]
    while len(" ".join(lines).split()) > 135:
        removed = False
        for candidate in drop_order:
            if candidate in lines:
                lines.remove(candidate)
                removed = True
                break
        if not removed:
            # If the topic outline itself is unusually long, remove its final point.
            for point in reversed(outline):
                if point in lines:
                    lines.remove(point)
                    outline.remove(point)
                    removed = True
                    break
        if not removed:
            raise ValueError("Required narration and complete call-to-action exceed the 135-word limit.")
    return " ".join(lines)

def make_srt(text: str, duration: float) -> str:
    # Proportional timing is a draft only; downstream review must align captions to actual speech.
    words = text.split()
    chunks = [" ".join(words[i:i+7]) for i in range(0, len(words), 7)]
    weights = [max(1, len(c.split())) for c in chunks]
    total = sum(weights)
    def ts(sec: float) -> str:
        ms = max(0, round(sec * 1000))
        h, rem = divmod(ms, 3600000); m, rem = divmod(rem, 60000); s, ms = divmod(rem, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    out, start, index = [], 0.0, 1
    for chunk, weight in zip(chunks, weights):
        end = start + duration * weight / total
        out.extend([str(index), f"{ts(start)} --> {ts(end)}", chunk, ""])
        start, index = end, index + 1
    return "\n".join(out).rstrip() + "\n"

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-number", type=int, required=True)
    ap.add_argument("--voice", default="en-US-GuyNeural")
    ap.add_argument("--rate", default="-5%")
    args = ap.parse_args()
    queue = json.loads(QUEUE.read_text(encoding="utf-8"))
    items = [x for x in queue.get("items", []) if x.get("id") not in {"wildlife-vault-001", "wildlife-vault-002"}]
    if not items:
        raise SystemExit("No eligible queued topics remain.")
    item = items[(max(1, args.run_number) - 1) % len(items)]
    slug = re.sub(r"[^a-z0-9]+", "-", item.get("id", "wildlife-short").lower()).strip("-")[:70]
    OUT.mkdir(parents=True, exist_ok=True)
    text = build_script(item)
    audio = OUT / f"{slug}.mp3"
    await edge_tts.Communicate(text, args.voice, rate=args.rate).save(str(audio))
    duration = MP3(audio).info.length
    # Keep the package on HOLD if audio does not meet the intended Short duration.
    metadata = {
        "status": "HOLD_FOR_FOOTAGE_AND_REVIEW",
        "channel": "SonicVhibez",
        "queueItemId": item.get("id"),
        "title": item.get("title") or item.get("topic"),
        "description": (
            f"{item.get('topic', '')}. Learn practical wildlife filmmaking, nature documentary planning, "
            "ethical wildlife video production, and YouTube Shorts storytelling. "
            "This creator-education Short focuses on clear storytelling, responsible filming, and accurate captions.\n\n"
            f"Promotional resource: Complete YouTube Wildlife Creator's Vault — {APPROVED_URL}\n\n"
            "Use only footage, images, and music you have permission to publish. Captions in this draft have estimated timings and must be aligned to the final narration. "
            "#WildlifeFilmmaking #NatureDocumentary #YouTubeShorts"
        ),
        "tags": list(dict.fromkeys((item.get("keywords", []) + ["wildlife filmmaking", "nature documentary", "YouTube Shorts"])) )[:10],
        "productUrl": APPROVED_URL,
        "madeForKids": False,
        "visibility": "private",
        "targetSeconds": 55,
        "actualNarrationSeconds": round(duration, 2),
        "rightsConfirmed": False,
        "complianceReviewed": False,
        "notes": "Automated draft only. Check audio and title, verify factual claims, confirm footage/music rights, align captions, and review the thumbnail before upload. The product link is disclosed as promotional. No video was published."
    }
    (OUT / f"{slug}.txt").write_text(text + "\n", encoding="utf-8")
    (OUT / f"{slug}.srt").write_text(make_srt(text, duration), encoding="utf-8")
    (OUT / f"{slug}.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"PACKAGE: {slug}; words={len(text.split())}; narration={duration:.2f}s; status=HOLD_FOR_FOOTAGE_AND_REVIEW")
    print(f"TITLE: {metadata['title']}")
    print("CAPTIONS: estimated timestamps; final alignment required.")
    if duration < 50 or duration > 60:
        print("WARNING: narration outside 50–60s target; rewrite or adjust pace before render.")
if __name__ == "__main__":
    asyncio.run(main())
