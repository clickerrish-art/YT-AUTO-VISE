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

    def test_merges_caption_groups_that_cannot_fit_a_positive_non_overlapping_interval(self):
        boundaries = [
            {"text": "Hello.", "offset": 0, "duration": 2_000_000},
            {"text": "World.", "offset": 200_000, "duration": 3_000_000},
            {"text": "Again.", "offset": 10_000_000, "duration": 2_000_000},
        ]

        rendered = MODULE.captions_from_boundaries(boundaries)
        blocks = rendered.strip().split("\n\n")
        self.assertEqual(len(blocks), 2)
        self.assertIn("Hello. World.", blocks[0])
        intervals = []
        for block in blocks:
            timestamp = block.splitlines()[1]
            start, end = timestamp.split(" --> ")
            intervals.append((start, end))
        self.assertLess(intervals[0][0], intervals[0][1])
        self.assertLessEqual(intervals[0][1], intervals[1][0])

    def test_rejects_out_of_order_tts_word_boundaries(self):
        boundaries = [
            {"text": "Later.", "offset": 20_000_000, "duration": 2_000_000},
            {"text": "Earlier.", "offset": 10_000_000, "duration": 2_000_000},
        ]
        with self.assertRaisesRegex(ValueError, "out of order"):
            MODULE.captions_from_boundaries(boundaries)

    def test_rejects_non_finite_tts_word_boundary_offsets(self):
        boundaries = [
            {"text": "Invalid.", "offset": float("nan"), "duration": 2_000_000},
        ]
        with self.assertRaisesRegex(ValueError, "finite and non-negative"):
            MODULE.captions_from_boundaries(boundaries)

    def test_clips_overlapping_tts_word_durations_at_next_caption_start(self):
        boundaries = [
            {"text": "First.", "offset": 0, "duration": 20_000_000},
            {"text": "Second.", "offset": 10_000_000, "duration": 5_000_000},
        ]

        rendered = MODULE.captions_from_boundaries(boundaries)
        blocks = rendered.strip().split("\n\n")
        self.assertEqual(len(blocks), 2)
        first_end = blocks[0].splitlines()[1].split(" --> ")[1]
        second_start = blocks[1].splitlines()[1].split(" --> ")[0]
        self.assertEqual(first_end, second_start)

    def test_estimated_captions_reject_non_finite_or_non_positive_duration(self):
        for duration in (0, -1, float("nan"), float("inf")):
            with self.subTest(duration=duration):
                with self.assertRaisesRegex(ValueError, "finite and positive"):
                    MODULE.captions_from_text_estimate("A sentence.", duration)

    def test_estimated_captions_reject_empty_text_and_too_short_duration(self):
        with self.assertRaisesRegex(ValueError, "empty narration"):
            MODULE.captions_from_text_estimate("   ", 10)
        with self.assertRaisesRegex(ValueError, "too short"):
            MODULE.captions_from_text_estimate("One. Two. Three.", 0.2)

    def test_estimated_captions_keep_positive_non_overlapping_intervals(self):
        rendered = MODULE.captions_from_text_estimate(
            "First sentence. A much longer second sentence follows. Final sentence.",
            12.0,
        )
        blocks = rendered.strip().split("\\n\\n")
        self.assertEqual(len(blocks), 3)

        def milliseconds(value):
            hours, minutes, rest = value.split(":")
            seconds, millis = rest.split(",")
            return (((int(hours) * 60 + int(minutes)) * 60 + int(seconds)) * 1000) + int(millis)

        previous_end = 0
        for block in blocks:
            start_text, end_text = block.splitlines()[1].split(" --> ")
            start_ms, end_ms = milliseconds(start_text), milliseconds(end_text)
            self.assertGreater(end_ms, start_ms)
            self.assertGreaterEqual(start_ms, previous_end)
            previous_end = end_ms

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
