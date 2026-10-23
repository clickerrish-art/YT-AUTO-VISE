import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPROVED_URL = "https://selar.com/0u19v8u99l"


class CheckedInReleaseMetadataTests(unittest.TestCase):
    def test_checked_in_short_is_not_uploadable_by_default(self):
        metadata = json.loads((ROOT / "content" / "next-short.json").read_text(encoding="utf-8"))
        self.assertEqual(metadata.get("channel"), "SonicVhibez")
        self.assertEqual(metadata.get("productUrl"), APPROVED_URL)
        self.assertEqual(metadata.get("visibility"), "private")
        self.assertEqual(metadata.get("status"), "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW")
        self.assertFalse(metadata.get("rightsConfirmed"))
        self.assertFalse(metadata.get("complianceReviewed"))
        self.assertFalse(metadata.get("channelId"))

    def test_all_queued_items_remain_held_and_use_only_approved_destination(self):
        queue = json.loads((ROOT / "content" / "queue.json").read_text(encoding="utf-8"))
        self.assertIs(queue.get("publishingEnabled"), False)
        items = queue.get("items", [])
        self.assertGreaterEqual(len(items), 10)
        self.assertEqual(len({item.get("id") for item in items}), len(items))
        for item in items:
            with self.subTest(queue_item=item.get("id")):
                self.assertEqual(item.get("productUrl"), APPROVED_URL)
                self.assertIn(item.get("status"), {
                    "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW",
                    "script_and_captions_ready_needs_media_and_review",
                    "SCRIPT_READY_NARRATION_DRAFT_PENDING_GENERATION_MEDIA_AND_HUMAN_REVIEW_REQUIRED",
                    "SCRIPT_AND_CAPTIONS_READY_NEEDS_MEDIA_AND_HUMAN_REVIEW",
                    "DRAFT_REVIEW_REQUIRED",
                })


if __name__ == "__main__":
    unittest.main()
