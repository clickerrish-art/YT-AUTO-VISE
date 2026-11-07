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
        self.assertEqual(len(module.extract_read(master, "short-001").split()), 130)
        self.assertEqual(len(module.extract_read(master, "short-002").split()), 128)

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
