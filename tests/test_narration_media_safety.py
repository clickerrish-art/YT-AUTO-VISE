import asyncio
import importlib.util
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]

# Keep imports safe in test environments that do not install optional TTS clients.
sys.modules.setdefault("edge_tts", types.ModuleType("edge_tts"))
mutagen_package = types.ModuleType("mutagen")
mutagen_package.__path__ = []
mutagen_mp3 = types.ModuleType("mutagen.mp3")
class _MP3:
    def __init__(self, *args, **kwargs):
        self.info = types.SimpleNamespace(length=0.0)
mutagen_mp3.MP3 = _MP3
sys.modules.setdefault("mutagen", mutagen_package)
sys.modules.setdefault("mutagen.mp3", mutagen_mp3)


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


long_form = load_module("sonic_long_form_audition", ROOT / "scripts" / "generate_long_form_narration.py")
queue_package = load_module("sonic_queue_audition", ROOT / "scripts" / "generate-queue-package.py")
queued_renderer = load_module("sonic_queued_renderer", ROOT / "scripts" / "render-queued-draft.py")
photo_thumbnail = load_module("sonic_photo_thumbnail", ROOT / "scripts" / "render-photo-thumbnail.py")
legacy_long_form = load_module("sonic_legacy_long_form", ROOT / "scripts" / "generate-long-form-narration.py")


class NarrationMediaSafetyTests(unittest.TestCase):
    def test_long_form_edge_tts_is_blocked_without_owner_authorized_alternative_voice(self):
        for acknowledged in (False, True):
            with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
                long_form.require_noncommercial_audition(acknowledged)

    def test_long_form_requires_owner_authorization_before_voice_or_output(self):
        with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
            asyncio.run(long_form.main(True, None))

    def test_legacy_long_form_cli_is_blocked_before_creating_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "narration"
            with patch.object(legacy_long_form, "OUT", output):
                with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
                    asyncio.run(legacy_long_form.main())
            self.assertFalse(output.exists())

    def test_queue_package_edge_tts_is_blocked_without_owner_authorized_alternative_voice(self):
        for acknowledged in (False, True):
            with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
                queue_package.require_noncommercial_audition(acknowledged)

    def test_queue_package_cli_cannot_bypass_narrator_policy_with_noncommercial_acknowledgement(self):
        for acknowledgement in ([], ["--allow-noncommercial-audition"]):
            with tempfile.TemporaryDirectory() as tmp:
                output = Path(tmp) / "queue-package"
                with patch.object(queue_package, "OUT", output), patch.object(
                    sys, "argv", ["generate-queue-package.py", "--run-number", "1", *acknowledgement]
                ):
                    with self.assertRaisesRegex(SystemExit, "owner has not authorized an alternative narrator"):
                        asyncio.run(queue_package.main())
                self.assertFalse(output.exists())

    def test_production_renderer_requires_owner_approved_commercial_voice_and_original_media(self):
        metadata = {
            "channel": "SonicVhibez",
            "productUrl": "https://selar.com/0u19v8u99l",
            "voiceApprovalStatus": "NOT_OWNER_APPROVED",
            "licenseStatus": "NON_COMMERCIAL_INTERNAL_EVALUATION_ONLY",
            "commercialUseAllowed": False,
            "rightsConfirmed": False,
            "complianceReviewed": False,
            "mediaSourceType": "UNVERIFIED",
            "mediaProvenanceStatus": "UNVERIFIED",
        }
        with self.assertRaisesRegex(SystemExit, "commercially cleared narration voice"):
            queued_renderer.validate_render_authorization(metadata)
        metadata.update({
            "voiceApprovalStatus": "OWNER_APPROVED",
            "licenseStatus": "COMMERCIAL_USE_CLEARED",
            "commercialUseAllowed": True,
        })
        with self.assertRaisesRegex(SystemExit, "verified rights and completed human compliance review"):
            queued_renderer.validate_render_authorization(metadata)
        metadata.update({
            "rightsConfirmed": True,
            "complianceReviewed": True,
            "mediaSourceType": "ORIGINAL_CREATOR_CAPTURED",
            "mediaProvenanceStatus": "VERIFIED",
        })
        self.assertTrue(queued_renderer.validate_render_authorization(metadata))

    def test_generic_text_renderer_and_stock_thumbnail_generator_fail_closed(self):
        with self.assertRaisesRegex(SystemExit, "generic text-only draft renderer is disabled"):
            queued_renderer.main()
        with self.assertRaisesRegex(SystemExit, "Pexels stock-thumbnail generation is disabled"):
            photo_thumbnail.main()


if __name__ == "__main__":
    unittest.main()
