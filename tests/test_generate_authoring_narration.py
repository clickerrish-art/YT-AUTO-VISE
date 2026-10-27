import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "generate-authoring-narration.py"
SPEC = importlib.util.spec_from_file_location("generate_authoring_narration", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def short_payload(word_count=130):
    words = [f"word{i}" for i in range(word_count)]
    sections = []
    bounds = [0, word_count // 3, 2 * word_count // 3, word_count]
    for i in range(3):
        text = " ".join(words[bounds[i]:bounds[i + 1]])
        sections.append({
            "heading": f"Section {i + 1}", "purpose": f"Purpose {i + 1}",
            "narration": text, "visualDirection": "Use an approved, evidence-matched scene.",
            "pacing": "Measured", "soundDesign": "Natural ambience under clear narration."
        })
    narration = "\n\n".join(section["narration"] for section in sections)
    return {"narration": narration, "sections": sections,
            "claims": [{"text": "Supported claim.", "sourceIds": ["s1"]}],
            "sources": [{"id": "s1", "title": "Research paper", "url": "https://example.org/paper"}]}


class AuthoringNarrationTests(unittest.TestCase):
    def test_accepts_measured_short_with_matching_sections_and_claim_sources(self):
        narration, count = MODULE.validate_script_payload(short_payload(), "short")
        self.assertEqual(count, 130)
        self.assertEqual(len(narration.split()), 130)

    def test_script_hash_is_stable_and_changes_with_script_content(self):
        payload = short_payload()
        first = MODULE.canonical_script_sha256(payload)
        self.assertEqual(first, MODULE.canonical_script_sha256(payload))
        changed = short_payload()
        changed["claims"][0]["text"] = "A different supported claim."
        self.assertNotEqual(first, MODULE.canonical_script_sha256(changed))

    def test_rejects_short_below_minimum(self):
        with self.assertRaisesRegex(ValueError, "125–150"):
            MODULE.validate_script_payload(short_payload(124), "short")

    def test_rejects_sections_that_do_not_reproduce_full_narration(self):
        payload = short_payload()
        payload["sections"][1]["narration"] += " altered"
        with self.assertRaisesRegex(ValueError, "reproduce the complete"):
            MODULE.validate_script_payload(payload, "short")

    def test_rejects_claim_with_unknown_source_id(self):
        payload = short_payload()
        payload["claims"][0]["sourceIds"] = ["invented-source"]
        with self.assertRaisesRegex(ValueError, "known supplied source IDs"):
            MODULE.validate_script_payload(payload, "short")

    def test_rejects_missing_scene_direction(self):
        payload = short_payload()
        payload["sections"][0]["visualDirection"] = ""
        with self.assertRaisesRegex(ValueError, "visualDirection"):
            MODULE.validate_script_payload(payload, "short")

    def test_caption_builder_requires_real_ordered_word_boundaries(self):
        boundaries = [
            {"text": "Wildlife", "offset": 0, "duration": 4_000_000},
            {"text": "matters.", "offset": 4_000_000, "duration": 6_000_000},
            {"text": "Evidence", "offset": 10_000_000, "duration": 5_000_000},
            {"text": "helps.", "offset": 15_000_000, "duration": 5_000_000},
        ]
        srt = MODULE.captions_from_boundaries(boundaries)
        self.assertIn("00:00:00,000 --> 00:00:01,000", srt)
        self.assertIn("Wildlife matters.", srt)
        with self.assertRaisesRegex(ValueError, "no usable word-boundary"):
            MODULE.captions_from_boundaries([])

    def test_rejects_invalid_boundary_timing(self):
        with self.assertRaisesRegex(ValueError, "invalid timing"):
            MODULE.captions_from_boundaries([{"text": "bad", "offset": 0, "duration": 0}])


if __name__ == "__main__":
    unittest.main()
