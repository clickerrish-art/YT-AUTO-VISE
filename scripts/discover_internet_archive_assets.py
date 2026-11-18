#!/usr/bin/env python3
"""Discover Internet Archive moving-image candidates without downloading media or approving rights.

Search metadata only. Every result remains a candidate until the original item, exact licence,
embedded credits, third-party material, audio and final edit have been reviewed by a human.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

API_URL = "https://archive.org/advancedsearch.php"
DEFAULT_QUERY = (
    "mediatype:movies AND (wildlife OR animal OR crocodile OR elephant OR lion "
    "OR shark OR whale OR bird OR reptile OR ocean OR nature)"
)
FIELDS = ("identifier", "title", "creator", "date", "year", "mediatype",
          "licenseurl", "rights", "description", "collection")
USER_AGENT = "SonicVhibez-ArchiveDiscovery/1.0 (metadata-only rights-review intake)"


def classify_license(license_url: str, rights: str = "") -> str:
    """Conservative triage label, never a legal approval."""
    url = (license_url or "").strip().lower()
    text = (rights or "").strip().lower()
    combined = url + " " + text
    if any(term in combined for term in ("noncommercial", "by-nc", "no derivatives", "by-nd",
                                         "sampling+", "all rights reserved", "copyright")):
        return "HOLD_RESTRICTED_OR_UNCLEAR_TERMS"
    if "creativecommons.org/publicdomain/zero/" in url or "creativecommons.org/publicdomain/mark/" in url:
        return "POTENTIAL_PUBLIC_DOMAIN_OR_CC0_REVIEW_REQUIRED"
    if re.search(r"creativecommons\.org/licenses/by(?:-sa)?/\d", url):
        return "POTENTIAL_COMMERCIAL_CC_ATTRIBUTION_REVIEW_REQUIRED"
    if "public domain" in text and ("united states" in text or "us government" in text):
        return "POTENTIAL_PUBLIC_DOMAIN_CLAIM_VERIFY_SOURCE_REQUIRED"
    return "HOLD_LICENSE_UNVERIFIED"


def clean_text(value: Any, limit: int = 4000) -> str:
    if isinstance(value, list):
        value = "; ".join(str(item) for item in value)
    if value is None:
        return ""
    return str(value).strip()[:limit]


def candidate_from_doc(doc: dict[str, Any]) -> dict[str, Any] | None:
    identifier = clean_text(doc.get("identifier"), 200)
    if not identifier or not re.fullmatch(r"[A-Za-z0-9._-]+", identifier):
        return None
    license_url = clean_text(doc.get("licenseurl"), 1000)
    rights = clean_text(doc.get("rights"), 2000)
    return {
        "identifier": identifier,
        "title": clean_text(doc.get("title"), 500),
        "creator": clean_text(doc.get("creator"), 1000),
        "date": clean_text(doc.get("date") or doc.get("year"), 100),
        "mediaType": clean_text(doc.get("mediatype"), 50),
        "sourcePage": f"https://archive.org/details/{identifier}",
        "licenseUrlAsReportedByUploader": license_url,
        "rightsTextAsReportedByUploader": rights,
        "licenseTriage": classify_license(license_url, rights),
        "downloaded": False,
        "rightsEvidenceReviewed": False,
        "thirdPartyRestrictionsChecked": False,
        "humanApproved": False,
        "productionApproved": False,
        "notes": "Metadata discovery only. Verify the original item, licence, uploader authority, embedded credits, third-party material, audio and intended commercial edit. Do not use until separately approved."
    }


def search_archive(query: str, rows: int = 30, timeout: int = 30,
                   opener=urllib.request.urlopen) -> list[dict[str, Any]]:
    if not query.strip() or len(query) > 1000:
        raise ValueError("query must contain 1–1000 characters")
    if not 1 <= rows <= 100:
        raise ValueError("rows must be between 1 and 100")
    params: list[tuple[str, str]] = [("q", query), ("rows", str(rows)), ("page", "1"), ("output", "json")]
    params.extend(("fl[]", field) for field in FIELDS)
    url = API_URL + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with opener(request, timeout=timeout) as response:
        raw = response.read(5_000_001)
    if len(raw) > 5_000_000:
        raise ValueError("Internet Archive response exceeded the 5 MB safety limit")
    payload = json.loads(raw.decode("utf-8"))
    docs = payload.get("response", {}).get("docs", [])
    if not isinstance(docs, list):
        raise ValueError("Unexpected Internet Archive response format")
    return [candidate for doc in docs if isinstance(doc, dict)
            for candidate in [candidate_from_doc(doc)] if candidate is not None]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--query", default=DEFAULT_QUERY)
    parser.add_argument("--rows", type=int, default=30)
    parser.add_argument("--output", default="internet-archive-discovery.json")
    args = parser.parse_args()
    try:
        candidates = search_archive(args.query, args.rows)
        report = {
            "schemaVersion": 1,
            "channel": "SonicVhibez",
            "provider": "internet_archive_metadata_search",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "query": args.query,
            "resultCount": len(candidates),
            "status": "DISCOVERY_ONLY_NOT_RIGHTS_CLEARED",
            "mediaDownloaded": False,
            "assets": candidates,
            "policy": {
                "commercialUseAllowedByThisReport": False,
                "automaticDownload": False,
                "automaticAssetRegistration": False,
                "automaticRendering": False,
                "automaticScheduling": False,
                "automaticPublishing": False
            }
        }
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"PASS: discovered {len(candidates)} metadata candidate(s); no media downloaded.")
        print(f"Report: {output}")
        print("HOLD: metadata rights are uploader-reported; no asset is approved for commercial use.")
        return 0
    except Exception as exc:
        print(f"BLOCKED: Internet Archive discovery failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
