import importlib.util
import sys
import types
import unittest
from pathlib import Path

sys.modules.setdefault("edge_tts", types.ModuleType("edge_tts"))
path = Path(__file__).resolve().parents[1] / "scripts" / "generate-narration.py"
spec = importlib.util.spec_from_file_location("generate_narration", path)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)

class NarrationTests(unittest.TestCase):
    def test_current_scripts_are_in_required_word_range(self):
        master = module.MASTER.read_text(encoding="utf-8")
        self.assertEqual(len(module.extract_read(master, "short-001").split()), 128)
        self.assertEqual(len(module.extract_read(master, "short-002").split()), 126)

    def test_current_scripts_use_exact_owner_approved_disclosure(self):
        master = module.MASTER.read_text(encoding="utf-8")
        for short_id in ("short-001", "short-002"):
            narration = module.extract_read(master, short_id)
            self.assertIn(module.APPROVED_DISCLOSURE_TEXT, narration)

    def test_owner_approved_selar_gate_requires_exact_matching_disclosure(self):
        valid = {
            "products": [{
                "url": "https://selar.com/0u19v8u99l",
                "status": "approved",
                "promotionGate": {
                    "seller": {"status": "VERIFIED", "sourceUrl": "https://selar.com/0u19v8u99l", "verifiedAt": "2026-11-09T09:49:01+02:00"},
                    "brandAuthorization": {"status": "OWNER_CONFIRMED", "brand": "SonicVhibez", "confirmedAt": "2026-11-06T20:02:19+02:00"},
                    "compensation": {"status": "OWNER_CONFIRMED", "type": "DIRECT_SALES_REVENUE"},
                    "disclosure": {"status": "OWNER_APPROVED", "text": module.APPROVED_DISCLOSURE_TEXT, "approvedAt": "2026-11-10T07:02:41+02:00", "approvalReference": "owner approval"}
                }
            }]
        }
        self.assertTrue(module.has_owner_approved_selar_disclosure(valid))
        valid["products"][0]["promotionGate"]["disclosure"]["status"] = "UNVERIFIED"
        self.assertFalse(module.has_owner_approved_selar_disclosure(valid))

    def test_rejects_short_narration(self):
        with self.assertRaisesRegex(ValueError, "125–150"):
            module.extract_read("## Short 001\n**Read:**\nToo short.\n**Performance notes:** x", "short-001")

    def test_word_boundaries_generate_ordered_srt(self):
        events = [
            {"text": "Hello", "offset": 0, "duration": 4_000_000},
            {"text": "there.", "offset": 4_100_000, "duration": 5_000_000},
            {"text": "Again", "offset": 10_000_000, "duration": 3_000_000},
        ]
        srt = module.captions_from_boundaries(events)
        self.assertIn("00:00:00,000 --> 00:00:00,910", srt)
        self.assertIn("Hello there.", srt)
        self.assertIn("00:00:01,000 --> 00:00:01,300", srt)

    def test_rejects_missing_and_invalid_boundaries(self):
        with self.assertRaisesRegex(ValueError, "No TTS word boundaries"):
            module.captions_from_boundaries([])
        with self.assertRaisesRegex(ValueError, "invalid timing"):
            module.captions_from_boundaries([{"text": "bad", "offset": -1, "duration": 0}])

if __name__ == "__main__":
    unittest.main()
