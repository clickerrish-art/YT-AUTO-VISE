import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "render-reviewed-wildlife-footage.py"

class ReviewedFootageRendererSafetyTests(unittest.TestCase):
    def run_script_with_root(self, root: Path):
        # Exercise the entry point in an isolated project-shaped tree without
        # changing repository files or requiring FFmpeg to run.
        import shutil
        with tempfile.TemporaryDirectory() as td:
            copy = Path(td) / "scripts" / SCRIPT.name
            copy.parent.mkdir(parents=True)
            shutil.copy2(SCRIPT, copy)
            (Path(td) / "media").mkdir(exist_ok=True)
            result = subprocess.run([sys.executable, str(copy)], cwd=td,
                                    text=True, capture_output=True)
            return result

    def test_missing_manifest_fails_closed(self):
        with tempfile.TemporaryDirectory() as td:
            import shutil
            root = Path(td)
            (root / "scripts").mkdir()
            shutil.copy2(SCRIPT, root / "scripts" / SCRIPT.name)
            (root / "media").mkdir()
            result = subprocess.run([sys.executable, str(root / "scripts" / SCRIPT.name)],
                                    cwd=root, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("No reviewed footage manifest", result.stderr)
            self.assertFalse((root / "media" / "rendered-drafts").exists())


    def _load_renderer_module(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("reviewed_footage_renderer", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def _stock_clip(self, platform="Pexels"):
        method = "PEXELS_LICENSED_STOCK" if platform == "Pexels" else "PIXABAY_LICENSED_STOCK"
        license_name = "Pexels License" if platform == "Pexels" else "Pixabay Content License"
        return {
            "sourceMethod": method,
            "sourcePlatform": platform,
            "creatorCapturedOriginal": False,
            "creatorIdentity": "Test wildlife contributor",
            "file": "wildlife.mp4",
            "sourceUrl": "https://example.com/wildlife.mp4",
            "licenseBasis": license_name,
            "licenseEvidenceLocation": "content/media/test-license-evidence.md",
            "attribution": "Test wildlife contributor via " + platform,
            "originalSha256": "a" * 64,
            "platformLicenseReviewed": True,
            "thirdPartyRightsReviewed": False,
            "rightsReviewed": False,
            "reviewOnly": True
        }

    def test_rejects_pexels_stock_even_when_license_and_review_evidence_exist(self):
        renderer = self._load_renderer_module()
        clip = self._stock_clip("Pexels")
        with self.assertRaisesRegex(ValueError, "Only original creator-captured wildlife recordings"):
            renderer.validate_clip_source(clip)

    def test_rejects_pixabay_stock_even_when_license_and_review_evidence_exist(self):
        renderer = self._load_renderer_module()
        clip = self._stock_clip("Pixabay")
        with self.assertRaisesRegex(ValueError, "Only original creator-captured wildlife recordings"):
            renderer.validate_clip_source(clip)

    def test_accepts_original_creator_capture_with_capture_provenance(self):
        renderer = self._load_renderer_module()
        clip = {
            "sourceMethod": "ORIGINAL_RECORDING",
            "creatorCapturedOriginal": True,
            "creatorIdentity": "Camera operator",
            "file": "wildlife.mp4",
            "sourceUrl": "https://example.com/original-recording",
            "licenseBasis": "Original creator-owned recording; permissions documented separately",
            "attribution": "Camera operator",
            "originalSha256": "a" * 64,
            "captureProvenance": "Original camera file recorded by the named creator",
            "rightsReviewed": False,
            "reviewOnly": True
        }
        self.assertEqual(renderer.validate_clip_source(clip), "ORIGINAL_RECORDING")

    def test_rejects_original_recording_without_capture_provenance(self):
        renderer = self._load_renderer_module()
        clip = {
            "sourceMethod": "ORIGINAL_RECORDING",
            "creatorCapturedOriginal": True,
            "creatorIdentity": "Camera operator",
            "file": "wildlife.mp4",
            "sourceUrl": "https://example.com/original-recording",
            "licenseBasis": "Original recording",
            "attribution": "Camera operator",
            "originalSha256": "a" * 64,
            "rightsReviewed": False,
            "reviewOnly": True
        }
        with self.assertRaisesRegex(ValueError, "captureProvenance"):
            renderer.validate_clip_source(clip)

    def test_rejects_ai_generated_wildlife_visuals(self):
        renderer = self._load_renderer_module()
        clip = self._stock_clip("Pexels")
        clip["sourceMethod"] = "AI_GENERATED"
        with self.assertRaisesRegex(ValueError, "AI-generated wildlife visuals"):
            renderer.validate_clip_source(clip)

    def test_empty_manifest_fails_closed(self):
        with tempfile.TemporaryDirectory() as td:
            import shutil, json
            root = Path(td)
            (root / "scripts").mkdir()
            shutil.copy2(SCRIPT, root / "scripts" / SCRIPT.name)
            footage = root / "media" / "approved-footage"
            footage.mkdir(parents=True)
            (footage / "manifest.json").write_text(json.dumps({"clips": []}), encoding="utf-8")
            result = subprocess.run([sys.executable, str(root / "scripts" / SCRIPT.name)],
                                    cwd=root, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("at least one reviewed clip", result.stderr)

if __name__ == "__main__":
    unittest.main()
