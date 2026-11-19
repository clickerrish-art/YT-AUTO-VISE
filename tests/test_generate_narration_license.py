import importlib.util
import sys
import types
import unittest
from pathlib import Path

sys.modules.setdefault("edge_tts", types.ModuleType("edge_tts"))
module_path = Path(__file__).resolve().parents[1] / "scripts" / "generate-narration.py"
spec = importlib.util.spec_from_file_location("generate_narration_license", module_path)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


class ShortNarrationLicenseTests(unittest.TestCase):
    def test_generation_requires_explicit_noncommercial_acknowledgement(self):
        with self.assertRaisesRegex(SystemExit, "not the approved Roderic voice"):
            module.require_noncommercial_audition(False)
        self.assertTrue(module.require_noncommercial_audition(True))

    def test_notice_disallows_commercial_use_and_unapproved_voice(self):
        self.assertIn("not the approved Roderic voice", module.NONCOMMERCIAL_AUDITION_NOTICE)
        self.assertIn("cannot be used commercially", module.NONCOMMERCIAL_AUDITION_NOTICE)

    def test_sha256_helper_is_deterministic(self):
        import tempfile
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "sample.txt"
            target.write_text("internal audition only", encoding="utf-8")
            self.assertEqual(module.sha256_file(target), module.sha256_file(target))


if __name__ == "__main__":
    unittest.main()
