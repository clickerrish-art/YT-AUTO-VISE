#!/usr/bin/env python3
"""Create a review-only thumbnail from the verified NOAA spiny-lobster B-roll source.

This script never marks rights, compliance, human approval, publication, or scheduling
as approved. It extracts a silent still frame only; no source audio is copied.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageEnhance, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "media" / "rights-review" / "noaa-spiny-lobsters-california.download"
OUT_DIR = ROOT / "media" / "review-only" / "thumbnails"
FRAME = OUT_DIR / "source-frame-370s.jpg"
OUTPUT = OUT_DIR / "noaa-california-spiny-lobster-thumbnail-review.jpg"
EVIDENCE = OUT_DIR / "noaa-california-spiny-lobster-thumbnail-review.json"
EXPECTED_SOURCE_SHA256 = "1aefd2c3aae7569aa80b89f6fe9d15ac3cf8c7b27651fde4e2fede74a35a92eb"
SOURCE_SECONDS = 370

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def run(args: list[str]) -> str:
    result = subprocess.run(args, text=True, capture_output=True)
    if result.returncode:
        raise SystemExit(f"Command failed ({result.returncode}): {' '.join(args)}\n{result.stderr}")
    return result.stdout

def assert_no_symlink_ancestors(path: Path) -> None:
    current = path
    while current == ROOT or ROOT in current.parents:
        if current.exists() and current.is_symlink():
            raise SystemExit(f"Refusing symlinked review path: {current}")
        if current == ROOT:
            break
        current = current.parent

def main() -> None:
    assert_no_symlink_ancestors(SOURCE)
    assert_no_symlink_ancestors(OUT_DIR)
    if not SOURCE.is_file():
        raise SystemExit(f"NOAA source artifact missing: {SOURCE}")
    if SOURCE.is_symlink():
        raise SystemExit("NOAA source artifact must be a regular file, not a symlink")
    existing_outputs = [FRAME, OUTPUT, EVIDENCE]
    if any(path.exists() or path.is_symlink() for path in existing_outputs):
        raise SystemExit("Refusing to overwrite an existing review-only thumbnail artifact")
    source_hash = sha256(SOURCE)
    if source_hash != EXPECTED_SOURCE_SHA256:
        raise SystemExit(f"Source SHA-256 mismatch: {source_hash}")

    probe = json.loads(run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-show_entries", "stream=codec_type,width,height", "-of", "json", str(SOURCE)
    ]))
    duration = float(probe.get("format", {}).get("duration", 0))
    video = next((s for s in probe.get("streams", []) if s.get("codec_type") == "video"), None)
    if not video or video.get("width") != 1280 or video.get("height") != 720 or duration < SOURCE_SECONDS + 1:
        raise SystemExit(f"Unexpected source video properties: video={video}, duration={duration}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(SOURCE_SECONDS),
        "-i", str(SOURCE), "-frames:v", "1", "-q:v", "2", str(FRAME)
    ])
    image = Image.open(FRAME).convert("RGB")
    if image.size != (1280, 720):
        raise SystemExit(f"Unexpected extracted frame size: {image.size}")

    image = ImageEnhance.Brightness(image).enhance(1.20)
    image = ImageEnhance.Contrast(image).enhance(1.18)
    image = ImageEnhance.Color(image).enhance(1.10)

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    pixels = overlay.load()
    width, height = image.size
    for x in range(width):
        strength = max(0.0, 1.0 - x / 540.0)
        alpha = int(185 * (strength ** 1.5))
        for y in range(height):
            pixels[x, y] = (3, 14, 20, alpha)
    image = Image.alpha_composite(image.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(image)

    font_root = Path("/usr/share/fonts/truetype/dejavu")
    bold = ImageFont.truetype(str(font_root / "DejaVuSans-Bold.ttf"), 88)
    kicker = ImageFont.truetype(str(font_root / "DejaVuSans-Bold.ttf"), 23)
    footer = ImageFont.truetype(str(font_root / "DejaVuSans-Bold.ttf"), 15)

    draw.rounded_rectangle((52, 90, 455, 137), radius=12, fill=(7, 33, 43, 230), outline=(245, 190, 58, 220), width=2)
    draw.text((68, 100), "CALIFORNIA SPINY LOBSTER", font=kicker, fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(0, 0, 0, 180))
    for text, y, fill in [
        ("NO BIG", 230, (255, 255, 255, 255)),
        ("CLAWS?", 330, (255, 205, 68, 255)),
    ]:
        draw.text((62, y + 5), text, font=bold, fill=(0, 0, 0, 210), stroke_width=6, stroke_fill=(0, 0, 0, 180))
        draw.text((58, y), text, font=bold, fill=fill, stroke_width=2, stroke_fill=(0, 0, 0, 220))
    draw.rounded_rectangle((770, 661, 1225, 702), radius=9, fill=(3, 14, 20, 210))
    draw.text((786, 673), "NOAA • NATIONAL MARINE SANCTUARIES", font=footer, fill=(255, 255, 255, 245))

    image.convert("RGB").save(OUTPUT, quality=94, optimize=True)
    final_image = Image.open(OUTPUT)
    if final_image.size != (1280, 720):
        raise SystemExit(f"Thumbnail dimensions invalid: {final_image.size}")

    evidence = {
        "schemaVersion": 1,
        "contentId": "SHORT-004-CALIFORNIA-SPINY-LOBSTER",
        "status": "REVIEW_ONLY_NOT_FOR_PUBLICATION",
        "reviewStatus": "PENDING_HUMAN_REVIEW",
        "humanReviewRequired": True,
        "productionAsset": False,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "title": "B-Roll: Spiny Lobsters in California's Channel Islands",
            "publisher": "NOAA Fisheries / NOAA's Office of National Marine Sanctuaries",
            "sourceSha256": source_hash,
            "sourceSeconds": SOURCE_SECONDS,
            "sourceDurationSeconds": round(duration, 3),
            "sourceAudioUsed": False,
            "attribution": "NOAA's Office of National Marine Sanctuaries"
        },
        "thumbnail": {
            "path": str(OUTPUT.relative_to(ROOT)),
            "sha256": sha256(OUTPUT),
            "width": 1280,
            "height": 720,
            "text": "NO BIG CLAWS?",
            "sourceFrameSeconds": SOURCE_SECONDS,
            "imageIsOriginalFootageFrame": True
        },
        "rightsConfirmed": False,
        "rightsEvidenceReviewed": False,
        "humanApproved": False,
        "complianceReviewed": False,
        "productionApproved": False,
        "uploadAllowed": False,
        "scheduleAllowed": False,
        "notes": [
            "Review-only thumbnail derived from a genuine NOAA B-roll frame.",
            "The NOAA source credit is visible on the thumbnail; full source attribution must also appear in video description/end credits.",
            "Owner final review and rights/compliance approval remain pending.",
            "No source audio was copied; this is a still-frame thumbnail only."
        ]
    }
    EVIDENCE.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(f"REVIEW THUMBNAIL: {OUTPUT}")
    print(f"SHA-256: {sha256(OUTPUT)}")
    print("STATUS: REVIEW_ONLY_NOT_FOR_PUBLICATION")

if __name__ == "__main__":
    main()
