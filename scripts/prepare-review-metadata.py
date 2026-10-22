#!/usr/bin/env python3
"""Prepare a local review-metadata file from a generated artifact; never clears review gates."""
from __future__ import annotations
import argparse, json
from pathlib import Path

APPROVED_URL = "https://selar.com/0u19v8u99l"

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact_metadata", help="JSON metadata extracted from the selected draft artifact")
    parser.add_argument("--output", default="content/review-short.json")
    parser.add_argument("--channel-id", default="", help="Verified SonicVhibez YouTube channel ID, if already known")
    args = parser.parse_args()
    source = Path(args.artifact_metadata)
    if not source.is_file():
        raise SystemExit(f"BLOCKED: artifact metadata not found: {source}")
    item = json.loads(source.read_text(encoding="utf-8"))
    if item.get("channel") != "SonicVhibez":
        raise SystemExit("BLOCKED: source metadata does not target SonicVhibez.")
    if item.get("productUrl") != APPROVED_URL:
        raise SystemExit("BLOCKED: source metadata contains an unapproved product URL.")
    if not item.get("queueItemId") or not item.get("title"):
        raise SystemExit("BLOCKED: source metadata is missing queueItemId or title.")
    item["status"] = "HOLD_FOR_FOOTAGE_AND_REVIEW"
    item["visibility"] = "private"
    item["rightsConfirmed"] = False
    item["complianceReviewed"] = False
    item["channelId"] = args.channel_id.strip()
    item["notes"] = (
        "Prepared for human review from the matching generated artifact. This file deliberately "
        "remains held. Watch/listen to the full draft, verify facts, captions, final footage and "
        "all media rights, thumbnail accuracy, disclosure, and channel ID before manually changing "
        "review fields. Do not set review booleans true until checks are actually complete."
    )
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(item, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared held review metadata: {out}")
    print(f"Queue item: {item['queueItemId']}")
    print(f"Title: {item['title']}")
    print("Gates remain closed: rightsConfirmed=false, complianceReviewed=false, status=HOLD_FOR_FOOTAGE_AND_REVIEW.")

if __name__ == "__main__":
    main()
