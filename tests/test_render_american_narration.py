import hashlib, tempfile, unittest, wave, struct
from pathlib import Path
from scripts import render_american_narration as module

class AmericanNarrationTests(unittest.TestCase):

    def test_alternative_voice_render_cli_is_blocked(self):
        with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
            module.require_owner_authorized_alternative_voice()

    def test_render_api_is_blocked_before_output_directory_or_download(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "out"
            source = Path(tmp) / "script.md"
            source.write_text("A test narration script.", encoding="utf-8")
            called = []
            original_download = module.download
            module.download = lambda *args, **kwargs: called.append(args)
            try:
                with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
                    module.render(output, source)
            finally:
                module.download = original_download
            self.assertFalse(output.exists())
            self.assertEqual(called, [])

    def test_voice_is_us_english_male_norman(self):
        self.assertEqual(module.VOICE_ID,"en_US-norman-medium")
        self.assertIn("American English",module.DIRECTION)
        self.assertIn("passionate",module.DIRECTION)
        self.assertEqual(module.SPEECH_LENGTH_SCALE,1.1)

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
                w.writeframes(b"".join(struct.pack("<h",4000 if i%2 else -4000) for i in range(rate*55)))
            m=module.inspect_wav(p)
            self.assertEqual(m["sampleRateHz"],22050)
            self.assertEqual(m["clippedSampleCount"],0)
            self.assertEqual(m["durationSeconds"],55.0)

    def test_headroom_reduces_peak_before_strict_audio_qc(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"voice.wav"; rate=22050
            samples=[32767 if i % 1000 == 0 else (-4000 if i % 2 else 4000) for i in range(rate*55)]
            with wave.open(str(p),"wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
                w.writeframes(b"".join(struct.pack("<h",sample) for sample in samples))
            result=module.apply_headroom(p)
            self.assertTrue(result["applied"])
            self.assertLess(result["peakAfter"],32760)
            metrics=module.inspect_wav(p)
            self.assertEqual(metrics["clippedSampleCount"],0)
            self.assertEqual(metrics["durationSeconds"],55.0)

    def test_wav_inspection_rejects_clipping(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"voice.wav"; rate=22050
            with wave.open(str(p),"wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
                w.writeframes(struct.pack("<h",32767)*(rate*55))
            with self.assertRaisesRegex(ValueError,"duration/level/clipping"):
                module.inspect_wav(p)

if __name__=="__main__": unittest.main()
