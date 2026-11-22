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

    def test_accepts_pexels_stock_for_review_only_without_claiming_rights_clearance(self):
        renderer = self._load_renderer_module()
        clip = self._stock_clip("Pexels")
        self.assertEqual(renderer.validate_clip_source(clip), "PEXELS_LICENSED_STOCK")
        self.assertFalse(clip["rightsReviewed"])
        self.assertTrue(clip["reviewOnly"])

    def test_accepts_pixabay_stock_for_review_only_without_claiming_rights_clearance(self):
        renderer = self._load_renderer_module()
        clip = self._stock_clip("Pixabay")
        self.assertEqual(renderer.validate_clip_source(clip), "PIXABAY_LICENSED_STOCK")

    def test_rejects_stock_without_platform_license_review(self):
        renderer = self._load_renderer_module()
        clip = self._stock_clip("Pexels")
        clip["platformLicenseReviewed"] = False
        with self.assertRaisesRegex(ValueError, "platformLicenseReviewed=true"):
            renderer.validate_clip_source(clip)

    def test_rejects_stock_without_review_only_or_human_rights_review(self):
        renderer = self._load_renderer_module()
        clip = self._stock_clip("Pexels")
        clip["reviewOnly"] = False
        with self.assertRaisesRegex(ValueError, "reviewOnly=true"):
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
