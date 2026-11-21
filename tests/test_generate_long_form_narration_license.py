import importlib.util
import asyncio
import sys
import types
import unittest
from pathlib import Path

sys.modules.setdefault("edge_tts", types.ModuleType("edge_tts"))
module_path = Path(__file__).resolve().parents[1] / "scripts" / "generate_long_form_narration.py"
spec = importlib.util.spec_from_file_location("generate_long_form_narration_license", module_path)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


class LongFormNarrationLicenseTests(unittest.TestCase):
    def test_generation_requires_explicit_noncommercial_audition_acknowledgement(self):
        with self.assertRaisesRegex(SystemExit, "not the approved Roderic voice"):
            module.require_noncommercial_audition(False)
        self.assertTrue(module.require_noncommercial_audition(True))

    def test_hardcoded_edge_voice_is_marked_unapproved_and_noncommercial(self):
        self.assertEqual(module.VOICE, "en-US-GuyNeural")
        self.assertIn("not owner-approved", module.NONCOMMERCIAL_AUDITION_NOTICE)
        self.assertIn("cannot be used commercially", module.NONCOMMERCIAL_AUDITION_NOTICE)

    def test_main_blocks_before_any_generation_without_explicit_acknowledgement(self):
        with self.assertRaisesRegex(SystemExit, "not the approved Roderic voice"):
            asyncio.run(module.main(False))

    def test_hash_helper_is_deterministic_for_a_file(self):
        import tempfile
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "sample.txt"
            target.write_text("audition only", encoding="utf-8")
            first = module.sha256_file(target)
            second = module.sha256_file(target)
            self.assertEqual(first, second)
            self.assertEqual(len(first), 64)


if __name__ == "__main__":
    unittest.main()
