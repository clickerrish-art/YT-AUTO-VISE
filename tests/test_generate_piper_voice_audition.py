import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.generate_piper_voice_audition import (
    MODEL_SHA256, CANDIDATES, validate_config, sha256_file
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

    def test_model_hash_helper(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "model"
            path.write_bytes(b"piper-model")
            self.assertEqual(len(sha256_file(path)), 64)
            self.assertEqual(len(MODEL_SHA256), 64)

if __name__ == "__main__":
    unittest.main()
