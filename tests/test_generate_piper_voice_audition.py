import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.generate_piper_voice_audition import (
    MODEL_SHA256, CANDIDATES, validate_config, sha256_file, extract_short_narration
)

class PiperVoiceAuditionTests(unittest.TestCase):
    def test_only_male_speaker_ids_are_candidates(self):
        self.assertEqual([(x["voice"], x["speaker_id"]) for x in CANDIDATES],
                         [("banjo", 5), ("angus", 4), ("flynn", 6)])
        self.assertTrue(all(x["hours"] > 0 for x in CANDIDATES))

    def test_speaker_mapping_is_checked_against_model_config(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "voice.json"
            path.write_text(json.dumps({
                "num_speakers": 10,
                "speaker_id_map": {
                    "timothy_ferguson": 5, "algy_pug": 4, "howard_skyman": 6
                }
            }))
            self.assertEqual(validate_config(path)["num_speakers"], 10)

    def test_wrong_speaker_mapping_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "voice.json"
            path.write_text(json.dumps({
                "num_speakers": 10,
                "speaker_id_map": {
                    "timothy_ferguson": 4, "algy_pug": 5, "howard_skyman": 6
                }
            }))
            with self.assertRaises(ValueError):
                validate_config(path)

    def test_extracts_current_short_script_narration_without_description(self):
        markdown = """# Short

## Narration draft (production-length fixture)

Want better wildlife videos? Start with one clear story, not a pile of random animal clips. Choose one question your footage can actually answer. Plan three shots: a wide habitat view, a meaningful detail, and the behavior itself. Keep separate moments in their original recorded order; label any reconstruction clearly. Keep a safe distance. Never bait, chase, or disturb wildlife. Use patient observation and steady framing; let natural movement tell the story. Edit out pauses that add no information. Add readable captions and only music you have permission to use. Finish with one useful takeaway. For more wildlife creator planning, review the Complete YouTube Wildlife Creator's Vault. Advertisement. This product is sold through my own Selar business; purchases generate revenue for my business. The link is in the description.

## Draft description

Do not include this text.
"""
        text = extract_short_narration(markdown)
        self.assertIn("Want better wildlife videos?", text)
        self.assertIn("Finish with one useful takeaway.", text)
        self.assertNotIn("Draft description", text)
        self.assertNotIn("Do not include this text.", text)

    def test_rejects_missing_or_unresolved_short_script(self):
        with self.assertRaises(ValueError):
            extract_short_narration("# Short\n\n## Draft description\n\nNo narration here.")
        with self.assertRaises(ValueError):
            extract_short_narration("# Short\n\n## Narration draft\n\n[ADD SCRIPT HERE]")

    def test_model_hash_helper(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "model"
            path.write_bytes(b"piper-model")
            self.assertEqual(len(sha256_file(path)), 64)
            self.assertEqual(len(MODEL_SHA256), 64)

if __name__ == "__main__":
    unittest.main()
