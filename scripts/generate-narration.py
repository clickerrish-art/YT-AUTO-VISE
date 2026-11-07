#!/usr/bin/env python3
"""Generate free Edge TTS Short audio and measured word-boundary captions.

All outputs are review-only. No footage, rights approval, video render or publication.
"""
from __future__ import annotations
import argparse, asyncio, hashlib, json, re, subprocess, tempfile
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "content" / "narration-master-short-001-and-002.md"
OUTPUT = ROOT / "media" / "narration"
SHORTS = {"short-001": "Short 001", "short-002": "Short 002"}
MIN_WORDS, MAX_WORDS = 125, 150

def extract_read(master: str, short_id: str) -> str:
    if short_id not in SHORTS:
        raise ValueError(f"Unknown Short ID: {short_id}")
    section = re.search(rf"^## {re.escape(SHORTS[short_id])}[^\n]*\n(.*?)(?=^## |\Z)", master, re.M | re.S)
    if not section:
        raise ValueError(f"Missing narration section: {short_id}")
    match = re.search(r"\*\*Read:\*\*\s*(.*?)(?=\n\s*\*\*Performance notes:\*\*|\Z)", section.group(1), re.S)
    if not match:
        raise ValueError(f"Missing Read block: {short_id}")
    narration = re.sub(r"\s+", " ", match.group(1)).strip()
    count = len(narration.split())
    if not MIN_WORDS <= count <= MAX_WORDS:
        raise ValueError(f"{short_id} must contain {MIN_WORDS}–{MAX_WORDS} words; found {count}")
    return narration

def srt_time(seconds: float) -> str:
    millis = max(0, round(seconds * 1000))
    hours, rem = divmod(millis, 3600000)
    minutes, rem = divmod(rem, 60000)
    secs, millis = divmod(rem, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

def captions_from_boundaries(boundaries: list[dict]) -> str:
    groups, group = [], []
    for event in boundaries:
        word = str(event.get("text", "")).strip()
        if not word:
            continue
        offset, duration = float(event.get("offset", -1)), float(event.get("duration", 0))
        if offset < 0 or duration <= 0:
            raise ValueError("TTS word-boundary event has invalid timing")
        start, end = offset / 10_000_000, (offset + duration) / 10_000_000
        candidate = " ".join([x["text"] for x in group] + [word])
        if group and (len(group) >= 7 or len(candidate) > 42):
            groups.append(group)
            group = []
        group.append({"text": word, "start": start, "end": end})
        if re.search(r"[.!?:;][\"'”’)]*$", word):
            groups.append(group)
            group = []
    if group:
        groups.append(group)
    if not groups:
        raise ValueError("No TTS word boundaries; estimated caption timing is not accepted")
    output, previous_end = [], 0.0
    for index, cue in enumerate(groups, 1):
        start, end = cue[0]["start"], cue[-1]["end"]
        if start < previous_end:
            raise ValueError("TTS word boundaries overlap or are out of order")
        if index < len(groups):
            end = min(end, groups[index][0]["start"])
        if end <= start:
            raise ValueError("Caption cue has non-positive duration")
        output += [str(index), f"{srt_time(start)} --> {srt_time(end)}", " ".join(x["text"] for x in cue), ""]
        previous_end = end
    return "\n".join(output).rstrip() + "\n"

def measured_duration(path: Path) -> float:
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path)], capture_output=True, text=True, timeout=30)
    if result.returncode:
        raise RuntimeError("ffprobe could not measure narration duration")
    try:
        duration = float(result.stdout.strip())
    except ValueError as exc:
        raise RuntimeError("ffprobe returned an invalid duration") from exc
    if duration <= 0:
        raise RuntimeError("Narration duration must be positive")
    return duration

async def generate_one(short_id: str, narration: str, voice: str, rate: str) -> dict:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if OUTPUT.is_symlink():
        raise ValueError("Narration output directory cannot be a symlink")
    stem = f"{short_id}-{voice}"
    paths = {ext: OUTPUT / f"{stem}.{ext}" for ext in ("mp3", "srt", "txt", "json")}
    if any(p.is_symlink() for p in paths.values()):
        raise ValueError("Refusing symlink output")
    communicate = edge_tts.Communicate(narration, voice, rate=rate, boundary="WordBoundary")
    boundaries = []
    with tempfile.NamedTemporaryFile(prefix=".edge-tts-", suffix=".mp3", dir=OUTPUT, delete=False) as temp:
        tmp = Path(temp.name)
        try:
            async for chunk in communicate.stream():
                if chunk.get("type") == "audio":
                    temp.write(chunk["data"])
                elif chunk.get("type") == "WordBoundary":
                    boundaries.append(chunk)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise
    try:
        if not tmp.stat().st_size:
            raise RuntimeError("Edge TTS returned an empty audio file")
        captions = captions_from_boundaries(boundaries)
        duration = measured_duration(tmp)
        tmp.replace(paths["mp3"])
        transcript = narration + "\n"
        paths["srt"].write_text(captions, encoding="utf-8")
        paths["txt"].write_text(transcript, encoding="utf-8")
        report = {
            "shortId": short_id, "voice": voice, "rate": rate, "wordCount": len(narration.split()),
            "durationSeconds": round(duration, 3), "targetDurationSeconds": {"min": 50, "max": 60},
            "withinTargetDuration": 50 <= duration <= 60, "wordBoundaryCount": len(boundaries),
            "captionTiming": "TTS_WORD_BOUNDARIES",
            "audioSha256": hashlib.sha256(paths["mp3"].read_bytes()).hexdigest(),
            "transcriptSha256": hashlib.sha256(transcript.encode()).hexdigest(),
            "captionsSha256": hashlib.sha256(captions.encode()).hexdigest(),
            "humanReviewRequired": True, "rightsStatus": "NOT_VERIFIED",
            "status": "DRAFT_REVIEW_REQUIRED", "publishingEnabled": False
        }
        paths["json"].write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"{'PASS' if report['withinTargetDuration'] else 'REVIEW'}: {short_id}: {duration:.2f}s; {len(boundaries)} word boundaries")
        return report
    finally:
        tmp.unlink(missing_ok=True)

async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--short", choices=["short-001", "short-002", "both"], default="both")
    parser.add_argument("--voice", default="en-US-GuyNeural")
    parser.add_argument("--rate", default="-5%")
    parser.add_argument("--extract-only", action="store_true")
    args = parser.parse_args()
    if not MASTER.is_file() or MASTER.is_symlink():
        raise SystemExit("Narration master missing or unsafe")
    master = MASTER.read_text(encoding="utf-8")
    selected = list(SHORTS) if args.short == "both" else [args.short]
    reports = []
    for short_id in selected:
        narration = extract_read(master, short_id)
        if args.extract_only:
            print(f"--- {short_id} ({len(narration.split())} words) ---\n{narration}\n")
        else:
            reports.append(await generate_one(short_id, narration, args.voice, args.rate))
    if not args.extract_only:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        (OUTPUT / "generation-summary.json").write_text(json.dumps({
            "status": "DRAFT_REVIEW_REQUIRED", "publishingEnabled": False,
            "humanReviewRequired": True, "items": reports
        }, indent=2) + "\n", encoding="utf-8")
        if any(not r["withinTargetDuration"] for r in reports):
            print("REVIEW REQUIRED: one or more reads are outside 50–60 seconds; no automatic time-stretching was applied.")
    return 0

if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
