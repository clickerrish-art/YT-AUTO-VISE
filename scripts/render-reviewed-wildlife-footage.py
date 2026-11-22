#!/usr/bin/env python3
"""Render a review draft from hash-verified original or licensed wildlife footage.

Pexels and Pixabay stock footage may be used only under their applicable platform
licenses, with source-page provenance and saved license evidence. AI-generated wildlife
visuals remain prohibited. Incomplete third-party or human rights review forces a
review-only hold; this script never marks a video ready to publish or uploads anything.
"""
from __future__ import annotations
import hashlib, json, re, subprocess
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

def validate_clip_source(clip: dict) -> str:
    """Validate source class and its minimum evidence; never infer legal clearance."""
    method = clip.get("sourceMethod")
    if clip.get("aiGenerated") is True or method == "AI_GENERATED":
        raise ValueError("AI-generated wildlife visuals are not permitted.")
    common = ("creatorIdentity", "file", "sourceUrl", "licenseBasis", "attribution", "originalSha256")
    for field in common:
        if not str(clip.get(field, "")).strip():
            raise ValueError(f"Missing required source field {field}.")
    if method == "ORIGINAL_RECORDING":
        if clip.get("creatorCapturedOriginal") is not True:
            raise ValueError("ORIGINAL_RECORDING requires creatorCapturedOriginal=true.")
        if not str(clip.get("captureProvenance", "")).strip():
            raise ValueError("Original recordings require captureProvenance.")
    elif method in ("PEXELS_LICENSED_STOCK", "PIXABAY_LICENSED_STOCK"):
        expected_platform = "Pexels" if method == "PEXELS_LICENSED_STOCK" else "Pixabay"
        expected_license = "Pexels License" if expected_platform == "Pexels" else "Pixabay Content License"
        if clip.get("creatorCapturedOriginal") is not False:
            raise ValueError("Licensed stock must explicitly set creatorCapturedOriginal=false.")
        if clip.get("sourcePlatform") != expected_platform:
            raise ValueError(f"{method} requires sourcePlatform={expected_platform}.")
        if clip.get("licenseBasis") != expected_license:
            raise ValueError(f"{method} requires licenseBasis={expected_license}.")
        if clip.get("platformLicenseReviewed") is not True:
            raise ValueError("Licensed stock requires platformLicenseReviewed=true.")
        if not str(clip.get("licenseEvidenceLocation", "")).strip():
            raise ValueError("Licensed stock requires a saved licenseEvidenceLocation.")
    else:
        raise ValueError("Unsupported sourceMethod; use ORIGINAL_RECORDING, PEXELS_LICENSED_STOCK, or PIXABAY_LICENSED_STOCK.")
    if clip.get("rightsReviewed") is not True and clip.get("reviewOnly") is not True:
        raise ValueError("Incomplete rights review is allowed only for an explicit reviewOnly=true draft.")
    return method

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
        try:
            source_method = validate_clip_source(clip)
        except ValueError as exc:
            raise SystemExit(f"Clip {i}: {exc}") from exc
        if source_method in ("PEXELS_LICENSED_STOCK", "PIXABAY_LICENSED_STOCK"):
            evidence_path = inspectNonSymlinkRegularFile(
                str(ROOT / clip["licenseEvidenceLocation"]), "License evidence"
            )
            if ROOT.resolve() not in Path(evidence_path).parents:
                raise SystemExit(f"Clip {i}: license evidence must remain inside the project root.")
        digest = str(clip.get("originalSha256", ""))
        if not re.fullmatch(r"[a-f0-9]{64}", digest):
            raise SystemExit(f"Clip {i}: originalSha256 must be the exact original-file SHA-256.")
        path = (FOOTAGE / str(clip["file"])).resolve()
        if FOOTAGE.resolve() not in path.parents or not path.is_file():
            raise SystemExit(f"Clip {i}: file must exist inside {FOOTAGE} (no external paths).")
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != digest:
            raise SystemExit(f"Clip {i}: originalSha256 does not match the supplied original file bytes.")
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
    all_rights_reviewed = all(c.get("rightsReviewed") is True for _, c in resolved)
    review_only = any(c.get("reviewOnly") is True for _, c in resolved)
    evidence = {
        "video": output.name,
        "clips": [{
            "file": p.name,
            "sourceMethod": c["sourceMethod"],
            "sourcePlatform": c.get("sourcePlatform"),
            "creatorIdentity": c["creatorIdentity"],
            "sourceUrl": c["sourceUrl"],
            "licenseBasis": c["licenseBasis"],
            "licenseEvidenceLocation": c.get("licenseEvidenceLocation"),
            "attribution": c["attribution"],
            "platformLicenseReviewed": c.get("platformLicenseReviewed", False),
            "thirdPartyRightsReviewed": c.get("thirdPartyRightsReviewed", False),
            "rightsReviewed": c.get("rightsReviewed") is True,
            "reviewOnly": c.get("reviewOnly") is True
        } for p, c in resolved],
        "rightsReviewedForAllAssets": all_rights_reviewed,
        "finalEditorialReviewComplete": False,
        "releaseEligible": False,
        "status": "HOLD_FOR_RIGHTS_AND_HUMAN_REVIEW" if (review_only or not all_rights_reviewed) else "HOLD_FOR_FINAL_HUMAN_REVIEW",
        "note": "Renderer verifies source class, local file hashes and supplied license-evidence paths. It cannot independently establish third-party rights, legal clearance, factual accuracy or owner approval."
    }
    (OUT / f"{stem}-footage-evidence.json").write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    meta["renderedDraft"] = str(output.relative_to(ROOT))
    meta["status"] = "HOLD_FOR_RIGHTS_AND_HUMAN_REVIEW" if (review_only or not all_rights_reviewed) else "HOLD_FOR_FINAL_HUMAN_REVIEW"
    meta["visibility"] = "private"
    meta["rightsConfirmed"] = False
    meta["complianceReviewed"] = False
    meta["notes"] = "Review render only. Complete any outstanding third-party rights, human visual/audio, factual, caption, thumbnail, metadata, compliance and owner-approval checks before any private upload. This renderer never authorizes publication."
    (OUT / f"{stem}-footage.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"RENDERED: {output}; status remains HOLD_FOR_FINAL_HUMAN_REVIEW.")

if __name__ == "__main__":
    main()
