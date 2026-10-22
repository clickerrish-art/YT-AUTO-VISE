#!/usr/bin/env python3
"""Render a wildlife-footage review draft from a human-reviewed local manifest.

This is deliberately separate from the default text-led renderer. Each clip must be
placed in media/approved-footage/ and documented in manifest.json. The script fails
closed unless every asset has a source URL, license basis, attribution, and an explicit
human rights-review flag. It never marks a video ready to publish or uploads anything.
"""
from __future__ import annotations
import json, subprocess
from pathlib import Path
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "media" / "queue-package"
FOOTAGE = ROOT / "media" / "approved-footage"
OUT = ROOT / "media" / "rendered-drafts"
APPROVED_URL = "https://selar.com/0u19v8u99l"

def run(args: list[str]) -> None:
    p = subprocess.run(args, text=True)
    if p.returncode:
        raise SystemExit(f"FFmpeg failed (exit {p.returncode}); no publishable output was produced.")

def main() -> None:
    manifest_path = FOOTAGE / "manifest.json"
    if not manifest_path.is_file():
        raise SystemExit(
            "No reviewed footage manifest. Create media/approved-footage/manifest.json "
            "and add licensed clip files; see docs/WILDLIFE_MEDIA_RIGHTS_CHECKLIST.md."
        )
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    clips = manifest.get("clips", [])
    if not isinstance(clips, list) or not clips:
        raise SystemExit("Manifest must contain at least one reviewed clip.")
    resolved = []
    for i, clip in enumerate(clips, 1):
        if not isinstance(clip, dict):
            raise SystemExit(f"Clip {i}: expected an object.")
        for field in ("file", "sourceUrl", "licenseBasis", "attribution"):
            if not str(clip.get(field, "")).strip():
                raise SystemExit(f"Clip {i}: missing required field {field}.")
        if clip.get("rightsReviewed") is not True:
            raise SystemExit(f"Clip {i}: rightsReviewed must be true only after human verification.")
        path = (FOOTAGE / str(clip["file"])).resolve()
        if FOOTAGE.resolve() not in path.parents or not path.is_file():
            raise SystemExit(f"Clip {i}: file must exist inside {FOOTAGE} (no external paths).")
        resolved.append((path, clip))
    metas = sorted(PACKAGE.glob("*.json"))
    if len(metas) != 1:
        raise SystemExit(f"Expected exactly one queued metadata JSON; found {len(metas)}.")
    meta_path = metas[0]
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    stem = meta_path.stem
    audio, captions = PACKAGE / f"{stem}.mp3", PACKAGE / f"{stem}.srt"
    if meta.get("channel") != "SonicVhibez" or meta.get("productUrl") != APPROVED_URL:
        raise SystemExit("Destination/product safety check failed.")
    if not audio.is_file() or not captions.is_file():
        raise SystemExit("Missing narration or captions.")
    duration = MP3(audio).info.length
    if not 50 <= duration <= 60:
        raise SystemExit(f"Narration duration {duration:.2f}s is outside the 50–60 second target.")
    OUT.mkdir(parents=True, exist_ok=True)
    output = OUT / f"{stem}-FOOTAGE-REVIEW.mp4"
    args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for path, _ in resolved:
        args += ["-i", str(path)]
    args += ["-i", str(audio)]
    # Normalize every clip to a vertical canvas, concatenate and loop only the last
    # visual frame if footage is shorter than narration. Captions are estimated drafts.
    filters = []
    labels = []
    segment_duration = duration / len(resolved)
    for i, (_, clip) in enumerate(resolved):
        label = f"v{i}"
        filters.append(
            f"[{i}:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            f"crop=1080:1920,setsar=1,fps=30,trim=duration={segment_duration:.3f},"
            f"tpad=stop_mode=clone:stop_duration={segment_duration:.3f},"
            f"trim=duration={segment_duration:.3f},setpts=PTS-STARTPTS[{label}]"
        )
        labels.append(f"[{label}]")
    if len(labels) == 1:
        filters.append(f"{labels[0]}tpad=stop_mode=clone:stop_duration={duration:.3f},trim=duration={duration:.3f}[joined]")
    else:
        filters.append("".join(labels) + f"concat=n={len(labels)}:v=1:a=0,trim=duration={duration:.3f},setpts=PTS-STARTPTS[joined]")
    subtitle_path = str(captions.resolve()).replace("\\", "\\\\").replace(":", "\\:")
    filters.append(
        f"[joined]subtitles='{subtitle_path}':force_style='FontName=DejaVu Sans,FontSize=32,"
        "PrimaryColour=&H00FFFFFF,OutlineColour=&H90000000,BorderStyle=3,Outline=3,"
        "Shadow=0,Alignment=2,MarginV=250'[vout]"
    )
    args += ["-filter_complex", ";".join(filters), "-map", "[vout]", "-map", f"{len(resolved)}:a:0",
             "-t", f"{duration:.3f}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(output)]
    run(args)
    evidence = {
        "video": output.name,
        "clips": [{"file": p.name, "sourceUrl": c["sourceUrl"], "licenseBasis": c["licenseBasis"],
                   "attribution": c["attribution"], "rightsReviewed": True} for p, c in resolved],
        "humanRightsReviewRecordedInManifest": True,
        "finalEditorialReviewComplete": False,
        "status": "HOLD_FOR_FINAL_HUMAN_REVIEW",
        "note": "Renderer verifies supplied manifest fields but cannot independently verify a license or the factual accuracy of the edit."
    }
    (OUT / f"{stem}-footage-evidence.json").write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    meta["renderedDraft"] = str(output.relative_to(ROOT))
    meta["status"] = "HOLD_FOR_FOOTAGE_AND_REVIEW"
    meta["visibility"] = "private"
    meta["rightsConfirmed"] = False
    meta["complianceReviewed"] = False
    meta["notes"] = "Wildlife-footage review render created from a human-reviewed manifest. Perform final clip-by-clip rights, factual, caption, audio, thumbnail, and promotional-disclosure review before private upload."
    (OUT / f"{stem}-footage.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"RENDERED: {output}; status remains HOLD_FOR_FINAL_HUMAN_REVIEW.")

if __name__ == "__main__":
    main()
