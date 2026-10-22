import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "prepare-review-metadata.py"
APPROVED_URL = "https://selar.com/0u19v8u99l"

class PrepareReviewMetadataTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.source = self.root / "artifact.json"
        self.output = self.root / "review.json"

    def tearDown(self):
        self.tmp.cleanup()

    def write_source(self, **overrides):
        data = {
            "channel": "SonicVhibez",
            "queueItemId": "wildlife-short-research-before-shoot",
            "title": "Research Before You Shoot",
            "productUrl": APPROVED_URL,
            "rightsConfirmed": True,
            "complianceReviewed": True,
            "status": "READY_FOR_PRIVATE_UPLOAD",
            "visibility": "public"
        }
        data.update(overrides)
        self.source.write_text(json.dumps(data), encoding="utf-8")

    def run_script(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), str(self.source), "--output", str(self.output), *args],
            text=True, capture_output=True
        )

    def test_valid_source_always_remains_held(self):
        self.write_source()
        result = self.run_script("--channel-id", "UC_verified")
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(self.output.read_text(encoding="utf-8"))
        self.assertEqual(data["status"], "HOLD_FOR_FOOTAGE_AND_REVIEW")
        self.assertEqual(data["visibility"], "private")
        self.assertFalse(data["rightsConfirmed"])
        self.assertFalse(data["complianceReviewed"])
        self.assertEqual(data["channelId"], "UC_verified")

    def test_rejects_wrong_channel(self):
        self.write_source(channel="Nature Frontiers")
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.output.exists())

    def test_rejects_unapproved_product_url(self):
        self.write_source(productUrl="https://example.com")
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.output.exists())

    def test_rejects_missing_queue_item_id(self):
        self.write_source(queueItemId="")
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.output.exists())

if __name__ == "__main__":
    unittest.main()
