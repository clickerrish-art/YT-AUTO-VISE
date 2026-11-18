import hashlib, tempfile, unittest, wave, struct
from pathlib import Path
from scripts import render_american_narration as module

class AmericanNarrationTests(unittest.TestCase):
    def test_voice_is_us_english_male_norman(self):
        self.assertEqual(module.VOICE_ID,"en_US-norman-medium")
        self.assertIn("American English",module.DIRECTION)
        self.assertIn("passionate",module.DIRECTION)

    def test_asset_hash_validation_rejects_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"asset"; p.write_bytes(b"voice")
            with self.assertRaisesRegex(ValueError,"MD5 mismatch"):
                module.validate_asset(p,"0"*32)

    def test_wav_inspection_accepts_valid_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"voice.wav"; rate=22050
            with wave.open(str(p),"wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
                w.writeframes(b"".join(struct.pack("<h",4000 if i%2 else -4000) for i in range(rate*20)))
            m=module.inspect_wav(p)
            self.assertEqual(m["sampleRateHz"],22050)
            self.assertEqual(m["clippedSampleCount"],0)
            self.assertEqual(m["durationSeconds"],20.0)

    def test_wav_inspection_rejects_clipping(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"voice.wav"; rate=22050
            with wave.open(str(p),"wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
                w.writeframes(struct.pack("<h",32767)*(rate*20))
            with self.assertRaisesRegex(ValueError,"duration/level/clipping"):
                module.inspect_wav(p)

if __name__=="__main__": unittest.main()
