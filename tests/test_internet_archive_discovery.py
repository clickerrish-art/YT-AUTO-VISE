import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.discover_internet_archive_assets import (
    candidate_from_doc, classify_license, search_archive
)


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, limit):
        return self.payload[:limit]


class InternetArchiveDiscoveryTests(unittest.TestCase):
    def test_cc_by_is_candidate_only_not_approval(self):
        candidate = candidate_from_doc({
            "identifier": "wildlife-film-01",
            "title": "Wildlife documentary",
            "licenseurl": "https://creativecommons.org/licenses/by/4.0/",
            "rights": "Creative Commons Attribution 4.0"
        })
        self.assertEqual(candidate["licenseTriage"], "POTENTIAL_COMMERCIAL_CC_ATTRIBUTION_REVIEW_REQUIRED")
        self.assertFalse(candidate["humanApproved"])
        self.assertFalse(candidate["productionApproved"])
        self.assertFalse(candidate["downloaded"])

    def test_cc_by_sa_is_candidate_but_nc_and_nd_are_held(self):
        self.assertEqual(
            classify_license("https://creativecommons.org/licenses/by-sa/4.0/"),
            "POTENTIAL_COMMERCIAL_CC_ATTRIBUTION_REVIEW_REQUIRED"
        )
        self.assertEqual(
            classify_license("https://creativecommons.org/licenses/by-nc/4.0/"),
            "HOLD_RESTRICTED_OR_UNCLEAR_TERMS"
        )
        self.assertEqual(
            classify_license("https://creativecommons.org/licenses/by-nd/4.0/"),
            "HOLD_RESTRICTED_OR_UNCLEAR_TERMS"
        )

    def test_unknown_or_missing_license_is_held(self):
        self.assertEqual(classify_license(""), "HOLD_LICENSE_UNVERIFIED")
        self.assertEqual(classify_license("https://example.org/terms"), "HOLD_LICENSE_UNVERIFIED")

    def test_invalid_identifier_is_rejected(self):
        self.assertIsNone(candidate_from_doc({"identifier": "../private"}))

    def test_search_uses_metadata_only_and_returns_candidates(self):
        payload = {"response": {"docs": [{
            "identifier": "test-wildlife",
            "title": "Test wildlife",
            "mediatype": "movies",
            "licenseurl": "https://creativecommons.org/publicdomain/zero/1.0/"
        }]}}
        def opener(request, timeout):
            self.assertIn("advancedsearch.php?", request.full_url)
            self.assertEqual(timeout, 30)
            return FakeResponse(payload)
        results = search_archive("mediatype:movies AND wildlife", opener=opener)
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0]["downloaded"])
        self.assertFalse(results[0]["productionApproved"])

    def test_rejects_oversized_query_and_invalid_row_count(self):
        with self.assertRaises(ValueError):
            search_archive("x" * 1001)
        with self.assertRaises(ValueError):
            search_archive("wildlife", rows=101)


if __name__ == "__main__":
    unittest.main()
