import subprocess
import sys
import tempfile
import unittest
import wave
import struct
from pathlib import Path

from scripts import render_banjo_narration as module

NARRATION = (
    "Want better wildlife videos? Start with one clear story, not a pile of random animal clips. "
    "Choose one question your footage can actually answer. Plan three shots: a wide habitat view, "
    "a meaningful detail, and the behavior itself. Keep separate moments in their original recorded "
    "order; label any reconstruction clearly. Keep a safe distance. Never bait, chase, or disturb "
    "wildlife. Use patient observation and steady framing; let natural movement tell the story. "
    "Edit out pauses that add no information. Add readable captions and only music you have permission "
    "to use. Finish with one useful takeaway. For more wildlife creator planning, review the Complete "
    "YouTube Wildlife Creator's Vault. Advertisement. This product is sold through my own Selar business; "
    "purchases generate revenue for my business. The link is in the description."
)


def write_test_wav(path: Path, *, clipped=False, silent=False, duration=30):
    rate = 22050
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        frames = []
        for i in range(rate * duration):
            value = 32767 if clipped else (0 if silent else int(5000 * (i % 100 < 50 and 1 or -1)))
            frames.append(struct.pack("<h", value))
        wav.writeframes(b"".join(frames))


class FakeVoice:
    def synthesize_wav(self, text, wav_file, config):
        self.text = text
        self.config = config
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(22050)
        frames = [struct.pack("<h", 32767 if i in (1000, 10000, 50000) else (4500 if i % 100 < 50 else -4500)) for i in range(22050 * 30)]
        wav_file.writeframes(b"".join(frames))


class BanjoNarrationTests(unittest.TestCase):

    def test_alternative_voice_render_cli_is_blocked(self):
        with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
            module.require_owner_authorized_alternative_voice()

    def test_direct_cli_import_works_from_repository_root(self):
        root = Path(__file__).resolve().parents[1]
        result = subprocess.run(
            [sys.executable, "-c", "import sys; sys.path.insert(0, 'scripts'); import render_banjo_narration"],
            cwd=root, capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_selection_is_fixed_to_banjo_speaker_five(self):
        self.assertEqual(module.VOICE_ID, "banjo")
        self.assertEqual(module.SPEAKER_ID, 5)
        self.assertEqual(module.NARRATOR, "Timothy Ferguson")

    def test_inspects_valid_wav_and_reports_levels(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "valid.wav"
            write_test_wav(path)
            result = module.inspect_wav(path)
            self.assertEqual(result["channels"], 1)
            self.assertEqual(result["sampleWidthBits"], 16)
            self.assertEqual(result["clippedSampleCount"], 0)
            self.assertEqual(result["durationSeconds"], 30.0)

    def test_repairs_isolated_full_scale_samples_and_adds_headroom(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "repair.wav"
            rate = 22050
            samples = [5000 if i % 2 else -5000 for i in range(1000)]
            for index in (100, 500, 800):
                samples[index] = 32767
            with wave.open(str(path), "wb") as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(rate)
                wav.writeframes(b"".join(struct.pack("<h", value) for value in samples))
            result = module.repair_isolated_clips(path)
            with wave.open(str(path), "rb") as wav:
                repaired = [item[0] for item in struct.iter_unpack("<h", wav.readframes(wav.getnframes()))]
            self.assertEqual(result["clippedSamplesDetected"], 3)
            self.assertEqual(result["clippedSamplesInterpolated"], 3)
            self.assertLessEqual(max(map(abs, repaired)), 30000)
            self.assertEqual(sum(abs(value) >= 32760 for value in repaired), 0)

    def test_rejects_long_clipping_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "long-clip.wav"
            rate = 22050
            samples = [5000] * 1000
            samples[100:105] = [32767] * 5
            with wave.open(str(path), "wb") as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(rate)
                wav.writeframes(b"".join(struct.pack("<h", value) for value in samples))
            with self.assertRaisesRegex(ValueError, "too long"):
                module.repair_isolated_clips(path)

    def test_rejects_clipped_audio(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "clipped.wav"
            write_test_wav(path, clipped=True)
            with self.assertRaisesRegex(ValueError, "clipped"):
                module.inspect_wav(path)

    def test_rejects_silent_audio(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "silent.wav"
            write_test_wav(path, silent=True)
            with self.assertRaisesRegex(ValueError, "silent"):
                module.inspect_wav(path)

    def test_render_api_is_blocked_before_output_directory_or_model_download(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "script.md"
            source.write_text("# Short\n\n## Narration draft\n\nWildlife narration draft.\n", encoding="utf-8")
            output = root / "out"
            calls = []

            def downloader(filename, destination):
                calls.append(filename)

            with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
                module.render(output, source, downloader=downloader)

            self.assertFalse(output.exists())
            self.assertEqual(calls, [])

    def test_full_model_attribution_file_is_validated(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "ATTRIBUTION.md"
            path.write_text("Jenny (Dioco); Timothy Ferguson; commercial use permitted.")
            self.assertIn("Timothy Ferguson", module.validate_attribution_file(path))
            path.write_text("CC BY 4.0 only")
            with self.assertRaisesRegex(ValueError, "incomplete"):
                module.validate_attribution_file(path)

    def test_report_attribution_is_present(self):
        self.assertIn("Jenny (Dioco)", module.ATTRIBUTION)
        self.assertIn("CC BY 4.0", module.ATTRIBUTION)


if __name__ == "__main__":
    unittest.main()
