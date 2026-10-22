#!/usr/bin/env python3
"""Render an automatically generated, review-only typographic vertical Short.
No stock footage is used: the result is a designed text-led draft, not wildlife B-roll.
Requires FFmpeg with libass and drawtext. Never uploads or publishes.
"""
from __future__ import annotations
import json, re, subprocess, sys
from pathlib import Path
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "media" / "queue-package"
OUT = ROOT / "media" / "rendered-drafts"
APPROVED_URL = "https://selar.com/0u19v8u99l"

def run(args: list[str]) -> None:
    p = subprocess.run(args, text=True)
    if p.returncode:
        raise SystemExit(f"Render command failed with exit code {p.returncode}")

def main() -> None:
    metadata_files = sorted(PACKAGE.glob("*.json"))
    if len(metadata_files) != 1:
        raise SystemExit(f"Expected exactly one queued metadata file, found {len(metadata_files)}")
    meta_path = metadata_files[0]
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    stem = meta_path.stem
    audio = PACKAGE / f"{stem}.mp3"
    captions = PACKAGE / f"{stem}.srt"
    script = PACKAGE / f"{stem}.txt"
    if not all(p.is_file() for p in (audio, captions, script)):
        raise SystemExit("Draft package is incomplete: expected MP3, SRT, TXT and JSON.")
    if meta.get("channel") != "SonicVhibez" or meta.get("productUrl") != APPROVED_URL:
        raise SystemExit("Safety check failed: channel or approved product URL mismatch.")
    duration = MP3(audio).info.length
    if not 50 <= duration <= 60:
        raise SystemExit(f"Audio is {duration:.2f}s; only 50–60s narration can be rendered.")
    title = re.sub(r"\s+", " ", str(meta.get("title") or "Wildlife Creator Field Notes")).strip()[:85]
    if not title:
        raise SystemExit("Missing title.")
    OUT.mkdir(parents=True, exist_ok=True)
    title_file = OUT / f"{stem}-title.txt"
    # FFmpeg drawtext reads from file, avoiding command-line title escaping.
    title_file.write_text(title.replace("\\", "\\\\").replace("'", "\\'"), encoding="utf-8")
    output = OUT / f"{stem}-DRAFT.mp4"
    duration_arg = f"{duration:.3f}"
    # Designed text-led visuals are intentionally used instead of unverified stock footage.
    # Captions are estimated by the generator and therefore require review before publication.
    filtergraph = (
        "drawbox=x=0:y=0:w=iw:h=ih:color=0x071c24@1:t=fill,"
        "drawbox=x=44:y=120:w=992:h=1680:color=0x0d3440@0.78:t=fill,"
        "drawbox=x=70:y=150:w=940:h=10:color=0x20c5b5@1:t=fill,"
        "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:"
        f"textfile='{title_file.as_posix()}':fontcolor=white:fontsize=54:line_spacing=12:"
        "borderw=2:bordercolor=black@0.65:x=90:y=210:"
        "enable='between(t,0,8)',"
        "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
        "text='WILDLIFE CREATOR FIELD NOTES':fontcolor=0x72e0d4:fontsize=27:"
        "x=(w-text_w)/2:y=100,"
        "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
        "text='STORY  •  ETHICS  •  CRAFT':fontcolor=white@0.9:fontsize=27:"
        "x=(w-text_w)/2:y=h-170,"
        "subtitles='" + captions.as_posix() + "':force_style='FontName=DejaVu Sans,FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H90000000,BorderStyle=3,Outline=2,Shadow=0,Alignment=2,MarginV=260'"
    )
    run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "lavfi", "-i", f"color=c=0x071c24:s=1080x1920:r=30:d={duration_arg}",
        "-i", str(audio), "-t", duration_arg,
        "-vf", filtergraph, "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
        "-movflags", "+faststart", str(output)
    ])
    title_file.unlink(missing_ok=True)
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height",
         "-show_entries", "format=duration", "-of", "json", str(output)],
        text=True, capture_output=True
    )
    if probe.returncode:
        raise SystemExit("Rendered MP4 could not be inspected by ffprobe.")
    info = json.loads(probe.stdout)
    v = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), None)
    actual = float(info.get("format", {}).get("duration", 0))
    if not v or v.get("width") != 1080 or v.get("height") != 1920 or not 50 <= actual <= 60:
        raise SystemExit(f"Rendered media failed validation: video={v}, duration={actual:.2f}s")
    meta["renderedDraft"] = str(output.relative_to(ROOT))
    meta["renderedSeconds"] = round(actual, 2)
    meta["status"] = "HOLD_FOR_FOOTAGE_AND_REVIEW"
    meta["rightsConfirmed"] = False
    meta["complianceReviewed"] = False
    meta["notes"] = "Automatically rendered text-led visual draft; it contains no wildlife footage. Captions have estimated timing. Review script, caption sync, factual claims, thumbnail, and rights before any upload. Never treat as publication-ready."
    (OUT / f"{stem}.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"RENDERED DRAFT: {output} | 1080x1920 | {actual:.2f}s | HOLD_FOR_FOOTAGE_AND_REVIEW")

if __name__ == "__main__":
    main()
