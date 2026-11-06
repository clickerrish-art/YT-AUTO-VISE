import importlib.util
import sys
import types
import unittest
from pathlib import Path

# The cleaner is pure; the optional online TTS client is only used by main().
sys.modules.setdefault("edge_tts", types.ModuleType("edge_tts"))

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "generate_long_form_narration.py"
SPEC = importlib.util.spec_from_file_location("generate_long_form_narration", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class LongFormNarrationCleaningTests(unittest.TestCase):

    def test_source_and_output_paths_are_anchored_to_repository_not_caller_working_directory(self):
        expected_root = MODULE_PATH.resolve().parents[1]
        self.assertEqual(MODULE.SOURCE, expected_root / "content" / "long-form-scripts.md")
        self.assertEqual(MODULE.OUT, expected_root / "media" / "long-form-drafts")
        self.assertTrue(MODULE.SOURCE.is_absolute())
        self.assertTrue(MODULE.OUT.is_absolute())

    def test_removes_unapproved_paid_promotion_paragraph_and_destination(self):
        source = (
            "Opening narration remains.\n\n"
            "If you want a paid resource, you can find the Complete Wildlife Creator's Vault. "
            "It includes extra templates and guidance.\n\n"
            "Closing narration remains."
        )

        cleaned = MODULE.clean_script(source)

        self.assertIn("Opening narration remains.", cleaned)
        self.assertIn("Closing narration remains.", cleaned)
        self.assertNotIn("paid resource", cleaned)
        self.assertNotIn("Creator's Vault", cleaned)

    def test_removes_promotional_resource_line_and_selar_url(self):
        source = (
            "Useful narration.\n\n"
            "Promotional resource: https://selar.com/0u19v8u99l\n\n"
            "More useful narration."
        )

        cleaned = MODULE.clean_script(source)

        self.assertIn("Useful narration.", cleaned)
        self.assertIn("More useful narration.", cleaned)
        self.assertNotIn("Promotional resource:", cleaned)
        self.assertNotIn("selar.com", cleaned)

    def test_keeps_ordinary_narration_that_mentions_resources_generically(self):
        source = (
            "A resource can help you organize your workflow.\n\n"
            "Review every asset before publication."
        )

        cleaned = MODULE.clean_script(source)

        self.assertIn("A resource can help you organize your workflow.", cleaned)
        self.assertIn("Review every asset before publication.", cleaned)


if __name__ == "__main__":
    unittest.main()
