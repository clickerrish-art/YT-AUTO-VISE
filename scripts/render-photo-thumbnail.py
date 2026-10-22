#!/usr/bin/env python3
"""Create a photo-led YouTube thumbnail from a specifically identified Pexels image.
Downloads the source at run time, overlays title text, and writes provenance evidence.
This does not clear rights for any other footage used in the video.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import json, textwrap

SOURCE_PAGE = "https://www.pexels.com/photo/close-up-shot-of-an-african-leopard-7014883/"
SOURCE_IMAGE = "https://images.pexels.com/photos/7014883/pexels-photo-7014883.jpeg?auto=compress&cs=tinysrgb&w=2000"
LICENSE_PAGE = "https://www.pexels.com/photo-license/"
OUT = Path("media/rendered-drafts/thumbnail.jpg")
EVIDENCE = Path("media/rendered-drafts/thumbnail-rights-evidence.json")

def main():
    metas = list(Path("media/queue-package").glob("*.json"))
    if len(metas) != 1:
        raise SystemExit(f"Expected exactly one queue metadata file, got {len(metas)}")
    meta = json.loads(metas[0].read_text(encoding="utf-8"))
    title = str(meta.get("title") or "WILDLIFE FIELD NOTES").strip().upper()
    title = " ".join(title.split())[:78]
    req = Request(SOURCE_IMAGE, headers={"User-Agent": "SonicVhibez-ThumbnailBuilder/1.0"})
    try:
        with urlopen(req, timeout=30) as response:
            raw = response.read()
    except Exception as exc:
        raise SystemExit(f"Could not retrieve Pexels source image; thumbnail step must fail closed: {exc}")
    tmp = Path("media/rendered-drafts/.pexels-leopard-source.jpg")
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_bytes(raw)
    try:
        im = Image.open(tmp).convert("RGB")
        # Fill 16:9 with a center crop while preserving the subject's face as much as possible.
        target_ratio = 16 / 9
        w, h = im.size
        if w / h > target_ratio:
            nw = int(h * target_ratio)
            left = max(0, min(w - nw, int(w * 0.14)))
            im = im.crop((left, 0, left + nw, h))
        else:
            nh = int(w / target_ratio)
            top = max(0, min(h - nh, int(h * 0.30)))
            im = im.crop((0, top, w, top + nh))
        im = im.resize((1280, 720), Image.Resampling.LANCZOS)
        im = ImageEnhance.Contrast(im).enhance(1.08)
        im = ImageEnhance.Color(im).enhance(1.08)
        # Readable documentary-style lower banner.
        overlay = Image.new("RGBA", im.size, (0,0,0,0))
        od = ImageDraw.Draw(overlay)
        for y in range(430, 720):
            alpha = int(205 * ((y - 430) / 290))
            od.rectangle((0,y,1280,y), fill=(0,0,0,alpha))
        im = Image.alpha_composite(im.convert("RGBA"), overlay)
        draw = ImageDraw.Draw(im)
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
        ]
        font_path = next((p for p in font_paths if Path(p).exists()), None)
        if not font_path:
            raise SystemExit("No bold system font available for thumbnail text")
        # Fit two to three lines to width.
        lines = []
        for line in textwrap.wrap(title, width=23):
            lines.append(line)
        if len(lines) > 3:
            lines = lines[:2] + [" ".join(lines[2:])]
        font_size = 62 if len(lines) <= 2 else 52
        font = ImageFont.truetype(font_path, font_size)
        y = 470 if len(lines) <= 2 else 450
        for line in lines:
            draw.text((54, y+3), line, font=font, fill=(0,0,0,230), stroke_width=3, stroke_fill=(0,0,0,230))
            draw.text((50, y), line, font=font, fill=(255,255,255,255), stroke_width=1, stroke_fill=(20,20,20,255))
            y += font_size + 8
        draw.text((52, 680), "PHOTO: RICARDO LIMA / PEXELS", font=ImageFont.truetype(font_path, 17), fill=(245,245,245,240))
        OUT.parent.mkdir(parents=True, exist_ok=True)
        im.convert("RGB").save(OUT, "JPEG", quality=93, optimize=True)
    finally:
        try: tmp.unlink()
        except FileNotFoundError: pass
    evidence = {
        "asset": "African leopard close-up",
        "photographer": "Ricardo Lima",
        "sourcePage": SOURCE_PAGE,
        "sourceImage": SOURCE_IMAGE,
        "licensePage": LICENSE_PAGE,
        "licenseBasis": "Pexels states its photos are free for personal and commercial use under the Pexels License; verify current terms before publication.",
        "thumbnailOnly": True,
        "videoFootageRightsConfirmed": False,
        "publicationStatus": "HOLD_FOR_FOOTAGE_AND_REVIEW"
    }
    EVIDENCE.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(f"CREATED: {OUT} (1280x720 photo-led thumbnail)")
    print(f"CREATED: {EVIDENCE}; video footage rights and compliance remain unconfirmed.")

if __name__ == "__main__":
    main()
