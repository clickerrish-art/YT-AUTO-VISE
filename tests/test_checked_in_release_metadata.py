import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPROVED_URL = "https://selar.com/0u19v8u99l"


class CheckedInReleaseMetadataTests(unittest.TestCase):
    def test_checked_in_short_uses_verified_channel_id_but_is_not_uploadable_by_default(self):
        metadata = json.loads((ROOT / "content" / "next-short.json").read_text(encoding="utf-8"))
        self.assertEqual(metadata.get("channel"), "SonicVhibez")
        self.assertEqual(metadata.get("productUrl"), APPROVED_URL)
        self.assertEqual(metadata.get("visibility"), "private")
        self.assertEqual(metadata.get("status"), "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW")
        self.assertFalse(metadata.get("rightsConfirmed"))
        self.assertFalse(metadata.get("complianceReviewed"))
        self.assertEqual(metadata.get("channelId"), "UCSlkuPfHH78oGC1o418HV4w", "use only the ID confirmed by authenticated read-only OAuth")

    def test_long_form_queue_does_not_embed_an_unverified_channel_id(self):
        queue = json.loads((ROOT / "content" / "long-form-queue.json").read_text(encoding="utf-8"))
        self.assertEqual(queue.get("channel"), "SonicVhibez")
        self.assertIs(queue.get("publishingEnabled"), False)
        self.assertNotIn("channelId", queue, "long-form queue must wait for authenticated OAuth channel identity")

    def test_all_queued_items_remain_held_and_use_only_approved_destination(self):
        queue = json.loads((ROOT / "content" / "queue.json").read_text(encoding="utf-8"))
        self.assertIs(queue.get("publishingEnabled"), False)
        items = queue.get("items", [])
        self.assertGreaterEqual(len(items), 10)
        self.assertEqual(len({item.get("id") for item in items}), len(items))
        for item in items:
            with self.subTest(queue_item=item.get("id")):
                if item.get("hasPaidPromotion") is True:
                    self.assertEqual(item.get("productUrl"), APPROVED_URL)
                else:
                    self.assertIsNone(item.get("productUrl"))
                if item.get("productUrl"):
                    self.assertIs(item.get("hasPaidPromotion"), True)
                    self.assertEqual(item.get("productUrl"), APPROVED_URL)
                self.assertIn(item.get("status"), {
                    "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW",
                    "script_and_captions_ready_needs_media_and_review",
                    "SCRIPT_READY_NARRATION_DRAFT_PENDING_GENERATION_MEDIA_AND_HUMAN_REVIEW_REQUIRED",
                    "SCRIPT_AND_CAPTIONS_READY_NEEDS_MEDIA_AND_HUMAN_REVIEW",
                    "DRAFT_REVIEW_REQUIRED",
                })


    def test_short_001_visual_review_preview_cannot_be_mistaken_for_release_evidence(self):
        preview = json.loads((ROOT / "content" / "short-001-visual-review-evidence.json").read_text(encoding="utf-8"))
        acquisition = json.loads((ROOT / "content" / "short-001-acquisition-manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(preview.get("status"), "VISUAL_REVIEW_ONLY_NOT_RELEASE_ELIGIBLE")
        self.assertFalse(preview["productionBoundaries"]["rightsConfirmed"])
        self.assertFalse(preview["productionBoundaries"]["releaseEligible"])
        self.assertFalse(preview["productionBoundaries"]["uploadedOrPublished"])
        self.assertFalse(preview["productionBoundaries"]["humanFullPlaybackReview"])
        self.assertEqual(preview["output"]["audio"], "none")
        self.assertEqual(preview["output"]["width"] / preview["output"]["height"], 9 / 16)
        self.assertGreaterEqual(preview["output"]["durationSeconds"], 50)
        self.assertLessEqual(preview["output"]["durationSeconds"], 60)
        used = {asset["assetId"]: asset for asset in preview["sourceAssets"]}
        acquired = {asset["assetId"]: asset for asset in acquisition["assets"]}
        self.assertEqual(set(used), {"pexels-11528208", "pexels-11760785", "pexels-29765785"})
        for asset_id, asset in used.items():
            self.assertEqual(asset["sha256"], acquired[asset_id]["sha256"])
            self.assertTrue(acquired[asset_id]["ownerSelectionStatus"] == "EXPLICITLY_APPROVED")
        self.assertEqual(
            preview["excludedAssets"][0]["assetId"],
            "pexels-31702128",
            "the visible-enclosure/foreground-person clip must remain excluded"
        )
        self.assertTrue(preview["licenseEvidence"]["reviewed"])
        self.assertFalse(acquisition["release"]["rightsConfirmed"])
        self.assertFalse(acquisition["release"]["releaseEligible"])

if __name__ == "__main__":
    unittest.main()
