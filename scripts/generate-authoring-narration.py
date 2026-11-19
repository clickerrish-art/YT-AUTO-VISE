#!/usr/bin/env python3
"""Create measured narration audio and word-boundary SRT for a generated script.

Draft-only: requires the optional free Edge TTS client and network access to its
service. It never fetches visual assets, approves rights, renders video, or publishes.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

try:
    import edge_tts
except ImportError:
    edge_tts = None

ROOT = Path(__file__).resolve().parents[1]
MAX_WORDS = {"short": (125, 150), "long_form": (900, 1500)}
CAPTION_MAX_WORDS = 7
CAPTION_MAX_CHARS = 42


def normalized_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def canonical_script_sha256(payload: object) -> str:
    if not isinstance(payload, dict):
        raise ValueError("script JSON must be an object")
    script = payload.get("result", payload)
    if not isinstance(script, dict):
        raise ValueError("script result must be an object")
    canonical = json.dumps(script, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def validate_script_payload(payload: object, content_format: str) -> tuple[str, int]:
    if content_format not in MAX_WORDS:
        raise ValueError("format must be short or long_form")
    if not isinstance(payload, dict):
        raise ValueError("script JSON must be an object")
    script = payload.get("result", payload)
    if not isinstance(script, dict):
        raise ValueError("script result must be an object")
    narration = normalized_text(script.get("narration"))
    if not narration:
        raise ValueError("script narration is required")
    sections = script.get("sections")
    if not isinstance(sections, list) or len(sections) < (3 if content_format == "short" else 5):
        raise ValueError("script has too few differentiated sections")
    section_text = normalized_text("\n\n".join(normalized_text(s.get("narration")) for s in sections if isinstance(s, dict)))
    if not section_text or section_text != narration:
        raise ValueError("section narration must reproduce the complete script narration in order")
    for index, section in enumerate(sections, 1):
        if not isinstance(section, dict):
            raise ValueError(f"section {index} must be an object")
        for key in ("heading", "purpose", "visualDirection", "pacing", "soundDesign"):
            if not isinstance(section.get(key), str) or not section[key].strip():
                raise ValueError(f"section {index} requires {key}")
    words = len(narration.split())
    low, high = MAX_WORDS[content_format]
    if not low <= words <= high:
        raise ValueError(f"{content_format} narration must contain {low}–{high} measured words; found {words}")
    claims = script.get("claims")
    sources = script.get("sources")
    if not isinstance(claims, list) or not claims or not isinstance(sources, list) or not sources:
        raise ValueError("non-empty source-backed claims and source records are required")
    source_ids = {s.get("id") for s in sources if isinstance(s, dict) and isinstance(s.get("id"), str)}
    if not source_ids or any(not isinstance(c, dict) or not isinstance(c.get("text"), str) or
                             not c["text"].strip() or not isinstance(c.get("sourceIds"), list) or
                             not c["sourceIds"] or any(sid not in source_ids for sid in c["sourceIds"])
                             for c in claims):
        raise ValueError("every factual claim must cite known supplied source IDs")
    return narration, words


def srt_time(seconds: float) -> str:
    millis = max(0, int(round(seconds * 1000)))
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def captions_from_boundaries(boundaries: list[dict]) -> str:
    cues: list[list[dict]] = []
    group: list[dict] = []
    for item in boundaries:
        word = str(item.get("text", "")).strip()
        if not word:
            continue
        offset = float(item.get("offset", -1))
        duration = float(item.get("duration", 0))
        if offset < 0 or duration <= 0:
            raise ValueError("TTS word-boundary event has invalid timing")
        start = offset / 10_000_000
        end = (offset + duration) / 10_000_000
        candidate = " ".join([x["text"] for x in group] + [word])
        if group and (len(group) >= CAPTION_MAX_WORDS or len(candidate) > CAPTION_MAX_CHARS):
            cues.append(group)
            group = []
        group.append({"text": word, "start": start, "end": end})
        if re.search(r"[.!?:;][\"'”’)]*$", word):
            cues.append(group)
            group = []
    if group:
        cues.append(group)
    if not cues:
        raise ValueError("TTS returned no usable word-boundary events; approximate caption timing is not accepted")
    lines: list[str] = []
    previous_end = 0.0
    for index, cue in enumerate(cues, 1):
        start = cue[0]["start"]
        end = cue[-1]["end"]
        if start < previous_end:
            raise ValueError("TTS word boundaries are out of order or overlap prior caption cues")
        if index < len(cues):
            next_start = cues[index][0]["start"]
            end = min(end, next_start)
        if end <= start:
            raise ValueError("caption cue has zero or negative duration")
        lines.extend([str(index), f"{srt_time(start)} --> {srt_time(end)}",
                      " ".join(x["text"] for x in cue), ""])
        previous_end = end
    return "\n".join(lines).rstrip() + "\n"


def probe_duration(audio_path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
        capture_output=True, text=True, timeout=20, check=False,
    )
    if result.returncode != 0:
        raise ValueError("ffprobe could not measure generated narration duration")
    try:
        duration = float(result.stdout.strip())
    except ValueError as exc:
        raise ValueError("ffprobe returned an invalid narration duration") from exc
    if duration <= 0:
        raise ValueError("narration duration must be positive")
    return duration


async def generate(payload: object, content_format: str, output_dir: Path,
                   voice: str = "en-US-GuyNeural", rate: str = "-5%") -> dict:
    if edge_tts is None:
        raise RuntimeError("Install the free edge-tts package before generating narration")
    narration, words = validate_script_payload(payload, content_format)
    script_digest = canonical_script_sha256(payload)
    output_dir.mkdir(parents=True, exist_ok=True)
    if output_dir.is_symlink() or not output_dir.is_dir():
        raise ValueError("output directory must be a real directory, not a symlink")
    targets = [output_dir / name for name in ("narration.mp3", "narration.txt", "captions.srt", "narration-report.json")]
    if any(target.is_symlink() for target in targets):
        raise ValueError("output files must not be symbolic links")
    communicate = edge_tts.Communicate(narration, voice, rate=rate, boundary="WordBoundary")
    boundaries = []
    with tempfile.NamedTemporaryFile(prefix=".narration-", suffix=".mp3", dir=output_dir, delete=False) as temp:
        temp_path = Path(temp.name)
        try:
            async for chunk in communicate.stream():
                if chunk.get("type") == "audio":
                    temp.write(chunk["data"])
                elif chunk.get("type") == "WordBoundary":
                    boundaries.append(chunk)
        except Exception:
            temp_path.unlink(missing_ok=True)
            raise
    if not temp_path.exists() or temp_path.stat().st_size == 0:
        temp_path.unlink(missing_ok=True)
        raise RuntimeError("TTS produced no audio bytes")
    try:
        captions = captions_from_boundaries(boundaries)
        duration = probe_duration(temp_path)
        low, high = (50, 60) if content_format == "short" else (360, 600)
        if not low <= duration <= high:
            raise ValueError(f"measured narration duration must be {low}–{high} seconds; found {duration:.2f}")
        final_audio = targets[0]
        temp_path.replace(final_audio)
        targets[1].write_text(narration + "\n", encoding="utf-8")
        targets[2].write_text(captions, encoding="utf-8")
        report = {
            "format": content_format, "voice": voice, "rate": rate, "wordCount": words,
            "scriptSha256": script_digest,
            "durationSeconds": round(duration, 3), "wordBoundaryCount": len(boundaries),
            "captionTiming": "TTS_WORD_BOUNDARIES", "audioSha256": hashlib.sha256(final_audio.read_bytes()).hexdigest(),
            "transcriptSha256": hashlib.sha256((narration + "\n").encode()).hexdigest(),
            "captionsSha256": hashlib.sha256(captions.encode()).hexdigest(),
            "humanReviewRequired": True, "rightsStatus": "NOT_VERIFIED",
            "status": "DRAFT_REVIEW_REQUIRED", "publishingEnabled": False,
        }
        targets[3].write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        return report
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--script-json", required=True, help="JSON containing generated script result")
    parser.add_argument("--format", choices=["short", "long_form"], required=True)
    parser.add_argument("--output-dir", required=True, help="Job-specific output directory")
    parser.add_argument("--voice", default="en-US-GuyNeural")
    parser.add_argument("--rate", default="-5%")
    args = parser.parse_args()
    source_arg = Path(args.script_json)
    if source_arg.is_symlink():
        raise SystemExit("BLOCKED: script JSON must be a regular file, not a symlink")
    source = source_arg.resolve(strict=True)
    if not source.is_file():
        raise SystemExit("BLOCKED: script JSON must be a regular file, not a symlink")
    try:
        payload = json.loads(source.read_text(encoding="utf-8"))
        media_dir = ROOT / "media"
        if media_dir.is_symlink() or not media_dir.is_dir():
            raise ValueError("media directory must be a real directory, not a symlink")
        base_path = media_dir / "generated-authoring"
        if base_path.exists() and base_path.is_symlink():
            raise ValueError("generated-authoring directory must not be a symlink")
        base_path.mkdir(parents=True, exist_ok=True)
        base = base_path.resolve()
        output_arg = Path(args.output_dir)
        output_dir = (ROOT / output_arg).resolve() if not output_arg.is_absolute() else output_arg.resolve()
        if not output_dir.is_relative_to(base) or output_dir == base:
            raise ValueError("output directory must be a job-specific child of media/generated-authoring")
        cursor = base
        for part in output_dir.relative_to(base).parts:
            cursor = cursor / part
            if cursor.exists() and cursor.is_symlink():
                raise ValueError("output path may not contain symbolic links")
        report = asyncio.run(generate(payload, args.format, output_dir, args.voice, args.rate))
    except Exception as error:
        raise SystemExit("BLOCKED: narration generation failed closed: " + str(error)) from error
    print("DRAFT ONLY: " + json.dumps(report, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
